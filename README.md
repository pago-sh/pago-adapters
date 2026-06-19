# Pago Adapters

This repository hosts a wide array of Pago adapters for your TypeScript framework. Our Adapters are built to make it as easy as possible to integrate Pago in your application.

### Adapters

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


### Deploying Adapters

1. To deploy the adapters, you need to create a new changeset. You can do this by running and follow the instructions in the terminal:

```bash
npx @changesets/cli
```

2. After you have created the changeset, you should create a pull request to the main branch. 
3. Once the pull request is merged, a new pull request will be created that will bump the version of the adapters.
4. Merge it to the main branch and the adapters will be published to npm.


> [!WARNING]  
> Deno package is published to JSR registry, not npm. At the moment this is done manually.