export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📧 [Email API] Received request:", body);

    // This is a wrapper for the existing email logic or a placeholder for Bravo
    // For now, we'll proxy to the existing /api/v2mail or implement a similar flow
    
    // Example Bravo logic:
    /*
    const apiKey = process.env.BREVO_API_KEY;
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
       method: 'POST',
       headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
       body: JSON.stringify(body)
    });
    */

    return Response.json({ success: true, message: "Email triggered" });
  } catch (err: any) {
    console.error("📧 [Email API] Failed:", err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
