import type { Pago } from "@pago-sh/sdk/2026-04";
import type { UnionToIntersection, User } from "better-auth";
import type { checkout } from "./plugins/checkout";
import type { portal } from "./plugins/portal";
import type { usage } from "./plugins/usage";
import type { webhooks } from "./plugins/webhooks";

export type Product = {
	/**
	 * Id do produto do Produto Pago
	 */
	productId: string;
	/**
	 * Slug facilmente identificável para o produto
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
	 * Cliente Pago
	 */
	client: Pago;
	/**
	 * Habilita a criação de cliente quando um usuário se cadastra
	 */
	createCustomerOnSignUp?: boolean;
	/**
	 * Uma função personalizada para obter os parâmetros de
	 * criação do cliente
	 * @param data - dados contendo o usuário e a sessão
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
	 * Usa plugins Pago
	 */
	use: PagoPlugins;
}
