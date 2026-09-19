# 🧘‍♂️ Pause & Sip — Offline-First Desk Companion App

> **Built for RevenueCat Shipathon 2026**  
> *Targeting the RevenueCat Design Award, Idea to Income (Replit Track), and OneSignal Engagement Track.*

[![Expo SDK 51](https://img.shields.io/badge/Expo-SDK_51-000000?style=for-the-badge&logo=expo)](https://expo.dev)
[![React Native 0.74.5](https://img.shields.io/badge/React_Native-0.74.5-61DAFB?style=for-the-badge&logo=react)](https://reactnative.dev)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict_Zero_Any-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![License MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**Pause & Sip** is a premium, offline-first desk companion mobile and web application designed to combat workplace burnout, cognitive fatigue, and dehydration. Built with a **Deep Slate Calm** neumorphic aesthetic, it combines a **60fps Reanimated 3** box breathing engine, offline hydration tracking, RevenueCat Pro monetization, and OneSignal push reminders.

---

## 🎨 Design System: Deep Slate Calm

Derived from `ui-ux-pro-max` design rules for React Native:

### Color Palette Tokens
| Token Name | Hex Code | Purpose & Usage |
| :--- | :--- | :--- |
| **Base Background** | `#0B0F17` | Deep slate backdrop across all screens |
| **Surface (Card/Sheet)** | `#161F2E` | Elevated container cards with 1px border `#233044` |
| **Surface Elevated** | `#1E2B3E` | Highlighted active container states |
| **Border Color** | `#233044` | 1px clean card and divider lines |
| **Water Accent** | `#38BDF8` | Fluid sky blue for hydration progress bars and badges |
| **Breath Inhale** | `#10B981` | Soft emerald glow during inhale phase |
| **Breath Exhale** | `#818CF8` | Gentle periwinkle glow during exhale phase |
| **Breath Hold** | `#F59E0B` | Soft amber glow during breath-holding nodes |
| **Pro Gold Accent** | `#FBBF24` | Gold styling for RevenueCat Pro badges and paywall CTAs |
| **Primary Title** | `#F0F6FC` | High-contrast title text |
| **Body Text** | `#8B949E` | Secondary body text |
| **Muted Text** | `#484F58` | Subdued metadata and captions |

### Hardware & Touch Rules
- **Minimum Touch Target**: Strictly enforced `48x48dp` across all buttons, tab items, and interactive controls.
- **Safe Area Insets**: Full layout padding protection using `react-native-safe-area-context`.
- **Iconography**: Clean vector icons exclusively from `lucide-react-native`.

---

## ⚡ Technical Architecture & Core Modules

### 1. 60fps Reanimated 3 Breathing Engine (`src/components/BreathingVisualizer.tsx`)
- **UI Thread Animations**: Uses `react-native-reanimated` (v3+) shared values (`scale`, `ringOpacity`, `auraRotation`) driven on the UI thread for zero-jank 60fps performance.
- **4-4-4-4 Box Breathing Cycle**:
  - **Inhale** (4s): Orb scales from `0.45x` to `1.0x` with Emerald (`#10B981`) aura.
  - **Hold In** (4s): Soft Amber (`#F59E0B`) pulsing aura with countdown timer.
  - **Exhale** (4s): Orb contracts smoothly to `0.45x` with Periwinkle (`#818CF8`) aura.
  - **Rest / Hold Out** (4s): Slate (`#64748B`) resting aura.
- **Tactile Haptic Feedback**: Invokes `expo-haptics` (`Light` impact) on every phase transition boundary using `runOnJS`.
- **SVG Radial Glow**: Uses `react-native-svg` (`RadialGradient`, `Defs`, `Circle`) to project ambient lighting behind the orb.

### 2. RevenueCat Monetization & Paywall (`src/services/purchases.ts` & `src/components/PaywallModal.tsx`)
- **RevenueCat SDK Bridge**: Wrapped in `PurchaseService` with platform-safe dynamic module loading for seamless web, simulator, iOS, and Android execution.
- **Entitlement Check**: Queries customer info for active `'pro_access'` entitlement.
- **Offerings & Packages**: Fetches Monthly (`$1.99/mo`) and Lifetime (`$9.99` one-time) offerings formatted for UI presentation.
- **Polished Paywall Bottom Sheet**:
  - Pro features list (Advanced Breath Pacing, Ambient Focus Soundscapes, OLED Dark Themes).
  - Plan selector cards with gold `#FBBF24` **`BEST VALUE`** badge.
  - `Start 7-Day Free Trial` / `Unlock Lifetime Access` CTA button.
  - `Restore Purchases` and `Terms & Privacy` actions.
  - **Dev Sandbox Toggle**: Built-in developer bypass switch enabling instant Pro unlock during testing.

### 3. OneSignal Push Engagement (`src/services/notifications.ts`)
- **Notification Manager**: Platform-safe wrapper for `react-native-onesignal`.
- **Automated Break Scheduling**: Configures recurring 45-minute desk micro-break reminders (`desk_reminder_interval`) prompting users to pause, breathe, and hydrate.

### 4. Offline-First Storage Layer (`src/services/storage.ts`)
- Strongly typed AsyncStore wrapper using `@react-native-async-storage/async-storage`.
- Persists water intake logs, streak days, daily target preferences, and desk break schedules locally.

### 5. Haptic & Audio Controllers (`src/services/haptics.ts` & `src/services/audio.ts`)
- Tactile feedback wrapper supporting light, medium, heavy impact, selection ticks, and notification feedback.
- Audio manager wrapping `expo-av` for ambient desk focus soundscapes.

---

## 📂 Project Directory Map

```
pause-and-sleep/
├── App.tsx                        # Root layout, Safe Area Provider, tab switcher & Paywall Modal
├── app.json                       # Expo SDK 51 app manifest
├── package.json                   # Dependencies & scripts
├── tsconfig.json                  # Strict TypeScript configuration (zero any)
├── babel.config.js                # Babel preset + module-resolver + Reanimated plugin
├── assets/                        # App icons, splash screen, and favicon fallback PNGs
└── src/
    ├── components/
    │   ├── BreathingVisualizer.tsx # 60fps Reanimated 3 box breathing component
    │   └── PaywallModal.tsx        # RevenueCat bottom sheet paywall modal
    ├── theme/
    │   ├── colors.ts               # Deep Slate Calm color tokens
    │   ├── spacing.ts              # Spacing grid & 48x48dp touch target rules
    │   ├── typography.ts           # Text hierarchy styles
    │   └── index.ts                # Unified theme engine export
    ├── types/
    │   ├── index.ts                # Unified domain types export
    │   ├── water.ts                # WaterLog, daily target & unit types
    │   ├── breath.ts               # BreathPhase, BreathPattern & session log types
    │   ├── user.ts                 # UserStreak & DeskSettings types
    │   └── paywall.ts              # RevenueCat entitlement & offering types
    └── services/
        ├── storage.ts              # AsyncStore typed local persistence
        ├── haptics.ts              # Expo-haptics tactile feedback service
        ├── audio.ts                # Expo-av soundscape audio manager
        ├── purchases.ts            # RevenueCat purchase & entitlement service
        └── notifications.ts        # OneSignal push notification manager
```

---

## 🏆 Hackathon Track Alignment

| Hackathon Track | Alignment & Implementation |
| :--- | :--- |
| **RevenueCat Design Award** | Neumorphic Deep Slate Calm dark mode UI, smooth 60fps Reanimated 3 orb scale animations, custom gold paywall bottom sheet modal with offering cards. |
| **Idea to Income (Replit Track)** | Complete offline-first execution, instant dev sandbox bypass toggle, standalone local persistence, and web preview compatibility. |
| **OneSignal Push Track** | Integrated OneSignal SDK manager handling scheduled micro-break push notification tags. |

---

## 🚀 Local Setup & Execution Guide

### Prerequisites
- Node.js `v18+` or `v22+`
- npm `v10+`

### Installation
```bash
# Clone the repository
git clone https://github.com/vikaskumarsardar/pause-and-sip.git
cd pause-and-sip

# Install dependencies
npm install --legacy-peer-deps
```

### Running Locally
```bash
# Start Web Development Server (Live Preview on http://localhost:8081)
npx expo start --web --port 8081

# Run on Android Emulator or Device
npx expo start --android

# Run TypeScript compilation check
npm run tsc
```

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

Developed by **[vikaskumarsardar](https://github.com/vikaskumarsardar)** for RevenueCat Shipathon 2026.
