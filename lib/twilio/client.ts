import twilio from "twilio";

function getClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) throw new Error("Twilio credentials not configured");
  return twilio(accountSid, authToken);
}

export async function makeCall(to: string, twimlUrl: string) {
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!from) throw new Error("TWILIO_PHONE_NUMBER not configured");
  const client = getClient();
  const call = await client.calls.create({ to, from, url: twimlUrl });
  return { sid: call.sid, status: call.status };
}

export async function sendSms(to: string, body: string) {
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!from) throw new Error("TWILIO_PHONE_NUMBER not configured");
  const client = getClient();
  const message = await client.messages.create({ to, from, body });
  return { sid: message.sid, status: message.status };
}
