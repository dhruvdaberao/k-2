// Replaces direct GA4/gtag usage with generic dataLayer push
// GTM is the single source of truth.

export type GTMPayload = Record<string, any>;

/**
 * Safely push to dataLayer if window is defined.
 * @param payload Object to push to dataLayer
 */
export const pushToDataLayer = (payload: GTMPayload) => {
    if (typeof window !== 'undefined') {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(payload);
    }
};

// Deprecated export to prevent build errors during refactor if imported elsewhere, 
// but technically incorrectly named now. 
// We will check for usages of trackEvent and update them to use pushToDataLayer or 
// keep a compatibility wrapper if needed, but the goal is to standardize.
// For now, let's keep a compatibility 'trackEvent' that uses pushToDataLayer
// to minimize churn in other files, but changing the underlying implementation.

export const trackEvent = ({ action, category, label, value, ...rest }: {
    action: string;
    category?: string;
    label?: string;
    value?: number;
    [key: string]: any;
}) => {
    pushToDataLayer({
        event: action,
        category,
        label,
        value,
        ...rest
    });
};
