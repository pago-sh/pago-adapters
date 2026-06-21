import { Pago } from "@pago-sh/sdk";

export const pagoSDK = new Pago({
  accessToken: process.env["PAGO_ACCESS_TOKEN"] as string,
  server: "sandbox",
});
