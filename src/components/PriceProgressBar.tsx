"use client";

interface PriceProgressBarProps {
    subtotal: number;
}

export default function PriceProgressBar({ subtotal }: PriceProgressBarProps) {
    const milestones = [
        { value: 650, label: "Free Shipping", icon: "shipping", color: "text-[#15803d]" },
        { value: 1250, label: "10% OFF", icon: "offer", color: "text-[#15803d]" },
        { value: 1800, label: "20% OFF", icon: "discount", color: "text-[#15803d]" }
    ];

    const maxValue = 1800;
    const progress = Math.min((subtotal / maxValue) * 100, 100);

    // Dynamic message
    let message = "";
    let messageColor = "text-[#92400e]";

    if (subtotal < 650) {
        message = `Add ₹${650 - subtotal} more for Free Shipping`;
        messageColor = "text-[#92400e]";
    } else if (subtotal < 1250) {
        message = `Free Shipping unlocked! Add ₹${1250 - subtotal} more for 10% OFF`;
        messageColor = "text-[#15803d]";
    } else if (subtotal < 1800) {
        message = `10% OFF unlocked! Add ₹${1800 - subtotal} more for 20% OFF`;
        messageColor = "text-[#15803d]";
    } else {
        const saved = Math.round(subtotal * 0.20);
        message = `Amazing! You unlocked 20% OFF and saved ₹${saved}`;
        messageColor = "text-[#15803d]";
    }

    const renderMilestoneIcon = (icon: string) => {
        switch (icon) {
            case "shipping":
                return (
                    <svg className="icon shipping-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="3" width="15" height="13" rx="1" />
                        <path d="M16 8h4l3 5v3h-7V8z" />
                        <circle cx="5.5" cy="18.5" r="1.5" />
                        <circle cx="18.5" cy="18.5" r="1.5" />
                    </svg>
                );
            case "offer":
                return (
                    <svg className="icon offer-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="m15 9-6 6" />
                        <circle cx="9.5" cy="9.5" r="1" fill="currentColor" stroke="none" />
                        <circle cx="14.5" cy="14.5" r="1" fill="currentColor" stroke="none" />
                    </svg>
                );
            default:
                return (
                    <svg className="icon discount-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="m15 9-6 6" />
                        <circle cx="9.5" cy="9.5" r="1" fill="currentColor" stroke="none" />
                        <circle cx="14.5" cy="14.5" r="1" fill="currentColor" stroke="none" />
                    </svg>
                );
        }
    };

    return (
        <div className="shipping-card mb-6">
            {/* Message */}
            <p className={`text-sm font-semibold ${messageColor} mb-3 text-center`}>
                {message}
            </p>

            {/* Progress Bar Container */}
            <div className="relative mb-4">
                {/* Background Track */}
                <div className="h-3 bg-white/60 rounded-full overflow-hidden shadow-inner">
                    {/* Progress Fill */}
                    <div
                        className="h-full bg-gradient-to-r from-[#f59e0b] via-[#d97706] to-[#b45309] transition-all duration-500 ease-out shadow-sm"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Milestone Markers */}
                <div className="absolute top-0 left-0 w-full h-3">
                    {milestones.map((milestone) => {
                        const position = (milestone.value / maxValue) * 100;
                        const isReached = subtotal >= milestone.value;

                        return (
                            <div
                                key={milestone.value}
                                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                                style={{ left: `${position}%` }}
                            >
                                <div
                                    className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${isReached
                                            ? 'bg-[#15803d] border-white shadow-md scale-110'
                                            : 'bg-white border-[#d1d5db] shadow-sm'
                                        }`}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Milestone Labels */}
            <div className="flex justify-between gap-2 text-[10px] font-medium">
                {milestones.map((milestone) => {
                    const isReached = subtotal >= milestone.value;
                    return (
                        <div
                            key={milestone.value}
                            className={`shipping-item flex-1 text-center transition-colors ${isReached ? (milestone as any).color || 'text-[#15803d]' : 'text-[#78716c]'
                                }`}
                        >
                            <span className="inline-flex">{renderMilestoneIcon(milestone.icon)}</span>
                            <span className="whitespace-nowrap">{milestone.label}</span>
                            <span className="text-[9px] opacity-70">on & above ₹{milestone.value}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
