// Define mock values at the top level
const mockCustomerPortalUrl = "https://mock-customer-portal-url.com/";
const mockCheckoutUrl = "https://mock-checkout-url.com/";
const mockSessionCreate = vi
	.fn()
	.mockResolvedValue({ customerPortalUrl: mockCustomerPortalUrl });
const mockCheckoutCreate = vi.fn(() => ({ url: mockCheckoutUrl }));

// Mock the module before any imports
vi.mock("@pago-sh/sdk", async (importOriginal) => {
	class Pago {
		customerSessions = {
			create: mockSessionCreate,
		};

		checkouts = {
			create: mockCheckoutCreate,
		};
	}

	return {
		...(await importOriginal()),
		Pago,
	};
});

import type { APIContext } from "astro";
import { describe, expect, it, vi } from "vitest";
import { Checkout } from "./checkout";

describe("Middleware de checkout", () => {
	it("should redirect to checkout when products is valid", async () => {
		const response = await Checkout({
			accessToken: "mock-access-token",
		})({
			url: new URL(
				new Request(
					"http://localhost:3000/?products=product-1&products=product-2",
				).url,
			),
		} as APIContext);

		expect(response).toBeInstanceOf(Response);
		expect((response as Response).status).toBe(302);
		expect((response as Response).headers.get("Location")).toBe(
			mockCheckoutUrl,
		);
	});

	it("should return 400 when products is not defined", async () => {
		const response = await Checkout({
			accessToken: "mock-access-token",
		})({
			url: new URL(new Request("http://localhost:3000/").url),
		} as APIContext);

		expect(response).toBeInstanceOf(Response);
		expect((response as Response).status).toBe(400);
		expect(await (response as Response).json()).toEqual({
			error: "Produtos ausentes nos parâmetros da query",
		});
	});
});
