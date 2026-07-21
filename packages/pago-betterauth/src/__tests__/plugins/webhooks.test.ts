import { webhooks as sdkWebhooks } from "@pago-sh/sdk/2026-04";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { webhooks } from "../../plugins/webhooks";
import { createMockPagoClient } from "../utils/mocks";

vi.mock("@pago-sh/adapter-utils", () => ({
	handleWebhookPayload: vi.fn(),
}));

vi.mock("@pago-sh/sdk/2026-04", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@pago-sh/sdk/2026-04")>();
	return {
		...actual,
		webhooks: { ...actual.webhooks, validateEvent: vi.fn() },
	};
});

vi.mock("better-auth/api", () => ({
	APIError: class APIError extends Error {
		constructor(
			public code: string,
			public data?: { message: string },
		) {
			super(data?.message || code);
		}
	},
	createAuthEndpoint: vi.fn((path, config, handler) => ({
		path,
		config,
		handler,
	})),
}));

const { handleWebhookPayload } = (await vi.importMock(
	"@pago-sh/adapter-utils",
)) as any;
const { validateEvent } = sdkWebhooks as any;
const { APIError, createAuthEndpoint } = (await vi.importMock(
	"better-auth/api",
)) as any;

describe("webhooks plugin", () => {
	let mockClient: ReturnType<typeof createMockPagoClient>;

	beforeEach(() => {
		mockClient = createMockPagoClient();
		vi.clearAllMocks();
	});

	describe("plugin creation", () => {
		it("should create webhooks plugin with minimal options", () => {
			const options = {
				secret: "test-secret",
			};

			const plugin = webhooks(options);
			const endpoints = plugin(mockClient);

			expect(endpoints).toHaveProperty("pagoWebhooks");
		});

		it("should create webhooks plugin with all handlers", () => {
			const options = {
				secret: "test-secret",
				onPayload: vi.fn(),
				onCheckoutCreated: vi.fn(),
				onCheckoutUpdated: vi.fn(),
				onOrderCreated: vi.fn(),
				onOrderPaid: vi.fn(),
				onOrderRefunded: vi.fn(),
				onSubscriptionCreated: vi.fn(),
				onSubscriptionUpdated: vi.fn(),
				onSubscriptionActive: vi.fn(),
				onSubscriptionCanceled: vi.fn(),
				onCustomerCreated: vi.fn(),
				onCustomerUpdated: vi.fn(),
			};

			const plugin = webhooks(options);
			const endpoints = plugin(mockClient);

			expect(endpoints).toHaveProperty("pagoWebhooks");
		});

		it("should configure endpoint with correct path and options", () => {
			const options = { secret: "test-secret" };
			const plugin = webhooks(options);
			plugin(mockClient);

			expect(createAuthEndpoint).toHaveBeenCalledWith(
				"/pago/webhooks",
				expect.objectContaining({
					method: "POST",
					metadata: { isAction: false },
					cloneRequest: true,
				}),
				expect.any(Function),
			);
		});
	});

	describe("webhook endpoint handler", () => {
		let handler: Function;
		let mockRequest: Request;

		beforeEach(() => {
			const options = {
				secret: "test-webhook-secret",
				onCheckoutCreated: vi.fn(),
				onOrderPaid: vi.fn(),
			};

			const plugin = webhooks(options);
			const endpoints = plugin(mockClient);
			handler = endpoints.pagoWebhooks.handler;

			// Create a mock request with proper headers
			const headers = new Headers({
				"webhook-id": "wh_123",
				"webhook-timestamp": "1234567890",
				"webhook-signature": "v1,signature123",
			});

			mockRequest = {
				headers,
				text: vi
					.fn()
					.mockResolvedValue('{"type": "checkout.created", "data": {}}'),
				body: '{"type": "checkout.created", "data": {}}',
			} as any;
		});

		it("should process valid webhook successfully", async () => {
			const mockEvent = {
				type: "checkout.created",
				data: { id: "checkout-123" },
			};

			vi.mocked(validateEvent).mockReturnValue(mockEvent);
			vi.mocked(handleWebhookPayload).mockResolvedValue(undefined);

			const ctx = {
				request: mockRequest,
				context: {
					logger: { error: vi.fn() },
				},
				json: vi.fn().mockReturnValue({ received: true }),
			};

			await handler(ctx);

			expect(validateEvent).toHaveBeenCalledWith(
				'{"type": "checkout.created", "data": {}}',
				{
					"webhook-id": "wh_123",
					"webhook-timestamp": "1234567890",
					"webhook-signature": "v1,signature123",
				},
				"test-webhook-secret",
			);

			expect(handleWebhookPayload).toHaveBeenCalledWith(
				mockEvent,
				expect.objectContaining({
					webhookSecret: "test-webhook-secret",
				}),
			);

			expect(ctx.json).toHaveBeenCalledWith({ received: true });
		});

		it("should throw error when request body is missing", async () => {
			const ctx = {
				request: { body: null },
				context: { logger: { error: vi.fn() } },
			};

			await expect(handler(ctx)).rejects.toThrow();
		});

		it("should throw error when webhook secret is missing", async () => {
			const options = { secret: "" };
			const plugin = webhooks(options);
			const endpoints = plugin(mockClient);
			const noSecretHandler = endpoints.pagoWebhooks.handler;

			const ctx = {
				request: mockRequest,
				context: { logger: { error: vi.fn() } },
			};

			await expect(noSecretHandler(ctx)).rejects.toThrow(
				"Segredo do webhook do Pago não encontrado",
			);
		});

		it("should handle invalid webhook signature", async () => {
			vi.mocked(validateEvent).mockImplementation(() => {
				throw new Error("Assinatura inválida");
			});

			const ctx = {
				request: mockRequest,
				context: { logger: { error: vi.fn() } },
			};

			await expect(handler(ctx)).rejects.toThrow(
				"Erro no webhook: Assinatura inválida",
			);
			expect(ctx.context.logger.error).toHaveBeenCalledWith(
				"Assinatura inválida",
			);
		});

		it("should handle missing webhook headers", async () => {
			const invalidRequest = {
				headers: new Headers({}),
				text: vi.fn().mockResolvedValue('{"type": "test"}'),
				body: '{"type": "test"}',
			} as any;

			vi.mocked(validateEvent).mockImplementation(() => {
				throw new Error("Cabeçalhos obrigatórios ausentes");
			});

			const ctx = {
				request: invalidRequest,
				context: { logger: { error: vi.fn() } },
			};

			await expect(handler(ctx)).rejects.toThrow(
				"Erro no webhook: Cabeçalhos obrigatórios ausentes",
			);
		});

		it("should handle webhook payload processing errors", async () => {
			const mockEvent = { type: "checkout.created", data: {} };
			vi.mocked(validateEvent).mockReturnValue(mockEvent);
			vi.mocked(handleWebhookPayload).mockRejectedValue(
				new Error("Falha no processamento do handler"),
			);

			const ctx = {
				request: mockRequest,
				context: { logger: { error: vi.fn() } },
			};

			await expect(handler(ctx)).rejects.toThrow(
				"Erro no webhook: consulte os logs do servidor para mais informações.",
			);
			expect(ctx.context.logger.error).toHaveBeenCalledWith(
				"Falha no webhook do Pago. Erro: Falha no processamento do handler",
			);
		});

		it("should handle non-Error webhook payload failures", async () => {
			const mockEvent = { type: "checkout.created", data: {} };
			vi.mocked(validateEvent).mockReturnValue(mockEvent);
			vi.mocked(handleWebhookPayload).mockRejectedValue("Erro desconhecido");

			const ctx = {
				request: mockRequest,
				context: { logger: { error: vi.fn() } },
			};

			await expect(handler(ctx)).rejects.toThrow(
				"Erro no webhook: consulte os logs do servidor para mais informações.",
			);
			expect(ctx.context.logger.error).toHaveBeenCalledWith(
				"Falha no webhook do Pago. Erro: Erro desconhecido",
			);
		});

		it("should handle non-Error validation failures", async () => {
			vi.mocked(validateEvent).mockImplementation(() => {
				throw "Erro de validação desconhecido";
			});

			const ctx = {
				request: mockRequest,
				context: { logger: { error: vi.fn() } },
			};

			await expect(handler(ctx)).rejects.toThrow(
				"Erro no webhook: Erro de validação desconhecido",
			);
		});

		it("should pass all event handlers to handleWebhookPayload", async () => {
			const mockHandlers = {
				secret: "test-secret",
				onPayload: vi.fn(),
				onCheckoutCreated: vi.fn(),
				onOrderPaid: vi.fn(),
				onSubscriptionActive: vi.fn(),
			};

			const plugin = webhooks(mockHandlers);
			const endpoints = plugin(mockClient);
			const handlerWithAllOptions = endpoints.pagoWebhooks.handler;

			const mockEvent = { type: "checkout.created", data: {} };
			vi.mocked(validateEvent).mockReturnValue(mockEvent);
			vi.mocked(handleWebhookPayload).mockResolvedValue(undefined);

			const ctx = {
				request: mockRequest,
				context: { logger: { error: vi.fn() } },
				json: vi.fn().mockReturnValue({ received: true }),
			};

			await handlerWithAllOptions(ctx);

			expect(handleWebhookPayload).toHaveBeenCalledWith(
				mockEvent,
				expect.objectContaining({
					webhookSecret: "test-secret",
					onPayload: mockHandlers.onPayload,
					onCheckoutCreated: mockHandlers.onCheckoutCreated,
					onOrderPaid: mockHandlers.onOrderPaid,
					onSubscriptionActive: mockHandlers.onSubscriptionActive,
				}),
			);
		});

		it("should handle different webhook event types", async () => {
			const testCases = [
				{ type: "checkout.created", data: { id: "checkout-123" } },
				{ type: "order.paid", data: { id: "order-456" } },
				{ type: "subscription.active", data: { id: "sub-789" } },
				{ type: "customer.created", data: { id: "customer-abc" } },
			];

			for (const mockEvent of testCases) {
				vi.mocked(validateEvent).mockReturnValue(mockEvent);
				vi.mocked(handleWebhookPayload).mockResolvedValue(undefined);

				const ctx = {
					request: mockRequest,
					context: { logger: { error: vi.fn() } },
					json: vi.fn().mockReturnValue({ received: true }),
				};

				await handler(ctx);

				expect(handleWebhookPayload).toHaveBeenCalledWith(
					mockEvent,
					expect.any(Object),
				);
			}
		});

		it("should extract headers correctly from request", async () => {
			const customHeaders = new Headers({
				"webhook-id": "custom-id-456",
				"webhook-timestamp": "9876543210",
				"webhook-signature": "v1,custom-signature",
			});

			const customRequest = {
				headers: customHeaders,
				text: vi.fn().mockResolvedValue('{"type": "test"}'),
				body: '{"type": "test"}',
			} as any;

			const mockEvent = { type: "test", data: {} };
			vi.mocked(validateEvent).mockReturnValue(mockEvent);
			vi.mocked(handleWebhookPayload).mockResolvedValue(undefined);

			const ctx = {
				request: customRequest,
				context: { logger: { error: vi.fn() } },
				json: vi.fn().mockReturnValue({ received: true }),
			};

			await handler(ctx);

			expect(validateEvent).toHaveBeenCalledWith(
				'{"type": "test"}',
				{
					"webhook-id": "custom-id-456",
					"webhook-timestamp": "9876543210",
					"webhook-signature": "v1,custom-signature",
				},
				"test-webhook-secret",
			);
		});
	});
});
