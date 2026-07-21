import { createPagoClient } from "@pago-sh/adapter-utils";

export const pagoSDK = createPagoClient({
	accessToken: process.env["PAGO_ACCESS_TOKEN"] as string,
	server: "sandbox",
});
