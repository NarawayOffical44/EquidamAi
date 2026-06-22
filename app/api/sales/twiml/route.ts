import { NextRequest, NextResponse } from "next/server";

function buildTwiml(name: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Hi ${name}, this is a quick call from Evaldam AI.
    You signed up recently and we wanted to make sure you got started.
    Evaldam helps founders get a defensible pre-money valuation in minutes, one that holds up when investors push back.
    Just log in to your dashboard, add your startup, and run the valuation. It takes about three minutes.
    If you have questions about your raise, reply to the welcome email we sent you.
    Thanks for joining Evaldam. Good luck with the raise.
  </Say>
</Response>`;
}

// Twilio fetches this via GET or POST depending on call configuration
export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name") || "there";
  return new NextResponse(buildTwiml(name), { headers: { "Content-Type": "text/xml" } });
}

export async function POST(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name") || "there";
  return new NextResponse(buildTwiml(name), { headers: { "Content-Type": "text/xml" } });
}
