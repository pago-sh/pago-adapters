# @pago-sh/supabase

Pagamentos e Checkouts extremamente simples com Supabase Edge Functions.

`npm install @pago-sh/supabase`

## Checkout

Crie um handler de Checkout que cuida dos redirecionamentos.

```typescript
// supabase/functions/checkout/index.ts
import { Checkout } from "@pago-sh/supabase";

const handler = Checkout({
	accessToken: Deno.env.get("PAGO_ACCESS_TOKEN"),
	successUrl: Deno.env.get("SUCCESS_URL"),
    returnUrl: "https://myapp.com", // Optional Return URL, which renders a Back-button in the Checkout
	server: "sandbox", // Use sandbox if you're testing Pago - omit the parameter or pass 'production' otherwise
	theme: "dark", // Enforces the theme - System-preferred theme will be set if left omitted
});

Deno.serve(handler);
```

### Query Params

Passe parametros de query para esta rota.

- products `?products=123`
- customerId (opcional) `?products=123&customerId=xxx`
- customerExternalId (opcional) `?products=123&customerExternalId=xxx`
- customerEmail (opcional) `?products=123&customerEmail=janedoe@gmail.com`
- customerName (opcional) `?products=123&customerName=Jane`
- customerBillingAddress (opcional) `URL-Encoded JSON string`
- customerTaxId (opcional) `?products=123&customerTaxId=xxx`
- customerIpAddress (opcional) `?products=123&customerIpAddress=192.168.1.1`
- customerMetadata (opcional) `URL-Encoded JSON string`
- allowDiscountCodes (opcional) `?products=123&allowDiscountCodes=true`
- discountId (opcional) `?products=123&discountId=xxx`
- seats (opcional) `?products=123&seats=5` - Numero de assentos para produtos baseados em assentos
- metadata (opcional) `URL-Encoded JSON string`

## Customer Portal

Crie um portal do cliente onde seu cliente pode visualizar pedidos e assinaturas.

```typescript
// supabase/functions/portal/index.ts
import { CustomerPortal } from "@pago-sh/supabase";

const handler = CustomerPortal({
	accessToken: Deno.env.get("PAGO_ACCESS_TOKEN")!,
	getCustomerId: async (req: Request) => {
		// Function to resolve a Pago Customer ID
		// You can extract customer ID from auth headers, cookies, etc.
		return "123";
	},
    returnUrl: "https://myapp.com", // Optional Return URL, which renders a Back-button in the Customer Portal
	server: "sandbox", // Use sandbox if you're testing Pago - omit the parameter or pass 'production' otherwise
});

Deno.serve(handler);
```

## Webhooks

Um utilitario simples que resolve payloads de webhook recebidos validando a assinatura do webhook.

```typescript
// supabase/functions/webhooks/index.ts
import { Webhooks } from "@pago-sh/supabase";

const handler = Webhooks({
	webhookSecret: Deno.env.get("PAGO_WEBHOOK_SECRET")!,
	onPayload: async (payload) => {
		// Handle the payload
		// No need to return an acknowledge response
	},
});

Deno.serve(handler);
```

### Payload Handlers

O handler de Webhook tambem suporta handlers granulares para facilitar a integracao.

- onCheckoutCreated: (payload) => Promise<void>
- onCheckoutUpdated: (payload) => Promise<void>
- onOrderCreated: (payload) => Promise<void>
- onOrderUpdated: (payload) => Promise<void>
- onOrderPaid: (payload) => Promise<void>
- onOrderRefunded: (payload) => Promise<void>
- onRefundCreated: (payload) => Promise<void>
- onRefundUpdated: (payload) => Promise<void>
- onSubscriptionCreated: (payload) => Promise<void>
- onSubscriptionUpdated: (payload) => Promise<void>
- onSubscriptionActive: (payload) => Promise<void>
- onSubscriptionCanceled: (payload) => Promise<void>
- onSubscriptionRevoked: (payload) => Promise<void>
- onSubscriptionUncanceled: (payload) => Promise<void>
- onProductCreated: (payload) => Promise<void>
- onProductUpdated: (payload) => Promise<void>
- onOrganizationUpdated: (payload) => Promise<void>
- onBenefitCreated: (payload) => Promise<void>
- onBenefitUpdated: (payload) => Promise<void>
- onBenefitGrantCreated: (payload) => Promise<void>
- onBenefitGrantUpdated: (payload) => Promise<void>
- onBenefitGrantRevoked: (payload) => Promise<void>
- onCustomerCreated: (payload) => Promise<void>
- onCustomerUpdated: (payload) => Promise<void>
- onCustomerDeleted: (payload) => Promise<void>
- onCustomerStateChanged: (payload) => Promise<void>

## Edge Runtime Compatibility

Este adaptador foi construido para funcionar com Supabase Edge Functions, que rodam no runtime Deno. Ele usa Web APIs padrao (`Request`, `Response`) que sao compativeis com ambientes edge, tornando-o ideal para:

- Supabase Edge Functions
- Deno Deploy
- Outros runtimes edge baseados em Deno

Todos os handlers retornam objetos `Response` padrao e aceitam objetos `Request` padrao, garantindo maxima compatibilidade com runtimes edge.
