import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PixelSettings {
  ga_id?: string;
  fb_pixel_id?: string;
  tiktok_pixel_id?: string;
}

export function TrackingPixels() {
  const location = useLocation();
  const { data: settings } = useQuery<PixelSettings>({
    queryKey: ["tracking-pixel-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("trend_settings")
        .select("key, value")
        .in("key", ["ga_id", "fb_pixel_id", "tiktok_pixel_id"]);

      const result: PixelSettings = {};
      data?.forEach((row) => {
        result[row.key as keyof PixelSettings] = String(row.value ?? "").replace(/"/g, "");
      });
      return result;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Google Analytics
  useEffect(() => {
    if (!settings?.ga_id) return;
    const id = settings.ga_id;
    if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${id}"]`)) return;

    const script = document.createElement("script");
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    script.async = true;
    document.head.appendChild(script);

    const inline = document.createElement("script");
    inline.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${id}');
    `;
    document.head.appendChild(inline);
  }, [settings?.ga_id]);

  // Facebook Pixel
  useEffect(() => {
    if (!settings?.fb_pixel_id) return;
    const id = settings.fb_pixel_id;
    if ((window as any).fbq) return;

    const inline = document.createElement("script");
    inline.textContent = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${id}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(inline);
  }, [settings?.fb_pixel_id]);

  // TikTok Pixel
  useEffect(() => {
    if (!settings?.tiktok_pixel_id) return;
    const id = settings.tiktok_pixel_id;
    if ((window as any).ttq) return;

    const inline = document.createElement("script");
    inline.textContent = `
      !function (w, d, t) {
        w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var a=document.createElement("script");a.type="text/javascript",a.async=!0,a.src=r+"?sdkid="+e+"&lib="+t;var s=document.getElementsByTagName("script")[0];s.parentNode.insertBefore(a,s)};
        ttq.load('${id}');
        ttq.page();
      }(window, document, 'ttq');
    `;
    document.head.appendChild(inline);
  }, [settings?.tiktok_pixel_id]);

  // SPA virtual pageview tracking
  useEffect(() => {
    const dl = (window as any).dataLayer = (window as any).dataLayer || [];
    dl.push({
      event: "virtual_pageview",
      page_path: location.pathname + location.search,
      page_title: document.title,
    });

    // GA direct
    if ((window as any).gtag) {
      (window as any).gtag("event", "page_view", { page_path: location.pathname + location.search });
    }
    // FB Pixel
    if ((window as any).fbq) {
      (window as any).fbq("track", "PageView");
    }
    // TikTok Pixel
    if ((window as any).ttq) {
      (window as any).ttq.page();
    }
  }, [location.pathname, location.search]);

  return null;
}

// Plausible Analytics helper — skips admin pages
//
// Dev debug mode: when enabled, events are logged to the console and NOT sent.
// Toggle from devtools console:
//   localStorage.setItem('plausible_debug', '1')   // enable
//   localStorage.removeItem('plausible_debug')      // disable
// Auto-enabled in dev (import.meta.env.DEV) unless explicitly set to '0'.
function isPlausibleDebug(): boolean {
  try {
    if (typeof window === "undefined") return false;
    const ls = window.localStorage?.getItem("plausible_debug");
    if (ls === "1") return true;
    if (ls === "0") return false;
    return Boolean((import.meta as any).env?.DEV);
  } catch {
    return false;
  }
}

export function trackPlausible(event: string, props?: Record<string, string | number | boolean>) {
  try {
    if (typeof window === "undefined") return;
    if (window.location.pathname.startsWith("/admin")) return;
    if (isPlausibleDebug()) {
      // eslint-disable-next-line no-console
      console.log("%c[plausible:debug]", "color:#7c3aed;font-weight:bold", event, props ?? {});
      return;
    }
    const p = (window as any).plausible;
    if (typeof p === "function") {
      props ? p(event, { props }) : p(event);
    }
  } catch {
    // no-op
  }
}

// Helper to fire conversion events from anywhere
export function trackRegistrationEvent() {
  trackPlausible("Register");
  // GTM dataLayer
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push({ event: "sign_up", method: "email" });

  // Google Analytics (direct)
  if ((window as any).gtag) {
    (window as any).gtag("event", "sign_up", { method: "email" });
  }
  // Facebook Pixel
  if ((window as any).fbq) {
    (window as any).fbq("track", "CompleteRegistration");
  }
  // TikTok Pixel
  if ((window as any).ttq) {
    (window as any).ttq.track("CompleteRegistration");
  }
}

export function trackPurchaseEvent(planName: string, amount: number) {
  const dl = (window as any).dataLayer = (window as any).dataLayer || [];
  dl.push({ event: "purchase", currency: "KZT", value: amount, items: [{ item_name: planName }] });
  if ((window as any).gtag) (window as any).gtag("event", "purchase", { currency: "KZT", value: amount, items: [{ item_name: planName }] });
  if ((window as any).fbq) (window as any).fbq("track", "Purchase", { currency: "KZT", value: amount });
  if ((window as any).ttq) (window as any).ttq.track("PlaceAnOrder", { content_name: planName, value: amount, currency: "KZT" });
}

// ViewContent — видео карточкасын ашқанда
export function trackViewContent(contentName: string, contentCategory?: string) {
  const dl = (window as any).dataLayer = (window as any).dataLayer || [];
  dl.push({ event: "view_content", content_name: contentName, content_category: contentCategory });
  if ((window as any).gtag) (window as any).gtag("event", "view_item", { item_name: contentName, item_category: contentCategory });
  if ((window as any).fbq) (window as any).fbq("track", "ViewContent", { content_name: contentName, content_category: contentCategory });
  if ((window as any).ttq) (window as any).ttq.track("ViewContent", { content_name: contentName, content_category: contentCategory });
}

// Search — іздеу жасағанда
export function trackSearchEvent(searchTerm: string) {
  const dl = (window as any).dataLayer = (window as any).dataLayer || [];
  dl.push({ event: "search", search_term: searchTerm });
  if ((window as any).gtag) (window as any).gtag("event", "search", { search_term: searchTerm });
  if ((window as any).fbq) (window as any).fbq("track", "Search", { search_string: searchTerm });
  if ((window as any).ttq) (window as any).ttq.track("Search", { query: searchTerm });
}

// InitiateCheckout — тариф таңдағанда
export function trackInitiateCheckout(planName: string, amount: number) {
  const dl = (window as any).dataLayer = (window as any).dataLayer || [];
  dl.push({ event: "begin_checkout", currency: "KZT", value: amount, items: [{ item_name: planName }] });
  if ((window as any).gtag) (window as any).gtag("event", "begin_checkout", { currency: "KZT", value: amount, items: [{ item_name: planName }] });
  if ((window as any).fbq) (window as any).fbq("track", "InitiateCheckout", { currency: "KZT", value: amount, content_name: planName });
  if ((window as any).ttq) (window as any).ttq.track("InitiateCheckout", { content_name: planName, value: amount, currency: "KZT" });
}

// AddToWishlist — видеоны таңдаулыларға қосқанда
export function trackAddToFavorites(contentName: string) {
  const dl = (window as any).dataLayer = (window as any).dataLayer || [];
  dl.push({ event: "add_to_wishlist", content_name: contentName });
  if ((window as any).gtag) (window as any).gtag("event", "add_to_wishlist", { items: [{ item_name: contentName }] });
  if ((window as any).fbq) (window as any).fbq("track", "AddToWishlist", { content_name: contentName });
  if ((window as any).ttq) (window as any).ttq.track("AddToWishlist", { content_name: contentName });
}
