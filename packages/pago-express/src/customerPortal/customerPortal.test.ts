// Define mock values at the top level
const mockCustomerPortalUrl = "https://mock-customer-portal-url.com";
const mockCheckoutUrl = "https://mock-checkout-url.com";
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

import express from "express";
import supertest from "supertest";
import { describe, it, vi } from "vitest";
import { CustomerPortal } from "./customerPortal";

describe("Middleware do portal do cliente", () => {
	it("should redirect to customer portal when customerId is valid", async () => {
		const app = express();
		const mockGetCustomerId = async () => "valid-customer-id";

		app.get(
			"/",
			CustomerPortal({
				getCustomerId: mockGetCustomerId,
			}),
		);

		supertest(app)
			.get("/")
			.expect(302)
			.expect("location", mockCustomerPortalUrl)
			.end((err) => {
				if (err) {
					throw err;
				}
			});
	});

	it("should return 400 when customerId is not defined", async () => {
		const app = express();
		const mockGetCustomerId = async () => "";
		app.get(
			"/",
			CustomerPortal({
				getCustomerId: mockGetCustomerId,
			}),
		);

		supertest(app)
			.get("/")
			.expect(400)
			.expect({ error: "customerId não definido" })
			.end((err) => {
				if (err) {
					throw err;
				}
			});
	});
});
