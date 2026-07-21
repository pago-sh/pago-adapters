import {
	type WebhooksConfig,
	handleWebhookPayload,
} from "@pago-sh/adapter-utils";
import { PagoWebhookVerificationError } from "@pago-sh/sdk";
import { webhooks } from "@pago-sh/sdk/2026-04";
import type { Request, RequestHandler, Response } from "express";

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
}: WebhooksConfig): RequestHandler => {
	return async (req: Request, res: Response) => {
		const requestBody = JSON.stringify(req.body);

		const webhookHeaders: Record<string, string> = {
			"webhook-id": req.headers["webhook-id"] as string,
			"webhook-timestamp": req.headers["webhook-timestamp"] as string,
			"webhook-signature": req.headers["webhook-signature"] as string,
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
				res.status(403).json({ received: false });
				return;
			}

			res.status(500).json({ error: "Erro interno do servidor" });
			return;
		}

		await handleWebhookPayload(webhookPayload, {
			webhookSecret,
			entitlements,
			onPayload,
			...eventHandlers,
		});

		res.json({ received: true });
	};
};
