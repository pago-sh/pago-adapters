import type { models } from "@pago-sh/sdk/2026-04";
import type { Pago } from "@pago-sh/sdk/2026-04";
import { APIError } from "better-auth/api";
import { createAuthEndpoint, sessionMiddleware } from "better-auth/api";
import * as z from "zod/v4";

export interface PortalConfig {
	returnUrl?: string;
	/**
	 * Tema do portal
	 */
	theme?: "light" | "dark";
}

export const portal =
	({ returnUrl, theme }: PortalConfig = {}) =>
	(pago: Pago) => {
		const retUrl = returnUrl ? new URL(returnUrl) : undefined;

		return {
			portal: createAuthEndpoint(
				"/customer/portal",
				{
					method: ["GET", "POST"],
					body: z
						.object({
							redirect: z.boolean().optional(),
						})
						.optional(),
					use: [sessionMiddleware],
				},
				async (ctx) => {
					if (!ctx.context.session?.user.id) {
						throw new APIError("BAD_REQUEST", {
							message: "Usuário não encontrado",
						});
					}

					if (ctx.context.session?.user["isAnonymous"]) {
						throw new APIError("UNAUTHORIZED", {
							message: "Usuários anônimos não podem acessar o portal",
						});
					}

					try {
						const customerSession = await pago.customerSessions.create({
							external_customer_id: ctx.context.session?.user.id,
							return_url: retUrl ? decodeURI(retUrl.toString()) : undefined,
						});

						const portalUrl = new URL(customerSession.customer_portal_url);

						if (theme) {
							portalUrl.searchParams.set("theme", theme);
						}

						return ctx.json({
							url: portalUrl.toString(),
							redirect: ctx.body?.redirect ?? true,
						});
					} catch (e: unknown) {
						if (e instanceof Error) {
							ctx.context.logger.error(
								`Falha ao criar o portal do cliente Pago. Erro: ${e.message}`,
							);
						}

						throw new APIError("INTERNAL_SERVER_ERROR", {
							message: "Falha ao criar o portal do cliente",
						});
					}
				},
			),
			state: createAuthEndpoint(
				"/customer/state",
				{
					method: "GET",
					use: [sessionMiddleware],
				},
				async (ctx) => {
					if (!ctx.context.session.user.id) {
						throw new APIError("BAD_REQUEST", {
							message: "Usuário não encontrado",
						});
					}

					try {
						const state = await pago.customers.getStateExternal(
							ctx.context.session.user.id,
						);

						return ctx.json(state);
					} catch (e: unknown) {
						if (e instanceof Error) {
							ctx.context.logger.error(
								`Falha ao listar assinaturas Pago. Erro: ${e.message}`,
							);
						}

						throw new APIError("INTERNAL_SERVER_ERROR", {
							message: "Falha ao listar assinaturas",
						});
					}
				},
			),
			benefits: createAuthEndpoint(
				"/customer/benefits/list",
				{
					method: "GET",
					query: z
						.object({
							page: z.coerce.number().optional(),
							limit: z.coerce.number().optional(),
						})
						.optional(),
					use: [sessionMiddleware],
				},
				async (ctx) => {
					if (!ctx.context.session.user.id) {
						throw new APIError("BAD_REQUEST", {
							message: "Usuário não encontrado",
						});
					}

					try {
						const customerSession = await pago.customerSessions.create({
							external_customer_id: ctx.context.session?.user.id,
						});

						const benefits = await pago.customerPortal.benefitGrants.list(
							// BLOQUEADO: o SDK não permite sobrepor a autenticação por requisição.
							// Os endpoints de customer portal autenticam com o token da customer session,
							// mas `createPago` fixa o accessToken no cliente e o `Pago` recebido não expõe
							// a baseUrl para reconstruir um cliente com escopo de sessão.
							{ customerSession: customerSession.token },
							{
								page: ctx.query?.page,
								limit: ctx.query?.limit,
							},
						);

						return ctx.json(benefits);
					} catch (e: unknown) {
						if (e instanceof Error) {
							ctx.context.logger.error(
								`Falha ao listar benefícios Pago. Erro: ${e.message}`,
							);
						}

						throw new APIError("INTERNAL_SERVER_ERROR", {
							message: "Falha ao listar benefícios",
						});
					}
				},
			),
			subscriptions: createAuthEndpoint(
				"/customer/subscriptions/list",
				{
					method: "GET",
					query: z
						.object({
							referenceId: z.string().optional(),
							page: z.coerce.number().optional(),
							limit: z.coerce.number().optional(),
							active: z.coerce.boolean().optional(),
						})
						.optional(),
					use: [sessionMiddleware],
				},
				async (ctx) => {
					if (!ctx.context.session.user.id) {
						throw new APIError("BAD_REQUEST", {
							message: "Usuário não encontrado",
						});
					}

					if (ctx.query?.referenceId) {
						try {
							const subscriptions = await pago.subscriptions.list({
								page: ctx.query?.page,
								limit: ctx.query?.limit,
								active: ctx.query?.active,
								metadata: {
									referenceId: ctx.query?.referenceId,
								},
							});

							return ctx.json(subscriptions);
						} catch (e: unknown) {
							console.log(e);
							if (e instanceof Error) {
								ctx.context.logger.error(
									`Falha ao listar assinaturas Pago com referenceId. Erro: ${e.message}`,
								);
							}

							throw new APIError("INTERNAL_SERVER_ERROR", {
								message: "Falha ao listar assinaturas com referenceId",
							});
						}
					}

					try {
						const customerSession = await pago.customerSessions.create({
							external_customer_id: ctx.context.session?.user.id,
						});

						const subscriptions = await pago.customerPortal.subscriptions.list(
							// BLOQUEADO: o SDK não permite sobrepor a autenticação por requisição.
							// Os endpoints de customer portal autenticam com o token da customer session,
							// mas `createPago` fixa o accessToken no cliente e o `Pago` recebido não expõe
							// a baseUrl para reconstruir um cliente com escopo de sessão.
							{ customerSession: customerSession.token },
							{
								page: ctx.query?.page,
								limit: ctx.query?.limit,
								active: ctx.query?.active,
							},
						);

						return ctx.json(subscriptions);
					} catch (e: unknown) {
						if (e instanceof Error) {
							ctx.context.logger.error(
								`Falha ao listar assinaturas Pago. Erro: ${e.message}`,
							);
						}

						throw new APIError("INTERNAL_SERVER_ERROR", {
							message: "Falha ao listar assinaturas Pago",
						});
					}
				},
			),
			orders: createAuthEndpoint(
				"/customer/orders/list",
				{
					method: "GET",
					query: z
						.object({
							page: z.coerce.number().optional(),
							limit: z.coerce.number().optional(),
							productBillingType: z.enum(["recurring", "one_time"]).optional(),
						})
						.optional(),
					use: [sessionMiddleware],
				},
				async (ctx) => {
					if (!ctx.context.session.user.id) {
						throw new APIError("BAD_REQUEST", {
							message: "Usuário não encontrado",
						});
					}

					try {
						const customerSession = await pago.customerSessions.create({
							external_customer_id: ctx.context.session?.user.id,
						});

						const orders = await pago.customerPortal.orders.list(
							// BLOQUEADO: o SDK não permite sobrepor a autenticação por requisição.
							// Os endpoints de customer portal autenticam com o token da customer session,
							// mas `createPago` fixa o accessToken no cliente e o `Pago` recebido não expõe
							// a baseUrl para reconstruir um cliente com escopo de sessão.
							{ customerSession: customerSession.token },
							{
								page: ctx.query?.page,
								limit: ctx.query?.limit,
								product_billing_type: ctx.query?.productBillingType,
							},
						);

						return ctx.json(orders);
					} catch (e: unknown) {
						if (e instanceof Error) {
							ctx.context.logger.error(
								`Falha ao listar pedidos Pago. Erro: ${e.message}`,
							);
						}

						throw new APIError("INTERNAL_SERVER_ERROR", {
							message: "Falha ao listar pedidos",
						});
					}
				},
			),
		};
	};
