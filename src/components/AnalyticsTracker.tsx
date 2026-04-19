"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { pushToDataLayer } from "@/lib/analytics";

export default function AnalyticsTracker() {
    const pathname = usePathname();
    const [startTime, setStartTime] = useState<number>(Date.now());
    const [scrolled50, setScrolled50] = useState(false);
    const [scrolled90, setScrolled90] = useState(false);

    // Reset timer on route change (Page view tracking handled by GTM automatically)
    useEffect(() => {
        setStartTime(Date.now());
        setScrolled50(false);
        setScrolled90(false);

        // Track Time on Page on unmount/route change
        return () => {
            const timeOnPage = Math.round((Date.now() - startTime) / 1000);
            pushToDataLayer({
                event: "time_on_page",
                duration: timeOnPage,
                path: pathname
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]); // Depend on pathname to reset on navigation

    // Track Scroll Depth
    useEffect(() => {
        const handleScroll = () => {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollTop = window.scrollY;
            const scrollPercentage = (scrollTop / scrollHeight) * 100;

            if (!scrolled50 && scrollPercentage >= 50) {
                setScrolled50(true);
                pushToDataLayer({
                    event: "scroll_depth",
                    percent: "50%"
                });
            }

            if (!scrolled90 && scrollPercentage >= 90) {
                setScrolled90(true);
                pushToDataLayer({
                    event: "scroll_depth",
                    percent: "90%"
                });
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [scrolled50, scrolled90]);

    return null;
}
