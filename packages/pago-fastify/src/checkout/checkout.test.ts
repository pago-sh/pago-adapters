// Define mock values at the top level
const mockCustomerPortalUrl = "https://mock-customer-portal-url.com";
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

import fastify from "fastify";
import { describe, expect, it, vi } from "vitest";
import { Checkout } from "./checkout";

describe("Middleware de checkout", () => {
	it("should redirect to checkout when products is valid", async () => {
		const app = fastify();
		app.get(
			"/",
			Checkout({
				accessToken: "mock-access-token",
			}),
		);

		const response = await app.inject({
			url: "http://localhost/?products=mock-product-id",
			method: "GET",
		});

		expect(response.statusCode).toBe(302);
		expect(response.headers["location"]).toBe(mockCheckoutUrl);
	});

	it("should return 400 when products is not defined", async () => {
		const app = fastify();
		app.get(
			"/",
			Checkout({
				accessToken: "mock-access-token",
			}),
		);

		const response = await app.inject({
			url: "http://localhost/",
			method: "GET",
		});

		expect(response.statusCode).toBe(400);
		expect(response.json()).toEqual({
			error: "Produtos ausentes nos parâmetros de consulta",
		});
	});
});
