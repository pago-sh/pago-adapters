import {
	type WebhooksConfig,
	handleWebhookPayload,
} from "npm:@pago-sh/adapter-utils@1.0.0";
import { PagoWebhookVerificationError } from "npm:@pago-sh/sdk@1.0.0";
import { createPago, webhooks } from "npm:@pago-sh/sdk@1.0.0/2026-04";

const serverBaseUrl = (server?: "sandbox" | "production"): string =>
	server === "sandbox" ? "https://sandbox-api.pago.sh" : "https://api.pago.sh";

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
}: CheckoutConfig): ((request: Request) => Promise<Response>) => {
	const pago = createPago({
		accessToken: accessToken ?? Deno.env.get("PAGO_ACCESS_TOKEN") ?? "",
		baseUrl: serverBaseUrl(server),
	});

	return async (request: Request) => {
		const url = new URL(request.url);
		const products = url.searchParams.getAll("products");

		if (products.length === 0) {
			return new Response(
				JSON.stringify({ error: "Produtos ausentes nos parâmetros da query" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
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
				return_url: retUrl ? decodeURI(retUrl.toString()) : undefined,
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
			});

			const redirectUrl = new URL(result.url);

			if (theme) {
				redirectUrl.searchParams.set("theme", theme);
			}

			return Response.redirect(redirectUrl.toString());
		} catch (error) {
			console.error(error);
			return new Response(
				JSON.stringify({ error: "Erro interno do servidor" }),
				{
					status: 500,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
	};
};

export interface CustomerPortalConfig {
	accessToken?: string;
	getCustomerId: (request: Request) => Promise<string>;
	server?: "sandbox" | "production";
	returnUrl?: string;
}

// deno-lint-ignore explicit-function-return-type
export const CustomerPortal = ({
	accessToken,
	server,
	getCustomerId,
	returnUrl,
}: CustomerPortalConfig): ((request: Request) => Promise<Response>) => {
	const pago = createPago({
		accessToken: accessToken ?? Deno.env.get("PAGO_ACCESS_TOKEN") ?? "",
		baseUrl: serverBaseUrl(server),
	});

	return async (request: Request) => {
		const retUrl = returnUrl ? new URL(returnUrl) : undefined;

		const customerId = await getCustomerId(request);

		if (!customerId) {
			return new Response(
				JSON.stringify({ error: "customerId não definido" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		try {
			const result = await pago.customerSessions.create({
				customer_id: customerId,
				return_url: retUrl ? decodeURI(retUrl.toString()) : undefined,
			});

			return Response.redirect(result.customer_portal_url);
		} catch (error) {
			console.error(error);
			return new Response(
				JSON.stringify({ error: "Erro interno do servidor" }),
				{
					status: 500,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
	};
};

export const Webhooks = ({
	webhookSecret,
	onPayload,
	entitlements,
	...eventHandlers
}: WebhooksConfig): ((request: Request) => Promise<Response>) => {
	return async (request: Request) => {
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
			console.log(error);
			if (error instanceof PagoWebhookVerificationError) {
				return new Response(JSON.stringify({ received: false }), {
					status: 403,
					headers: { "Content-Type": "application/json" },
				});
			}

			throw error;
		}

		await handleWebhookPayload(webhookPayload, {
			webhookSecret,
			onPayload,
			entitlements,
			...eventHandlers,
		});

		return new Response(JSON.stringify({ received: true }), {
			headers: { "Content-Type": "application/json" },
		});
	};
};
