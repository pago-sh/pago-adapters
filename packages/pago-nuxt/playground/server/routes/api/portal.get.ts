export default defineEventHandler((event) => {
  const {
    private: { pagoAccessToken, pagoServer },
  } = useRuntimeConfig();

  const customerPortalHandler = CustomerPortal({
    accessToken: pagoAccessToken,
    server: pagoServer as "sandbox" | "production",
    getCustomerId: () => {
      return Promise.resolve("9d89909b-216d-475e-8005-053dba7cff07");
    },
  });

  return customerPortalHandler(event);
});
