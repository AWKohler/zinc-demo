import { randomUUID } from "crypto";

export function generateIdempotencyKey(): string {
  return randomUUID();
}

export function getWebhookUrl(endpoint: string): string {
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://your-domain.com';
    
  return `${baseUrl}/api/webhooks/${endpoint}?secret=${process.env.ZINC_WEBHOOK_SECRET}`;
}