export default {
  expo: {
    name: "TheraHome",
    slug: "therahome-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "vn.therahome.app",
      buildNumber: "1",
      infoPlist: {
        NSUserTrackingUsageDescription: "Ứng dụng cần quyền này để cải thiện trải nghiệm của bạn",
        LSApplicationQueriesSchemes: ["https", "http"]
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "vn.therahome.app",
      versionCode: 1,
      permissions: [
        "CAMERA",
        "NOTIFICATIONS"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#2563eb"
        }
      ],
      [
        "expo-camera",
        {
          cameraPermission: "Ứng dụng cần quyền camera để quét mã QR kích hoạt thiết bị"
        }
      ]
    ],
    scheme: "therahome",
    extra: {
      eas: {
        projectId: "your-project-id"
      }
    }
  }
};
