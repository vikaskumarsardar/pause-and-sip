import { SubscriptionOffering, PAYWALL_PLAN, PACKAGE_ID, REVENUECAT_KEYS } from '@/types';

export const PRO_ENTITLEMENT_ID = REVENUECAT_KEYS.PRO_ENTITLEMENT_ID;

const FALLBACK_PRICES = {
  MONTHLY: '$1.99',
  LIFETIME: '$9.99',
} as const;

export class PurchaseService {
  private static isInitialized: boolean = false;
  private static devBypassEnabled: boolean = false;

  /** Enable or disable dev-mode sandbox bypass for testing */
  static setDevSandboxBypass(enabled: boolean): void {
    PurchaseService.devBypassEnabled = enabled;
  }

  /** Check if dev-mode sandbox bypass is currently active */
  static getDevSandboxBypass(): boolean {
    return PurchaseService.devBypassEnabled;
  }

  /** Web adapter init */
  static async initPurchases(): Promise<void> {
    console.log('[PurchaseService Web] Web dev sandbox adapter active.');
    PurchaseService.isInitialized = true;
  }

  /** Check Pro entitlement on Web */
  static async checkProEntitlement(): Promise<boolean> {
    return PurchaseService.devBypassEnabled;
  }

  /** Fetch Pro offerings for Web */
  static async fetchProOfferings(): Promise<SubscriptionOffering[]> {
    return [
      {
        id: PACKAGE_ID.MONTHLY_PRO,
        identifier: PACKAGE_ID.RC_MONTHLY,
        title: 'Monthly Pro',
        description: 'Full desk companion access billed monthly.',
        priceString: FALLBACK_PRICES.MONTHLY,
        period: PAYWALL_PLAN.MONTHLY,
        isBestValue: false,
      },
      {
        id: PACKAGE_ID.LIFETIME_PRO,
        identifier: PACKAGE_ID.RC_LIFETIME,
        title: 'Lifetime Access',
        description: 'One-time payment for perpetual Pro access.',
        priceString: FALLBACK_PRICES.LIFETIME,
        period: PAYWALL_PLAN.LIFETIME,
        isBestValue: true,
      },
    ];
  }

  /** Purchase Pro package on Web (Dev Sandbox) */
  static async purchaseProPackage(_packageId: string): Promise<boolean> {
    PurchaseService.devBypassEnabled = true;
    return true;
  }

  /** Restore purchases on Web */
  static async restorePurchases(): Promise<boolean> {
    PurchaseService.devBypassEnabled = true;
    return true;
  }
}
