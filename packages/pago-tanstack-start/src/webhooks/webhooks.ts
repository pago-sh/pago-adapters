import {
	type WebhooksConfig,
	handleWebhookPayload,
} from "@pago-sh/adapter-utils";
import { PagoWebhookVerificationError } from "@pago-sh/sdk";
import { webhooks } from "@pago-sh/sdk/2026-04";
// @ts-expect-error - TODO: fix this
import type { StartAPIMethodCallback } from "@tanstack/react-start/api";

export {
	EntitlementStrategy,
	Entitlements,
	type EntitlementContext,
	type EntitlementHandler,
	type EntitlementProperties,
} from "@pago-sh/adapter-utils";

export const Webhooks = <TPath extends string = string>({
	webhookSecret,
	entitlements,
	onPayload,
	...eventHandlers
}: WebhooksConfig): StartAPIMethodCallback<TPath> => {
	// @ts-expect-error - TODO: fix this
	return async ({ request }) => {
		const requestBody = await request.text();

		const webhookHeaders = {
			"webhook-id": request.headers.get("webhook-id") ?? "",
			"webhook-timestamp": request.headers.get("webhook-timestamp") ?? "",
			"webhook-signature": request.headers.get("webhook-signature") ?? "",
		};

		let webhookPayload: webhooks.WebhookPayload;
		try {
			webhookPayload = await webhooks.validateEvent(
				requestBody,
				webhookHeaders,
				webhookSecret,
			);
		} catch (error) {
			if (error instanceof PagoWebhookVerificationError) {
				return Response.json({ received: false }, { status: 403 });
			}

			throw error;
		}

		await handleWebhookPayload(webhookPayload, {
			webhookSecret,
			entitlements,
			onPayload,
			...eventHandlers,
		});

		return Response.json({ received: true });
	};
};
