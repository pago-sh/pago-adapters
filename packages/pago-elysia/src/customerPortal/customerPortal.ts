import { createPagoClient } from "@pago-sh/adapter-utils";
import { type Context, status } from "elysia";
import type { InlineHandler } from "elysia/types";

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
}: CustomerPortalConfig): InlineHandler => {
	const pago = createPagoClient({
		accessToken: accessToken ?? process.env["PAGO_ACCESS_TOKEN"],
		server,
	});

	return async (ctx: Context) => {
		const retUrl = returnUrl ? new URL(returnUrl) : undefined;

		const customerId = await getCustomerId(ctx.request);

		if (!customerId) {
			return status(400, { error: "customerId não definido" });
		}

		try {
			const result = await pago.customerSessions.create({
				customer_id: customerId,
				return_url: retUrl ? decodeURI(retUrl.toString()) : undefined,
			});

			return ctx.redirect(result.customer_portal_url);
		} catch (error) {
			console.error(error);
			return status(500, { error: "Erro interno do servidor" });
		}
	};
};
