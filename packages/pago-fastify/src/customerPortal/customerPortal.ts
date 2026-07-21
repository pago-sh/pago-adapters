import { createPagoClient } from "@pago-sh/adapter-utils";
import type { FastifyReply, FastifyRequest, RouteHandler } from "fastify";
export interface CustomerPortalConfig {
	accessToken?: string;
	getCustomerId: (req: FastifyRequest) => Promise<string>;
	server?: "sandbox" | "production";
	returnUrl?: string;
}

export const CustomerPortal = ({
	accessToken,
	server,
	getCustomerId,
	returnUrl,
}: CustomerPortalConfig): RouteHandler => {
	const pago = createPagoClient({
		accessToken: accessToken ?? process.env["PAGO_ACCESS_TOKEN"],
		server,
	});

	return async (request: FastifyRequest, reply: FastifyReply) => {
		const retUrl = returnUrl ? new URL(returnUrl) : undefined;

		const customerId = await getCustomerId(request);

		if (!customerId) {
			return reply.status(400).send({ error: "customerId não definido" });
		}

		try {
			const result = await pago.customerSessions.create({
				customer_id: customerId,
				return_url: retUrl ? decodeURI(retUrl.toString()) : undefined,
			});

			return reply.redirect(result.customer_portal_url);
		} catch (error) {
			console.error(error);
			return reply.status(500).send({ error: "Erro interno do servidor" });
		}
	};
};
