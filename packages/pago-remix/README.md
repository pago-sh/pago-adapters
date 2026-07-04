# @pago-sh/remix

Pagamentos e Checkouts extremamente simples com Remix e React Router.

`pnpm install @pago-sh/remix zod`

## Checkout

Crie um handler de Checkout que cuida dos redirecionamentos.

```typescript
import { Checkout } from "@pago-sh/remix";

export const loader = Checkout({
  accessToken: "xxx", // Or set an environment variable to PAGO_ACCESS_TOKEN
  successUrl: process.env.SUCCESS_URL,
  returnUrl: "https://myapp.com", // URL de retorno opcional, que renderiza um botão de Voltar no Checkout
  server: "sandbox", // Use sandbox se estiver testando a Pago - omita o parâmetro ou passe 'production' caso contrário
  theme: "dark" // Força o tema - o tema preferido do sistema será usado se omitido
});
```

### Parâmetros de Query

Passe os parâmetros de query para esta rota.

- products `?products=123`
- customerId (opcional) `?products=123&customerId=xxx`
- customerExternalId (opcional) `?products=123&customerExternalId=xxx`
- customerEmail (opcional) `?products=123&customerEmail=janedoe@gmail.com`
- customerName (opcional) `?products=123&customerName=Jane`
- seats (opcional) `?products=123&seats=5` - Número de assentos para produtos baseados em assentos
- metadata (opcional) `URL-Encoded JSON string`

## Portal do Cliente

Crie um portal do cliente onde seus clientes podem visualizar pedidos e assinaturas.

```typescript
import { CustomerPortal } from "@pago-sh/remix";

export const loader = CustomerPortal({
  accessToken: "xxx", // Or set an environment variable to PAGO_ACCESS_TOKEN
  getCustomerId: (event) => "", // Função para resolver um Customer ID da Pago
  returnUrl: "https://myapp.com", // URL de retorno opcional, que renderiza um botão de Voltar no Portal do Cliente
  server: "sandbox", // Use sandbox se estiver testando a Pago - omita o parâmetro ou passe 'production' caso contrário
});
```

## Webhooks

Um utilitário simples que resolve payloads de webhook recebidos, assinando o segredo do webhook corretamente.

```typescript
import { Webhooks } from '@pago-sh/remix';

export const action = Webhooks({
  webhookSecret: process.env.PAGO_WEBHOOK_SECRET!,
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
