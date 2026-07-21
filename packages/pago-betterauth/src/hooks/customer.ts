import type { GenericEndpointContext, User } from "better-auth";
import { APIError } from "better-auth/api";
import type { PagoOptions } from "../types";

export const onBeforeUserCreate =
	(options: PagoOptions) =>
	async (user: Partial<User>, context: GenericEndpointContext | null) => {
		if (context && options.createCustomerOnSignUp) {
			try {
				if (user.isAnonymous) {
					return;
				}

				const params = options.getCustomerCreateParams
					? await options.getCustomerCreateParams({
							user,
						})
					: {};

				if (!user.email) {
					throw new APIError("BAD_REQUEST", {
						message: "É necessário um e-mail associado",
					});
				}

				// Verifica se o cliente já existe
				const existingCustomers = await options.client.customers.list({
					email: user.email,
				});
				const existingCustomer = existingCustomers.items[0];

				// Ignora a criação se o cliente já existir
				if (!existingCustomer) {
					await options.client.customers.create({
						...params,
						email: user.email,
						name: user.name,
					});
				}
			} catch (e: unknown) {
				if (e instanceof Error) {
					throw new APIError("INTERNAL_SERVER_ERROR", {
						message: `Falha ao criar o cliente Pago. Erro: ${e.message}`,
					});
				}

				throw new APIError("INTERNAL_SERVER_ERROR", {
					message: `Falha ao criar o cliente Pago. Erro: ${e}`,
				});
			}
		}
	};

export const onAfterUserCreate =
	(options: PagoOptions) =>
	async (user: User, context: GenericEndpointContext | null) => {
		if (context && options.createCustomerOnSignUp) {
			if (user.isAnonymous) {
				return;
			}

			try {
				const existingCustomers = await options.client.customers.list({
					email: user.email,
				});
				const existingCustomer = existingCustomers.items[0];

				if (existingCustomer) {
					if (existingCustomer.external_id !== user.id) {
						await options.client.customers.update(existingCustomer.id, {
							external_id: user.id,
						});
					}
				}
			} catch (e: unknown) {
				if (e instanceof Error) {
					throw new APIError("INTERNAL_SERVER_ERROR", {
						message: `Falha ao criar o cliente Pago. Erro: ${e.message}`,
					});
				}

				throw new APIError("INTERNAL_SERVER_ERROR", {
					message: `Falha ao criar o cliente Pago. Erro: ${e}`,
				});
			}
		}
	};

export const onUserUpdate =
	(options: PagoOptions) =>
	async (user: User, context: GenericEndpointContext | null) => {
		if (context && options.createCustomerOnSignUp) {
			try {
				if (user.isAnonymous) {
					return;
				}

				await options.client.customers.updateExternal(user.id, {
					email: user.email,
					name: user.name,
				});
			} catch (e: unknown) {
				if (e instanceof Error) {
					context.context.logger.error(
						`Falha ao atualizar o cliente Pago. Erro: ${e.message}`,
					);
				} else {
					context.context.logger.error(
						`Falha ao atualizar o cliente Pago. Erro: ${e}`,
					);
				}
			}
		}
	};

export const onUserDelete =
	(options: PagoOptions) =>
	async (user: User, context: GenericEndpointContext | null) => {
		if (context && options.createCustomerOnSignUp) {
			try {
				if (user.isAnonymous) {
					return;
				}

				if (user.email) {
					const existingCustomers = await options.client.customers.list({
						email: user.email,
					});
					const existingCustomer = existingCustomers.items[0];
					if (existingCustomer) {
						await options.client.customers.delete(existingCustomer.id);
					}
				}
			} catch (e: unknown) {
				if (e instanceof Error) {
					context?.context.logger.error(
						`Falha ao excluir o cliente Pago. Erro: ${e.message}`,
					);
					return;
				}
				context?.context.logger.error(
					`Falha ao excluir o cliente Pago. Erro: ${e}`,
				);
			}
		}
	};
