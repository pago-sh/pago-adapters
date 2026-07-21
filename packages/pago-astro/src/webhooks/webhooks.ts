import {
	type WebhooksConfig,
	handleWebhookPayload,
} from "@pago-sh/adapter-utils";
import { PagoWebhookVerificationError } from "@pago-sh/sdk";
import { webhooks } from "@pago-sh/sdk/2026-04";
import type { APIRoute } from "astro";

export {
	type EntitlementContext,
	type EntitlementHandler,
	type EntitlementProperties,
	EntitlementStrategy,
	Entitlements,
} from "@pago-sh/adapter-utils";

export const Webhooks = ({
	webhookSecret,
	onPayload,
	entitlements,
	...eventHandlers
}: WebhooksConfig): APIRoute => {
	return async ({ request }) => {
		if (request.method !== "POST") {
			return Response.json(
				{ message: "Método não permitido" },
				{ status: 405 },
			);
		}

		const requestBody = await request.text();

		const webhookHeaders: Record<string, string> = {
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
			console.log(error);
			if (error instanceof PagoWebhookVerificationError) {
				return Response.json({ received: false }, { status: 403 });
			}

			return Response.json(
				{ error: "Erro interno do servidor" },
				{ status: 500 },
			);
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
