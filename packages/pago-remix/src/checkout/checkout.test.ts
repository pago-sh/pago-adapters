// Define mock values at the top level
const mockCustomerPortalUrl = "https://mock-customer-portal-url.com/";
const mockCheckoutUrl = "https://mock-checkout-url.com/";
const mockSessionCreate = vi
	.fn()
	.mockResolvedValue({ customer_portal_url: mockCustomerPortalUrl });
const mockCheckoutCreate = vi.fn(() => ({ url: mockCheckoutUrl }));

// Mock the module before any imports
vi.mock("@pago-sh/sdk/2026-04", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@pago-sh/sdk/2026-04")>();
	return {
		...actual,
		createPago: vi.fn(() => ({
			customerSessions: {
				create: mockSessionCreate,
			},

			checkouts: {
				create: mockCheckoutCreate,
			},
		})),
	};
});

import { describe, expect, it, vi } from "vitest";
import { Checkout } from "./checkout";

describe("Middleware de checkout", () => {
	it("should redirect to checkout when products is valid", async () => {
		const loader = Checkout({});

		// Test Loader Function
		const response = await loader({
			request: new Request("http://localhost:3000/?products=mock-product-id"),
			context: {},
			params: {},
		});

		expect(response).toBeInstanceOf(Response);
		expect((response as Response).status).toBe(302);
		expect((response as Response).headers.get("Location")).toBe(
			mockCheckoutUrl,
		);
	});

	it("should return 400 when products is not defined", async () => {
		const loader = Checkout({
			accessToken: "mock-access-token",
		});

		const response = await loader({
			request: new Request("http://localhost:3000/"),
			context: {},
			params: {},
		});

		expect(response).toBeInstanceOf(Response);
		expect((response as Response).status).toBe(400);
		expect(await (response as Response).json()).toEqual({
			error: "Produtos ausentes nos parâmetros da consulta",
		});
	});
});
