import { handleWebhookPayload } from "@pago-sh/adapter-utils";
import type { Pago } from "@pago-sh/sdk/2026-04";
import { webhooks as sdkWebhooks } from "@pago-sh/sdk/2026-04";
import { APIError, createAuthEndpoint } from "better-auth/api";

export interface WebhooksOptions {
	/**
	 * Segredo do webhook
	 */
	secret: string;
	/**
	 * Handler genérico para todos os webhooks
	 */
	onPayload?: (payload: sdkWebhooks.WebhookPayload) => Promise<void>;
	/**
	 * Webhook para checkout criado
	 */
	onCheckoutCreated?: (
		payload: sdkWebhooks.WebhookCheckoutCreatedPayload,
	) => Promise<void>;
	/**
	 * Webhook para checkout atualizado
	 */
	onCheckoutUpdated?: (
		payload: sdkWebhooks.WebhookCheckoutUpdatedPayload,
	) => Promise<void>;
	/**
	 * Webhook para pedido criado
	 */
	onOrderCreated?: (
		payload: sdkWebhooks.WebhookOrderCreatedPayload,
	) => Promise<void>;
	/**
	 * Webhook para pedido reembolsado
	 */
	onOrderRefunded?: (
		payload: sdkWebhooks.WebhookOrderRefundedPayload,
	) => Promise<void>;
	/**
	 * Webhook para pedido pago
	 */
	onOrderPaid?: (payload: sdkWebhooks.WebhookOrderPaidPayload) => Promise<void>;
	/**
	 * Webhook para pedido atualizado
	 */
	onOrderUpdated?: (
		payload: sdkWebhooks.WebhookOrderUpdatedPayload,
	) => Promise<void>;
	/**
	 * Webhook para reembolso criado
	 */
	onRefundCreated?: (
		payload: sdkWebhooks.WebhookRefundCreatedPayload,
	) => Promise<void>;
	/**
	 * Webhook para reembolso atualizado
	 */
	onRefundUpdated?: (
		payload: sdkWebhooks.WebhookRefundUpdatedPayload,
	) => Promise<void>;
	/**
	 * Webhook para assinatura criada
	 */
	onSubscriptionCreated?: (
		payload: sdkWebhooks.WebhookSubscriptionCreatedPayload,
	) => Promise<void>;
	/**
	 * Webhook para assinatura atualizada
	 */
	onSubscriptionUpdated?: (
		payload: sdkWebhooks.WebhookSubscriptionUpdatedPayload,
	) => Promise<void>;
	/**
	 * Webhook para assinatura ativa
	 */
	onSubscriptionActive?: (
		payload: sdkWebhooks.WebhookSubscriptionActivePayload,
	) => Promise<void>;
	/**
	 * Webhook para assinatura cancelada
	 */
	onSubscriptionCanceled?: (
		payload: sdkWebhooks.WebhookSubscriptionCanceledPayload,
	) => Promise<void>;
	/**
	 * Webhook para assinatura revogada
	 */
	onSubscriptionRevoked?: (
		payload: sdkWebhooks.WebhookSubscriptionRevokedPayload,
	) => Promise<void>;
	/**
	 * Webhook para cancelamento de assinatura desfeito
	 */
	onSubscriptionUncanceled?: (
		payload: sdkWebhooks.WebhookSubscriptionUncanceledPayload,
	) => Promise<void>;
	/**
	 * Webhook para produto criado
	 */
	onProductCreated?: (
		payload: sdkWebhooks.WebhookProductCreatedPayload,
	) => Promise<void>;
	/**
	 * Webhook para produto atualizado
	 */
	onProductUpdated?: (
		payload: sdkWebhooks.WebhookProductUpdatedPayload,
	) => Promise<void>;
	/**
	 * Webhook para organização atualizada
	 */
	onOrganizationUpdated?: (
		payload: sdkWebhooks.WebhookOrganizationUpdatedPayload,
	) => Promise<void>;
	/**
	 * Webhook para benefício criado
	 */
	onBenefitCreated?: (
		payload: sdkWebhooks.WebhookBenefitCreatedPayload,
	) => Promise<void>;
	/**
	 * Webhook para benefício atualizado
	 */
	onBenefitUpdated?: (
		payload: sdkWebhooks.WebhookBenefitUpdatedPayload,
	) => Promise<void>;
	/**
	 * Webhook para concessão de benefício criada
	 */
	onBenefitGrantCreated?: (
		payload: sdkWebhooks.WebhookBenefitGrantCreatedPayload,
	) => Promise<void>;
	/**
	 * Webhook para concessão de benefício atualizada
	 */
	onBenefitGrantUpdated?: (
		payload: sdkWebhooks.WebhookBenefitGrantUpdatedPayload,
	) => Promise<void>;
	/**
	 * Webhook para concessão de benefício revogada
	 */
	onBenefitGrantRevoked?: (
		payload: sdkWebhooks.WebhookBenefitGrantRevokedPayload,
	) => Promise<void>;
	/**
	 * Webhook para cliente criado
	 */
	onCustomerCreated?: (
		payload: sdkWebhooks.WebhookCustomerCreatedPayload,
	) => Promise<void>;
	/**
	 * Webhook para cliente atualizado
	 */
	onCustomerUpdated?: (
		payload: sdkWebhooks.WebhookCustomerUpdatedPayload,
	) => Promise<void>;
	/**
	 * Webhook para cliente excluído
	 */
	onCustomerDeleted?: (
		payload: sdkWebhooks.WebhookCustomerDeletedPayload,
	) => Promise<void>;
	/**
	 * Webhook para estado do cliente alterado
	 */
	onCustomerStateChanged?: (
		payload: sdkWebhooks.WebhookCustomerStateChangedPayload,
	) => Promise<void>;
}

export const webhooks = (options: WebhooksOptions) => (_pago: Pago) => {
	return {
		pagoWebhooks: createAuthEndpoint(
			"/pago/webhooks",
			{
				method: "POST",
				metadata: {
					isAction: false,
				},
				cloneRequest: true,
			},
			async (ctx) => {
				const { secret, ...eventHandlers } = options;

				if (!ctx.request?.body) {
					throw new APIError("INTERNAL_SERVER_ERROR");
				}
				const buf = await ctx.request.text();
				let event: sdkWebhooks.WebhookPayload;
				try {
					if (!secret) {
						throw new APIError("INTERNAL_SERVER_ERROR", {
							message: "Segredo do webhook do Pago não encontrado",
						});
					}

					const headers = {
						"webhook-id": ctx.request.headers.get("webhook-id") as string,
						"webhook-timestamp": ctx.request.headers.get(
							"webhook-timestamp",
						) as string,
						"webhook-signature": ctx.request.headers.get(
							"webhook-signature",
						) as string,
					};

					event = await sdkWebhooks.validateEvent(buf, headers, secret);
				} catch (err: unknown) {
					if (err instanceof APIError) {
						throw err;
					}
					if (err instanceof Error) {
						ctx.context.logger.error(`${err.message}`);
						throw new APIError("BAD_REQUEST", {
							message: `Erro no webhook: ${err.message}`,
						});
					}
					throw new APIError("BAD_REQUEST", {
						message: `Erro no webhook: ${err}`,
					});
				}

				try {
					await handleWebhookPayload(event, {
						webhookSecret: secret,
						...eventHandlers,
					});
				} catch (e: unknown) {
					if (e instanceof APIError) {
						throw e;
					}
					if (e instanceof Error) {
						ctx.context.logger.error(
							`Falha no webhook do Pago. Erro: ${e.message}`,
						);
					} else {
						ctx.context.logger.error(`Falha no webhook do Pago. Erro: ${e}`);
					}

					throw new APIError("BAD_REQUEST", {
						message:
							"Erro no webhook: consulte os logs do servidor para mais informações.",
					});
				}

				return ctx.json({ received: true });
			},
		),
	};
};
