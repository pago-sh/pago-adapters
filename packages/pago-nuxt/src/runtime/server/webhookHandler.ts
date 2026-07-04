import { handleWebhookPayload } from "@pago-sh/adapter-utils";
import type { WebhooksConfig } from "@pago-sh/adapter-utils";
import {
	WebhookVerificationError,
	validateEvent,
} from "@pago-sh/sdk/webhooks";
import type { H3Event } from "h3";
import { createError, getHeader, readRawBody, setResponseStatus } from "h3";

export const Webhooks = ({
	webhookSecret,
	onPayload,
	entitlements,
	...eventHandlers
}: WebhooksConfig) => {
	return async (event: H3Event) => {
		const requestBody = await readRawBody(event);

		const webhookHeaders = {
			"webhook-id": getHeader(event, "webhook-id") ?? "",
			"webhook-timestamp": getHeader(event, "webhook-timestamp") ?? "",
			"webhook-signature": getHeader(event, "webhook-signature") ?? "",
		};

		let webhookPayload: ReturnType<typeof validateEvent>;

		try {
			webhookPayload = validateEvent(
				requestBody || "",
				webhookHeaders,
				webhookSecret,
			);
		} catch (error) {
			if (error instanceof WebhookVerificationError) {
				console.error("Falha ao verificar o evento de webhook", error);
				setResponseStatus(event, 403);
				return { received: false };
			}

			console.error("Falha ao validar o evento de webhook", error);
			throw createError({
				statusCode: 500,
				statusMessage: (error as Error).message,
				message: (error as Error).message ?? "Erro interno do servidor",
			});
		}

		try {
			await handleWebhookPayload(webhookPayload, {
				webhookSecret,
				entitlements,
				onPayload,
				...eventHandlers,
			});

			return { received: true };
		} catch (error) {
			console.error("Erro no webhook", error);
			throw createError({
				statusCode: 500,
				statusMessage: (error as Error).message,
				message: (error as Error).message ?? "Erro interno do servidor",
			});
		}
	};
};
