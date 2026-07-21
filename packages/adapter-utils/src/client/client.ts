import { createPago } from "@pago-sh/sdk/2026-04";
import type { Pago } from "@pago-sh/sdk/2026-04";

export type PagoServer = "sandbox" | "production";

export const PAGO_SERVER_URLS: Record<PagoServer, string> = {
	production: "https://api.pago.sh",
	sandbox: "https://sandbox-api.pago.sh",
};

export interface PagoClientConfig {
	accessToken?: string;
	server?: PagoServer;
	baseUrl?: string;
}

export const createPagoClient = ({
	accessToken,
	server,
	baseUrl,
}: PagoClientConfig): Pago =>
	createPago({
		accessToken: accessToken ?? "",
		baseUrl: baseUrl ?? PAGO_SERVER_URLS[server ?? "production"],
	});
