import { Platform } from 'react-native';
import { SubscriptionOffering } from '../types/paywall';

export const PRO_ENTITLEMENT_ID = 'pro_access';

let Purchases: any = null;
if (Platform.OS === 'ios' || Platform.OS === 'android') {
  try {
    Purchases = require('react-native-purchases').default || require('react-native-purchases');
  } catch {
    console.warn('[PurchaseService] Native Purchases module unavailable');
  }
}

const REVENUECAT_KEYS = {
  apple: 'appl_demo_key_pause_sip_shipathon',
  google: 'goog_demo_key_pause_sip_shipathon',
};

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

  /** Initialize RevenueCat SDK safely */
  static async initPurchases(): Promise<void> {
    if (PurchaseService.isInitialized) return;

    try {
      if ((Platform.OS === 'ios' || Platform.OS === 'android') && Purchases) {
        const apiKey = Platform.OS === 'ios' ? REVENUECAT_KEYS.apple : REVENUECAT_KEYS.google;
        if (Purchases.LOG_LEVEL) {
          await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
        }
        await Purchases.configure({ apiKey });
        PurchaseService.isInitialized = true;
      } else {
        console.warn('[PurchaseService] Web/Emulator platform. Using dev fallback adapter.');
      }
    } catch (error) {
      console.warn('[PurchaseService] Could not configure Purchases SDK:', error);
    }
  }

  /** Check if user has active Pro access entitlement */
  static async checkProEntitlement(): Promise<boolean> {
    if (PurchaseService.devBypassEnabled) {
      return true;
    }

    if (!PurchaseService.isInitialized || !Purchases) {
      return PurchaseService.devBypassEnabled;
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const entitlement = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID];
      return entitlement !== undefined && entitlement.isActive;
    } catch (error) {
      console.warn('[PurchaseService] Error fetching customer info:', error);
      return PurchaseService.devBypassEnabled;
    }
  }

  /** Fetch available Pro offerings */
  static async fetchProOfferings(): Promise<SubscriptionOffering[]> {
    const fallbackOfferings: SubscriptionOffering[] = [
      {
        id: 'monthly_pro',
        identifier: '$rc_monthly',
        title: 'Monthly Pro',
        description: 'Full desk companion access billed monthly.',
        priceString: '$1.99',
        period: 'monthly',
        isBestValue: false,
      },
      {
        id: 'lifetime_pro',
        identifier: '$rc_lifetime',
        title: 'Lifetime Access',
        description: 'One-time payment for perpetual Pro access.',
        priceString: '$9.99',
        period: 'lifetime',
        isBestValue: true,
      },
    ];

    if (!PurchaseService.isInitialized || !Purchases) {
      return fallbackOfferings;
    }

    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null && offerings.current.availablePackages.length > 0) {
        return PurchaseService.formatPackages(offerings.current);
      }
      return fallbackOfferings;
    } catch (error) {
      console.warn('[PurchaseService] Error fetching offerings:', error);
      return fallbackOfferings;
    }
  }

  /** Execute purchase for selected RevenueCat package */
  static async purchaseProPackage(packageId: string): Promise<boolean> {
    if (PurchaseService.devBypassEnabled) {
      return true;
    }

    if (!PurchaseService.isInitialized || !Purchases) {
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

      const targetPkg = currentOffering.availablePackages.find(
        (pkg: any) => pkg.identifier === packageId || pkg.product.identifier === packageId
      );

      if (!targetPkg) {
        PurchaseService.devBypassEnabled = true;
        return true;
      }

      const { customerInfo } = await Purchases.purchasePackage(targetPkg);
      const isPro = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
      return isPro;
    } catch (error: unknown) {
      console.warn('[PurchaseService] Purchase canceled or failed:', error);
      return false;
    }
  }

  /** Restore previous purchases */
  static async restorePurchases(): Promise<boolean> {
    if (!PurchaseService.isInitialized || !Purchases) {
      PurchaseService.devBypassEnabled = true;
      return true;
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      const isPro = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
      if (isPro) {
        PurchaseService.devBypassEnabled = true;
      }
      return isPro || PurchaseService.devBypassEnabled;
    } catch (error) {
      console.warn('[PurchaseService] Error restoring purchases:', error);
      return false;
    }
  }

  /** Helper to format RevenueCat packages */
  private static formatPackages(offering: any): SubscriptionOffering[] {
    return offering.availablePackages.map((pkg: any) => {
      const isLifetime = pkg.packageType === 'LIFETIME' || pkg.identifier.includes('lifetime');
      return {
        id: pkg.identifier,
        identifier: pkg.product.identifier,
        title: pkg.product.title || (isLifetime ? 'Lifetime Access' : 'Monthly Pro'),
        description: pkg.product.description || 'Full desk companion access.',
        priceString: pkg.product.priceString || (isLifetime ? '$9.99' : '$1.99'),
        period: isLifetime ? 'lifetime' : 'monthly',
        isBestValue: isLifetime,
      };
    });
  }
}
