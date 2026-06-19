export default defineNuxtConfig({
  modules: ["../src/module"],
  pago: {},
  devtools: { enabled: true },
  compatibilityDate: "2025-02-25",
  runtimeConfig: {
    private: {
      pagoAccessToken: "",
      pagoServer: "",
      pagoCheckoutSuccessUrl: "",
      pagoWebhookSecret: "",
    },
  },
});
