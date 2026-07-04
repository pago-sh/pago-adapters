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

import express from "express";
import supertest from "supertest";
import { describe, it, vi } from "vitest";
import { Checkout } from "./checkout";

describe("Middleware de checkout", () => {
	it("should redirect to checkout when products is valid", async () => {
		const app = express();
		app.get(
			"/",
			Checkout({
				accessToken: "mock-access-token",
			}),
		);

		supertest(app)
			.get("/?products=mock-product-id")
			.expect(302)
			.expect("location", mockCheckoutUrl)
			.end((err) => {
				if (err) {
					throw err;
				}
			});
	});

	it("should return 400 when products is not defined", async () => {
		const app = express();
		app.get(
			"/",
			Checkout({
				accessToken: "mock-access-token",
			}),
		);

		supertest(app)
			.get("/")
			.expect(400)
			.expect({
				error: "Produtos ausentes nos parâmetros da query",
			})
			.end((err) => {
				if (err) {
					throw err;
				}
			});
	});
});
