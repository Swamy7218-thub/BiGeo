/**
 * BiGeo Producer Webhook — Dialogflow CX fulfillment handler
 *
 * Handles intents from the WhatsApp producer onboarding bot:
 * - register_producer: save new producer to DynamoDB, call Vaahan to resolve address
 * - schedule_pickup: create pickup request
 * - check_status: return shipment status
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { randomUUID } from "crypto";

const region = process.env.AWS_REGION || "ap-south-1";
const PRODUCERS_TABLE = process.env.PRODUCERS_TABLE || "bigeo-producers";
const PICKUPS_TABLE = process.env.PICKUPS_TABLE || "bigeo-pickups";
const VAAHAN_API = process.env.VAAHAN_API || "https://v34s17v3h2.execute-api.ap-south-1.amazonaws.com/v1";
const VAAHAN_KEY = process.env.VAAHAN_API_KEY || "";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));
const ses = new SESClient({ region });

const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

// ── Dialogflow CX response builder ──
function dfResponse(text, sessionInfo = {}, endInteraction = false) {
  return {
    fulfillmentResponse: {
      messages: [{ text: { text: [text] } }]
    },
    sessionInfo: { parameters: sessionInfo },
    ...(endInteraction && { payload: { telephony: { hangup: false } } })
  };
}

// ── Resolve address via Vaahan API ──
async function resolveAddress(addressText) {
  try {
    const res = await fetch(`${VAAHAN_API}/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": VAAHAN_KEY },
      body: JSON.stringify({ address: addressText }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// ── Register Producer ──
async function handleRegisterProducer(params, sessionId) {
  const producerId = `PROD#${randomUUID().slice(0, 8).toUpperCase()}`;
  const name = params.producer_name || "Unknown";
  const village = params.village_name || "";
  const products = params.products || "";

  // Resolve address via Vaahan
  let resolvedAddress = null;
  if (village) {
    resolvedAddress = await resolveAddress(`${village}, Telangana`);
  }

  const producer = {
    PK: producerId,
    SK: "PROFILE",
    name,
    village,
    products: products.split(/,|and|మరియు/).map(p => p.trim()).filter(Boolean),
    status: "active",
    created_at: new Date().toISOString(),
    whatsapp_session: sessionId,
    resolved_address: resolvedAddress ? {
      district: resolvedAddress.district,
      mandal: resolvedAddress.mandal,
      lat: resolvedAddress.lat,
      lng: resolvedAddress.lng,
      confidence: resolvedAddress.confidence_score,
    } : null,
    calls_this_month: 0,
    total_pickups: 0,
  };

  try {
    await ddb.send(new PutCommand({ TableName: PRODUCERS_TABLE, Item: producer }));

    // Notify admin
    await ses.send(new SendEmailCommand({
      Source: "admin@bigeo.in",
      Destination: { ToAddresses: ["admin@bigeo.in"] },
      Message: {
        Subject: { Data: `New Producer Registered: ${name} — ${village}` },
        Body: {
          Html: {
            Data: `
              <h2>New Producer Registered</h2>
              <p><strong>ID:</strong> ${producerId}</p>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Village:</strong> ${village}</p>
              <p><strong>Products:</strong> ${products}</p>
              ${resolvedAddress ? `
                <p><strong>District:</strong> ${resolvedAddress.district}</p>
                <p><strong>Mandal:</strong> ${resolvedAddress.mandal}</p>
                <p><strong>Confidence:</strong> ${resolvedAddress.confidence_score}</p>
              ` : "<p><em>Address resolution pending</em></p>"}
              <p><strong>Registered via:</strong> WhatsApp Bot</p>
              <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            `
          }
        }
      }
    })).catch(e => console.error("SES notification error:", e));

    const locationInfo = resolvedAddress?.district
      ? ` (${resolvedAddress.district} district)`
      : "";

    return dfResponse(
      `✅ నమోదు సఫలమైంది! Registration complete!\n\n` +
      `🪪 Your Producer ID: *${producerId}*\n` +
      `📍 Village: ${village}${locationInfo}\n` +
      `🌾 Products: ${products}\n\n` +
      `Save your Producer ID — you'll need it to schedule pickups.\n` +
      `Reply PICKUP to schedule your first pickup, or HELP for more options.`,
      { producer_id: producerId, registered: true }
    );
  } catch (err) {
    console.error("Register error:", err);
    return dfResponse(
      "Sorry, registration failed. Please try again or call our helpline.\n" +
      "క్షమించండి, నమోదు విఫలమైంది. దయచేసి మళ్ళీ ప్రయత్నించండి."
    );
  }
}

// ── Schedule Pickup ──
async function handleSchedulePickup(params, sessionId) {
  const producerId = params.producer_id;
  const quantity = params.quantity_kg || "Not specified";
  const pickupDate = params.pickup_date || "ASAP";
  const products = params.products || "";

  if (!producerId) {
    return dfResponse(
      "Please register first before scheduling a pickup.\n" +
      "దయచేసి ముందు నమోదు చేయండి.\n\n" +
      "Reply REGISTER to get started."
    );
  }

  const pickupId = `PU#${randomUUID().slice(0, 8).toUpperCase()}`;
  const pickup = {
    PK: pickupId,
    SK: "REQUEST",
    producer_id: producerId,
    quantity_kg: quantity,
    products,
    requested_date: pickupDate,
    status: "pending",
    created_at: new Date().toISOString(),
    whatsapp_session: sessionId,
  };

  try {
    await ddb.send(new PutCommand({ TableName: PICKUPS_TABLE, Item: pickup }));

    return dfResponse(
      `🚜 Pickup scheduled!\n\n` +
      `📋 Pickup ID: *${pickupId}*\n` +
      `📦 Quantity: ${quantity} kg\n` +
      `📅 Requested: ${pickupDate}\n` +
      `⏳ Status: Pending confirmation\n\n` +
      `Our team will confirm within 2 hours. You'll receive a message when the pickup partner is assigned.\n` +
      `మా బృందం 2 గంటల్లో ధృవీకరిస్తుంది.`,
      { pickup_id: pickupId }
    );
  } catch (err) {
    console.error("Pickup error:", err);
    return dfResponse("Failed to schedule pickup. Please try again.\nతిరిగి ప్రయత్నించండి.");
  }
}

// ── Check Status ──
async function handleCheckStatus(params) {
  const producerId = params.producer_id;
  if (!producerId) {
    return dfResponse("Please share your Producer ID to check status.\nమీ Producer ID చెప్పండి.");
  }

  try {
    const result = await ddb.send(new QueryCommand({
      TableName: PICKUPS_TABLE,
      KeyConditionExpression: "begins_with(PK, :prefix)",
      FilterExpression: "producer_id = :pid",
      ExpressionAttributeValues: { ":prefix": "PU#", ":pid": producerId },
      ScanIndexForward: false,
      Limit: 3,
    }));

    const pickups = result.Items || [];
    if (pickups.length === 0) {
      return dfResponse(`No pickups found for Producer ID ${producerId}.\nNo pickups registered yet. Reply PICKUP to schedule one.`);
    }

    const latest = pickups[0];
    const statusEmoji = { pending: "⏳", confirmed: "✅", in_transit: "🚜", delivered: "📦", paid: "💰" }[latest.status] || "📋";

    return dfResponse(
      `${statusEmoji} Latest pickup status:\n\n` +
      `ID: ${latest.PK}\n` +
      `Products: ${latest.products || "Not specified"}\n` +
      `Quantity: ${latest.quantity_kg} kg\n` +
      `Status: *${latest.status.toUpperCase()}*\n` +
      `Date: ${latest.created_at?.split("T")[0]}\n\n` +
      (pickups.length > 1 ? `You have ${pickups.length - 1} more recent pickups.` : "")
    );
  } catch (err) {
    console.error("Status check error:", err);
    return dfResponse("Could not retrieve status. Please try again later.");
  }
}

// ── Main handler ──
export const handler = async (event) => {
  if (event.requestContext?.http?.method === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  // Dialogflow CX webhook format
  const tag = body.fulfillmentInfo?.tag || "";
  const params = body.sessionInfo?.parameters || {};
  const sessionId = body.sessionInfo?.session || "";

  console.log(`Webhook tag: ${tag}, params:`, JSON.stringify(params));

  let response;
  switch (tag) {
    case "register_producer":
      response = await handleRegisterProducer(params, sessionId);
      break;
    case "schedule_pickup":
      response = await handleSchedulePickup(params, sessionId);
      break;
    case "check_status":
      response = await handleCheckStatus(params);
      break;
    default:
      response = dfResponse(
        "🌾 BiGeo Producer Bot\n\nReply:\n1 - Register\n2 - Schedule Pickup\n3 - Check Status\n4 - Help\n\nనమస్కారం! BiGeo కి స్వాగతం."
      );
  }

  return { statusCode: 200, headers, body: JSON.stringify(response) };
};
