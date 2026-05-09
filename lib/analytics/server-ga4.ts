type ServerEventParams = Record<string, string | number | boolean | null | undefined>;

export async function trackServerEvent(
  eventName: string,
  params: ServerEventParams = {},
  userId?: string
) {
  const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) return;

  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null)
  );

  try {
    await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: userId || `server.${Date.now()}`,
          user_id: userId,
          events: [{ name: eventName, params: cleanParams }],
        }),
      }
    );
  } catch (error) {
    console.warn("Server GA4 event failed", {
      eventName,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
