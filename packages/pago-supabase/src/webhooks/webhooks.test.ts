// Mock the modules before any imports
vi.mock("@pago-sh/sdk/2026-04", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@pago-sh/sdk/2026-04")>();
	return {
		...actual,
		webhooks: {
			...actual.webhooks,
			validateEvent: vi.fn(async () => ({
				type: "order.created" as const,
				timestamp: new Date().toISOString(),
				data: { id: "order-123" },
			})),
		},
	};
});

vi.mock("@pago-sh/adapter-utils", async (importOriginal) => {
	const actual =
		await importOriginal<typeof import("@pago-sh/adapter-utils")>();
	return {
		...actual,
		handleWebhookPayload: vi.fn(async () => {}),
	};
});

import { handleWebhookPayload } from "@pago-sh/adapter-utils";
import { PagoWebhookVerificationError } from "@pago-sh/sdk";
import { webhooks } from "@pago-sh/sdk/2026-04";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Webhooks } from "./webhooks";

// Get the mocked functions — typed loosely so mockReturnValue accepts partial payloads
const mockValidateEvent = vi.mocked(webhooks.validateEvent) as ReturnType<
	typeof vi.fn
>;
const mockHandleWebhookPayload = vi.mocked(handleWebhookPayload) as ReturnType<
	typeof vi.fn
>;

describe("Webhooks", () => {
	beforeEach(() => {
		mockValidateEvent.mockClear();
		mockHandleWebhookPayload.mockClear();
		mockValidateEvent.mockResolvedValue({
			type: "order.created" as const,
			timestamp: new Date(),
			data: { id: "order-123" },
		});
	});

	describe("configuration", () => {
		it("should create webhook handler function", () => {
			const handler = Webhooks({
				webhookSecret: "test-secret",
			});

			expect(handler).toBeDefined();
			expect(typeof handler).toBe("function");
		});
	});

	describe("request handling", () => {
		it("should validate webhook and return success", async () => {
			const mockPayload = {
				type: "order.created",
				data: { id: "order-123" },
			};

			mockValidateEvent.mockResolvedValue(mockPayload);

			const handler = Webhooks({
				webhookSecret: "test-secret",
			});

			const request = new Request("https://example.com/webhooks", {
				method: "POST",
				headers: {
					"webhook-id": "msg_123",
					"webhook-timestamp": "1234567890",
					"webhook-signature": "v1,signature",
					"content-type": "application/json",
				},
				body: JSON.stringify(mockPayload),
			});

			const response = await handler(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.received).toBe(true);
			expect(mockValidateEvent).toHaveBeenCalledTimes(1);
			expect(mockHandleWebhookPayload).toHaveBeenCalledTimes(1);
			expect(mockHandleWebhookPayload).toHaveBeenCalledWith(mockPayload, {
				webhookSecret: "test-secret",
			});
		});

		it("should return 403 on verification error", async () => {
			mockValidateEvent.mockImplementation(() => {
				throw new PagoWebhookVerificationError("Assinatura inválida");
			});

			const handler = Webhooks({
				webhookSecret: "test-secret",
			});

			const request = new Request("https://example.com/webhooks", {
				method: "POST",
				headers: {
					"webhook-id": "msg_123",
					"webhook-timestamp": "1234567890",
					"webhook-signature": "invalid",
				},
				body: "{}",
			});

			const response = await handler(request);
			const data = await response.json();

			expect(response.status).toBe(403);
			expect(data.received).toBe(false);
		});

		it("should call event handlers", async () => {
			const mockPayload = {
				type: "order.created",
				data: { id: "order-123" },
			};

			mockValidateEvent.mockResolvedValue(mockPayload);

			const onOrderCreated = vi.fn();

			const handler = Webhooks({
				webhookSecret: "test-secret",
				onOrderCreated,
			});

			const request = new Request("https://example.com/webhooks", {
				method: "POST",
				headers: {
					"webhook-id": "msg_123",
					"webhook-timestamp": "1234567890",
					"webhook-signature": "v1,signature",
				},
				body: JSON.stringify(mockPayload),
			});

			await handler(request);

			expect(mockHandleWebhookPayload).toHaveBeenCalledTimes(1);
			expect(mockHandleWebhookPayload).toHaveBeenCalledWith(mockPayload, {
				webhookSecret: "test-secret",
				onOrderCreated,
			});
		});

		it("should pass onPayload handler", async () => {
			const mockPayload = {
				type: "subscription.created",
				data: { id: "sub-123" },
			};

			mockValidateEvent.mockResolvedValue(mockPayload);

			const onPayload = vi.fn();

			const handler = Webhooks({
				webhookSecret: "test-secret",
				onPayload,
			});

			const request = new Request("https://example.com/webhooks", {
				method: "POST",
				headers: {
					"webhook-id": "msg_123",
					"webhook-timestamp": "1234567890",
					"webhook-signature": "v1,signature",
				},
				body: JSON.stringify(mockPayload),
			});

			await handler(request);

			expect(mockHandleWebhookPayload).toHaveBeenCalledTimes(1);
			expect(mockHandleWebhookPayload).toHaveBeenCalledWith(mockPayload, {
				webhookSecret: "test-secret",
				onPayload,
			});
		});

		it("should extract webhook headers correctly", async () => {
			const mockPayload = {
				type: "checkout.updated",
				data: { id: "checkout-123" },
			};

			mockValidateEvent.mockResolvedValue(mockPayload);

			const handler = Webhooks({
				webhookSecret: "test-secret",
			});

			const request = new Request("https://example.com/webhooks", {
				method: "POST",
				headers: {
					"webhook-id": "msg_456",
					"webhook-timestamp": "9876543210",
					"webhook-signature": "v1,abc123",
				},
				body: JSON.stringify(mockPayload),
			});

			await handler(request);

			expect(mockValidateEvent).toHaveBeenCalledTimes(1);
			expect(mockValidateEvent).toHaveBeenCalledWith(
				JSON.stringify(mockPayload),
				{
					"webhook-id": "msg_456",
					"webhook-timestamp": "9876543210",
					"webhook-signature": "v1,abc123",
				},
				"test-secret",
			);
		});

		it("should handle missing webhook headers", async () => {
			const mockPayload = {
				type: "product.created",
				data: { id: "product-123" },
			};

			mockValidateEvent.mockResolvedValue(mockPayload);

			const handler = Webhooks({
				webhookSecret: "test-secret",
			});

			const request = new Request("https://example.com/webhooks", {
				method: "POST",
				body: JSON.stringify(mockPayload),
			});

			await handler(request);

			expect(mockValidateEvent).toHaveBeenCalledTimes(1);
			expect(mockValidateEvent).toHaveBeenCalledWith(
				JSON.stringify(mockPayload),
				{
					"webhook-id": "",
					"webhook-timestamp": "",
					"webhook-signature": "",
				},
				"test-secret",
			);
		});
	});
});
