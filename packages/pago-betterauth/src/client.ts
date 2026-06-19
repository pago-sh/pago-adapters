import { PagoEmbedCheckout } from "@pago-sh/checkout/embed";
import type { PagoEmbedCheckout as PagoEmbedCheckoutType } from "@pago-sh/checkout/embed";
import type { BetterAuthClientPlugin } from "better-auth";
import type { BetterFetchOption } from "better-auth/client";
import type { CheckoutParams } from "./plugins/checkout";
import type { pago } from "./server";

export type { PagoEmbedCheckoutType as PagoEmbedCheckout };

export const pagoClient = () => {
	return {
		id: "pago-client",
		$InferServerPlugin: {} as ReturnType<typeof pago>,
		getActions: ($fetch) => {
			return {
				checkoutEmbed: async (
					data: Omit<CheckoutParams, "redirect" | "embedOrigin">,
					fetchOptions?: BetterFetchOption,
				): Promise<PagoEmbedCheckoutType> => {
					const res = await $fetch("/checkout", {
						method: "POST",
						body: {
							...data,
							redirect: false,
							embedOrigin: window.location.origin,
						},
						...fetchOptions,
					});

					if (res.error) {
						throw new Error(res.error.message);
					}

					const checkout = res.data as { url: string };

					const theme =
						(new URL(checkout.url).searchParams.get("theme") as
							| "light"
							| "dark"
							| undefined) ?? "light";

					return await PagoEmbedCheckout.create(checkout.url, { theme });
				},
			};
		},
	} satisfies BetterAuthClientPlugin;
};
