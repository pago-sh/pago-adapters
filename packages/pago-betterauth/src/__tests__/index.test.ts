import { beforeEach, describe, expect, it, vi } from "vitest";
import { pago } from "../index";
import { checkout } from "../plugins/checkout";
import { portal } from "../plugins/portal";
import { usage } from "../plugins/usage";
import { webhooks } from "../plugins/webhooks";
import { createTestPagoOptions } from "./utils/helpers";
import { createMockPagoClient, createMockUser } from "./utils/mocks";

vi.mock("../plugins/checkout");
vi.mock("../plugins/portal");
vi.mock("../plugins/usage");
vi.mock("../plugins/webhooks");

describe("pago plugin", () => {
	let mockClient: ReturnType<typeof createMockPagoClient>;

	beforeEach(() => {
		mockClient = createMockPagoClient();
		vi.clearAllMocks();

		vi.mocked(checkout).mockReturnValue(
			vi.fn().mockReturnValue({
				"checkout/create": vi.fn(),
			}),
		);

		vi.mocked(portal).mockReturnValue(
			vi.fn().mockReturnValue({
				"portal/url": vi.fn(),
				"portal/customer": vi.fn(),
			}),
		);

		vi.mocked(usage).mockReturnValue(
			vi.fn().mockReturnValue({
				"usage/ingest": vi.fn(),
			}),
		);

		vi.mocked(webhooks).mockReturnValue(
			vi.fn().mockReturnValue({
				"webhooks/handler": vi.fn(),
			}),
		);
	});

	it("should create a plugin with correct id", () => {
		const options = createTestPagoOptions({
			client: mockClient,
			use: [checkout()],
		});

		const plugin = pago(options);

		expect(plugin.id).toBe("pago");
	});

	it("should combine endpoints from all plugins", () => {
		const mockCheckoutPlugin = vi
			.fn()
			.mockReturnValue({ "checkout/create": vi.fn() });
		const mockPortalPlugin = vi.fn().mockReturnValue({ "portal/url": vi.fn() });

		vi.mocked(checkout).mockReturnValue(mockCheckoutPlugin);
		vi.mocked(portal).mockReturnValue(mockPortalPlugin);

		const options = createTestPagoOptions({
			client: mockClient,
			use: [checkout(), portal()],
		});

		const plugin = pago(options);

		expect(plugin.endpoints).toHaveProperty("checkout/create");
		expect(plugin.endpoints).toHaveProperty("portal/url");
		expect(mockCheckoutPlugin).toHaveBeenCalledWith(mockClient);
		expect(mockPortalPlugin).toHaveBeenCalledWith(mockClient);
	});

	it("should initialize with database hooks", () => {
		const options = createTestPagoOptions({
			client: mockClient,
			use: [checkout()],
		});

		const plugin = pago(options);
		const initResult = plugin.init();

		expect(initResult.options).toHaveProperty("databaseHooks");
		expect(initResult.options.databaseHooks).toHaveProperty("user");
		expect(initResult.options.databaseHooks.user).toHaveProperty("create");
		expect(initResult.options.databaseHooks.user).toHaveProperty("update");
		expect(initResult.options.databaseHooks.user.create).toHaveProperty(
			"after",
		);
		expect(initResult.options.databaseHooks.user.update).toHaveProperty(
			"after",
		);
	});

	it("should handle empty plugin array", () => {
		const options = createTestPagoOptions({
			client: mockClient,
			use: [],
		});

		const plugin = pago(options);

		expect(plugin.endpoints).toEqual({});
	});

	it("should handle multiple plugins of same type", () => {
		const mockPlugin1 = vi.fn().mockReturnValue({ "test/endpoint1": vi.fn() });
		const mockPlugin2 = vi.fn().mockReturnValue({ "test/endpoint2": vi.fn() });

		vi.mocked(checkout).mockReturnValueOnce(mockPlugin1);
		vi.mocked(portal).mockReturnValueOnce(mockPlugin2);

		const options = createTestPagoOptions({
			client: mockClient,
			use: [checkout(), portal()],
		});

		const plugin = pago(options);

		expect(plugin.endpoints).toHaveProperty("test/endpoint1");
		expect(plugin.endpoints).toHaveProperty("test/endpoint2");
	});

	it("should preserve plugin configuration", () => {
		const customGetCustomerCreateParams = vi.fn();
		const options = createTestPagoOptions({
			client: mockClient,
			createCustomerOnSignUp: false,
			getCustomerCreateParams: customGetCustomerCreateParams,
			use: [checkout()],
		});

		const plugin = pago(options);

		expect(plugin).toBeDefined();
		expect(plugin.id).toBe("pago");
	});
});
