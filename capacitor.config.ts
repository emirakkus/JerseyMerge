import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Jersey Merge — Capacitor configuration.
 *
 * Recommended setup (accounts + global leaderboard need the Next.js backend):
 *   1. Deploy this app (with the database) to a host, e.g. Vercel + Neon.
 *   2. Build the web bundle with the public API base URL inlined:
 *        NEXT_PUBLIC_API_URL=https://your-app.vercel.app npm run build
 *   3. Point the webview at the deployed app:
 *        npx cap config set server.url https://your-app.vercel.app
 *
 * Guest mode works fully offline (progress in localStorage) even without a server.
 */
const config: CapacitorConfig = {
  appId: "com.jerseymerge.app",
  appName: "Jersey Merge",
  webDir: "out",
  server: {
    // Uncomment (or `npx cap config set server.url …`) to load the deployed
    // app instead of local web assets:
    // url: process.env.CAPACITOR_SERVER_URL,
    androidScheme: "https",
  },
  android: {
    backgroundColor: "#101d42",
  },
  ios: {
    backgroundColor: "#101d42",
    contentInset: "automatic",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 400,
      backgroundColor: "#101d42",
    },
  },
};

export default config;
