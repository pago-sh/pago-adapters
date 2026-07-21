import {
	type WebhooksConfig,
	handleWebhookPayload,
} from "@pago-sh/adapter-utils";
import { PagoWebhookVerificationError } from "@pago-sh/sdk";
import { webhooks } from "@pago-sh/sdk/2026-04";
import type { FastifyReply, FastifyRequest, RouteHandler } from "fastify";

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
}: WebhooksConfig): RouteHandler => {
	return async (request: FastifyRequest, reply: FastifyReply) => {
		const requestBody =
			typeof request.body === "string"
				? request.body
				: JSON.stringify(request.body);

		const webhookHeaders: Record<string, string> = {
			"webhook-id": request.headers["webhook-id"] as string,
			"webhook-timestamp": request.headers["webhook-timestamp"] as string,
			"webhook-signature": request.headers["webhook-signature"] as string,
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
				return reply.status(400).send({ received: false });
			}

			return reply.status(500).send({ error: "Erro interno do servidor" });
		}

		await handleWebhookPayload(webhookPayload, {
			webhookSecret,
			entitlements,
			onPayload,
			...eventHandlers,
		});

		return { received: true };
	};
};
