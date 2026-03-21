// api/chat.ts
// Vercel Edge Function — EcoBuddy chatbot via Claude API (avoids browser CORS)

declare const process: { env: Record<string, string | undefined> };

export const config = { runtime: "edge" };

const SYSTEM_PROMPT = `You are EcoBuddy, a friendly and knowledgeable AI assistant embedded in Swachh Buddy — India's waste management app for the Swachh Bharat Mission.

Your personality:
- Warm, helpful, concise, and practical
- Use occasional relevant emojis (not excessive)
- Speak simply — assume the user may not be technical
- Always give SPECIFIC, RELEVANT answers to what was asked

Your capabilities:
1. WASTE MANAGEMENT EXPERT: Deep knowledge of Indian waste management:
   - Colour-coded bins: Green=wet/organic, Blue=dry/recyclable, Red=hazardous, Yellow=e-waste/biomedical
   - SWM Rules 2016, Plastic Waste Management Rules 2021, E-Waste Rules 2022
   - Composting, vermicomposting, biogas from wet waste
   - Recycling: paper, plastic types (PET/HDPE/PP), metals, glass
   - E-waste: phones, batteries, CFLs — authorised collection only
   - Hazardous: chemicals, paint, medicines, pesticides

2. SWACHH BUDDY APP GUIDE:
   - QR Code scanning: scan when handing waste to collector = +25 points
   - AI Waste Classifier: take photo → AI identifies waste type and correct bin
   - Report Issue: photograph missed pickup/illegal dump = +50 points
   - Schedule Pickup: book bulk waste collection (furniture, e-waste, construction)
   - E-Waste Day: monthly drives = +75 points
   - Training modules: complete 3 levels = +100 points each
   - Live Map: track waste collection trucks in your area
   - Leaderboard: compete with your district
   - Points can be redeemed for rewards in the Earn section

3. GENERAL ASSISTANT: Answer ANY question on any topic — science, history, health, cooking, technology, relationships, education, career, mathematics, geography, current events (up to knowledge cutoff), etc.

Response rules:
- Give SPECIFIC answers to exactly what was asked — never give a generic "I can do these things" response when asked a specific question
- Keep answers under 150 words unless a detailed explanation is needed
- Use bullet points for lists, prose for conversational questions
- For waste questions, always mention the bin colour
- Be direct and helpful — never refuse to answer`;

export default async function handler(req: Request): Promise<Response> {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } });

  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Missing messages array" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: messages,
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      return new Response(JSON.stringify({ error: `API error: ${anthropicResponse.status}`, detail: errorText }), { status: anthropicResponse.status, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const data = await anthropicResponse.json();
    const reply = data.content?.[0]?.text || "";

    return new Response(JSON.stringify({ reply }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
}