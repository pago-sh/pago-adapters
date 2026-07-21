vi.mock("@pago-sh/sdk/2026-04", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@pago-sh/sdk/2026-04")>();
	return {
		...actual,
		webhooks: {
			...actual.webhooks,
			validateEvent: vi.fn((v: string) => JSON.parse(v)),
		},
	};
});

import fastify from "fastify";
import { describe, expect, it, vi } from "vitest";
import { Webhooks } from "./webhooks";

describe("Middleware de webhooks", () => {
	it("should call onPayload with the payload", async () => {
		const app = fastify();
		const mockOnPayload = vi.fn();

		app.post(
			"*",
			Webhooks({
				webhookSecret: "mock-secret",
				onPayload: mockOnPayload,
			}),
		);

		const payload = { event: "mock-event", data: "mock-data" };

		const response = await app.inject({
			url: "http://localhost/",
			method: "POST",
			body: JSON.stringify(payload),
			headers: {
				"webhook-id": "mock-id",
				"webhook-timestamp": "mock-timestamp",
				"webhook-signature": "mock-signature",
				"content-type": "application/json",
			},
		});

		expect(response.statusCode).toBe(200);
		expect(mockOnPayload).toHaveBeenCalledWith(payload);
	});

	it("should acknowledge the webhook", async () => {
		const app = fastify();
		const mockOnPayload = vi.fn();

		app.post(
			"*",
			Webhooks({
				webhookSecret: "mock-secret",
				onPayload: mockOnPayload,
			}),
		);

		const payload = { event: "mock-event", data: "mock-data" };

		const response = await app.inject({
			url: "http://localhost/",
			method: "POST",
			body: JSON.stringify(payload),
			headers: {
				"webhook-id": "mock-id",
				"webhook-timestamp": "mock-timestamp",
				"webhook-signature": "mock-signature",
				"content-type": "application/json",
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual({ received: true });
	});
});
