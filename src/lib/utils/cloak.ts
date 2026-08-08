import { isEnvDevPublic } from "$lib/state/DevTools.svelte";

export function autoTabCloak() {
    if (isEnvDevPublic) return;
    if (window.self !== window.top) return;

    const url = window.location.href;

    const win = window.open("about:blank", "_blank");
    if (!win) {
        console.warn("Popup blocked. Cannot auto-cloak.");
        return;
    }

    const iframe = win.document.createElement("iframe");
    iframe.style.cssText =
        "position:fixed;width:100vw;height:100vh;top:0;left:0;right:0;bottom:0;z-index:2147483647;background-color:white;border:none;margin:0;padding:0;";

    iframe.src = url;

    win.document.body.style.margin = "0";
    win.document.body.style.padding = "0";
    win.document.body.appendChild(iframe);

    // Retrieve user preference from localStorage, default to Clever
    const savedRedirect = localStorage.getItem("cloak_redirect_url") || "https://clever.com";

    // Normalize URL to ensure http/https prefix
    let targetUrl = savedRedirect.trim();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
        targetUrl = "https://" + targetUrl;
    }

    window.location.replace(targetUrl);
}