# @pago-sh/hono

Pagamentos e Checkouts extremamente simples com Hono.

`pnpm install @pago-sh/hono zod`

## Checkout

Crie um handler de Checkout que cuida dos redirecionamentos.

```typescript
import { Hono } from "hono";
import { Checkout } from "@pago-sh/hono";

const app = new Hono();

app.get(
  "/checkout",
  Checkout({
    accessToken: "xxx", // Ou defina a variável de ambiente PAGO_ACCESS_TOKEN
    successUrl: process.env.SUCCESS_URL,
    returnUrl: "https://myapp.com", // URL de retorno opcional, que renderiza um botão Voltar no Checkout
    server: "sandbox", // Use sandbox se estiver testando a Pago - omita o parâmetro ou passe 'production' caso contrário
    theme: "dark" // Força o tema - o tema preferido do sistema será usado se omitido
  }),
);
```

### Query Params

Passe query params para esta rota.

- products `?products=123`
- customerId (opcional) `?products=123&customerId=xxx`
- customerExternalId (opcional) `?products=123&customerExternalId=xxx`
- customerEmail (opcional) `?products=123&customerEmail=janedoe@gmail.com`
- customerName (opcional) `?products=123&customerName=Jane`
- metadata (opcional) `URL-Encoded JSON string`

## Customer Portal

Crie um portal do cliente onde seus clientes podem visualizar pedidos e assinaturas.

```typescript
import { Hono } from "hono";
import { CustomerPortal } from "@pago-sh/hono";

const app = new Hono();

app.get(
  "/portal",
  CustomerPortal({
    accessToken: "xxx", // Ou defina a variável de ambiente PAGO_ACCESS_TOKEN
    getCustomerId: (event) => "", // Função para resolver um Customer ID da Pago
    returnUrl: "https://myapp.com", // URL de retorno opcional, que renderiza um botão Voltar no Customer Portal
    server: "sandbox", // Use sandbox se estiver testando a Pago - omita o parâmetro ou passe 'production' caso contrário
  }),
);
```

## Webhooks

Um utilitário simples que resolve os payloads de webhook recebidos, assinando corretamente o webhook secret.

```typescript
import { Hono } from 'hono'
import { Webhooks } from "@pago-sh/hono";

const app = new Hono()

app.post('/pago/webhooks', Webhooks({
  webhookSecret: process.env.PAGO_WEBHOOK_SECRET!,
  onPayload: async (payload) => /** Trate o payload */,
}))
```

#### Payload Handlers

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
