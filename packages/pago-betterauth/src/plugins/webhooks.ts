import { handleWebhookPayload } from "@pago-sh/adapter-utils";
import type { Pago } from "@pago-sh/sdk";
import type { WebhookBenefitCreatedPayload } from "@pago-sh/sdk/models/components/webhookbenefitcreatedpayload";
import type { WebhookBenefitGrantCreatedPayload } from "@pago-sh/sdk/models/components/webhookbenefitgrantcreatedpayload";
import type { WebhookBenefitGrantRevokedPayload } from "@pago-sh/sdk/models/components/webhookbenefitgrantrevokedpayload";
import type { WebhookBenefitGrantUpdatedPayload } from "@pago-sh/sdk/models/components/webhookbenefitgrantupdatedpayload";
import type { WebhookBenefitUpdatedPayload } from "@pago-sh/sdk/models/components/webhookbenefitupdatedpayload";
import type { WebhookCheckoutCreatedPayload } from "@pago-sh/sdk/models/components/webhookcheckoutcreatedpayload";
import type { WebhookCheckoutUpdatedPayload } from "@pago-sh/sdk/models/components/webhookcheckoutupdatedpayload";
import type { WebhookCustomerCreatedPayload } from "@pago-sh/sdk/models/components/webhookcustomercreatedpayload";
import type { WebhookCustomerDeletedPayload } from "@pago-sh/sdk/models/components/webhookcustomerdeletedpayload";
import type { WebhookCustomerStateChangedPayload } from "@pago-sh/sdk/models/components/webhookcustomerstatechangedpayload";
import type { WebhookCustomerUpdatedPayload } from "@pago-sh/sdk/models/components/webhookcustomerupdatedpayload";
import type { WebhookOrderCreatedPayload } from "@pago-sh/sdk/models/components/webhookordercreatedpayload";
import type { WebhookOrderPaidPayload } from "@pago-sh/sdk/models/components/webhookorderpaidpayload";
import type { WebhookOrderRefundedPayload } from "@pago-sh/sdk/models/components/webhookorderrefundedpayload";
import type { WebhookOrderUpdatedPayload } from "@pago-sh/sdk/models/components/webhookorderupdatedpayload";
import type { WebhookOrganizationUpdatedPayload } from "@pago-sh/sdk/models/components/webhookorganizationupdatedpayload";
import type { WebhookProductCreatedPayload } from "@pago-sh/sdk/models/components/webhookproductcreatedpayload";
import type { WebhookProductUpdatedPayload } from "@pago-sh/sdk/models/components/webhookproductupdatedpayload";
import type { WebhookRefundCreatedPayload } from "@pago-sh/sdk/models/components/webhookrefundcreatedpayload";
import type { WebhookRefundUpdatedPayload } from "@pago-sh/sdk/models/components/webhookrefundupdatedpayload";
import type { WebhookSubscriptionActivePayload } from "@pago-sh/sdk/models/components/webhooksubscriptionactivepayload";
import type { WebhookSubscriptionCanceledPayload } from "@pago-sh/sdk/models/components/webhooksubscriptioncanceledpayload";
import type { WebhookSubscriptionCreatedPayload } from "@pago-sh/sdk/models/components/webhooksubscriptioncreatedpayload";
import type { WebhookSubscriptionRevokedPayload } from "@pago-sh/sdk/models/components/webhooksubscriptionrevokedpayload";
import type { WebhookSubscriptionUncanceledPayload } from "@pago-sh/sdk/models/components/webhooksubscriptionuncanceledpayload";
import type { WebhookSubscriptionUpdatedPayload } from "@pago-sh/sdk/models/components/webhooksubscriptionupdatedpayload";
import { validateEvent } from "@pago-sh/sdk/webhooks";
import { APIError, createAuthEndpoint } from "better-auth/api";

export interface WebhooksOptions {
	/**
	 * Segredo do webhook
	 */
	secret: string;
	/**
	 * Handler genérico para todos os webhooks
	 */
	onPayload?: (payload: ReturnType<typeof validateEvent>) => Promise<void>;
	/**
	 * Webhook para checkout criado
	 */
	onCheckoutCreated?: (payload: WebhookCheckoutCreatedPayload) => Promise<void>;
	/**
	 * Webhook para checkout atualizado
	 */
	onCheckoutUpdated?: (payload: WebhookCheckoutUpdatedPayload) => Promise<void>;
	/**
	 * Webhook para pedido criado
	 */
	onOrderCreated?: (payload: WebhookOrderCreatedPayload) => Promise<void>;
	/**
	 * Webhook para pedido reembolsado
	 */
	onOrderRefunded?: (payload: WebhookOrderRefundedPayload) => Promise<void>;
	/**
	 * Webhook para pedido pago
	 */
	onOrderPaid?: (payload: WebhookOrderPaidPayload) => Promise<void>;
	/**
	 * Webhook para pedido atualizado
	 */
	onOrderUpdated?: (payload: WebhookOrderUpdatedPayload) => Promise<void>;
	/**
	 * Webhook para reembolso criado
	 */
	onRefundCreated?: (payload: WebhookRefundCreatedPayload) => Promise<void>;
	/**
	 * Webhook para reembolso atualizado
	 */
	onRefundUpdated?: (payload: WebhookRefundUpdatedPayload) => Promise<void>;
	/**
	 * Webhook para assinatura criada
	 */
	onSubscriptionCreated?: (
		payload: WebhookSubscriptionCreatedPayload,
	) => Promise<void>;
	/**
	 * Webhook para assinatura atualizada
	 */
	onSubscriptionUpdated?: (
		payload: WebhookSubscriptionUpdatedPayload,
	) => Promise<void>;
	/**
	 * Webhook para assinatura ativa
	 */
	onSubscriptionActive?: (
		payload: WebhookSubscriptionActivePayload,
	) => Promise<void>;
	/**
	 * Webhook para assinatura cancelada
	 */
	onSubscriptionCanceled?: (
		payload: WebhookSubscriptionCanceledPayload,
	) => Promise<void>;
	/**
	 * Webhook para assinatura revogada
	 */
	onSubscriptionRevoked?: (
		payload: WebhookSubscriptionRevokedPayload,
	) => Promise<void>;
	/**
	 * Webhook para cancelamento de assinatura desfeito
	 */
	onSubscriptionUncanceled?: (
		payload: WebhookSubscriptionUncanceledPayload,
	) => Promise<void>;
	/**
	 * Webhook para produto criado
	 */
	onProductCreated?: (payload: WebhookProductCreatedPayload) => Promise<void>;
	/**
	 * Webhook para produto atualizado
	 */
	onProductUpdated?: (payload: WebhookProductUpdatedPayload) => Promise<void>;
	/**
	 * Webhook para organização atualizada
	 */
	onOrganizationUpdated?: (
		payload: WebhookOrganizationUpdatedPayload,
	) => Promise<void>;
	/**
	 * Webhook para benefício criado
	 */
	onBenefitCreated?: (payload: WebhookBenefitCreatedPayload) => Promise<void>;
	/**
	 * Webhook para benefício atualizado
	 */
	onBenefitUpdated?: (payload: WebhookBenefitUpdatedPayload) => Promise<void>;
	/**
	 * Webhook para concessão de benefício criada
	 */
	onBenefitGrantCreated?: (
		payload: WebhookBenefitGrantCreatedPayload,
	) => Promise<void>;
	/**
	 * Webhook para concessão de benefício atualizada
	 */
	onBenefitGrantUpdated?: (
		payload: WebhookBenefitGrantUpdatedPayload,
	) => Promise<void>;
	/**
	 * Webhook para concessão de benefício revogada
	 */
	onBenefitGrantRevoked?: (
		payload: WebhookBenefitGrantRevokedPayload,
	) => Promise<void>;
	/**
	 * Webhook para cliente criado
	 */
	onCustomerCreated?: (payload: WebhookCustomerCreatedPayload) => Promise<void>;
	/**
	 * Webhook para cliente atualizado
	 */
	onCustomerUpdated?: (payload: WebhookCustomerUpdatedPayload) => Promise<void>;
	/**
	 * Webhook para cliente excluído
	 */
	onCustomerDeleted?: (payload: WebhookCustomerDeletedPayload) => Promise<void>;
	/**
	 * Webhook para estado do cliente alterado
	 */
	onCustomerStateChanged?: (
		payload: WebhookCustomerStateChangedPayload,
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
				let event: ReturnType<typeof validateEvent>;
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

					event = validateEvent(buf, headers, secret);
				} catch (err: unknown) {
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
