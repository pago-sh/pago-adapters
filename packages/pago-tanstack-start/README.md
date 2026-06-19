# @pago-sh/tanstack-start

Pagamentos e Checkouts extremamente simples com o [Tanstack Start](https://tanstack.com/start)

`pnpm install @pago-sh/tanstack-start zod`

## Checkout

Crie um handler de Checkout que cuida dos redirecionamentos.

```typescript
// routes/api/checkout.ts
import { Checkout } from "@pago-sh/tanstack-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/checkout")({
  GET: Checkout({
    accessToken: process.env.PAGO_ACCESS_TOKEN,
    successUrl: process.env.SUCCESS_URL,
    returnUrl: "https://myapp.com", // URL de retorno opcional, que renderiza um botao de Voltar no Checkout
    server: "sandbox", // Use sandbox se estiver testando a Pago - omita o parametro ou passe 'production' caso contrario
    theme: "dark" // Forca o tema - o tema preferido do sistema sera usado se omitido
  }),
});
```

### Parametros de Query

Passe parametros de query para esta rota.

- products `?products=123`
- customerId (opcional) `?products=123&customerId=xxx`
- customerExternalId (opcional) `?products=123&customerExternalId=xxx`
- customerEmail (opcional) `?products=123&customerEmail=janedoe@gmail.com`
- customerName (opcional) `?products=123&customerName=Jane`
- seats (opcional) `?products=123&seats=5` - Numero de assentos para produtos baseados em assentos
- metadata (opcional) `URL-Encoded JSON string`

## Portal do Cliente

Crie um portal do cliente onde seus clientes podem visualizar pedidos e assinaturas.

```typescript
// routes/api/portal.ts
import { CustomerPortal } from "@pago-sh/tanstack-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { getSupabaseServerClient } from "~/servers/supabase-server";

export const APIRoute = createAPIFileRoute("/api/portal")({
  GET: CustomerPortal({
    accessToken: process.env.PAGO_ACCESS_TOKEN,
    getCustomerId: async (request: Request) => "", // Funcao para resolver um Customer ID da Pago
    returnUrl: "https://myapp.com", // URL de retorno opcional, que renderiza um botao de Voltar no Portal do Cliente
    server: "sandbox", // Use sandbox se estiver testando a Pago - omita o parametro ou passe 'production' caso contrario
  }),
});
```

## Webhooks

Um utilitario simples que resolve os payloads de webhook recebidos assinando corretamente o segredo do webhook.

```typescript
// api/webhook/pago.ts
import { Webhooks } from "@pago-sh/tanstack-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/webhook/pago")({
  POST: Webhooks({
    webhookSecret: process.env.PAGO_WEBHOOK_SECRET!,
    onPayload: async (payload) => {
      // Trate o payload
      // Nao e necessario retornar uma resposta de confirmacao
    },
  }),
});
```

#### Handlers de Payload

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
