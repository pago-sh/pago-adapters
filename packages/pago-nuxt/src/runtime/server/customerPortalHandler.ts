import { Pago } from "@pago-sh/sdk";
import { createError, sendRedirect } from "h3";
import type { H3Event } from "h3";

export interface CustomerPortalConfig {
	accessToken: string;
	server?: "sandbox" | "production";
	getCustomerId: (event: H3Event) => Promise<string>;
	returnUrl?: string;
}

export const CustomerPortal = ({
	accessToken,
	server,
	getCustomerId,
	returnUrl,
}: CustomerPortalConfig) => {
	return async (event: H3Event) => {
		const retUrl = returnUrl ? new URL(returnUrl) : undefined;

		const customerId = await getCustomerId(event);

		if (!customerId) {
			console.error(
				"Falha ao redirecionar para o portal do cliente, customerId não definido",
			);
			throw createError({
				statusCode: 400,
				message: "customerId não definido",
			});
		}

		try {
			const pago = new Pago({
				accessToken,
				server,
			});

			const result = await pago.customerSessions.create({
				customerId,
				returnUrl: retUrl ? decodeURI(retUrl.toString()) : undefined,
			});

			return sendRedirect(event, result.customerPortalUrl);
		} catch (error) {
			console.error("Falha ao redirecionar para o portal do cliente", error);
			throw createError({
				statusCode: 500,
				statusMessage: (error as Error).message,
				message: (error as Error).message ?? "Erro interno do servidor",
			});
		}
	};
};
