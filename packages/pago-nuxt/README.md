# @pago-sh/nuxt

Pagamentos e Checkouts extremamente simples com Nuxt.

## Instalação

### Instale o pacote

Escolha o gerenciador de pacotes de sua preferência para instalar o módulo:

`pnpm add @pago-sh/nuxt`

### Registre o módulo

Adicione o módulo ao seu `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ["@pago-sh/nuxt"],
});
```

## Checkout

Crie um handler de Checkout que cuida dos redirecionamentos.

```typescript
// server/routes/api/checkout.post.ts
export default defineEventHandler((event) => {
  const {
    private: { pagoAccessToken, pagoCheckoutSuccessUrl, pagoServer },
  } = useRuntimeConfig();

  const checkoutHandler = Checkout({
    accessToken: pagoAccessToken,
    successUrl: pagoCheckoutSuccessUrl,
    returnUrl: "https://myapp.com", // URL de retorno opcional, que renderiza um botão de Voltar no Checkout
    server: pagoServer as "sandbox" | "production",
    theme: "dark" // Força o tema - O tema preferido do sistema será usado se omitido
  });

  return checkoutHandler(event);
});
```

### Parâmetros de Query

Passe parâmetros de query para esta rota.

- products `?products=123`
- customerId (opcional) `?products=123&customerId=xxx`
- customerExternalId (opcional) `?products=123&customerExternalId=xxx`
- customerEmail (opcional) `?products=123&customerEmail=janedoe@gmail.com`
- customerName (opcional) `?products=123&customerName=Jane`
- metadata (opcional) `URL-Encoded JSON string`

## Portal do Cliente

Crie um portal do cliente onde seu cliente pode visualizar pedidos e assinaturas.

```typescript
// server/routes/api/portal.get.ts
export default defineEventHandler((event) => {
  const {
    private: { pagoAccessToken, pagoCheckoutSuccessUrl, pagoServer },
  } = useRuntimeConfig();

  const customerPortalHandler = CustomerPortal({
    accessToken: pagoAccessToken,
    server: pagoServer as "sandbox" | "production",
    getCustomerId: (event) => {
      return Promise.resolve("9d89909b-216d-475e-8005-053dba7cff07");
    },
    returnUrl: "https://myapp.com", // URL de retorno opcional, que renderiza um botão de Voltar no Portal do Cliente
  });

  return customerPortalHandler(event);
});
```

## Webhooks

Um utilitário simples que resolve os payloads de webhook recebidos assinando o segredo do webhook corretamente.

```typescript
// server/routes/webhook/pago.post.ts
export default defineEventHandler((event) => {
  const {
    private: { pagoWebhookSecret },
  } = useRuntimeConfig();

  const webhooksHandler = Webhooks({
    webhookSecret: pagoWebhookSecret,
    onPayload: async (payload: any) => {
      // Trate o payload
      // Não é necessário retornar uma resposta de confirmação
    },
  });

  return webhooksHandler(event);
});
```

### Handlers de Payload

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
