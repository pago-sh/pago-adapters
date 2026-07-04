# @pago-sh/express

Pagamentos e Checkouts extremamente simples com Express.

`pnpm install @pago-sh/express zod`

## Checkout

Crie um handler de Checkout que cuida dos redirecionamentos.

```typescript
import express from "express";
import { Checkout } from "@pago-sh/express";

const app = express();

app.get(
  "/checkout",
  Checkout({
    accessToken: "xxx", // Ou defina uma variavel de ambiente PAGO_ACCESS_TOKEN
    successUrl: process.env.SUCCESS_URL,
    returnUrl: "https://myapp.com", // URL de retorno opcional, que renderiza um botao Voltar no Checkout
    server: "sandbox", // Use sandbox se estiver testando a pago.sh - omita o parametro ou passe 'production' caso contrario
    theme: "dark" // Forca o tema - o tema preferido do sistema sera usado se omitido
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
- seats (opcional) `?products=123&seats=5` - Numero de assentos para produtos baseados em assentos
- metadata (opcional) `URL-Encoded JSON string`

## Customer Portal

Crie um portal do cliente onde seus clientes podem visualizar pedidos e assinaturas.

```typescript
import express from "express";
import { CustomerPortal } from "@pago-sh/express";

const app = express();

app.get(
  "/portal",
  CustomerPortal({
    accessToken: "xxx", // Ou defina uma variavel de ambiente PAGO_ACCESS_TOKEN
    getCustomerId: (event) => "", // Funcao para resolver um Pago Customer ID
    returnUrl: "https://myapp.com", // URL de retorno opcional, que renderiza um botao Voltar no Customer Portal
    server: "sandbox", // Use sandbox se estiver testando a pago.sh - omita o parametro ou passe 'production' caso contrario
  }),
);
```

## Webhooks

Um utilitario simples que resolve os payloads de webhook recebidos assinando corretamente o segredo do webhook.

```typescript
import express from 'express'
import { Webhooks } from "@pago-sh/express";

const app = express()

app
.use(express.json())
.post('/pago/webhooks', Webhooks({
  webhookSecret: process.env.PAGO_WEBHOOK_SECRET!,
  onPayload: async (payload) => /** Trate o payload */,
}))
```

#### Payload Handlers

O handler de Webhook tambem suporta handlers granulares para facilitar a integracao.

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
