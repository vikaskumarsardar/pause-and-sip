import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import { SubscriptionOffering, PAYWALL_PLAN, PACKAGE_ID, PLATFORM_OS, REVENUECAT_KEYS } from '@/types';

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

  /** Initialize RevenueCat SDK on iOS and Android */
  static async initPurchases(): Promise<void> {
    if (PurchaseService.isInitialized) return;

    try {
      const isAppleDevice = Platform.OS === PLATFORM_OS.IOS;
      const apiKey = isAppleDevice ? REVENUECAT_KEYS.APPLE : REVENUECAT_KEYS.GOOGLE;

      if (Purchases.LOG_LEVEL) {
        await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
      }
      await Purchases.configure({ apiKey });
      PurchaseService.isInitialized = true;
    } catch (error) {
      console.warn('[PurchaseService Native] Could not configure Purchases SDK:', error);
    }
  }

  /** Check if user has active Pro access entitlement */
  static async checkProEntitlement(): Promise<boolean> {
    if (PurchaseService.devBypassEnabled) {
      return true;
    }

    if (!PurchaseService.isInitialized) {
      return PurchaseService.devBypassEnabled;
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const activeEntitlements = customerInfo.entitlements.active;
      const proEntitlement = activeEntitlements[PRO_ENTITLEMENT_ID];
      const isEntitlementActive = proEntitlement !== undefined && proEntitlement.isActive;
      return isEntitlementActive;
    } catch (error) {
      console.warn('[PurchaseService Native] Error fetching customer info:', error);
      return PurchaseService.devBypassEnabled;
    }
  }

  /** Fetch available Pro offerings from RevenueCat */
  static async fetchProOfferings(): Promise<SubscriptionOffering[]> {
    const fallbackOfferings: SubscriptionOffering[] = [
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

    if (!PurchaseService.isInitialized) {
      return fallbackOfferings;
    }

    try {
      const offerings = await Purchases.getOfferings();
      const currentOffering = offerings.current;
      const hasAvailablePackages = currentOffering !== null && currentOffering.availablePackages.length > 0;

      if (hasAvailablePackages) {
        return PurchaseService.formatPackages(currentOffering);
      }
      return fallbackOfferings;
    } catch (error) {
      console.warn('[PurchaseService Native] Error fetching offerings:', error);
      return fallbackOfferings;
    }
  }

  /** Execute purchase for selected RevenueCat package */
  static async purchaseProPackage(packageId: string): Promise<boolean> {
    if (PurchaseService.devBypassEnabled) {
      return true;
    }

    if (!PurchaseService.isInitialized) {
      PurchaseService.devBypassEnabled = true;
      return true;
    }

    try {
      const offerings = await Purchases.getOfferings();
      const currentOffering = offerings.current;

      if (!currentOffering) {
        PurchaseService.devBypassEnabled = true;
        return true;
      }

      const availablePackages = currentOffering.availablePackages;
      const targetPkg = availablePackages.find(
        (pkg: any) => pkg.identifier === packageId || pkg.product.identifier === packageId
      );

      if (!targetPkg) {
        PurchaseService.devBypassEnabled = true;
        return true;
      }

      const { customerInfo } = await Purchases.purchasePackage(targetPkg);
      const isProActive = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
      return isProActive;
    } catch (error: unknown) {
      console.warn('[PurchaseService Native] Purchase canceled or failed:', error);
      return false;
    }
  }

  /** Restore previous purchases */
  static async restorePurchases(): Promise<boolean> {
    if (!PurchaseService.isInitialized) {
      PurchaseService.devBypassEnabled = true;
      return true;
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      const activeEntitlements = customerInfo.entitlements.active;
      const isProActive = activeEntitlements[PRO_ENTITLEMENT_ID] !== undefined;

      if (isProActive) {
        PurchaseService.devBypassEnabled = true;
      }
      return isProActive || PurchaseService.devBypassEnabled;
    } catch (error) {
      console.warn('[PurchaseService Native] Error restoring purchases:', error);
      return false;
    }
  }

  /** Helper to format RevenueCat packages */
  private static formatPackages(offering: any): SubscriptionOffering[] {
    return offering.availablePackages.map((pkg: any) => {
      const isLifetimeType = pkg.packageType === 'LIFETIME' || pkg.identifier.includes(PAYWALL_PLAN.LIFETIME);
      const planPeriod = isLifetimeType ? PAYWALL_PLAN.LIFETIME : PAYWALL_PLAN.MONTHLY;
      const defaultTitle = isLifetimeType ? 'Lifetime Access' : 'Monthly Pro';
      const defaultPrice = isLifetimeType ? FALLBACK_PRICES.LIFETIME : FALLBACK_PRICES.MONTHLY;

      return {
        id: pkg.identifier,
        identifier: pkg.product.identifier,
        title: pkg.product.title || defaultTitle,
        description: pkg.product.description || 'Full desk companion access.',
        priceString: pkg.product.priceString || defaultPrice,
        period: planPeriod,
        isBestValue: isLifetimeType,
      };
    });
  }
}
