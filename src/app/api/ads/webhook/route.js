// Same handler as /api/billing/webhook: one Razorpay webhook serves Pro payments and sponsor banners.
// Kept so a webhook URL saved in the dashboard earlier at /api/ads/webhook keeps working.
export const runtime = 'nodejs';
export { POST } from '@/app/api/billing/webhook/route';