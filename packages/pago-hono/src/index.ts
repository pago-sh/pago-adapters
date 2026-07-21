import {
	createPagoClient,
	type WebhooksConfig,
	handleWebhookPayload,
} from "@pago-sh/adapter-utils";
import { PagoWebhookVerificationError } from "@pago-sh/sdk";
import { webhooks } from "@pago-sh/sdk/2026-04";
import type { Context } from "hono";

export {
	type EntitlementContext,
	type EntitlementHandler,
	type EntitlementProperties,
	EntitlementStrategy,
	Entitlements,
} from "@pago-sh/adapter-utils";
export interface CheckoutConfig {
	accessToken?: string;
	successUrl?: string;
	returnUrl?: string;
	includeCheckoutId?: boolean;
	server?: "sandbox" | "production";
	theme?: "light" | "dark";
}

export const Checkout = ({
	accessToken,
	successUrl,
	returnUrl,
	server,
	theme,
	includeCheckoutId = true,
}: CheckoutConfig) => {
	const pago = createPagoClient({
		accessToken: accessToken ?? process.env["PAGO_ACCESS_TOKEN"],
		server,
	});

	return async (c: Context) => {
		const url = new URL(c.req.url);
		const products = url.searchParams.getAll("products");

		if (products.length === 0) {
			return c.json(
				{ error: "Produtos ausentes nos parâmetros da query" },
				{ status: 400 },
			);
		}

		const success = successUrl ? new URL(successUrl) : undefined;

		if (success && includeCheckoutId) {
			success.searchParams.set("checkoutId", "{CHECKOUT_ID}");
		}

		const retUrl = returnUrl ? new URL(returnUrl) : undefined;

		try {
			const result = await pago.checkouts.create({
				products,
				success_url: success ? decodeURI(success.toString()) : undefined,
				customer_id: url.searchParams.get("customerId") ?? undefined,
				external_customer_id:
					url.searchParams.get("customerExternalId") ?? undefined,
				customer_email: url.searchParams.get("customerEmail") ?? undefined,
				customer_name: url.searchParams.get("customerName") ?? undefined,
				customer_billing_address: url.searchParams.has("customerBillingAddress")
					? JSON.parse(url.searchParams.get("customerBillingAddress") ?? "{}")
					: undefined,
				customer_tax_id: url.searchParams.get("customerTaxId") ?? undefined,
				customer_ip_address:
					url.searchParams.get("customerIpAddress") ?? undefined,
				customer_metadata: url.searchParams.has("customerMetadata")
					? JSON.parse(url.searchParams.get("customerMetadata") ?? "{}")
					: undefined,
				allow_discount_codes: url.searchParams.has("allowDiscountCodes")
					? url.searchParams.get("allowDiscountCodes") === "true"
					: undefined,
				discount_id: url.searchParams.get("discountId") ?? undefined,
				metadata: url.searchParams.has("metadata")
					? JSON.parse(url.searchParams.get("metadata") ?? "{}")
					: undefined,
				return_url: retUrl ? decodeURI(retUrl.toString()) : undefined,
			});

			const redirectUrl = new URL(result.url);

			if (theme) {
				redirectUrl.searchParams.set("theme", theme);
			}

			return c.redirect(redirectUrl.toString());
		} catch (error) {
			console.error(error);
			return c.json({ error: "Erro interno do servidor" }, { status: 500 });
		}
	};
};

export interface CustomerPortalConfig {
	accessToken?: string;
	getCustomerId: (req: Context) => Promise<string>;
	server?: "sandbox" | "production";
	returnUrl?: string;
}

export const CustomerPortal = ({
	accessToken,
	server,
	getCustomerId,
	returnUrl,
}: CustomerPortalConfig) => {
	const pago = createPagoClient({
		accessToken: accessToken ?? process.env["PAGO_ACCESS_TOKEN"],
		server,
	});

	return async (c: Context) => {
		const retUrl = returnUrl ? new URL(returnUrl) : undefined;

		const customerId = await getCustomerId(c);

		if (!customerId) {
			return c.json({ error: "customerId não definido" }, { status: 400 });
		}

		try {
			const result = await pago.customerSessions.create({
				customer_id: customerId,
				return_url: retUrl ? decodeURI(retUrl.toString()) : undefined,
			});

			return c.redirect(result.customer_portal_url);
		} catch (error) {
			console.error(error);
			return c.json({ error: "Erro interno do servidor" }, { status: 500 });
		}
	};
};

export const Webhooks = ({
	webhookSecret,
	onPayload,
	entitlements,
	...eventHandlers
}: WebhooksConfig) => {
	return async (c: Context) => {
		const requestBody = await c.req.text();

		const webhookHeaders = {
			"webhook-id": c.req.header("webhook-id") ?? "",
			"webhook-timestamp": c.req.header("webhook-timestamp") ?? "",
			"webhook-signature": c.req.header("webhook-signature") ?? "",
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
				return c.json({ received: false }, { status: 403 });
			}

			throw error;
		}

		await handleWebhookPayload(webhookPayload, {
			webhookSecret,
			entitlements,
			onPayload,
			...eventHandlers,
		});

		return c.json({ received: true });
	};
};
