import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { StatusBar, Style } from '@capacitor/status-bar'
import { Capacitor } from '@capacitor/core'
import './index.css'
import App from './App'

// Initialize StatusBar for native platforms
if (Capacitor.isNativePlatform()) {
  StatusBar.setBackgroundColor({ color: '#f8fafc' }).catch(() => {});
  StatusBar.setStyle({ style: Style.Light }).catch(() => {}); // Dark icons on light background
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

