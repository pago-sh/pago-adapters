import { vi } from "vitest";
import type { PagoOptions } from "../../types";
import { createMockPagoClient } from "./mocks";

export const createTestPagoOptions = (
	overrides: Partial<PagoOptions> = {},
): PagoOptions => ({
	client: createMockPagoClient(),
	createCustomerOnSignUp: true,
	use: [],
	...overrides,
});

export { createMockPagoClient };

export const mockApiError = (status: number, message: string) => {
	const error = new Error(message) as any;
	error.status = status;
	error.response = {
		status,
		data: { error: { message } },
	};
	return error;
};

export const mockApiResponse = <T>(data: T) => Promise.resolve({ data });

export const createMockMiddleware = () => {
	const middleware = vi.fn();
	middleware.mockImplementation((context, next) => next());
	return middleware;
};
