import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { pagesConfig } from "@/pages.config";

export default function NavigationTracker() {
  const location = useLocation();
  const { Pages, mainPage } = pagesConfig;
  const mainPageKey = mainPage ?? Object.keys(Pages)[0];

  useEffect(() => {
    // In the Base44 version this logged navigation events to their backend.
    // You can hook this into your own analytics endpoint later if needed.
    const pathname = location.pathname;
    let pageName;

    if (pathname === "/" || pathname === "") {
      pageName = mainPageKey;
    } else {
      const pathSegment = pathname.replace(/^\//, "").split("/")[0];
      const pageKeys = Object.keys(Pages);
      const matchedKey = pageKeys.find(
        (key) => key.toLowerCase() === pathSegment.toLowerCase()
      );
      pageName = matchedKey || null;
    }

    if (pageName) {
      // placeholder: console.log or send to your own backend if desired
      // console.debug("Navigated to page:", pageName);
    }
  }, [location, Pages, mainPageKey]);

  return null;
}