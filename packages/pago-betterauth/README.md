# @pago-sh/better-auth

Um plugin do [Better Auth](https://github.com/better-auth/better-auth) para integrar pagamentos e assinaturas da [pago.sh](https://pago.sh) ao seu fluxo de autenticação.

## Recursos

- Integração de Checkout
- Portal do Cliente
- Criação automática de Cliente no cadastro
- Ingestão de Eventos e Medidores de Cliente para Cobrança por Uso flexível
- Tratamento seguro de Webhooks da pago.sh com verificação de assinatura
- Sistema de Referência para associar compras a organizações

## Instalação

```bash
pnpm add better-auth @pago-sh/better-auth @pago-sh/sdk
```

## Preparação

Acesse as Configurações da sua Organização na pago.sh e crie um Token de Acesso da Organização. Adicione-o ao seu ambiente.

```bash
# .env
PAGO_ACCESS_TOKEN=...
```

### Configurando o Servidor BetterAuth

O plugin da pago.sh vem com um conjunto de plugins adicionais que adicionam funcionalidades à sua stack.

- Checkout - Habilita uma integração de checkout perfeita
- Portal - Permite que seus clientes gerenciem seus pedidos, assinaturas e benefícios concedidos
- Usage - Extensão simples para listar medidores de clientes e ingerir eventos para Cobrança por Uso
- Webhooks - Escuta os webhooks relevantes da pago.sh

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

### Configurando o Cliente BetterAuth

Você utilizará o Cliente BetterAuth para interagir com as funcionalidades da pago.sh.

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

## Opções de Configuração

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

### Opções Obrigatórias

- `client`: Instância do cliente do SDK da pago.sh

### Opções Opcionais

- `createCustomerOnSignUp`: Cria automaticamente um cliente na pago.sh quando um usuário se cadastra
- `getCustomerCreateParams`: Função personalizada para fornecer metadados adicionais na criação do cliente

### Clientes

Quando `createCustomerOnSignUp` está habilitado, um novo Cliente da pago.sh é criado automaticamente quando um novo Usuário é adicionado ao Banco de Dados do Better-Auth.

Todos os novos clientes são criados com um `externalId` associado, que é o ID do seu Usuário no Banco de Dados. Isso nos permite dispensar qualquer mapeamento entre pago.sh e Usuário no seu Banco de Dados.

## Plugin de Checkout

Para dar suporte a checkouts no seu app, basta passar o plugin Checkout para a propriedade `use`.

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

Quando os checkouts estão habilitados, você pode inicializar Sessões de Checkout usando o método `checkout` no Cliente BetterAuth. Isso redirecionará o usuário para o Checkout do Produto.

```typescript
await authClient.checkout({
  // Any Pago Product ID can be passed here
  products: ["e651f46d-ac20-4f26-b769-ad088b123df2"],
  // Or, if you setup "products" in the Checkout Config, you can pass the slug
  slug: "pro",
});
```

Os checkouts levarão automaticamente o Usuário autenticado como o cliente para o checkout. O endereço de e-mail será "fixado".

Se `authenticatedUsersOnly` for `false`, então será possível disparar sessões de checkout sem nenhum cliente associado.


### Checkout Incorporado (Embed)

Você pode usar o método `checkoutEmbed` para, em vez disso, abrir o Checkout como um Embed no seu site.

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

### Suporte a Organizações

Este plugin suporta o plugin Organization. Se você passar o ID da organização para o `referenceId` do Checkout, poderá acompanhar as compras feitas pelos membros da organização.

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

## Plugin do Portal

Um plugin que habilita o gerenciamento, pelo cliente, de suas compras, pedidos e assinaturas.

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

O plugin do portal fornece ao Cliente BetterAuth um conjunto de métodos de gerenciamento de clientes, agrupados sob `authClient.customer`.

### Gerenciamento do Portal do Cliente

O método a seguir redirecionará o usuário para o Portal do Cliente da pago.sh, onde ele poderá ver pedidos, compras, assinaturas, benefícios, etc.

```typescript
await authClient.customer.portal();
```

### Estado do Cliente

O plugin do portal também adiciona um método de estado conveniente para recuperar o Estado geral do Cliente.

```typescript
const { data: customerState } = await authClient.customer.state();
```

O objeto de estado do cliente contém:

- Todos os dados sobre o cliente.
- A lista de suas assinaturas ativas
  - Observação: Isso não inclui assinaturas feitas por uma organização-mãe. Veja o método `list` de assinaturas abaixo para mais informações.
- A lista de seus benefícios concedidos.
- A lista de seus medidores ativos, com o saldo atual.

Assim, com esse único objeto, você tem todas as informações necessárias para verificar se deve ou não provisionar acesso ao seu serviço.

[Você pode saber mais sobre o Estado do Cliente da pago.sh na Documentação da pago.sh](https://docs.pago.sh/integrate/customer-state).

### Benefícios, Pedidos e Assinaturas

O plugin do portal adiciona 3 métodos convenientes para listar benefícios, pedidos e assinaturas relevantes para o usuário/cliente autenticado.

[Todos esses métodos usam as APIs do CustomerPortal da pago.sh](https://docs.pago.sh/api-reference/customer-portal)

#### Benefícios

Este método lista apenas os benefícios concedidos ao usuário/cliente autenticado.

```typescript
const { data: benefits } = await authClient.customer.benefits.list({
  query: {
    page: 1,
    limit: 10,
  },
});
```

#### Pedidos

Este método lista pedidos como compras e renovações de assinatura para o usuário/cliente autenticado.

```typescript
const { data: orders } = await authClient.customer.orders.list({
  query: {
    page: 1,
    limit: 10,
    productBillingType: "one_time", // or 'recurring'
  },
});
```

#### Assinaturas

Este método lista as assinaturas associadas ao usuário/cliente autenticado.

```typescript
const { data: subscriptions } = await authClient.customer.subscriptions.list({
  query: {
    page: 1,
    limit: 10,
    active: true,
  },
});
```

**Importante** - Suporte a Organizações

Isto **não** retornará assinaturas feitas por uma organização-mãe para o usuário autenticado.

No entanto, você pode passar um `referenceId` para este método. Isso retornará todas as assinaturas associadas a esse `referenceId` em vez das assinaturas associadas ao usuário.

Então, para descobrir se um usuário deve ter acesso, passe o ID da organização do usuário para verificar se há uma assinatura ativa para essa organização.

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

## Plugin de Uso (Usage)

Um plugin simples para Cobrança por Uso.

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

### Ingestão de Eventos

A Cobrança por Uso da pago.sh é construída inteiramente sobre a ingestão de eventos. Ingira eventos da sua aplicação, crie Medidores para representar esse uso e adicione preços medidos aos Produtos para cobrar por isso.

[Saiba mais sobre Cobrança por Uso na Documentação da pago.sh.](https://docs.pago.sh/features/usage-based-billing/introduction)

```typescript
const { data: ingested } = await authClient.usage.ingest({
  event: "file-uploads",
  metadata: {
    uploadedFiles: 12,
  },
});
```

O usuário autenticado é automaticamente associado ao evento ingerido.

### Medidores de Cliente

Um método simples para listar os Medidores de Uso do usuário autenticado, ou, como os chamamos, Medidores de Cliente.

Os Medidores de Cliente contêm todas as informações sobre o consumo do cliente nos medidores que você definiu.

- Informações do Cliente
- Informações do Medidor
- Informações do Medidor de Cliente
  - Unidades Consumidas
  - Unidades Creditadas
  - Saldo

```typescript
const { data: customerMeters } = await authClient.usage.meters.list({
  query: {
    page: 1,
    limit: 10,
  },
});
```

## Plugin de Webhooks

O plugin de Webhooks pode ser usado para capturar eventos recebidos da sua organização na pago.sh.

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

Configure um endpoint de Webhook na página de Configurações da sua Organização na pago.sh. O endpoint do Webhook é configurado em /pago/webhooks.

Adicione o secret ao seu ambiente.

```bash
# .env
PAGO_WEBHOOK_SECRET=...
```

O plugin suporta handlers para todos os eventos de webhook da pago.sh:

- `onPayload` - Handler genérico para qualquer evento de Webhook recebido
- `onCheckoutCreated` - Disparado quando um checkout é criado
- `onCheckoutUpdated` - Disparado quando um checkout é atualizado
- `onOrderCreated` - Disparado quando um pedido é criado
- `onOrderPaid` - Disparado quando um pedido é pago
- `onOrderRefunded` - Disparado quando um pedido é reembolsado
- `onRefundCreated` - Disparado quando um reembolso é criado
- `onRefundUpdated` - Disparado quando um reembolso é atualizado
- `onSubscriptionCreated` - Disparado quando uma assinatura é criada
- `onSubscriptionUpdated` - Disparado quando uma assinatura é atualizada
- `onSubscriptionActive` - Disparado quando uma assinatura se torna ativa
- `onSubscriptionCanceled` - Disparado quando uma assinatura é cancelada
- `onSubscriptionRevoked` - Disparado quando uma assinatura é revogada
- `onSubscriptionUncanceled` - Disparado quando um cancelamento de assinatura é revertido
- `onProductCreated` - Disparado quando um produto é criado
- `onProductUpdated` - Disparado quando um produto é atualizado
- `onOrganizationUpdated` - Disparado quando uma organização é atualizada
- `onBenefitCreated` - Disparado quando um benefício é criado
- `onBenefitUpdated` - Disparado quando um benefício é atualizado
- `onBenefitGrantCreated` - Disparado quando uma concessão de benefício é criada
- `onBenefitGrantUpdated` - Disparado quando uma concessão de benefício é atualizada
- `onBenefitGrantRevoked` - Disparado quando uma concessão de benefício é revogada
- `onCustomerCreated` - Disparado quando um cliente é criado
- `onCustomerUpdated` - Disparado quando um cliente é atualizado
- `onCustomerDeleted` - Disparado quando um cliente é excluído
- `onCustomerStateChanged` - Disparado quando um cliente é criado
