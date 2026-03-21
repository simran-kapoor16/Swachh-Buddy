// api/classify-waste.ts
// Vercel Edge Function — handles Claude API call server-side (avoids CORS)

declare const process: { env: Record<string, string | undefined> };

export const config = { runtime: "edge" };

export default async function handler(req: Request): Promise<Response> {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64 || !mimeType) {
      return new Response(JSON.stringify({ error: "Missing imageBase64 or mimeType" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const ANTHROPIC_API_KEY: string = process.env.ANTHROPIC_API_KEY || "";

    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not set in Vercel environment variables" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const prompt = `You are an expert waste classification AI for India's Swachh Bharat mission. Analyze this image carefully and classify the waste item shown.

Respond ONLY with a valid JSON object — no markdown, no explanation, just raw JSON:

{
  "category": "wet" | "dry" | "hazardous" | "e-waste" | "medical" | "unknown",
  "confidence": <integer 0-100>,
  "itemName": "<specific item name>",
  "description": "<one clear sentence describing what the item is>",
  "disposalInstructions": "<specific step-by-step disposal instructions for Indian citizens, 2-3 sentences>",
  "binColor": "<Green Bin | Blue Bin | Red Bin | Yellow Bin | White Bin>",
  "tips": ["<tip 1>", "<tip 2>", "<tip 3>"],
  "doNotDo": ["<warning 1>", "<warning 2>"]
}

Classification rules:
- WET (Green Bin): food scraps, vegetable/fruit peels, cooked food, garden waste, leaves, flowers
- DRY (Blue Bin): paper, cardboard, plastic bottles, glass bottles, metal cans, clean packaging
- HAZARDOUS (Red Bin): batteries, paint, pesticides, cleaning chemicals, CFL bulbs, gas cylinders
- E-WASTE (Yellow Bin): phones, laptops, tablets, chargers, cables, remote controls, circuit boards
- MEDICAL (White Bin): syringes, medicine strips, bandages, gloves, masks, expired medicines
- UNKNOWN: if image is unclear or not waste

Only respond with the JSON object, nothing else.`;

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mimeType, data: imageBase64 },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error("Anthropic API error:", errorText);
      return new Response(
        JSON.stringify({ error: `Anthropic API error: ${anthropicResponse.status}` }),
        { status: anthropicResponse.status, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const data = await anthropicResponse.json();
    const text: string = (data.content as Array<{ type: string; text?: string }>)
      ?.map((block) => (block.type === "text" ? block.text ?? "" : ""))
      .join("") ?? "";

    const cleaned = text.replace(/```json|```/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ error: "Could not parse classification response" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
}