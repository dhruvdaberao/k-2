"use client";

import { showToast } from "@/components/Toast";
import { trackEvent } from "@/lib/analytics";

interface CartEnquireButtonProps {
    items: Array<{ title: string; qty: number; price: number }>;
    total: number;
    className?: string;
    label?: string;
}

export default function CartEnquireButton({
    items,
    total,
    className = "btn-secondary w-full text-sm mt-3",
    label = "Enquire on Instagram"
}: CartEnquireButtonProps) {
    const handleEnquire = () => {
        const itemList = items.map(it => `${it.title} (x${it.qty})`).join(", ");
        const message = `Hi Keshvi Crafts! I want to enquire about my cart:\n\nItems: ${itemList}\n\nTotal: ₹${total}\n\nPlease share availability and delivery time.`;

        navigator.clipboard.writeText(message);

        // Fix for Desktop Firefox Redirect Loop
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const url = "https://www.instagram.com/direct/t/17844051177388084/";

        window.open(url, "_blank", "noreferrer");
        showToast("Cart details copied! Paste in Instagram DM.");
        trackEvent({
            action: "click_instagram_enquiry",
            category: "Ecommerce",
            label: "Cart Enquiry",
            location: "cart",
            itemCount: items.length,
            total
        });
    };

    return (
        <button
            onClick={handleEnquire}
            className={className}
        >
            {label}
        </button>
    );
}
