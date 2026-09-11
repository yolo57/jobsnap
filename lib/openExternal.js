// Inside the native iOS/Android app, Stripe Checkout must NOT render inside
// the app's own WebView — Apple rejects apps that run third-party payment
// UI in-app for digital subscriptions (guideline 3.1.1). Opening it in the
// system browser (Safari/Chrome) instead keeps the purchase fully outside
// the app's UI, which is allowed. On the regular website this just behaves
// like a normal same-tab redirect.
//
// `window.Capacitor` is injected automatically by Capacitor into every page
// it loads, so this works without adding any new native plugin/build.
export function openExternal(url) {
  const isNative = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();
  if (isNative) {
    window.open(url, '_system');
  } else {
    window.location.href = url;
  }
}
