import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.foodwise.app",
  appName: "FoodWise",
  webDir: ".next",

  server: {
    androidScheme: "https",
  },
};

export default config;