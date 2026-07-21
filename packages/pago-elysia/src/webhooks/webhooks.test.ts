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

import Elysia from "elysia";
import { describe, expect, it, vi } from "vitest";
import { Webhooks } from "./webhooks";

describe("Middleware de webhooks", () => {
	it("should call onPayload with the payload", async () => {
		const app = new Elysia();
		const mockOnPayload = vi.fn();

		app.post(
			"*",
			Webhooks({
				webhookSecret: "mock-secret",
				onPayload: mockOnPayload,
			}),
		);

		const payload = { event: "mock-event", data: "mock-data" };

		const response = await app.handle(
			new Request("http://localhost/", {
				method: "POST",
				body: JSON.stringify(payload),
				headers: {
					"webhook-id": "mock-id",
					"webhook-timestamp": "mock-timestamp",
					"webhook-signature": "mock-signature",
				},
			}),
		);

		expect(response.status).toBe(200);
		expect(mockOnPayload).toHaveBeenCalledWith(payload);
	});

	it("should acknowledge the webhook", async () => {
		const app = new Elysia();
		const mockOnPayload = vi.fn();

		app.post(
			"*",
			Webhooks({
				webhookSecret: "mock-secret",
				onPayload: mockOnPayload,
			}),
		);

		const payload = { event: "mock-event", data: "mock-data" };

		const response = await app.handle(
			new Request("http://localhost/", {
				method: "POST",
				body: JSON.stringify(payload),
				headers: {
					"webhook-id": "mock-id",
					"webhook-timestamp": "mock-timestamp",
					"webhook-signature": "mock-signature",
				},
			}),
		);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ received: true });
	});
});
