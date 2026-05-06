const isPwaRegistrationAllowed = () => {
  if (typeof window === "undefined") {
    return false;
  }

  if (!("serviceWorker" in navigator)) {
    return false;
  }

  return (
    window.isSecureContext ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
};

export const registerServiceWorker = () => {
  if (!isPwaRegistrationAllowed()) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
};
