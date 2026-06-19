# @pago-sh/nextjs

Pagamentos e Checkouts extremamente simples com Next.js.

`pnpm install @pago-sh/nextjs zod`

## Checkout

Crie um handler de Checkout que cuida dos redirecionamentos.

```typescript
// checkout/route.ts
import { Checkout } from "@pago-sh/nextjs";

export const GET = Checkout({
	accessToken: process.env.PAGO_ACCESS_TOKEN,
	successUrl: process.env.SUCCESS_URL,
    returnUrl: "https://myapp.com", // URL de retorno opcional, que renderiza um botão "Voltar" no Checkout
	server: "sandbox", // Use sandbox se estiver testando a pago.sh - omita o parâmetro ou passe 'production' caso contrário
	theme: "dark" // Força o tema - o tema preferido do sistema será aplicado se omitido
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
- metadata (opcional) `URL-Encoded JSON string`

## Portal do Cliente

Crie um portal do cliente onde seu cliente pode visualizar pedidos e assinaturas.

```typescript
// portal/route.ts
import { CustomerPortal } from "@pago-sh/nextjs";

export const GET = CustomerPortal({
	accessToken: process.env.PAGO_ACCESS_TOKEN,
	getCustomerId: (req: NextRequest) => "", // Função para resolver o ID de Cliente da Pago
    returnUrl: "https://myapp.com", // URL de retorno opcional, que renderiza um botão "Voltar" no Portal do Cliente
	server: "sandbox", // Use sandbox se estiver testando a pago.sh - omita o parâmetro ou passe 'production' caso contrário
});
```

## Webhooks

Um utilitário simples que resolve payloads de webhook recebidos, assinando o segredo do webhook corretamente.

```typescript
// api/webhook/pago/route.ts
import { Webhooks } from "@pago-sh/nextjs";

export const POST = Webhooks({
	webhookSecret: process.env.PAGO_WEBHOOK_SECRET!,
	onPayload: async (payload) => {
		// Trate o payload
		// Não é necessário retornar uma resposta de confirmação
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
