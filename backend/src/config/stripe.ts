import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export const STRIPE_PLANS = {
  basic: {
    priceId: process.env.STRIPE_BASIC_PRICE_ID || '',
    name: 'Basic',
    price: 49,
    maxMembers: 500,
    maxDevices: 1,
    features: {
      promotions: 3,
      events: true,
      notifications: false,
      analytics: 'basic',
      pos_integration: false,
      gamification: false,
      sms: false,
    },
  },
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID || '',
    name: 'Pro',
    price: 149,
    maxMembers: 2500,
    maxDevices: 5,
    features: {
      promotions: 10,
      events: true,
      notifications: true,
      analytics: 'advanced',
      pos_integration: true,
      gamification: true,
      sms: false,
    },
  },
  premium: {
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID || '',
    name: 'Premium',
    price: 349,
    maxMembers: 10000,
    maxDevices: -1, // unlimited
    features: {
      promotions: -1, // unlimited
      events: true,
      notifications: true,
      analytics: 'bi',
      pos_integration: true,
      gamification: true,
      sms: true,
    },
  },
};

export default stripe;
