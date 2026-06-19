# @pago-sh/better-auth

A [Better Auth](https://github.com/better-auth/better-auth) plugin for integrating [Pago](https://pago.sh) payments and subscriptions into your authentication flow.

## Features

- Checkout Integration
- Customer Portal
- Automatic Customer creation on signup
- Event Ingestion & Customer Meters for flexible Usage Based Billing
- Handle Pago Webhooks securely with signature verification
- Reference System to associate purchases with organizations

## Installation

```bash
pnpm add better-auth @pago-sh/better-auth @pago-sh/sdk
```

## Preparation

Go to your Pago Organization Settings, and create an Organization Access Token. Add it to your environment.

```bash
# .env
PAGO_ACCESS_TOKEN=...
```

### Configuring BetterAuth Server

The Pago plugin comes with a handful additional plugins which adds functionality to your stack.

- Checkout - Enables a seamless checkout integration
- Portal - Makes it possible for your customers to manage their orders, subscriptions & granted benefits
- Usage - Simple extension for listing customer meters & ingesting events for Usage Based Billing
- Webhooks - Listen for relevant Pago webhooks

```typescript
import { betterAuth } from "better-auth";
import { pago, checkout, portal, usage, webhooks } from "@pago-sh/better-auth";
import { Pago } from "@pago-sh/sdk";

const pagoClient = new Pago({
    accessToken: process.env.PAGO_ACCESS_TOKEN,
    // Use 'sandbox' if you're using the Pago Sandbox environment
    // Remember that access tokens, products, etc. are completely separated between environments.
    // Access tokens obtained in Production are for instance not usable in the Sandbox environment.
    server: 'sandbox'
});

const auth = betterAuth({
    // ... Better Auth config
    plugins: [
        pago({
            client: pagoClient,
            createCustomerOnSignUp: true,
            use: [
                checkout({
                    products: [
                        {
                            productId: "123-456-789", // ID of Product from Pago Dashboard
                            slug: "pro" // Custom slug for easy reference in Checkout URL, e.g. /checkout/pro
                        }
                    ],
                    successUrl: "/success?checkout_id={CHECKOUT_ID}",
                    authenticatedUsersOnly: true,
                    returnUrl: "https://myapp.com", // Optional Return URL, which renders a Back-button in the Checkout
                }),
                portal({
                  returnUrl: "https://myapp.com", // Optional Return URL, which renders a Back-button in the Customer Portal
                }),
                usage(),
                webhooks({
                    secret: process.env.PAGO_WEBHOOK_SECRET,
                    onCustomerStateChanged: (payload) => // Triggered when anything regarding a customer changes
                    onOrderPaid: (payload) => // Triggered when an order was paid (purchase, subscription renewal, etc.)
                    ...  // Over 25 granular webhook handlers
                    onPayload: (payload) => // Catch-all for all events
                })
            ],
        })
    ]
});
```

### Configuring BetterAuth Client

You will be using the BetterAuth Client to interact with the Pago functionalities.

```typescript
import { createAuthClient } from "better-auth/react";
import { pagoClient } from "@pago-sh/better-auth";
import { organizationClient } from "better-auth/client/plugins";

// This is all that is needed
// All Pago plugins, etc. should be attached to the server-side BetterAuth config
export const authClient = createAuthClient({
  plugins: [pagoClient()],
});
```

## Configuration Options

```typescript
import { betterAuth } from "better-auth";
import {
  pago,
  checkout,
  portal,
  usage,
  webhooks,
} from "@pago-sh/better-auth";
import { Pago } from "@pago-sh/sdk";

const pagoClient = new Pago({
  accessToken: process.env.PAGO_ACCESS_TOKEN,
  // Use 'sandbox' if you're using the Pago Sandbox environment
  // Remember that access tokens, products, etc. are completely separated between environments.
  // Access tokens obtained in Production are for instance not usable in the Sandbox environment.
  server: "sandbox",
});

const auth = betterAuth({
  // ... Better Auth config
  plugins: [
    pago({
      client: pagoClient,
      createCustomerOnSignUp: true,
      getCustomerCreateParams: ({ user }, request) => ({
        metadata: {
          myCustomProperty: 123,
        },
      }),
      use: [
        // This is where you add Pago plugins
      ],
    }),
  ],
});
```

### Required Options

- `client`: Pago SDK client instance

### Optional Options

- `createCustomerOnSignUp`: Automatically create a Pago customer when a user signs up
- `getCustomerCreateParams`: Custom function to provide additional customer creation metadata

### Customers

When `createCustomerOnSignUp` is enabled, a new Pago Customer is automatically created when a new User is added in the Better-Auth Database.

All new customers are created with an associated `externalId`, which is the ID of your User in the Database. This allows us to skip any Pago <-> User mapping in your Database.

## Checkout Plugin

To support checkouts in your app, simply pass the Checkout plugin to the use-property.

```typescript
import { pago, checkout } from "@pago-sh/better-auth";

const auth = betterAuth({
    // ... Better Auth config
    plugins: [
        pago({
            ...
            use: [
                checkout({
                    // Optional field - will make it possible to pass a slug to checkout instead of Product ID
                    products: [ { productId: "123-456-789", slug: "pro" } ],
                    // Relative URL to return to when checkout is successfully completed
                    successUrl: "/success?checkout_id={CHECKOUT_ID}",
                    // Optional Return URL, which renders a Back-button in the Checkout
                    returnUrl: "https://myapp.com",
                    // Wheather you want to allow unauthenticated checkout sessions or not
                    authenticatedUsersOnly: true,
                    // Enforces the theme - System-preferred theme will be set if left omitted
                    theme: "dark"
                })
            ],
        })
    ]
});
```

When checkouts are enabled, you're able to initialize Checkout Sessions using the checkout-method on the BetterAuth Client. This will redirect the user to the Product Checkout.

```typescript
await authClient.checkout({
  // Any Pago Product ID can be passed here
  products: ["e651f46d-ac20-4f26-b769-ad088b123df2"],
  // Or, if you setup "products" in the Checkout Config, you can pass the slug
  slug: "pro",
});
```

Checkouts will automatically carry the authenticated User as the customer to the checkout. Email-address will be "locked-in".

If `authenticatedUsersOnly` is `false` - then it will be possible to trigger checkout sessions without any associated customer.


### Checkout Embed

You can use the `checkoutEmbed` method to instead open the Checkout as an Embed on your site. 

```typescript
const embed = await authClient.checkoutEmbed({
  products: ["e651f46d-ac20-4f26-b769-ad088b123df2"],
});

// Listen for successful completion
checkout.addEventListener("success", (event) => {
  console.log("Purchase successful!", event.detail);

  // Call event.preventDefault() if you want to prevent the standard behavior
  // event.preventDefault()
  // Note: For success event, this prevents automatic redirection if redirect is true

  // If redirect is false, you can show your own success message
  if (!event.detail.redirect) {
    showSuccessMessage();
  }
  // Otherwise, the user will be redirected to the success URL (unless prevented)
});
```

### Organization Support

This plugin supports the Organization plugin. If you pass the organization ID to the Checkout referenceId, you will be able to keep track of purchases made from organization members.

```typescript
const organizationId = (await authClient.organization.list())?.data?.[0]?.id,

await authClient.checkout({
    // Any Pago Product ID can be passed here
    products: ["e651f46d-ac20-4f26-b769-ad088b123df2"],
    // Or, if you setup "products" in the Checkout Config, you can pass the slug
    slug: 'pro',
    // Reference ID will be saved as `referenceId` in the metadata of the checkout, order & subscription object
    referenceId: organizationId
});
```

## Portal Plugin

A plugin which enables customer management of their purchases, orders and subscriptions.

```typescript
import { pago, checkout, portal } from "@pago-sh/better-auth";

const auth = betterAuth({
    // ... Better Auth config
    plugins: [
        pago({
            ...
            use: [
                checkout(...),
                portal({
                   // Optional Return URL, which renders a Back-button in the Customer Portal
                  redirectUrl: "https://myapp.com"
                })
            ],
        })
    ]
});
```

The portal-plugin gives the BetterAuth Client a set of customer management methods, scoped under `authClient.customer`.

### Customer Portal Management

The following method will redirect the user to the Pago Customer Portal, where they can see orders, purchases, subscriptions, benefits, etc.

```typescript
await authClient.customer.portal();
```

### Customer State

The portal plugin also adds a convenient state-method for retrieving the general Customer State.

```typescript
const { data: customerState } = await authClient.customer.state();
```

The customer state object contains:

- All the data about the customer.
- The list of their active subscriptions
  - Note: This does not include subscriptions done by a parent organization. See the subscription list-method below for more information.
- The list of their granted benefits.
- The list of their active meters, with their current balance.

Thus, with that single object, you have all the required information to check if you should provision access to your service or not.

[You can learn more about the Pago Customer State in the Pago Docs](https://docs.pago.sh/integrate/customer-state).

### Benefits, Orders & Subscriptions

The portal plugin adds 3 convenient methods for listing benefits, orders & subscriptions relevant to the authenticated user/customer.

[All of these methods use the Pago CustomerPortal APIs](https://docs.pago.sh/api-reference/customer-portal)

#### Benefits

This method only lists granted benefits for the authenticated user/customer.

```typescript
const { data: benefits } = await authClient.customer.benefits.list({
  query: {
    page: 1,
    limit: 10,
  },
});
```

#### Orders

This method lists orders like purchases and subscription renewals for the authenticated user/customer.

```typescript
const { data: orders } = await authClient.customer.orders.list({
  query: {
    page: 1,
    limit: 10,
    productBillingType: "one_time", // or 'recurring'
  },
});
```

#### Subscriptions

This method lists the subscriptions associated with authenticated user/customer.

```typescript
const { data: subscriptions } = await authClient.customer.subscriptions.list({
  query: {
    page: 1,
    limit: 10,
    active: true,
  },
});
```

**Important** - Organization Support

This will **not** return subscriptions made by a parent organization to the authenticated user.

However, you can pass a `referenceId` to this method. This will return all subscriptions associated with that referenceId instead of subscriptions associated with the user.

So in order to figure out if a user should have access, pass the user's organization ID to see if there is an active subscription for that organization.

```typescript
const organizationId = (await authClient.organization.list())?.data?.[0]?.id,

const { data: subscriptions } = await authClient.customer.subscriptions.list({
    query: {
	    page: 1,
		limit: 10,
		active: true,
        referenceId: organizationId
    },
});

const userShouldHaveAccess = subscriptions.some(
    sub => // Your logic to check subscription product or whatever.
)
```

## Usage Plugin

A simple plugin for Usage Based Billing.

```typescript
import { pago, checkout, portal, usage } from "@pago-sh/better-auth";

const auth = betterAuth({
    // ... Better Auth config
    plugins: [
        pago({
            ...
            use: [
                checkout(...),
                portal(),
                usage()
            ],
        })
    ]
});
```

### Event Ingestion

Pago's Usage Based Billing builds entirely on event ingestion. Ingest events from your application, create Meters to represent that usage, and add metered prices to Products to charge for it.

[Learn more about Usage Based Billing in the Pago Docs.](https://docs.pago.sh/features/usage-based-billing/introduction)

```typescript
const { data: ingested } = await authClient.usage.ingest({
  event: "file-uploads",
  metadata: {
    uploadedFiles: 12,
  },
});
```

The authenticated user is automatically associated with the ingested event.

### Customer Meters

A simple method for listing the authenticated user's Usage Meters, or as we call them, Customer Meters.

Customer Meter's contains all information about their consumtion on your defined meters.

- Customer Information
- Meter Information
- Customer Meter Information
  - Consumed Units
  - Credited Units
  - Balance

```typescript
const { data: customerMeters } = await authClient.usage.meters.list({
  query: {
    page: 1,
    limit: 10,
  },
});
```

## Webhooks Plugin

The Webhooks plugin can be used to capture incoming events from your Pago organization.

```typescript
import { pago, webhooks } from "@pago-sh/better-auth";

const auth = betterAuth({
    // ... Better Auth config
    plugins: [
        pago({
            ...
            use: [
                webhooks({
                    secret: process.env.PAGO_WEBHOOK_SECRET,
                    onCustomerStateChanged: (payload) => // Triggered when anything regarding a customer changes
                    onOrderPaid: (payload) => // Triggered when an order was paid (purchase, subscription renewal, etc.)
                    ...  // Over 25 granular webhook handlers
                    onPayload: (payload) => // Catch-all for all events
                })
            ],
        })
    ]
});
```

Configure a Webhook endpoint in your Pago Organization Settings page. Webhook endpoint is configured at /pago/webhooks.

Add the secret to your environment.

```bash
# .env
PAGO_WEBHOOK_SECRET=...
```

The plugin supports handlers for all Pago webhook events:

- `onPayload` - Catch-all handler for any incoming Webhook event
- `onCheckoutCreated` - Triggered when a checkout is created
- `onCheckoutUpdated` - Triggered when a checkout is updated
- `onOrderCreated` - Triggered when an order is created
- `onOrderPaid` - Triggered when an order is paid
- `onOrderRefunded` - Triggered when an order is refunded
- `onRefundCreated` - Triggered when a refund is created
- `onRefundUpdated` - Triggered when a refund is updated
- `onSubscriptionCreated` - Triggered when a subscription is created
- `onSubscriptionUpdated` - Triggered when a subscription is updated
- `onSubscriptionActive` - Triggered when a subscription becomes active
- `onSubscriptionCanceled` - Triggered when a subscription is canceled
- `onSubscriptionRevoked` - Triggered when a subscription is revoked
- `onSubscriptionUncanceled` - Triggered when a subscription cancellation is reversed
- `onProductCreated` - Triggered when a product is created
- `onProductUpdated` - Triggered when a product is updated
- `onOrganizationUpdated` - Triggered when an organization is updated
- `onBenefitCreated` - Triggered when a benefit is created
- `onBenefitUpdated` - Triggered when a benefit is updated
- `onBenefitGrantCreated` - Triggered when a benefit grant is created
- `onBenefitGrantUpdated` - Triggered when a benefit grant is updated
- `onBenefitGrantRevoked` - Triggered when a benefit grant is revoked
- `onCustomerCreated` - Triggered when a customer is created
- `onCustomerUpdated` - Triggered when a customer is updated
- `onCustomerDeleted` - Triggered when a customer is deleted
- `onCustomerStateChanged` - Triggered when a customer is created
