package com.mydairy.customer;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Enable hardware acceleration
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
        );
        
        super.onCreate(savedInstanceState);
        
        // Optimize WebView after it's created
        optimizeWebView();
    }
    
    private void optimizeWebView() {
        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                WebSettings settings = webView.getSettings();
                
                // Performance optimizations
                settings.setRenderPriority(WebSettings.RenderPriority.HIGH);
                settings.setCacheMode(WebSettings.LOAD_DEFAULT);
                settings.setDomStorageEnabled(true);
                settings.setDatabaseEnabled(true);
                
                // Hardware acceleration for WebView
                webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
                
                // Enable smooth scrolling
                webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
                webView.setVerticalScrollBarEnabled(false);
                webView.setHorizontalScrollBarEnabled(false);
                
                // Enable GPU rendering
                settings.setAllowContentAccess(true);
                settings.setAllowFileAccess(true);
                
                // Optimize media
                settings.setMediaPlaybackRequiresUserGesture(false);
            }
        } catch (Exception e) {
            // WebView optimization failed, continue normally
            e.printStackTrace();
        }
    }
    
    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            // Enable immersive mode for a native feel
            hideSystemUI();
        }
    }
    
    private void hideSystemUI() {
        // Use full-screen immersive sticky mode
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        );
    }
}

