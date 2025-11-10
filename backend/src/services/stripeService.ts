import stripe, { STRIPE_PLANS } from '../config/stripe';
import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';
import logger from '../utils/logger';

export const createCheckoutSession = async (
  clubId: string,
  planType: 'basic' | 'pro' | 'premium',
  successUrl: string,
  cancelUrl: string
) => {
  const plan = STRIPE_PLANS[planType];

  if (!plan.priceId) {
    throw new AppError('Plan price ID not configured', 500);
  }

  // Get club details
  const clubResult = await query('SELECT * FROM clubs WHERE id = $1', [clubId]);

  if (clubResult.rows.length === 0) {
    throw new AppError('Club not found', 404);
  }

  const club = clubResult.rows[0];

  try {
    // Create or get Stripe customer
    let customerId = club.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: club.email,
        metadata: {
          clubId: club.id,
          clubName: club.name,
        },
      });
      customerId = customer.id;

      // Update club with customer ID
      await query('UPDATE clubs SET stripe_customer_id = $1 WHERE id = $2', [customerId, clubId]);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        clubId: club.id,
        planType,
      },
      subscription_data: {
        trial_period_days: club.status === 'trialing' ? 14 : undefined,
        metadata: {
          clubId: club.id,
          planType,
        },
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (error: any) {
    logger.error('Stripe checkout error:', error);
    throw new AppError('Failed to create checkout session', 500);
  }
};

export const handleCheckoutCompleted = async (session: any) => {
  const clubId = session.metadata.clubId;
  const planType = session.metadata.planType;
  const subscriptionId = session.subscription;

  if (!clubId || !planType || !subscriptionId) {
    logger.error('Missing metadata in checkout session:', session);
    return;
  }

  try {
    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);

    const plan = STRIPE_PLANS[planType as keyof typeof STRIPE_PLANS];

    // Update club
    await query(
      `UPDATE clubs
       SET
         stripe_subscription_id = $1,
         stripe_customer_id = $2,
         current_plan = $3,
         status = $4,
         max_members = $5,
         features = $6,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $7`,
      [
        subscription.id,
        subscription.customer,
        planType,
        subscription.status === 'trialing' ? 'trialing' : 'active',
        plan.maxMembers,
        JSON.stringify(plan.features),
        clubId,
      ]
    );

    // Create or update club subscription record
    await query(
      `INSERT INTO club_subscriptions
       (club_id, stripe_subscription_id, stripe_customer_id, plan_type, status, current_period_start, current_period_end, amount, currency)
       VALUES ($1, $2, $3, $4, $5, to_timestamp($6), to_timestamp($7), $8, $9)
       ON CONFLICT (stripe_subscription_id)
       DO UPDATE SET
         status = EXCLUDED.status,
         current_period_start = EXCLUDED.current_period_start,
         current_period_end = EXCLUDED.current_period_end,
         updated_at = CURRENT_TIMESTAMP`,
      [
        clubId,
        subscription.id,
        subscription.customer,
        planType,
        subscription.status,
        subscription.current_period_start,
        subscription.current_period_end,
        plan.price,
        'usd',
      ]
    );

    logger.info('Checkout completed successfully for club:', clubId);
  } catch (error) {
    logger.error('Error handling checkout completion:', error);
    throw error;
  }
};

export const handleSubscriptionUpdated = async (subscription: any) => {
  try {
    const clubResult = await query(
      'SELECT id FROM clubs WHERE stripe_subscription_id = $1',
      [subscription.id]
    );

    if (clubResult.rows.length === 0) {
      logger.warn('Club not found for subscription:', subscription.id);
      return;
    }

    const clubId = clubResult.rows[0].id;

    // Map Stripe status to our status
    let status = subscription.status;
    if (status === 'active' || status === 'trialing') {
      status = subscription.status;
    } else if (status === 'past_due' || status === 'unpaid') {
      status = 'suspended';
    } else if (status === 'canceled' || status === 'incomplete_expired') {
      status = 'cancelled';
    }

    // Update club status
    await query(
      'UPDATE clubs SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [status, clubId]
    );

    // Update subscription record
    await query(
      `UPDATE club_subscriptions
       SET
         status = $1,
         current_period_start = to_timestamp($2),
         current_period_end = to_timestamp($3),
         cancel_at_period_end = $4,
         updated_at = CURRENT_TIMESTAMP
       WHERE stripe_subscription_id = $5`,
      [
        subscription.status,
        subscription.current_period_start,
        subscription.current_period_end,
        subscription.cancel_at_period_end,
        subscription.id,
      ]
    );

    logger.info('Subscription updated for club:', clubId);
  } catch (error) {
    logger.error('Error handling subscription update:', error);
    throw error;
  }
};

export const handleSubscriptionDeleted = async (subscription: any) => {
  try {
    const clubResult = await query(
      'SELECT id FROM clubs WHERE stripe_subscription_id = $1',
      [subscription.id]
    );

    if (clubResult.rows.length === 0) {
      logger.warn('Club not found for subscription:', subscription.id);
      return;
    }

    const clubId = clubResult.rows[0].id;

    // Update club status to cancelled
    await query(
      `UPDATE clubs
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [clubId]
    );

    // Update subscription record
    await query(
      `UPDATE club_subscriptions
       SET
         status = 'cancelled',
         cancelled_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       WHERE stripe_subscription_id = $1`,
      [subscription.id]
    );

    logger.info('Subscription cancelled for club:', clubId);
  } catch (error) {
    logger.error('Error handling subscription deletion:', error);
    throw error;
  }
};

export const cancelSubscription = async (clubId: string) => {
  const clubResult = await query(
    'SELECT stripe_subscription_id FROM clubs WHERE id = $1',
    [clubId]
  );

  if (clubResult.rows.length === 0) {
    throw new AppError('Club not found', 404);
  }

  const subscriptionId = clubResult.rows[0].stripe_subscription_id;

  if (!subscriptionId) {
    throw new AppError('No active subscription found', 400);
  }

  try {
    // Cancel at period end (don't cancel immediately)
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    logger.info('Subscription marked for cancellation:', subscriptionId);

    return { success: true, message: 'Subscription will be cancelled at the end of the billing period' };
  } catch (error: any) {
    logger.error('Error cancelling subscription:', error);
    throw new AppError('Failed to cancel subscription', 500);
  }
};
