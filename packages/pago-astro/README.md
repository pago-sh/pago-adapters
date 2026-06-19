# @pago-sh/astro

Pagamentos e Checkouts extremamente simples com Astro.

`pnpm install @pago-sh/astro`

## Checkout

Crie um handler de Checkout que cuida dos redirecionamentos.

```typescript
import { Checkout } from "@pago-sh/astro";
import { PAGO_ACCESS_TOKEN, PAGO_SUCCESS_URL } from "astro:env/server";

export const GET = Checkout({
  accessToken: PAGO_ACCESS_TOKEN,
  successUrl: PAGO_SUCCESS_URL,
  returnUrl: "https://myapp.com", // URL de retorno opcional, que renderiza um botão de Voltar no Checkout 
  server: "sandbox", // Use sandbox se estiver testando a pago.sh - omita o parâmetro ou passe 'production' caso contrário
  theme: "dark" // Força o tema - o tema preferido do sistema será usado se omitido
});
```

### Parâmetros de Query

Passe parâmetros de query para esta rota.

- products `?products=123`
- customerId (opcional) `?products=123&customerId=xxx`
- customerExternalId (opcional) `?products=123&customerExternalId=xxx`
- customerEmail (opcional) `?products=123&customerEmail=janedoe@gmail.com`
- customerName (opcional) `?products=123&customerName=Jane`
- seats (opcional) `?products=123&seats=5` - Número de assentos para produtos baseados em assentos
- metadata (opcional) `string JSON URL-Encoded`

## Portal do Cliente

Crie um portal do cliente onde seus clientes podem visualizar pedidos e assinaturas.

```typescript
import { CustomerPortal } from "@pago-sh/astro";
import { PAGO_ACCESS_TOKEN } from "astro:env/server";

export const GET = CustomerPortal({
  accessToken: PAGO_ACCESS_TOKEN,
  getCustomerId: (event) => "", // Função para resolver um Customer ID da pago.sh
  returnUrl: "https://myapp.com", // URL de retorno opcional, que renderiza um botão de Voltar no Portal do Cliente
  server: "sandbox", // Use sandbox se estiver testando a pago.sh - omita o parâmetro ou passe 'production' caso contrário
});
```

## Webhooks

Um utilitário simples que resolve os payloads de webhook recebidos assinando o webhook secret corretamente.

```typescript
import { Webhooks } from '@pago-sh/astro';
import { PAGO_WEBHOOK_SECRET } from "astro:env/server"

export const POST = Webhooks({
  webhookSecret: PAGO_WEBHOOK_SECRET,
  onPayload: async (payload) => /** Trate o payload */,
})
```

#### Handlers de Payload

O handler de Webhook também suporta handlers granulares para facilitar a integração.

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
