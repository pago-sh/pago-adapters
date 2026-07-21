import { createPagoClient } from "@pago-sh/adapter-utils";
import type { Request, Response } from "express";

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
}: CustomerPortalConfig) => {
	const pago = createPagoClient({
		accessToken: accessToken ?? process.env["PAGO_ACCESS_TOKEN"],
		server,
	});

	return async (req: Request, res: Response) => {
		const retUrl = returnUrl ? new URL(returnUrl) : undefined;

		const customerId = await getCustomerId(req);

		if (!customerId) {
			res.status(400).json({ error: "customerId não definido" });
			return;
		}

		try {
			const result = await pago.customerSessions.create({
				customer_id: customerId,
				return_url: retUrl ? decodeURI(retUrl.toString()) : undefined,
			});

			res.redirect(result.customer_portal_url);
			return;
		} catch (error) {
			console.error(error);
			res.status(500).json({ error: "Erro interno do servidor" });
			return;
		}
	};
};
