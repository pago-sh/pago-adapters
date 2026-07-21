import sinon from "https://cdn.skypack.dev/sinon@11.1.2?dts";

const mockCustomerPortalUrl = "https://mock-customer-portal-url.com";
const mockCheckoutUrl = "https://mock-checkout-url.com";
const mockSessionCreate = sinon
	.stub()
	.returns({ customer_portal_url: mockCustomerPortalUrl });

const mockCheckoutCreate = sinon.stub().returns({ url: mockCheckoutUrl });

// deno-lint-ignore no-explicit-any
export function createPago(_options: any) {
	return {
		customerSessions: {
			create: mockSessionCreate,
		},
		checkouts: {
			create: mockCheckoutCreate,
		},
	};
}

export const webhooks = {
	validateEvent: (
		v: string,
		_headers: Record<string, string>,
		_secret: string,
	) => Promise.resolve(JSON.parse(v)),
};
