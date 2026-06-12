"use client";

import { useState } from "react";
import { showToast } from "./Toast";

export default function ContactForm() {
    const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatus("submitting");
        
        const formData = new FormData(e.currentTarget);
        const name = formData.get("name")?.toString() || "";
        const message = formData.get("message")?.toString() || "";
        
        // Use mailto as a fallback since there's no backend endpoint yet
        const subject = encodeURIComponent(`Contact Form Inquiry from ${name}`);
        const body = encodeURIComponent(message);
        
        window.location.href = `mailto:keshvicrafts@gmail.com?subject=${subject}&body=${body}`;
        
        setTimeout(() => {
            setStatus("success");
            showToast("Opening your email client...");
            (e.target as HTMLFormElement).reset();
            setTimeout(() => setStatus("idle"), 3000);
        }, 500);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8 bg-[#f5efe6] p-6 md:p-8 rounded-2xl border border-[#C4A484] shadow-sm">
            <h2 className="font-serif text-2xl font-bold text-[#4a3219] mb-2">Send us a message</h2>
            
            <div className="flex flex-col gap-1">
                <label htmlFor="name" className="text-sm font-semibold text-stone-700">Name</label>
                <input required type="text" id="name" name="name" className="p-3 rounded-xl border border-[#e6dccf] bg-white focus:outline-none focus:border-[#4a3219]" placeholder="Your name" />
            </div>
            
            <div className="flex flex-col gap-1">
                <label htmlFor="email" className="text-sm font-semibold text-stone-700">Email</label>
                <input required type="email" id="email" name="email" className="p-3 rounded-xl border border-[#e6dccf] bg-white focus:outline-none focus:border-[#4a3219]" placeholder="your@email.com" />
            </div>
            
            <div className="flex flex-col gap-1">
                <label htmlFor="message" className="text-sm font-semibold text-stone-700">Message</label>
                <textarea required id="message" name="message" rows={4} className="p-3 rounded-xl border border-[#e6dccf] bg-white focus:outline-none focus:border-[#4a3219] resize-none" placeholder="How can we help you?"></textarea>
            </div>
            
            <button type="submit" disabled={status === "submitting"} className="btn-primary py-3 rounded-xl font-bold mt-2 transition-all">
                {status === "submitting" ? "Sending..." : status === "success" ? "Sent!" : "Send Message"}
            </button>
        </form>
    );
}
