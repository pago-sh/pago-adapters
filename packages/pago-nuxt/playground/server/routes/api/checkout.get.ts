export default defineEventHandler((event) => {
  const {
    private: { pagoAccessToken, pagoCheckoutSuccessUrl, pagoServer },
  } = useRuntimeConfig();

  const checkoutHandler = Checkout({
    accessToken: pagoAccessToken,
    successUrl: pagoCheckoutSuccessUrl,
    server: pagoServer as "sandbox" | "production",
  });

  return checkoutHandler(event);
});
