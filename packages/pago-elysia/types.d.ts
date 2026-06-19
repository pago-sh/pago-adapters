declare module "@pago-sh/hono" {
  interface Context {
    env: {
      PAGO_ACCESS_TOKEN: string;
    };
  }
}
