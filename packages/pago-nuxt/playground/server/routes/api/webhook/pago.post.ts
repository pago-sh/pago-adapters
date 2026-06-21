export default defineEventHandler((event) => {
  const {
    private: { pagoWebhookSecret },
  } = useRuntimeConfig();

  const webhooksHandler = Webhooks({
    webhookSecret: pagoWebhookSecret,
    onPayload: async () => {
      // Handle the payload
      // No need to return an acknowledge response
    },
  });

  return webhooksHandler(event);
});
