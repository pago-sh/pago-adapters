import { betterAuth } from "better-auth";
import {
	pago,
	checkout,
	webhooks,
	usage,
	portal,
} from "@pago-sh/better-auth";
import Database from "better-sqlite3";
import { pagoSDK } from "./pago";
import { organization } from "better-auth/plugins";

export const auth = betterAuth({
	emailAndPassword: {
		enabled: true,
	},
	plugins: [
		organization(),
		pago({
			client: pagoSDK,
			createCustomerOnSignUp: true,
			async getCustomerCreateParams() {
				return {
					metadata: {
						hello: "world",
					},
				};
			},
			use: [
				checkout({
					theme: "dark",
					products: [
						{
							productId: "e651f46d-ac20-4f26-b769-ad088b123df2",
							slug: "pro",
						},
					],
					returnUrl: "https://myapp.com",
				}),
				usage(),
				portal({
					returnUrl: "https://myapp.com",
				}),
				webhooks({
					secret: process.env["PAGO_WEBHOOK_SECRET"] as string,
					onOrganizationUpdated: async (payload) => {
						console.log(payload);
					},
				}),
			],
		}),
	],
	database: new Database("sqlite.db"),
});
