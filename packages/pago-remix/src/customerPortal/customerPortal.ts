import { Pago } from "@pago-sh/sdk";
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
	const pago = new Pago({
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
				customerId,
				returnUrl: retUrl ? decodeURI(retUrl.toString()) : undefined,
			});

			return Response.redirect(result.customerPortalUrl);
		} catch (error) {
			console.error(error);
			return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
		}
	};
};
