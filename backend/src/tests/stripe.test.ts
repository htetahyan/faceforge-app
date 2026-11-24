import { assert, req, token } from './test-context.ts';
import { app } from '../index.ts';

export async function runStripeTests() {
  // Test Case 8: Stripe mock checkout upgrade
  console.log('\n[Test 8] Mock Stripe subscription upgrade (Pro)...');
  
  const plansRes = await req('/api/stripe/plans');
  assert(plansRes.status === 200, 'Stripe plans route returns HTTP 200');
  const plansBody: any = await plansRes.json();
  const proPlan = plansBody.plans.find((p: any) => p.id === 'pro');
  const proPriceId = proPlan?.priceId || 'price_pro_placeholder';
  
  const checkoutRes = await req('/api/stripe/create-checkout', {
    method: 'POST',
    token,
    body: { priceId: proPriceId }
  });
  assert(checkoutRes.status === 200, 'Stripe checkout route returns HTTP 200');
  const checkoutBody: any = await checkoutRes.json();
  assert(checkoutBody.url.includes('mock-checkout-success'), 'Returns mock checkout URL in dev mode');

  // Trigger mock success redirect URL
  const upgradeRes = await app.request(checkoutBody.url.replace('http://localhost:3005', ''));
  assert(upgradeRes.status === 200, 'Mock checkout redirection completes successfully');

  // Verify user is upgraded
  const meRes = await req('/api/auth/me', { token });
  const meBody: any = await meRes.json();
  assert(meBody.user.subscriptionTier === 'pro', 'User upgraded to PRO tier');

  // Test Case 9: Retrieve Stripe subscription details
  console.log('\n[Test 9] Retrieve Subscription Status...');
  const subRes = await req('/api/stripe/subscription', { token });
  assert(subRes.status === 200, 'Stripe subscription route returns HTTP 200');
  const subBody: any = await subRes.json();
  assert(subBody.subscription.tier === 'pro', 'Subscription tier is pro');
  assert(subBody.subscription.status === 'active', 'Subscription status is active');
  assert(subBody.subscription.usage.limit === 50, 'Pro subscription limit is 50');
}
