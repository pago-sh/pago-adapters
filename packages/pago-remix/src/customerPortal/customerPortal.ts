import { createPagoClient } from "@pago-sh/adapter-utils";
import type { LoaderFunction } from "../types";

export interface CustomerPortalConfig {
	accessToken?: string;
	getCustomerId: (req: Request) => Promise<string>;
	server?: "sandbox" | "production";
	returnUrl?: string;
}

export const CustomerPortal = ({
	accessToken,
	server,
	getCustomerId,
	returnUrl,
}: CustomerPortalConfig): LoaderFunction => {
	const pago = createPagoClient({
		accessToken: accessToken ?? process.env["PAGO_ACCESS_TOKEN"],
		server,
	});

	return async ({ request }) => {
		const retUrl = returnUrl ? new URL(returnUrl) : undefined;

		const customerId = await getCustomerId(request);

		if (!customerId) {
			return Response.json(
				{ error: "customerId não definido" },
				{ status: 400 },
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
			return Response.json(
				{ error: "Erro interno do servidor" },
				{ status: 500 },
			);
		}
	};
};
