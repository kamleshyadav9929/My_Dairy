import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

/**
 * Hook to handle Android hardware back button properly.
 * - Navigates back in history if possible
 * - Minimizes app instead of closing on root pages
 * - Prevents accidental app closure
 */
export const useAndroidBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBackButton = useCallback(async () => {
    // Root pages where double-tap should minimize instead of navigate
    const rootPaths = [
      '/customer/dashboard',
      '/customer',
      '/',
      '/login'
    ];

    const isRootPage = rootPaths.some(path => 
      location.pathname === path || 
      (path === '/customer' && location.pathname === '/customer/dashboard')
    );

    // Check if we can go back in browser history
    if (window.history.length > 1 && !isRootPage) {
      // Navigate back using React Router
      navigate(-1);
    } else {
      // On root page - minimize app instead of closing
      await App.minimizeApp();
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    // Only add listener on native platforms
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // Add back button listener
    const listener = App.addListener('backButton', ({ canGoBack }) => {
      // If we can exit (Android allows it), handle it
      if (canGoBack) {
        handleBackButton();
      } else {
        // On root of app, minimize instead of exit
        App.minimizeApp();
      }
    });

    // Cleanup on unmount
    return () => {
      listener.then(handle => handle.remove());
    };
  }, [handleBackButton]);
};

export default useAndroidBackButton;
