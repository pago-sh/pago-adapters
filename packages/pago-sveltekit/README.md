# @pago-sh/sveltekit

Pagamentos e Checkouts extremamente simples com Sveltekit.

`pnpm install @pago-sh/sveltekit zod`

## Checkout

Crie um handler de Checkout que cuida dos redirecionamentos.

```typescript
// /api/checkout/+server.ts
import { Checkout } from "@pago-sh/sveltekit";

export const GET = Checkout({
  accessToken: process.env.PAGO_ACCESS_TOKEN,
  successUrl: process.env.SUCCESS_URL,
  returnUrl: "https://myapp.com", // Optional Return URL, which renders a Back-button in the Checkout
  server: "sandbox", // Use sandbox if you're testing Pago - omit the parameter or pass 'production' otherwise
  theme: "dark" // Enforces the theme - System-preferred theme will be set if left omitted
});
```

### Parâmetros de Query

Passe parâmetros de query para esta rota.

- products `?products=123`
- customerId (opcional) `?products=123&customerId=xxx`
- customerExternalId (opcional) `?products=123&customerExternalId=xxx`
- customerEmail (opcional) `?products=123&customerEmail=janedoe@gmail.com`
- customerName (opcional) `?products=123&customerName=Jane`
- metadata (opcional) `string JSON URL-Encoded`

## Portal do Cliente

Crie um portal do cliente onde seus clientes podem visualizar pedidos e assinaturas.

```typescript
// /api/portal/+server.ts
import { CustomerPortal } from "@pago-sh/sveltekit";

export const GET = CustomerPortal({
  accessToken: process.env.PAGO_ACCESS_TOKEN,
  getCustomerId: (event) => "", // Fuction to resolve a Pago Customer ID
  getExternalCustomerId: (event) => "", // Alternatively, resolve the external customer ID
  returnUrl: "https://myapp.com", // Optional Return URL, which renders a Back-button in the Customer Portal
  server: "sandbox", // Use sandbox if you're testing Pago - omit the parameter or pass 'production' otherwise
});
```

#### Resolvendo o cliente
Você pode resolver tanto o ID de cliente da pago.sh (implementando `getCustomerId`) quanto o ID externo do cliente (implementando `getExternalCustomerId`). Um exemplo comum é resolver o cliente pelo cookie de sessão ou token JWT.

## Webhooks

Um utilitário simples que resolve os payloads de webhook recebidos assinando corretamente o segredo do webhook.

```typescript
// api/webhook/pago/route.ts
import { Webhooks } from "@pago-sh/sveltekit";

export const POST = Webhooks({
  webhookSecret: process.env.PAGO_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    // Handle the payload
    // No need to return an acknowledge response
  },
});
```

#### Handlers de Payload

O handler de Webhook também oferece suporte a handlers granulares para facilitar a integração.

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
