import { PagoWebhookVerificationError } from "@pago-sh/sdk";
import { webhooks } from "@pago-sh/sdk/2026-04";
import type { RequestEvent } from "@sveltejs/kit";
import {
	type WebhooksConfig,
	createPagoClient,
	handleWebhookPayload,
} from "@pago-sh/adapter-utils";

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

export type CheckoutHandler = (event: RequestEvent) => Promise<Response>;
export type CustomerPortalHandler = (event: RequestEvent) => Promise<Response>;
export type WebhookHandler = (event: RequestEvent) => Promise<Response>;

export const Checkout = ({
	accessToken,
	successUrl,
	returnUrl,
	server,
	theme,
	includeCheckoutId = true,
}: CheckoutConfig): CheckoutHandler => {
	const pago = createPagoClient({ accessToken, server });

	return async (event) => {
		const url = new URL(event.request.url);
		const products = url.searchParams.getAll("products");

		if (products.length === 0) {
			return new Response(
				JSON.stringify({
					error: "Produtos ausentes nos parâmetros da query",
				}),
				{ status: 400 },
			);
		}

		const success = successUrl ? new URL(successUrl, event.url) : undefined;

		if (success && includeCheckoutId) {
			success.searchParams.set("checkoutId", "{CHECKOUT_ID}");
		}

		const retUrl = returnUrl ? new URL(returnUrl, event.url) : undefined;

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

			return new Response(null, {
				status: 302,
				headers: { Location: redirectUrl.toString() },
			});
		} catch (error) {
			console.error("Capturar erro de checkout", error);
			return new Response(null, { status: 500 });
		}
	};
};

type CustomerPortalBaseConfig = {
	accessToken: string;
	server?: "sandbox" | "production";
	returnUrl?: string;
};

type CustomerPortalCustomerIdConfig = CustomerPortalBaseConfig & {
	getCustomerId: (event: RequestEvent) => Promise<string>;
	getExternalCustomerId?: never;
};

type CustomerPortalExternalCustomerIdConfig = CustomerPortalBaseConfig & {
	getCustomerId?: never;
	getExternalCustomerId: (event: RequestEvent) => Promise<string>;
};

function configIsExternalCustomerIdConfig(
	config: CustomerPortalConfig,
): config is CustomerPortalExternalCustomerIdConfig {
	return typeof config.getExternalCustomerId === "function";
}

export type CustomerPortalConfig =
	| CustomerPortalCustomerIdConfig
	| CustomerPortalExternalCustomerIdConfig;

export const CustomerPortal = (
	config: CustomerPortalConfig,
): CustomerPortalHandler => {
	const { accessToken, server, returnUrl } = config;

	const pago = createPagoClient({
		accessToken,
		server,
	});

	return async (event) => {
		try {
			const decodedReturnUrl = returnUrl
				? decodeURI(new URL(returnUrl, event.url).toString())
				: undefined;

			if (configIsExternalCustomerIdConfig(config)) {
				const externalCustomerId = await config.getExternalCustomerId(event);

				if (!externalCustomerId) {
					return new Response(
						JSON.stringify({ error: `getExternalCustomerId not defined` }),
						{ status: 400 },
					);
				}

				const { customer_portal_url: customerPortalUrl } =
					await pago.customerSessions.create({
						return_url: decodedReturnUrl,
						external_customer_id: externalCustomerId,
					});

				return new Response(null, {
					status: 302,
					headers: { Location: customerPortalUrl },
				});
			}

			const customerId = await config.getCustomerId(event);

			if (!customerId) {
				return new Response(
					JSON.stringify({ error: `customerId not defined` }),
					{ status: 400 },
				);
			}

			const { customer_portal_url: customerPortalUrl } =
				await pago.customerSessions.create({
					return_url: decodedReturnUrl,
					customer_id: customerId,
				});

			return new Response(null, {
				status: 302,
				headers: { Location: customerPortalUrl },
			});
		} catch (error) {
			console.error(error);
			return new Response(null, { status: 500 });
		}
	};
};

export const Webhooks = ({
	webhookSecret,
	entitlements,
	onPayload,
	...eventHandlers
}: WebhooksConfig): WebhookHandler => {
	return async (event: RequestEvent) => {
		const requestBody = await event.request.text();
		const webhookHeaders = {
			"webhook-id": event.request.headers.get("webhook-id") ?? "",
			"webhook-timestamp": event.request.headers.get("webhook-timestamp") ?? "",
			"webhook-signature": event.request.headers.get("webhook-signature") ?? "",
		};

		// biome-ignore lint/suspicious/noExplicitAny: fix ci
		let webhookPayload: any;

		try {
			webhookPayload = await webhooks.validateEvent(
				requestBody,
				webhookHeaders,
				webhookSecret,
			);
		} catch (error) {
			if (error instanceof PagoWebhookVerificationError) {
				return new Response(JSON.stringify({ received: false }), {
					status: 403,
				});
			}
			throw error;
		}

		await handleWebhookPayload(webhookPayload, {
			webhookSecret,
			entitlements,
			onPayload,
			...eventHandlers,
		});

		return new Response(JSON.stringify({ received: true }), { status: 200 });
	};
};
