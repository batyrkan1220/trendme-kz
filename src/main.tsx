import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { isNativePlatform, initNativeApp } from "./lib/native";

// Mark body for native-specific CSS
if (isNativePlatform) {
  document.body.classList.add("native-app");
}

createRoot(document.getElementById("root")!).render(<App />);

// Initialize native app settings
initNativeApp();

// Register service worker only on web (not in native app)
if (!isNativePlatform && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  });
}
