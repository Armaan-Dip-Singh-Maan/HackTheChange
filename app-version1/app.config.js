import "dotenv/config";

export default {
  expo: {
    name: "",
    slug: "app-version1",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    iconWidth: 1000,
    scheme: "appversion1",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#000000",
        foregroundImage: "./assets/images/icon.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: "static",
      favicon: "./assets/images/icon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/icon.png",
          imageResizeMode: "contain",
          backgroundColor: "#4ade80",
          imageWidth: 1000,
          imageHeight: 1000,
          splashScreenScale: 2,
          dark: {
            backgroundColor: "#16a34a",
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      MAPBOX_TOKEN: process.env.EXPO_MAPBOX_PUBLIC_TOKEN,
      MAPBOX_PUBLIC_URL: process.env.EXPO_MAPBOX_PUBLIC_URL,
    },
  },
};
