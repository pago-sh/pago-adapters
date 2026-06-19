# @pago-sh/astro

Payments and Checkouts made dead simple with Astro.

`pnpm install @pago-sh/astro`

## Checkout

Create a Checkout handler which takes care of redirections.

```typescript
import { Checkout } from "@pago-sh/astro";
import { PAGO_ACCESS_TOKEN, PAGO_SUCCESS_URL } from "astro:env/server";

export const GET = Checkout({
  accessToken: PAGO_ACCESS_TOKEN,
  successUrl: PAGO_SUCCESS_URL,
  returnUrl: "https://myapp.com", // Optional Return URL, which renders a Back-button in the Checkout 
  server: "sandbox", // Use sandbox if you're testing Pago - omit the parameter or pass 'production' otherwise
  theme: "dark" // Enforces the theme - System-preferred theme will be set if left omitted
});
```

### Query Params

Pass query params to this route.

- products `?products=123`
- customerId (optional) `?products=123&customerId=xxx`
- customerExternalId (optional) `?products=123&customerExternalId=xxx`
- customerEmail (optional) `?products=123&customerEmail=janedoe@gmail.com`
- customerName (optional) `?products=123&customerName=Jane`
- seats (optional) `?products=123&seats=5` - Number of seats for seat-based products
- metadata (optional) `URL-Encoded JSON string`

## Customer Portal

Create a customer portal where your customer can view orders and subscriptions.

```typescript
import { CustomerPortal } from "@pago-sh/astro";
import { PAGO_ACCESS_TOKEN } from "astro:env/server";

export const GET = CustomerPortal({
  accessToken: PAGO_ACCESS_TOKEN,
  getCustomerId: (event) => "", // Fuction to resolve a Pago Customer ID
  returnUrl: "https://myapp.com", // Optional Return URL, which renders a Back-button in the Customer Portal
  server: "sandbox", // Use sandbox if you're testing Pago - omit the parameter or pass 'production' otherwise
});
```

## Webhooks

A simple utility which resolves incoming webhook payloads by signing the webhook secret properly.

```typescript
import { Webhooks } from '@pago-sh/astro';
import { PAGO_WEBHOOK_SECRET } from "astro:env/server"

export const POST = Webhooks({
  webhookSecret: PAGO_WEBHOOK_SECRET,
  onPayload: async (payload) => /** Handle payload */,
})
```

#### Payload Handlers

The Webhook handler also supports granular handlers for easy integration.

- onCheckoutCreated: (payload) =>
- onCheckoutUpdated: (payload) =>
- onOrderCreated: (payload) =>
- onOrderUpdated: (payload) =>
- onOrderPaid: (payload) =>
- onSubscriptionCreated: (payload) =>
- onSubscriptionUpdated: (payload) =>
- onSubscriptionActive: (payload) =>
- onSubscriptionCanceled: (payload) =>
- onSubscriptionRevoked: (payload) =>
- onProductCreated: (payload) =>
- onProductUpdated: (payload) =>
- onOrganizationUpdated: (payload) =>
- onBenefitCreated: (payload) =>
- onBenefitUpdated: (payload) =>
- onBenefitGrantCreated: (payload) =>
- onBenefitGrantUpdated: (payload) =>
- onBenefitGrantRevoked: (payload) =>
- onCustomerCreated: (payload) =>
- onCustomerUpdated: (payload) =>
- onCustomerDeleted: (payload) =>
- onCustomerStateChanged: (payload) =>
