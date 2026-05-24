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
    label = "Enquire"
}: CartEnquireButtonProps) {
    const handleEnquire = () => {
        const itemList = items.map(it => `${it.title} (x${it.qty})`).join(", ");
        const message = `Hi Keshvi Crafts! I want to enquire about my cart:\n\nItems: ${itemList}\n\nTotal: ₹${total}\n\nPlease share availability and delivery time.`;

        const encodedMessage = encodeURIComponent(message);
        const url = `https://wa.me/917310045515?text=${encodedMessage}`;

        window.open(url, "_blank", "noreferrer");
        
        trackEvent({
            action: "click_whatsapp_enquiry",
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
