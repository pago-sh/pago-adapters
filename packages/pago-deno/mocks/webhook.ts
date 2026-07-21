export class PagoWebhookVerificationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "PagoWebhookVerificationError";
	}
}
