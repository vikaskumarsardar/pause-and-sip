# 🧘‍♂️ Pause & Sip — Offline-First Desk Companion App

> **Built for RevenueCat Shipathon 2026**  
> *Targeting the RevenueCat Design Award, Idea to Income (Replit Track), and OneSignal Engagement Track.*

[![Expo SDK 51](https://img.shields.io/badge/Expo-SDK_51-000000?style=for-the-badge&logo=expo)](https://expo.dev)
[![React Native 0.74.5](https://img.shields.io/badge/React_Native-0.74.5-61DAFB?style=for-the-badge&logo=react)](https://reactnative.dev)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict_Zero_Any-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Expo Doctor](https://img.shields.io/badge/Expo_Doctor-17%2F17_Passing-10B981?style=for-the-badge)](https://expo.dev)
[![License MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**Pause & Sip** is a premium, offline-first desk companion mobile and web application designed to combat workplace burnout, cognitive fatigue, and dehydration. Built with a **Deep Slate Calm** neumorphic aesthetic, it combines a **60fps Reanimated 3** box breathing engine, multi-beverage hydration logging, RevenueCat Pro monetization, OneSignal push reminders, OLED theme customization, and cross-platform CSV/JSON data exports.

---

## 🎨 Design System & OLED Aesthetic Themes

Derived from `ui-ux-pro-max` design rules for React Native with dynamic theme support:

### 1. Aesthetic Theme Presets 🎨
| Theme Name | Theme ID | Background | Surface | Accent | Gating |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Deep Slate** | `deepSlate` | `#0B0F17` | `#161F2E` | `#38BDF8` | **Free Default** |
| **OLED True Black** | `oledBlack` | `#000000` | `#0E121B` | `#38BDF8` | **Pro 👑** |
| **Midnight Violet** | `midnightViolet` | `#0F0B1E` | `#1C1635` | `#818CF8` | **Pro 👑** |
| **Emerald Forest** | `emeraldForest` | `#071510` | `#12241C` | `#10B981` | **Pro 👑** |

### 2. Core Color Palette Tokens
| Token Name | Hex Code | Purpose & Usage |
| :--- | :--- | :--- |
| **Base Background** | `#0B0F17` | Deep slate backdrop across all screens |
| **Surface (Card/Sheet)** | `#161F2E` | Container cards with 1px border `#233044` |
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

### 3. Hardware & Touch Rules
- **Minimum Touch Target**: Strictly enforced `48x48dp` across all buttons, tab items, and interactive controls.
- **Safe Area Insets**: Full layout padding protection using `react-native-safe-area-context`.
- **Iconography**: Clean vector icons exclusively from `lucide-react-native`.

---

## ⚡ Technical Architecture & Core Modules

### 1. 60fps Reanimated 3 Breathing Engine (`src/components/BreathingVisualizer.tsx`)
- **UI Thread Animations**: Uses `react-native-reanimated` (v3+) shared values (`scale`, `ringOpacity`, `rotation`) driven on the UI thread for zero-jank 60fps performance.
- **Breathing Rhythms & Pro Gating**:
  - **Free**: Box 4-4-4-4, Sigh 2-1-6, 2-0-2 Energy.
  - **Pro 👑**: 4-7-8 Relax, 7-11 Anti-Anxiety, 5-5 Coherence.
- **Custom Breathing Rhythm CRUD Modal**: Allows Pro users to create and save custom inhale/hold/exhale timing presets.
- **Multi-Soundscapes & Audio FX**:
  - Free soundscapes: Waterfall, Rainfall, Ocean Surf.
  - Pro soundscapes 👑: Cozy Fire, Forest Wind, 528Hz Solfeggio Miracle, 432Hz Alpha Waves.
  - Custom Audio FX upload modal (`+ Audio FX`) 👑.
- **Phase Crossfade & Clean Timer**: Smooth 400ms phase action text crossfading, with static countdown displays (`4s`, `3s`, `2s`, `1s`) eliminating text shaking.

### 2. Hydration Pro & Multi-Beverage Tracking (`App.tsx` & `src/types/index.ts`)
- **Beverage Types & Efficiency Factors**:
  - **Pure Water** (`1.0x` hydration factor) — Free.
  - **Herbal Tea** (`0.9x` hydration factor) — Pro 👑.
  - **Electrolytes** (`1.15x` hydration factor) — Pro 👑.
  - **Desk Coffee** (`0.7x` hydration factor) — Pro 👑.
- **7-Day Desk Hydration History Chart**: Interactive 7-day column bar chart tracking daily hydration progress (Pro interactive prompt 👑).

### 3. RevenueCat Monetization & Paywall (`src/services/purchases.ts` & `src/components/PaywallModal.tsx`)
- **Platform-Safe Bridges**: Platform-specific extensions (`purchases.web.ts` and `purchases.native.ts`) preventing native `TurboModuleRegistry` crashes on web.
- **Entitlement Tracking**: Queries customer info for active `'pro_access'` entitlement.
- **Offerings**: Monthly (`$1.99/mo` with 7-day trial) and Lifetime (`$9.99` one-time) packages.
- **Paywall Sheet**: Bottom-sheet paywall with feature cards, gold `#FBBF24` **`BEST VALUE`** badge, and **Dev Sandbox Toggle** for instant developer testing.

### 4. OneSignal Push Reminders & Custom Intervals (`src/services/notifications.ts`)
- **Notification Manager**: Platform-safe wrapper for `react-native-onesignal` (`notifications.web.ts` and `notifications.native.ts`).
- **Frequency Interval Selector**:
  - `15m Express` 👑, `30m Focus` 👑, `45m Standard` (Free), `60m Deep Work` 👑, `90m Cycle` 👑.

### 5. Cross-Platform Data Export (`src/services/export.ts`)
- **Web Platform**: Generates Blob links and triggers browser file download.
- **Native Android / iOS**: Saves file to `FileSystem.documentDirectory` and launches native Share & Save dialog via `expo-sharing` (`Sharing.shareAsync`).
- Supports **CSV Data Export** and **JSON Full Backup** 👑.

---

## 📂 Project Directory Map

```
pause-and-sleep/
├── App.tsx                        # Root layout, theme engine, hydration tracking & Paywall Modal
├── app.json                       # Expo SDK 51 app manifest
├── eas.json                       # EAS Build config (preview APK & production AAB profiles)
├── package.json                   # Dependencies & build scripts
├── tsconfig.json                  # Strict TypeScript configuration (~5.3.3)
├── babel.config.js                # Babel preset + module-resolver + Reanimated plugin
├── assets/                        # App icons, splash screen, and store PNG assets
└── src/
    ├── components/
    │   ├── BreathingVisualizer.tsx # 60fps Reanimated 3 box breathing & soundscape component
    │   └── PaywallModal.tsx        # RevenueCat bottom sheet paywall modal
    ├── theme/
    │   ├── colors.ts               # Deep Slate Calm color tokens
    │   ├── spacing.ts              # Spacing grid & 48x48dp touch target rules
    │   ├── typography.ts           # Text hierarchy styles
    │   └── index.ts                # Unified theme engine export
    ├── types/
    │   ├── index.ts                # Domain types (Beverages, Themes, Intervals, Soundscapes)
    │   ├── water.ts                # WaterLog, daily target & unit types
    │   ├── breath.ts               # BreathPhase, BreathPattern & session log types
    │   ├── user.ts                 # UserStreak & DeskSettings types
    │   └── paywall.ts              # RevenueCat entitlement & offering types
    └── services/
        ├── storage.ts              # AsyncStore typed local persistence
        ├── haptics.ts              # Expo-haptics tactile feedback service
        ├── audio.ts                # Platform-safe audio manager (web / native)
        ├── purchases.ts            # Platform-safe RevenueCat purchase service
        ├── notifications.ts        # Platform-safe OneSignal push reminder service
        └── export.ts               # Cross-platform CSV/JSON export service (FileSystem & Sharing)
```

---

## 🏆 Hackathon Track Alignment

| Hackathon Track | Alignment & Implementation |
| :--- | :--- |
| **RevenueCat Design Award** | Neumorphic Deep Slate Calm & OLED dark mode UI, smooth 60fps Reanimated 3 orb scale animations, custom gold paywall bottom sheet modal with offering cards. |
| **Idea to Income (Replit Track)** | Complete offline-first execution, instant dev sandbox bypass toggle, standalone local persistence, cross-platform export, and web preview compatibility. |
| **OneSignal Push Track** | Integrated OneSignal SDK manager handling scheduled micro-break push notification tags and custom frequency interval selection. |

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
npm install
```

### Running Locally
```bash
# Start Web Development Server (Live Preview on http://localhost:8081)
npx expo start --web --port 8081

# Run on Android Emulator or Device
npx expo start --android

# Run TypeScript compilation check
npm run check-types

# Run Expo Doctor check
npx expo-doctor
```

### Building APK / AAB
```bash
# Build Android Preview APK
npm run build:apk

# Build Android Production AAB
npm run build:aab
```

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

Developed by **[vikaskumarsardar](https://github.com/vikaskumarsardar)** for RevenueCat Shipathon 2026.
