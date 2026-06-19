# Pago Adapters

Este repositório hospeda uma ampla variedade de adaptadores da pago.sh para o seu framework TypeScript. Nossos adaptadores são feitos para tornar a integração da pago.sh na sua aplicação o mais simples possível.

### Adaptadores

- [BetterAuth](./packages/pago-betterauth)
- [Supabase](./packages/pago-supabase/)
- [Deno](./packages//pago-deno/)
- [Astro](./packages/pago-astro)
- [Elysia](./packages/pago-elysia)
- [Express](./packages/pago-express)
- [Fastify](./packages/pago-fastify)
- [Hono](./packages/pago-hono)
- [Next.js](./packages/pago-nextjs)
- [Nuxt](./packages/pago-nuxt)
- [Remix](./packages/pago-remix)
- [Sveltekit](./packages/pago-sveltekit)
- [TanStack Start](./packages/pago-tanstack-start)


### Publicando os adaptadores

1. Para publicar os adaptadores, você precisa criar um novo changeset. Você pode fazer isso executando o comando abaixo e seguindo as instruções no terminal:

```bash
npx @changesets/cli
```

2. Depois de criar o changeset, você deve abrir um pull request para a branch main.
3. Assim que o pull request for mesclado, um novo pull request será criado para incrementar a versão dos adaptadores.
4. Mescle-o na branch main e os adaptadores serão publicados no npm.


> [!WARNING]  
> O pacote Deno é publicado no registry JSR, não no npm. No momento, isso é feito manualmente.