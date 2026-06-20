import { Pago } from "@pago-sh/sdk";
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
	const pago = new Pago({
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
				customerId,
				returnUrl: retUrl ? decodeURI(retUrl.toString()) : undefined,
			});

			return ctx.redirect(result.customerPortalUrl);
		} catch (error) {
			console.error(error);
			return status(500, { error: "Erro interno do servidor" });
		}
	};
};
