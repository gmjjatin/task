// IMPORTANT ! DO NOT MODIFY THIS FILE
// Simulates an external payment provider. Treat it as a remote service: calls are slow and can be declined.
import crypto from 'crypto';

export class PaymentDeclinedError extends Error {
  constructor(message = 'Card declined') {
    super(message);
    this.name = 'PaymentDeclinedError';
    this.code = 'card_declined';
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class PaymentGateway {
  constructor({ latencyMs = 300, declineAboveCents = 100000 } = {}) {
    this.latencyMs = latencyMs;
    this.declineAboveCents = declineAboveCents;
  }

  // Resolves with a charge, or rejects with PaymentDeclinedError.
  async charge({ amountCents, reference }) {
    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      throw new Error('amountCents must be a positive integer');
    }
    await sleep(this.latencyMs);
    if (amountCents > this.declineAboveCents) {
      throw new PaymentDeclinedError('Card declined: amount exceeds the card limit');
    }
    return {
      id: `ch_${crypto.randomBytes(8).toString('hex')}`,
      amountCents,
      reference,
      status: 'succeeded',
    };
  }
}
