// Define mock values at the top level
const mockCheckoutUrl = "https://pago.sh/checkout/123";
const mockCheckoutCreate = vi.fn(() => ({ url: mockCheckoutUrl }));

// Mock the module before any imports
vi.mock("@pago-sh/sdk/2026-04", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@pago-sh/sdk/2026-04")>();
	return {
		...actual,
		createPago: vi.fn(() => ({
			checkouts: {
				create: mockCheckoutCreate,
			},
		})),
	};
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { Checkout } from "./checkout";

describe("Checkout", () => {
	beforeEach(() => {
		mockCheckoutCreate.mockClear();
	});

	describe("configuration", () => {
		it("should create checkout function", () => {
			const checkout = Checkout({
				accessToken: "test-token",
				server: "sandbox",
			});

			expect(checkout).toBeDefined();
			expect(typeof checkout).toBe("function");
		});

		it("should handle default includeCheckoutId", () => {
			const checkout = Checkout({
				accessToken: "test-token",
			});

			expect(checkout).toBeDefined();
		});
	});

	describe("request handling", () => {
		it("should return 400 when no products provided", async () => {
			const checkout = Checkout({ accessToken: "test-token" });
			const request = new Request("https://example.com/checkout");

			const response = await checkout(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe("Produtos ausentes nos parâmetros da query");
		});

		it("should create checkout with single product", async () => {
			const checkout = Checkout({ accessToken: "test-token" });
			const request = new Request(
				"https://example.com/checkout?products=prod_123",
			);

			const response = await checkout(request);

			expect(mockCheckoutCreate).toHaveBeenCalledTimes(1);
			expect(mockCheckoutCreate).toHaveBeenCalledWith({
				products: ["prod_123"],
			});
			expect(response.status).toBe(302);
		});

		it("should create checkout with multiple products", async () => {
			const checkout = Checkout({ accessToken: "test-token" });
			const request = new Request(
				"https://example.com/checkout?products=prod_123&products=prod_456",
			);

			await checkout(request);

			expect(mockCheckoutCreate).toHaveBeenCalledWith({
				products: ["prod_123", "prod_456"],
			});
		});

		it("should include successUrl with checkoutId when configured", async () => {
			const checkout = Checkout({
				accessToken: "test-token",
				successUrl: "https://example.com/success",
				includeCheckoutId: true,
			});
			const request = new Request(
				"https://example.com/checkout?products=prod_123",
			);

			await checkout(request);

			expect(mockCheckoutCreate).toHaveBeenCalledWith({
				products: ["prod_123"],
				success_url: "https://example.com/success?checkoutId={CHECKOUT_ID}",
			});
		});

		it("should include successUrl without checkoutId when disabled", async () => {
			const checkout = Checkout({
				accessToken: "test-token",
				successUrl: "https://example.com/success",
				includeCheckoutId: false,
			});
			const request = new Request(
				"https://example.com/checkout?products=prod_123",
			);

			await checkout(request);

			expect(mockCheckoutCreate).toHaveBeenCalledWith({
				products: ["prod_123"],
				success_url: "https://example.com/success",
			});
		});

		it("should add theme parameter to redirect URL", async () => {
			const checkout = Checkout({
				accessToken: "test-token",
				theme: "dark",
			});
			const request = new Request(
				"https://example.com/checkout?products=prod_123",
			);

			const response = await checkout(request);

			expect(response.headers.get("location")).toBe(
				"https://pago.sh/checkout/123?theme=dark",
			);
		});

		it("should parse customer parameters correctly", async () => {
			const checkout = Checkout({ accessToken: "test-token" });
			const billingAddress = JSON.stringify({
				street: "123 Main St",
				city: "NYC",
			});
			const metadata = JSON.stringify({ source: "website" });
			const customerMetadata = JSON.stringify({ plan: "premium" });

			const requestUrl = new URL("https://example.com/checkout");
			requestUrl.searchParams.set("products", "prod_123");
			requestUrl.searchParams.set("customerId", "cust_123");
			requestUrl.searchParams.set("customerExternalId", "ext_123");
			requestUrl.searchParams.set("customerEmail", "test@example.com");
			requestUrl.searchParams.set("customerName", "John Doe");
			requestUrl.searchParams.set("customerBillingAddress", billingAddress);
			requestUrl.searchParams.set("customerTaxId", "TAX123");
			requestUrl.searchParams.set("customerIpAddress", "192.168.1.1");
			requestUrl.searchParams.set("customerMetadata", customerMetadata);
			requestUrl.searchParams.set("allowDiscountCodes", "true");
			requestUrl.searchParams.set("discountId", "disc_123");
			requestUrl.searchParams.set("metadata", metadata);

			const request = new Request(requestUrl.toString());

			await checkout(request);

			expect(mockCheckoutCreate).toHaveBeenCalledWith({
				products: ["prod_123"],
				customer_id: "cust_123",
				external_customer_id: "ext_123",
				customer_email: "test@example.com",
				customer_name: "John Doe",
				customer_billing_address: {
					street: "123 Main St",
					city: "NYC",
				},
				customer_tax_id: "TAX123",
				customer_ip_address: "192.168.1.1",
				customer_metadata: { plan: "premium" },
				allow_discount_codes: true,
				discount_id: "disc_123",
				metadata: { source: "website" },
			});
		});

		it("should handle allowDiscountCodes as false", async () => {
			const checkout = Checkout({ accessToken: "test-token" });
			const request = new Request(
				"https://example.com/checkout?products=prod_123&allowDiscountCodes=false",
			);

			await checkout(request);

			expect(mockCheckoutCreate).toHaveBeenCalledWith({
				products: ["prod_123"],
				allow_discount_codes: false,
			});
		});

		it("should return error response when checkout creation fails", async () => {
			mockCheckoutCreate.mockRejectedValueOnce(new Error("API Error"));

			const checkout = Checkout({ accessToken: "test-token" });
			const request = new Request(
				"https://example.com/checkout?products=prod_123",
			);

			const response = await checkout(request);

			expect(response.status).toBe(500);
		});
	});
});
