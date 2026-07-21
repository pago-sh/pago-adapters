import { createPagoClient } from "@pago-sh/adapter-utils";
import { type NextRequest, NextResponse } from "next/server";

interface CustomerPortalBaseConfig {
	accessToken: string;
	server: "sandbox" | "production";
	returnUrl?: string;
}

interface CustomerPortalCustomerIdConfig extends CustomerPortalBaseConfig {
	getCustomerId: (req: NextRequest) => Promise<string>;
	getExternalCustomerId?: never;
}

interface CustomerPortalExternalCustomerIdConfig
	extends CustomerPortalBaseConfig {
	getCustomerId?: never;
	getExternalCustomerId: (req: NextRequest) => Promise<string>;
}

function configIsExternalCustomerIdConfig(
	config: CustomerPortalConfig,
): config is CustomerPortalExternalCustomerIdConfig {
	return typeof config.getExternalCustomerId === "function";
}

export type CustomerPortalConfig =
	| CustomerPortalCustomerIdConfig
	| CustomerPortalExternalCustomerIdConfig;

export const CustomerPortal = (config: CustomerPortalConfig) => {
	const { accessToken, server, returnUrl } = config;

	const pago = createPagoClient({
		accessToken,
		server,
	});

	return async (req: NextRequest) => {
		const decodedReturnUrl = returnUrl
			? decodeURI(new URL(returnUrl).toString())
			: undefined;

		if (configIsExternalCustomerIdConfig(config)) {
			const externalCustomerId = await config.getExternalCustomerId(req);

			if (!externalCustomerId) {
				return NextResponse.json(
					{ error: "externalCustomerId não definido" },
					{ status: 400 },
				);
			}

			try {
				const { customer_portal_url: customerPortalUrl } =
					await pago.customerSessions.create({
						return_url: decodedReturnUrl,
						external_customer_id: externalCustomerId,
					});

				return NextResponse.redirect(customerPortalUrl);
			} catch (error) {
				console.error(error);
				return NextResponse.error();
			}
		}

		const customerId = await config.getCustomerId(req);

		if (!customerId) {
			return NextResponse.json(
				{ error: "customerId não definido" },
				{ status: 400 },
			);
		}

		try {
			const { customer_portal_url: customerPortalUrl } =
				await pago.customerSessions.create({
					return_url: decodedReturnUrl,
					customer_id: customerId,
				});

			return NextResponse.redirect(customerPortalUrl);
		} catch (error) {
			console.error(error);
			return NextResponse.error();
		}
	};
};
