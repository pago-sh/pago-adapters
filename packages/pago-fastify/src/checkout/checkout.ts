import { createPagoClient } from "@pago-sh/adapter-utils";
import type { FastifyReply, FastifyRequest, RouteHandler } from "fastify";

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
}: CheckoutConfig): RouteHandler => {
	const pago = createPagoClient({
		accessToken: accessToken ?? process.env["PAGO_ACCESS_TOKEN"],
		server,
	});

	return async (request: FastifyRequest, reply: FastifyReply) => {
		const url = new URL(
			`${request.protocol}://${request.hostname}${request.url}`,
		);
		const products = url.searchParams.getAll("products");

		if (products.length === 0) {
			return reply.status(400).send({
				error: "Produtos ausentes nos parâmetros de consulta",
			});
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
				seats: url.searchParams.has("seats")
					? Number.parseInt(url.searchParams.get("seats") ?? "1", 10)
					: undefined,
				return_url: retUrl ? decodeURI(retUrl.toString()) : undefined,
			});

			const redirectUrl = new URL(result.url);

			if (theme) {
				redirectUrl.searchParams.set("theme", theme);
			}

			return reply.redirect(redirectUrl.toString());
		} catch (error) {
			console.error(error);
			return reply.status(500).send({ error: "Erro interno do servidor" });
		}
	};
};
