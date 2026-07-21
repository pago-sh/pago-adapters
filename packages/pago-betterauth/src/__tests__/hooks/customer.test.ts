import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	onAfterUserCreate,
	onBeforeUserCreate,
	onUserUpdate,
} from "../../hooks/customer";
import { createTestPagoOptions, mockApiError } from "../utils/helpers";
import {
	createMockCustomer,
	createMockPagoClient,
	createMockUser,
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
}));

const { APIError } = (await vi.importMock("better-auth/api")) as any;

describe("customer hooks", () => {
	let mockClient: ReturnType<typeof createMockPagoClient>;

	beforeEach(() => {
		mockClient = createMockPagoClient();
		vi.mocked(mockClient.customers.list).mockResolvedValue({
			items: [],
			pagination: { total_count: 0, max_page: 1 },
		});
		vi.mocked(mockClient.customers.create).mockResolvedValue(
			createMockCustomer(),
		);
		vi.clearAllMocks();
		// Mock console.log to avoid test output noise
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	describe("onBeforeUserCreate", () => {
		it("should create customer when createCustomerOnSignUp is enabled", async () => {
			const options = createTestPagoOptions({
				client: mockClient,
				createCustomerOnSignUp: true,
			});

			const mockUser = createMockUser({
				id: "user-123",
				email: "test@example.com",
				name: "Test User",
			});

			const mockCustomer = createMockCustomer();

			vi.mocked(mockClient.customers.create).mockResolvedValue(mockCustomer);

			const ctx = { context: { logger: { error: vi.fn() } } } as any;
			const hook = onBeforeUserCreate(options);

			await hook(mockUser, ctx);

			expect(mockClient.customers.create).toHaveBeenCalledWith({
				email: "test@example.com",
				name: "Test User",
			});
		});

		it("should not create customer when customer already exists", async () => {
			const options = createTestPagoOptions({
				client: mockClient,
				createCustomerOnSignUp: true,
			});

			const mockUser = createMockUser({
				id: "user-123",
				email: "test@example.com",
				name: "Test User",
			});

			const mockCustomer = createMockCustomer();

			vi.mocked(mockClient.customers.list).mockResolvedValue({
				items: [mockCustomer],
				pagination: { total_count: 1, max_page: 1 },
			});

			const ctx = { context: { logger: { error: vi.fn() } } } as any;
			const hook = onBeforeUserCreate(options);

			await hook(mockUser, ctx);

			expect(mockClient.customers.create).not.toHaveBeenCalled();
		});

		it("should use custom getCustomerCreateParams when provided", async () => {
			const mockGetCustomerCreateParams = vi.fn().mockResolvedValue({
				metadata: { source: "website", plan: "premium" },
			});

			const options = createTestPagoOptions({
				client: mockClient,
				createCustomerOnSignUp: true,
				getCustomerCreateParams: mockGetCustomerCreateParams,
			});

			const mockUser = createMockUser();
			const mockCustomer = createMockCustomer();

			vi.mocked(mockClient.customers.create).mockResolvedValue(mockCustomer);

			const ctx = { context: { logger: { error: vi.fn() } } } as any;
			const hook = onBeforeUserCreate(options);

			await hook(mockUser, ctx);

			expect(mockGetCustomerCreateParams).toHaveBeenCalledWith({
				user: mockUser,
			});

			expect(mockClient.customers.create).toHaveBeenCalledWith({
				email: mockUser.email,
				name: mockUser.name,
				metadata: { source: "website", plan: "premium" },
			});
		});

		it("should not create customer when createCustomerOnSignUp is disabled", async () => {
			const options = createTestPagoOptions({
				client: mockClient,
				createCustomerOnSignUp: false,
			});

			const mockUser = createMockUser();
			const ctx = { context: { logger: { error: vi.fn() } } } as any;
			const hook = onBeforeUserCreate(options);

			await hook(mockUser, ctx);

			expect(mockClient.customers.create).not.toHaveBeenCalled();
		});

		it("should not create customer when context is missing", async () => {
			const options = createTestPagoOptions({
				client: mockClient,
				createCustomerOnSignUp: true,
			});

			const mockUser = createMockUser();
			const hook = onBeforeUserCreate(options);

			await hook(mockUser); // No context provided

			expect(mockClient.customers.create).not.toHaveBeenCalled();
		});

		it("should handle API errors during customer creation", async () => {
			const options = createTestPagoOptions({
				client: mockClient,
				createCustomerOnSignUp: true,
			});

			const mockUser = createMockUser();

			vi.mocked(mockClient.customers.create).mockRejectedValue(
				mockApiError(500, "Erro interno do servidor"),
			);

			const ctx = { context: { logger: { error: vi.fn() } } } as any;
			const hook = onBeforeUserCreate(options);

			await expect(hook(mockUser, ctx)).rejects.toThrow(
				"Falha ao criar o cliente no Pago. Erro: Erro interno do servidor",
			);
		});

		it("should handle non-Error exceptions", async () => {
			const options = createTestPagoOptions({
				client: mockClient,
				createCustomerOnSignUp: true,
			});

			const mockUser = createMockUser();

			vi.mocked(mockClient.customers.create).mockRejectedValue(
				"Erro desconhecido",
			);

			const ctx = { context: { logger: { error: vi.fn() } } } as any;
			const hook = onBeforeUserCreate(options);

			await expect(hook(mockUser, ctx)).rejects.toThrow(
				"Falha ao criar o cliente no Pago. Erro: Erro desconhecido",
			);
		});

		it("should throw error when user email is missing", async () => {
			const options = createTestPagoOptions({
				client: mockClient,
				createCustomerOnSignUp: true,
			});

			const mockUser = createMockUser({ email: undefined });
			const ctx = { context: { logger: { error: vi.fn() } } } as any;
			const hook = onBeforeUserCreate(options);

			await expect(hook(mockUser, ctx)).rejects.toThrow(
				"É necessário um e-mail associado",
			);

			expect(mockClient.customers.create).not.toHaveBeenCalled();
		});
	});

	describe("onAfterUserCreate", () => {
		it("should update existing customer without external ID", async () => {
			const options = createTestPagoOptions({
				client: mockClient,
				createCustomerOnSignUp: true,
			});

			const mockUser = createMockUser({
				id: "user-123",
				email: "test@example.com",
				name: "Test User",
			});

			const existingCustomer = {
				...createMockCustomer(),
				id: "customer-456",
				external_id: null, // No external ID set
			};

			// Mock existing customer found
			vi.mocked(mockClient.customers.list).mockResolvedValue({
				items: [existingCustomer],
				pagination: { total_count: 1, max_page: 1 },
			});

			vi.mocked(mockClient.customers.update).mockResolvedValue(
				existingCustomer,
			);

			const ctx = { context: { logger: { error: vi.fn() } } } as any;
			const hook = onAfterUserCreate(options);

			await hook(mockUser, ctx);

			expect(mockClient.customers.list).toHaveBeenCalledWith({
				email: "test@example.com",
			});

			expect(mockClient.customers.update).toHaveBeenCalledWith("customer-456", {
				external_id: "user-123",
			});
		});

		it("should update existing customer with different external ID", async () => {
			const options = createTestPagoOptions({
				client: mockClient,
				createCustomerOnSignUp: true,
			});

			const mockUser = createMockUser({
				id: "user-123",
				email: "test@example.com",
			});

			const existingCustomer = {
				...createMockCustomer(),
				id: "customer-456",
				external_id: "different-user-id",
			};

			vi.mocked(mockClient.customers.list).mockResolvedValue({
				items: [existingCustomer],
				pagination: { total_count: 1, max_page: 1 },
			});

			vi.mocked(mockClient.customers.update).mockResolvedValue(
				existingCustomer,
			);

			const ctx = { context: { logger: { error: vi.fn() } } } as any;
			const hook = onAfterUserCreate(options);

			await hook(mockUser, ctx);

			expect(mockClient.customers.update).toHaveBeenCalledWith("customer-456", {
				external_id: "user-123",
			});
		});

		it("should not update existing customer with same external ID", async () => {
			const options = createTestPagoOptions({
				client: mockClient,
				createCustomerOnSignUp: true,
			});

			const mockUser = createMockUser({
				id: "user-123",
				email: "test@example.com",
			});

			const existingCustomer = {
				...createMockCustomer(),
				id: "customer-456",
				external_id: "user-123", // Same external ID
			};

			vi.mocked(mockClient.customers.list).mockResolvedValue({
				items: [existingCustomer],
				pagination: { total_count: 1, max_page: 1 },
			});

			const ctx = { context: { logger: { error: vi.fn() } } } as any;
			const hook = onAfterUserCreate(options);

			await hook(mockUser, ctx);

			expect(mockClient.customers.update).not.toHaveBeenCalled();
		});

		it("should not update customer when createCustomerOnSignUp is disabled", async () => {
			const options = createTestPagoOptions({
				client: mockClient,
				createCustomerOnSignUp: false,
			});

			const mockUser = createMockUser();
			const ctx = { context: { logger: { error: vi.fn() } } } as any;
			const hook = onAfterUserCreate(options);

			await hook(mockUser, ctx);

			expect(mockClient.customers.list).not.toHaveBeenCalled();
			expect(mockClient.customers.update).not.toHaveBeenCalled();
		});

		it("should not update customer when context is missing", async () => {
			const options = createTestPagoOptions({
				client: mockClient,
				createCustomerOnSignUp: true,
			});

			const mockUser = createMockUser();
			const hook = onAfterUserCreate(options);

			await hook(mockUser); // No context provided

			expect(mockClient.customers.list).not.toHaveBeenCalled();
			expect(mockClient.customers.update).not.toHaveBeenCalled();
		});

		it("should handle API errors during customer linking", async () => {
			const options = createTestPagoOptions({
				client: mockClient,
				createCustomerOnSignUp: true,
			});

			const mockUser = createMockUser();

			vi.mocked(mockClient.customers.list).mockRejectedValue(
				mockApiError(500, "Erro interno do servidor"),
			);

			const ctx = { context: { logger: { error: vi.fn() } } } as any;
			const hook = onAfterUserCreate(options);

			await expect(hook(mockUser, ctx)).rejects.toThrow(
				"Falha ao criar o cliente no Pago. Erro: Erro interno do servidor",
			);
		});

		it("should handle non-Error exceptions during customer linking", async () => {
			const options = createTestPagoOptions({
				client: mockClient,
				createCustomerOnSignUp: true,
			});

			const mockUser = createMockUser();

			vi.mocked(mockClient.customers.list).mockRejectedValue(
				"Erro desconhecido",
			);

			const ctx = { context: { logger: { error: vi.fn() } } } as any;
			const hook = onAfterUserCreate(options);

			await expect(hook(mockUser, ctx)).rejects.toThrow(
				"Falha ao criar o cliente no Pago. Erro: Erro desconhecido",
			);
		});
	});

	describe("onUserUpdate", () => {
		it("should update customer when createCustomerOnSignUp is enabled", async () => {
			const options = createTestPagoOptions({
				client: mockClient,
				createCustomerOnSignUp: true,
			});

			const mockUser = createMockUser({
				id: "user-123",
				email: "updated@example.com",
				name: "Usuário atualizado",
			});

			const mockCustomer = createMockCustomer();
			vi.mocked(mockClient.customers.updateExternal).mockResolvedValue(
				mockCustomer,
			);

			const ctx = {
				context: { logger: { error: vi.fn() } },
			} as any;

			const hook = onUserUpdate(options);

			await hook(mockUser, ctx);

			expect(mockClient.customers.updateExternal).toHaveBeenCalledWith(
				"user-123",
				{
					email: "updated@example.com",
					name: "Usuário atualizado",
				},
			);
		});

		it("should not update customer when createCustomerOnSignUp is disabled", async () => {
			const options = createTestPagoOptions({
				client: mockClient,
				createCustomerOnSignUp: false,
			});

			const mockUser = createMockUser();
			const ctx = {
				context: { logger: { error: vi.fn() } },
			} as any;

			const hook = onUserUpdate(options);

			await hook(mockUser, ctx);

			expect(mockClient.customers.updateExternal).not.toHaveBeenCalled();
		});

		it("should not update customer when context is missing", async () => {
			const options = createTestPagoOptions({
				client: mockClient,
				createCustomerOnSignUp: true,
			});

			const mockUser = createMockUser();
			const hook = onUserUpdate(options);

			await hook(mockUser); // No context provided

			expect(mockClient.customers.updateExternal).not.toHaveBeenCalled();
		});

		it("should handle API errors during customer update", async () => {
			const options = createTestPagoOptions({
				client: mockClient,
				createCustomerOnSignUp: true,
			});

			const mockUser = createMockUser();

			vi.mocked(mockClient.customers.updateExternal).mockRejectedValue(
				mockApiError(404, "Cliente não encontrado"),
			);

			const ctx = {
				context: { logger: { error: vi.fn() } },
			} as any;

			const hook = onUserUpdate(options);

			// Should not throw, just log the error
			await hook(mockUser, ctx);

			expect(ctx.context.logger.error).toHaveBeenCalledWith(
				"Falha ao atualizar o cliente no Pago. Erro: Cliente não encontrado",
			);
		});

		it("should handle non-Error exceptions during update", async () => {
			const options = createTestPagoOptions({
				client: mockClient,
				createCustomerOnSignUp: true,
			});

			const mockUser = createMockUser();

			vi.mocked(mockClient.customers.updateExternal).mockRejectedValue(
				"Erro desconhecido",
			);

			const ctx = {
				context: { logger: { error: vi.fn() } },
			} as any;

			const hook = onUserUpdate(options);

			await hook(mockUser, ctx);

			expect(ctx.context.logger.error).toHaveBeenCalledWith(
				"Falha ao atualizar o cliente no Pago. Erro: Erro desconhecido",
			);
		});

		it("should handle network timeouts gracefully", async () => {
			const options = createTestPagoOptions({
				client: mockClient,
				createCustomerOnSignUp: true,
			});

			const mockUser = createMockUser();

			vi.mocked(mockClient.customers.updateExternal).mockRejectedValue(
				new Error("Tempo de rede esgotado"),
			);

			const ctx = {
				context: { logger: { error: vi.fn() } },
			} as any;

			const hook = onUserUpdate(options);

			await hook(mockUser, ctx);

			expect(ctx.context.logger.error).toHaveBeenCalledWith(
				"Falha ao atualizar o cliente no Pago. Erro: Tempo de rede esgotado",
			);
		});
	});
});
