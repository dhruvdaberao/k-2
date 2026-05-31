export default function JsonLd({ data }: { data: Record<string, any> }) {
    // Sanitize string to prevent XSS breakout from script tags
    const safeJson = JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: safeJson }}
        />
    );
}
