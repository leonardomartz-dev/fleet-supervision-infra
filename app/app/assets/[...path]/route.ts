import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const cleanupScript = `
(function () {
  function reset() {
    var serviceWorker = navigator.serviceWorker;
    var cacheStorage = window.caches;
    var unregister = serviceWorker
      ? serviceWorker.getRegistrations().then(function (registrations) {
          return Promise.all(registrations.map(function (registration) {
            return registration.unregister();
          }));
        }).catch(function () {})
      : Promise.resolve();
    var clearCaches = cacheStorage
      ? cacheStorage.keys().then(function (keys) {
          return Promise.all(keys.map(function (key) {
            return cacheStorage.delete(key);
          }));
        }).catch(function () {})
      : Promise.resolve();

    Promise.all([unregister, clearCaches]).finally(function () {
      window.location.replace("/?cache-reset=traccar-assets");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", reset);
  } else {
    reset();
  }
})();
`;

export function GET() {
  return new NextResponse(cleanupScript, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": "application/javascript; charset=utf-8",
    },
  });
}
