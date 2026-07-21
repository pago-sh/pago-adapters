import type { models } from "@pago-sh/sdk/2026-04";
import type { Pago } from "@pago-sh/sdk/2026-04";
import {
	APIError,
	createAuthEndpoint,
	sessionMiddleware,
} from "better-auth/api";
import * as z from "zod/v4";
import type { Product } from "../types";

export interface UsageOptions {
	/**
	 * Produtos a serem usados para recarregar créditos
	 */
	creditProducts?: Product[] | (() => Promise<Product[]>);
}

export const usage = (_usageOptions?: UsageOptions) => (pago: Pago) => {
	return {
		meters: createAuthEndpoint(
			"/usage/meters/list",
			{
				method: "GET",
				use: [sessionMiddleware],
				query: z.object({
					page: z.coerce.number().optional(),
					limit: z.coerce.number().optional(),
				}),
			},
			async (ctx) => {
				if (!ctx.context.session.user.id) {
					throw new APIError("BAD_REQUEST", {
						message: "Usuário não encontrado",
					});
				}

				try {
					const customerSession = await pago.customerSessions.create({
						external_customer_id: ctx.context.session.user.id,
					});

					const customerMeters = await pago.customerPortal.customerMeters.list(
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

					return ctx.json(customerMeters);
				} catch (e: unknown) {
					if (e instanceof Error) {
						ctx.context.logger.error(
							`Falha ao listar medidores do Pago. Erro: ${e.message}`,
						);
					}

					throw new APIError("INTERNAL_SERVER_ERROR", {
						message: "Falha ao listar medidores",
					});
				}
			},
		),
		ingestion: createAuthEndpoint(
			"/usage/ingest",
			{
				method: "POST",
				body: z.object({
					event: z.string(),
					metadata: z.record(
						z.string(),
						z.union([z.string(), z.number(), z.boolean()]),
					),
				}),
				use: [sessionMiddleware],
			},
			async (ctx) => {
				if (!ctx.context.session.user.id) {
					throw new APIError("BAD_REQUEST", {
						message: "Usuário não encontrado",
					});
				}

				try {
					const ingestion = await pago.events.ingest({
						events: [
							{
								name: ctx.body.event,
								metadata: ctx.body.metadata,
								external_customer_id: ctx.context.session.user.id,
							},
						],
					});

					return ctx.json(ingestion);
				} catch (e: unknown) {
					if (e instanceof Error) {
						ctx.context.logger.error(
							`Falha na ingestão do Pago. Erro: ${e.message}`,
						);
					}

					throw new APIError("INTERNAL_SERVER_ERROR", {
						message: "Falha na ingestão",
					});
				}
			},
		),
	};
};
