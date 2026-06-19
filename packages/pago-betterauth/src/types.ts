import type { Pago } from "@pago-sh/sdk";

import type { UnionToIntersection, User } from "better-auth";
import type { checkout } from "./plugins/checkout";
import type { portal } from "./plugins/portal";
import type { usage } from "./plugins/usage";
import type { webhooks } from "./plugins/webhooks";

export type Product = {
	/**
	 * Product Id from Pago Product
	 */
	productId: string;
	/**
	 * Easily identifiable slug for the product
	 */
	slug: string;
};

export type PagoPlugin =
	| ReturnType<typeof checkout>
	| ReturnType<typeof usage>
	| ReturnType<typeof portal>
	| ReturnType<typeof webhooks>;

export type PagoPlugins = [PagoPlugin, ...PagoPlugin[]];

export type PagoEndpoints = UnionToIntersection<ReturnType<PagoPlugin>>;

export interface PagoOptions {
	/**
	 * Pago Client
	 */
	client: Pago;
	/**
	 * Enable customer creation when a user signs up
	 */
	createCustomerOnSignUp?: boolean;
	/**
	 * A custom function to get the customer create
	 * params
	 * @param data - data containing user and session
	 * @returns
	 */
	getCustomerCreateParams?: (
		data: {
			user: Partial<User>;
		},
		request?: Request,
	) => Promise<{
		metadata?: Record<string, string | number | boolean>;
	}>;
	/**
	 * Use Pago plugins
	 */
	use: PagoPlugins;
}
