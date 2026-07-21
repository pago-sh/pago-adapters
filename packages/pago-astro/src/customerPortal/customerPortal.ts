import { createPagoClient } from "@pago-sh/adapter-utils";
import type { APIRoute } from "astro";

export interface CustomerPortalConfig {
	accessToken?: string;
	getCustomerId: (req: Request) => Promise<string>;
	returnUrl?: string;
	server?: "sandbox" | "production";
}

export const CustomerPortal = ({
	accessToken,
	server,
	getCustomerId,
	returnUrl,
}: CustomerPortalConfig): APIRoute => {
	return async ({ request }) => {
		if (!accessToken) {
			const { getSecret } = await import("astro:env/server");
			accessToken = getSecret("PAGO_ACCESS_TOKEN");
		}

		const pago = createPagoClient({
			accessToken,
			server,
		});

		const customerId = await getCustomerId(request);

		if (!customerId) {
			return Response.json(
				{ error: "customerId não definido" },
				{ status: 400 },
			);
		}

		const retUrl = returnUrl ? new URL(returnUrl) : undefined;

		try {
			const result = await pago.customerSessions.create({
				customer_id: customerId,
				return_url: retUrl ? decodeURI(retUrl.toString()) : undefined,
			});

			return Response.redirect(result.customer_portal_url);
		} catch (error) {
			console.error(error);
			return Response.json(
				{ error: "Erro interno do servidor" },
				{ status: 500 },
			);
		}
	};
};
