# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# react-native-webview — required for WebView to work in release builds
-keep class com.reactnativecommunity.webview.** { *; }
-keepclassmembers class com.reactnativecommunity.webview.** { *; }

# Keep RCTWebViewManager and related classes
-keep class com.reactnativecommunity.webview.RCTWebViewManager { *; }
-keep class com.reactnativecommunity.webview.RCTWebViewManager$* { *; }

# Add any project specific keep options here:
