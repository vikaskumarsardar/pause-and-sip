export type EntitlementStatus = 'free' | 'pro';

export interface SubscriptionOffering {
  id: string;
  identifier: string;
  title: string;
  description: string;
  priceString: string;
  period: 'monthly' | 'annual' | 'lifetime';
  isBestValue?: boolean;
}

export interface PaywallState {
  isPro: boolean;
  activeEntitlement: EntitlementStatus;
  offerings: SubscriptionOffering[];
  isLoading: boolean;
  error: string | null;
}
