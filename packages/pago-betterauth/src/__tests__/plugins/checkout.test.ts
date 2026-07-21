import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkout } from "../../plugins/checkout";
import { mockApiError, mockApiResponse } from "../utils/helpers";
import {
	createMockBetterAuthContext,
	createMockCheckout,
	createMockPagoClient,
} from "../utils/mocks";

vi.mock("better-auth/api", () => ({
	APIError: class APIError extends Error {
		constructor(
			public code: string,
			public data: { message: string },
		) {
			super(data.message);
		}
	},
	getSessionFromCtx: vi.fn(),
	createAuthEndpoint: vi.fn((path, config, handler) => ({
		path,
		config,
		handler,
	})),
}));

const { APIError, getSessionFromCtx, createAuthEndpoint } =
	(await vi.importMock("better-auth/api")) as any;

describe("checkout plugin", () => {
	let mockClient: ReturnType<typeof createMockPagoClient>;
	let mockContext: ReturnType<typeof createMockBetterAuthContext>;

	beforeEach(() => {
		mockClient = createMockPagoClient();
		mockContext = createMockBetterAuthContext();
		vi.clearAllMocks();
	});

	describe("plugin creation", () => {
		it("should create checkout plugin with default options", () => {
			const plugin = checkout();
			const endpoints = plugin(mockClient);

			expect(endpoints).toHaveProperty("checkout");
			expect(createAuthEndpoint).toHaveBeenCalledWith(
				"/checkout",
				expect.objectContaining({
					method: "POST",
					body: expect.any(Object),
				}),
				expect.any(Function),
			);
		});

		it("should create checkout plugin with custom options", () => {
			const options = {
				products: [{ productId: "prod-123", slug: "test-product" }],
				successUrl: "https://example.com/success",
				authenticatedUsersOnly: true,
				theme: "dark" as const,
			};

			const plugin = checkout(options);
			const endpoints = plugin(mockClient);

			expect(endpoints).toHaveProperty("checkout");
		});
	});

	describe("checkout endpoint handler", () => {
		let handler: Function;

		beforeEach(() => {
			const plugin = checkout({
				products: [
					{ productId: "prod-123", slug: "test-product" },
					{ productId: "prod-456", slug: "another-product" },
				],
				successUrl: "https://example.com/success",
				theme: "dark",
			});
			const endpoints = plugin(mockClient);
			handler = endpoints.checkout.handler;
		});

		it("should create checkout with product IDs", async () => {
			const mockCheckout = createMockCheckout();
			vi.mocked(getSessionFromCtx).mockResolvedValue({
				user: { id: "user-123" },
			});
			vi.mocked(mockClient.checkouts.create).mockResolvedValue(mockCheckout);

			const ctx = {
				...mockContext,
				body: { products: ["prod-123", "prod-456"] },
				json: vi
					.fn()
					.mockReturnValue({ url: mockCheckout.url, redirect: true }),
			};

			await handler(ctx);

			expect(mockClient.checkouts.create).toHaveBeenCalledWith(
				expect.objectContaining({
					external_customer_id: "user-123",
					products: ["prod-123", "prod-456"],
					success_url: "https://example.com/success",
					metadata: undefined,
					custom_field_data: undefined,
				}),
			);

			expect(ctx.json).toHaveBeenCalledWith({
				url: expect.stringContaining("theme=dark"),
				redirect: true,
			});
		});

		it("should create checkout with single product ID", async () => {
			const mockCheckout = createMockCheckout();
			vi.mocked(getSessionFromCtx).mockResolvedValue({
				user: { id: "user-123" },
			});
			vi.mocked(mockClient.checkouts.create).mockResolvedValue(mockCheckout);

			const ctx = {
				...mockContext,
				body: { products: "prod-123" },
				json: vi
					.fn()
					.mockReturnValue({ url: mockCheckout.url, redirect: true }),
			};

			await handler(ctx);

			expect(mockClient.checkouts.create).toHaveBeenCalledWith(
				expect.objectContaining({
					external_customer_id: "user-123",
					products: ["prod-123"],
					success_url: "https://example.com/success",
					metadata: undefined,
					custom_field_data: undefined,
				}),
			);
		});

		it("should create checkout with product slug", async () => {
			const mockCheckout = createMockCheckout();
			vi.mocked(getSessionFromCtx).mockResolvedValue({
				user: { id: "user-123" },
			});
			vi.mocked(mockClient.checkouts.create).mockResolvedValue(mockCheckout);

			const ctx = {
				...mockContext,
				body: { slug: "test-product" },
				json: vi
					.fn()
					.mockReturnValue({ url: mockCheckout.url, redirect: true }),
			};

			await handler(ctx);

			expect(mockClient.checkouts.create).toHaveBeenCalledWith(
				expect.objectContaining({
					external_customer_id: "user-123",
					products: ["prod-123"],
					success_url: "https://example.com/success",
					metadata: undefined,
					custom_field_data: undefined,
				}),
			);
		});

		it("should handle async product resolution", async () => {
			const asyncProducts = vi
				.fn()
				.mockResolvedValue([
					{ productId: "async-prod-123", slug: "async-product" },
				]);

			const plugin = checkout({ products: asyncProducts });
			const endpoints = plugin(mockClient);
			const asyncHandler = endpoints.checkout.handler;

			const mockCheckout = createMockCheckout();
			vi.mocked(getSessionFromCtx).mockResolvedValue({
				user: { id: "user-123" },
			});
			vi.mocked(mockClient.checkouts.create).mockResolvedValue(mockCheckout);

			const ctx = {
				...mockContext,
				body: { slug: "async-product" },
				json: vi
					.fn()
					.mockReturnValue({ url: mockCheckout.url, redirect: true }),
			};

			await asyncHandler(ctx);

			expect(asyncProducts).toHaveBeenCalled();
			expect(mockClient.checkouts.create).toHaveBeenCalledWith(
				expect.objectContaining({
					external_customer_id: "user-123",
					products: ["async-prod-123"],
					success_url: undefined,
					metadata: undefined,
					custom_field_data: undefined,
				}),
			);
		});

		it("should throw error for unknown product slug", async () => {
			vi.mocked(getSessionFromCtx).mockResolvedValue({
				user: { id: "user-123" },
			});

			const ctx = {
				...mockContext,
				body: { slug: "unknown-product" },
			};

			await expect(handler(ctx)).rejects.toThrow("Produto não encontrado");
		});

		it("should include metadata and custom field data", async () => {
			const mockCheckout = createMockCheckout();
			vi.mocked(getSessionFromCtx).mockResolvedValue({
				user: { id: "user-123" },
			});
			vi.mocked(mockClient.checkouts.create).mockResolvedValue(mockCheckout);

			const ctx = {
				...mockContext,
				body: {
					products: ["prod-123"],
					referenceId: "ref-123",
					metadata: { key: "value" },
					customFieldData: { field: "data" },
				},
				json: vi
					.fn()
					.mockReturnValue({ url: mockCheckout.url, redirect: true }),
			};

			await handler(ctx);

			expect(mockClient.checkouts.create).toHaveBeenCalledWith(
				expect.objectContaining({
					external_customer_id: "user-123",
					products: ["prod-123"],
					success_url: "https://example.com/success",
					metadata: { referenceId: "ref-123", key: "value" },
					custom_field_data: { field: "data" },
				}),
			);
		});

		it("should handle unauthenticated users when not required", async () => {
			const plugin = checkout({ authenticatedUsersOnly: false });
			const endpoints = plugin(mockClient);
			const publicHandler = endpoints.checkout.handler;

			const mockCheckout = createMockCheckout();
			vi.mocked(getSessionFromCtx).mockResolvedValue(null);
			vi.mocked(mockClient.checkouts.create).mockResolvedValue(mockCheckout);

			const ctx = {
				...mockContext,
				body: { products: ["prod-123"] },
				json: vi
					.fn()
					.mockReturnValue({ url: mockCheckout.url, redirect: true }),
			};

			await publicHandler(ctx);

			expect(mockClient.checkouts.create).toHaveBeenCalledWith(
				expect.objectContaining({
					external_customer_id: undefined,
					products: ["prod-123"],
					success_url: undefined,
					metadata: undefined,
					custom_field_data: undefined,
				}),
			);
		});

		it("should throw error for unauthenticated users when authentication required", async () => {
			const plugin = checkout({ authenticatedUsersOnly: true });
			const endpoints = plugin(mockClient);
			const authHandler = endpoints.checkout.handler;

			vi.mocked(getSessionFromCtx).mockResolvedValue(null);

			const ctx = {
				...mockContext,
				body: { products: ["prod-123"] },
			};

			await expect(authHandler(ctx)).rejects.toThrow(
				"Você precisa estar logado para finalizar a compra",
			);
		});

		it("should handle API errors from Pago", async () => {
			vi.mocked(getSessionFromCtx).mockResolvedValue({
				user: { id: "user-123" },
			});
			vi.mocked(mockClient.checkouts.create).mockRejectedValue(
				mockApiError(400, "Produto inválido"),
			);

			const ctx = {
				...mockContext,
				body: { products: ["prod-123"] },
				context: { logger: { error: vi.fn() } },
			};

			await expect(handler(ctx)).rejects.toThrow("Falha ao criar o checkout");
			expect(ctx.context.logger.error).toHaveBeenCalledWith(
				expect.stringContaining("Falha ao criar o checkout"),
			);
		});

		it("should handle success URL construction", async () => {
			const mockCheckout = {
				...createMockCheckout(),
				url: "https://pago.sh/checkout/test-123",
			};
			vi.mocked(getSessionFromCtx).mockResolvedValue({
				user: { id: "user-123" },
			});
			vi.mocked(mockClient.checkouts.create).mockResolvedValue(mockCheckout);

			const ctx = {
				...mockContext,
				body: { products: ["prod-123"] },
				request: { url: "https://example.com/api/checkout" },
				json: vi
					.fn()
					.mockReturnValue({ url: mockCheckout.url, redirect: true }),
			};

			await handler(ctx);

			expect(mockClient.checkouts.create).toHaveBeenCalledWith(
				expect.objectContaining({
					success_url: "https://example.com/success",
				}),
			);
		});

		it("should filter out undefined product IDs", async () => {
			const mockCheckout = createMockCheckout();
			vi.mocked(getSessionFromCtx).mockResolvedValue({
				user: { id: "user-123" },
			});
			vi.mocked(mockClient.checkouts.create).mockResolvedValue(mockCheckout);

			const ctx = {
				...mockContext,
				body: { products: ["prod-123", undefined, "prod-456"] },
				json: vi
					.fn()
					.mockReturnValue({ url: mockCheckout.url, redirect: true }),
			};

			await handler(ctx);

			expect(mockClient.checkouts.create).toHaveBeenCalledWith(
				expect.objectContaining({
					products: ["prod-123", "prod-456"],
				}),
			);
		});
	});
});
