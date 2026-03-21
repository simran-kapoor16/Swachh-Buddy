// src/components/WasteChatbot.tsx
import { useState, useRef, useEffect, MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, User, X, Loader2, RefreshCw } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface ApiMessage {
  role: "user" | "assistant";
  content: string;
}

const BUBBLE_SIZE      = 56;
const CHATBOX_WIDTH    = 384;
const CHATBOX_HEIGHT   = 520;
const VIEWPORT_PADDING = 24;

// ── Detect environment ────────────────────────────────────────────────────────
const isVercel = () =>
  typeof window !== "undefined" &&
  (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1");

// ── Comprehensive local fallback — covers 30+ categories ─────────────────────
const buildFallback = (q: string): string => {
  const s = q.toLowerCase().trim();

  // App features
  if (s.match(/feature|app|swachh buddy|how (does|do)|what (is|does|can)|explain|tell me about|understand/)) {
    if (s.match(/qr|scan/)) return "📲 **QR Code Scanning**\n\nWhen handing waste to the municipal collector, scan their QR code to verify disposal.\n• Earn **+25 points** per verified scan\n• Go to Dashboard → Scan QR Code\n• Helps track responsible waste disposal 🌱";
    if (s.match(/report|issue|problem|missed|pickup/)) return "📷 **Report Issues**\n\nSpotted a missed pickup or illegal dumping? Report it!\n• Take a photo and submit via Dashboard → Report Issue\n• Earn **+50 points** per report\n• Helps hold municipalities accountable 💪";
    if (s.match(/ai|classifier|photo|identify/)) return "🤖 **AI Waste Classifier**\n\nNot sure which bin? Take a photo!\n• Dashboard → AI Classifier → take/upload a photo\n• Claude AI identifies the item and tells you the correct bin\n• Works for any household item 📦";
    if (s.match(/map|truck|track|vehicle|location/)) return "🗺️ **Live Map / Track Truck**\n\nSee your waste collection vehicles in real-time!\n• Dashboard → Track Truck or Live Map tab\n• Shows truck location, ETA, and route\n• Also shows illegal dump sites and hazardous zones 🚛";
    if (s.match(/schedule|bulk|pickup|book|furniture|construction/)) return "📅 **Schedule Pickup**\n\nBook a bulk waste pickup from home!\n• Dashboard → Schedule Pickup\n• For furniture, e-waste, construction debris, hazardous\n• 48 hour advance booking, you get driver contact details 🏠";
    if (s.match(/ewaste|e-waste day|drive|monthly/)) return "♻️ **E-Waste Day**\n\nMonthly drives to collect electronics!\n• Dashboard → E-Waste Day\n• Drop off phones, laptops, cables, batteries\n• Earn **+75 points** per participation ⚡";
    if (s.match(/point|earn|reward|coin|redeem/)) return "🏆 **Points & Rewards**\n\nEarn points for responsible waste actions:\n• QR scan: **+25 pts**\n• Report issue: **+50 pts**\n• E-Waste Day: **+75 pts**\n• Training module: **+100 pts**\n\nRedeem in the **Earn** section for rewards!";
    if (s.match(/train|learn|module|course|certif/)) return "🎓 **Training Modules**\n\nLearn waste management properly!\n• Learn tab → 3 core levels (Basics → Intermediate → Advanced)\n• Also: Student courses, Community Leadership, Rag Picker training\n• Complete all 3 levels → earn a **certificate** + **+100 pts** each 📜";
    if (s.match(/leaderboard|rank|compet/)) return "🏅 **Leaderboard**\n\nCompete with citizens in your district!\n• Dashboard → Leaderboard tab\n• Rankings based on total points earned\n• Top earners get recognition and special rewards 🥇";
    // Generic app features
    return "📱 **Swachh Buddy App Features:**\n\n• 📲 **Scan QR** — verify disposal, earn +25 pts\n• 🤖 **AI Classifier** — photo → correct bin\n• 📷 **Report Issue** — missed pickup, earn +50 pts\n• 📅 **Schedule Pickup** — book bulk collection\n• 🗺️ **Live Map** — track trucks & dump sites\n• ♻️ **E-Waste Day** — monthly drive, +75 pts\n• 🎓 **Training** — 3 levels + certificates\n\nAsk about any feature for details!";
  }

  // Waste disposal — specific items
  if (s.match(/banana|apple|mango|orange|grapes|fruit|peel|skin/))
    return "🟢 **Fruit peels & scraps → Green (Wet Waste) bin**\n\n• Great for composting — rich in nutrients!\n• Can be converted to biogas in community plants\n• Tip: drain excess liquid before binning to avoid odour 🌱";

  if (s.match(/vegetable|sabzi|onion|potato|tomato|carrot|curry|rice|roti|bread|cooked food|food/))
    return "🟢 **Food waste → Green (Wet Waste) bin**\n\n• Cooked & uncooked food scraps both go here\n• Never mix with dry waste — ruins recyclable value\n• 1 kg food waste → ~0.3 kg compost in 60 days 🌱";

  if (s.match(/plastic bottle|pet bottle|water bottle|cold drink bottle/))
    return "🔵 **Plastic bottles → Blue (Dry Waste) bin**\n\n• Rinse before binning — clean plastic is worth more\n• Remove cap separately (often different plastic type)\n• PET bottles (code ♳) are most recyclable ♻️";

  if (s.match(/plastic bag|polythene|carry bag|wrapper|packet|pouch/))
    return "🔵 **Plastic bags → Blue (Dry Waste) bin**\n\n• Single-use plastic bags are banned in many cities\n• Soft plastics (code ♶ LDPE) — check if your MRF accepts them\n• Better: switch to cloth bags and avoid this waste entirely! 🛍️";

  if (s.match(/newspaper|paper|cardboard|carton|book|magazine|box/))
    return "🔵 **Paper & cardboard → Blue (Dry Waste) bin**\n\n• Keep DRY — wet/oily paper is NOT recyclable\n• 1 tonne recycled paper saves ~17 trees 🌳\n• Shred confidential documents before binning";

  if (s.match(/glass bottle|glass jar|bottle|jar/))
    return "🔵 **Glass bottles/jars → Blue (Dry Waste) bin**\n\n• Rinse before binning, remove lids\n• Glass is infinitely recyclable!\n• Broken glass: wrap in newspaper, label 'SHARP' → Black (Reject) bin";

  if (s.match(/phone|mobile|smartphone|laptop|computer|tablet|ipad/))
    return "🟡 **Phones & laptops → Yellow (E-Waste) bin / authorised centre**\n\n• Never in regular bins — toxic metals pollute soil & water\n• Use Swachh Buddy's E-Waste Day for +75 pts ⚡\n• Factory data wipe before disposing — protect your privacy!";

  if (s.match(/charger|cable|wire|earphone|headphone|adapter|usb/))
    return "🟡 **Cables & chargers → Yellow (E-Waste) collection**\n\n• Copper and plastic in cables are fully recyclable\n• Authorised e-waste centres listed at cpcb.nic.in\n• Participate in monthly E-Waste Day for +75 pts ♻️";

  if (s.match(/battery|batteries/))
    return "🟡 **Batteries → Yellow (E-Waste) / Hazardous collection**\n\n• NEVER throw in regular bins — fire hazard in trucks!\n• Lithium (phones): authorised e-waste centres\n• Lead-acid (cars): return to auto shops or scrap dealers 🔋";

  if (s.match(/bulb|cfl|tube light|fluorescent|led/))
    return "🔴 **CFL/fluorescent bulbs → Red (Hazardous) bin**\n\n• Contain mercury — never break or throw in regular bins!\n• LED bulbs: e-waste collection\n• Many electronics stores accept old bulbs for safe disposal 💡";

  if (s.match(/medicine|tablet|capsule|syrup|drug|pill|expired/))
    return "🔴 **Medicines → Pharmacy take-back or Red (Hazardous) bin**\n\n• NEVER flush medicines — pollutes groundwater\n• Return unused medicines to any pharmacy\n• Expired medicines: Red bin or hazardous collection centre 💊";

  if (s.match(/syringe|needle|lancet|injection/))
    return "⚠️ **Syringes/needles → Puncture-proof sharps container ONLY**\n\n• Never handle bare-handed — HIV/Hepatitis risk\n• Use sharps container, return to hospital or clinic\n• If found on street: do NOT touch, report to municipality 🏥";

  if (s.match(/paint|chemical|pesticide|fertilizer|bleach|acid|solvent|motor oil/))
    return "🔴 **Chemicals & paint → Red (Hazardous) bin / collection centre**\n\n• NEVER pour down drains — contaminates groundwater\n• Keep in original containers with labels intact\n• Contact your municipality for scheduled hazardous collection ☣️";

  if (s.match(/clothes|cloth|garment|fabric|textile|shirt|jeans|shoes/))
    return "♻️ **Clothes → Textile recycling / donation**\n\n• Good condition: donate to NGOs, temples, or charity bins\n• Worn out: many brands (H&M, Zara) have take-back schemes\n• Kabadiwalla: buys old clothes by weight (₹8-12/kg) 👕";

  if (s.match(/construction|debris|cement|tile|brick|rubble|renovation/))
    return "🏗️ **Construction debris → Schedule bulk pickup**\n\n• Too heavy for regular bins — book via Swachh Buddy!\n• Dashboard → Schedule Pickup → Construction Debris\n• Some recyclers process C&D waste into road construction material 🧱";

  if (s.match(/sanitary|diaper|pad|tampon|tissue/))
    return "⚫ **Sanitary waste → Black (Reject/Inert) bin**\n\n• Wrap in newspaper or bag before binning — hygiene\n• Cannot be recycled — goes to controlled landfill\n• Biodegradable alternatives (cloth pads, menstrual cups) generate zero waste 🌱";

  // Waste management topics
  if (s.match(/compost|composting/))
    return "🌱 **How to Compost at Home:**\n\n1. Green (wet) bin scraps + dry leaves in a covered container\n2. Ideal C:N ratio: 25:1 — add cardboard/leaves if too wet\n3. Turn weekly, keep slightly moist\n4. Ready in **45-60 days** — rich fertilizer!\n\nTip: Vermicomposting with earthworms is faster (30-45 days) 🪱";

  if (s.match(/segregat|sort|separate|which bin|bin colour|bin color/))
    return "🗑️ **India's 4-Bin System:**\n\n• 🟢 **Green** — Wet/organic (food, peels, garden)\n• 🔵 **Blue** — Dry/recyclable (paper, plastic, glass, metal)\n• 🔴 **Red** — Hazardous (chemicals, medicines, paint)\n• 🟡 **Yellow** — E-Waste (electronics, batteries)\n• ⚫ **Black** — Reject (sanitary, ceramics, soiled items)\n\nMandate: SWM Rules 2016 make source segregation compulsory!";

  if (s.match(/recycle|recycling/))
    return "♻️ **What Can Be Recycled (India):**\n\n• ✅ Paper, cardboard (dry & clean)\n• ✅ Plastic bottles (PET, HDPE, PP — codes 1,2,5)\n• ✅ Metal cans (aluminium, steel)\n• ✅ Glass bottles (rinsed)\n• ❌ Oily/food-stained paper or plastic\n• ❌ Mixed-material packaging (chip packets)\n\nKey rule: **Clean + Dry + Separated = Higher value** 🌍";

  if (s.match(/swachh bharat|sbm|mission/))
    return "🇮🇳 **Swachh Bharat Mission:**\n\nIndia's flagship cleanliness programme launched Oct 2 2014.\n\n• **SBM-Urban 2.0** (2021-26): focus on waste processing, not just collection\n• Goal: Zero Waste to Landfill cities\n• ₹1.41 lakh crore investment in urban solid waste infrastructure\n• Swachh Survekshan: annual ranking of cleanest cities 🏙️";

  if (s.match(/swachh survekshan|cleanest city|indore|ranking/))
    return "🏆 **Swachh Survekshan Rankings:**\n\nIndia's annual cleanliness survey of cities.\n\n• **Indore** — cleanest city for 7 consecutive years (2017-2023)\n• **Surat, Navi Mumbai, Visakhapatnam** consistently in top 5\n• Key metrics: waste collection, processing, ODF status, citizen feedback\n• Your reports on Swachh Buddy help your city rank higher! 📊";

  // Greetings
  if (s.match(/^(hi|hello|hey|namaste|hii|helo|howdy|good morning|good evening|good afternoon|sup)[\s!?.]*$/))
    return "Hello! 👋 I'm EcoBuddy, your AI assistant on Swachh Buddy.\n\nI can help you with:\n• 🗑️ Which bin any item belongs in\n• 📱 How to use the app and earn points\n• ♻️ Composting, recycling, and waste tips\n• 🤖 Any general question you have!\n\nWhat can I help you with?";

  if (s.match(/thank|thanks|dhanyawad|shukriya|great|perfect|helpful|awesome|good/))
    return "You're welcome! 😊\n\nEvery correct waste disposal makes India cleaner. Keep up the great work! 🇮🇳🌱\n\nFeel free to ask anything else!";

  if (s.match(/who are you|what are you|your name|introduce/))
    return "I'm **EcoBuddy** 🌱 — the AI assistant for Swachh Buddy.\n\nI can:\n• Tell you the correct bin for any waste item\n• Guide you through all app features\n• Help you earn maximum points\n• Answer general questions on any topic\n\nPowered by Claude AI. Ask me anything!";

  // Default — specific and helpful
  return "I'd love to help! Here's what I'm great at:\n\n• 🗑️ **Waste disposal** — tell me any item, I'll tell you the bin\n• 📱 **App features** — QR scanning, points, pickups, map\n• ♻️ **Recycling & composting** tips\n• 🎓 **Swachh Bharat** information\n• 🤖 **Any general question** you have!\n\nWhat specifically would you like to know?";
};

// ─────────────────────────────────────────────────────────────────────────────
const WasteChatbot = () => {
  const [isOpen, setIsOpen]         = useState(false);
  const [messages, setMessages]     = useState<Message[]>([{
    id: "1",
    content: "Hello! 👋 I'm **EcoBuddy**, your AI assistant.\n\nI can answer questions about waste management, app features, how to earn points — or anything else on your mind! How can I help?",
    sender: "bot",
    timestamp: new Date(),
  }]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading]       = useState(false);
  const scrollRef     = useRef<HTMLDivElement>(null);
  const [position, setPosition]         = useState({ x: 0, y: 0 });
  const [chatboxPos, setChatboxPos]     = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging]     = useState(false);
  const dragOffset    = useRef({ x: 0, y: 0 });
  const wasDragged    = useRef(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [showDot, setShowDot]           = useState(false);

  useEffect(() => {
    setPosition({ x: window.innerWidth - BUBBLE_SIZE - VIEWPORT_PADDING, y: window.innerHeight - BUBBLE_SIZE - VIEWPORT_PADDING });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setShowGreeting(true); setShowDot(true); }, 2000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (showGreeting) { const t = setTimeout(() => setShowGreeting(false), 60000); return () => clearTimeout(t); }
  }, [showGreeting]);

  useEffect(() => {
    if (isOpen) {
      const idealX = position.x - CHATBOX_WIDTH + BUBBLE_SIZE;
      const idealY = position.y - CHATBOX_HEIGHT + BUBBLE_SIZE;
      setChatboxPos({
        x: Math.max(VIEWPORT_PADDING, Math.min(idealX, window.innerWidth - CHATBOX_WIDTH - VIEWPORT_PADDING)),
        y: Math.max(VIEWPORT_PADDING, Math.min(idealY, window.innerHeight - CHATBOX_HEIGHT - VIEWPORT_PADDING)),
      });
    }
  }, [isOpen, position]);

  useEffect(() => {
    const onMove = (e: globalThis.MouseEvent) => {
      wasDragged.current = true;
      setPosition({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    };
    const onUp = () => {
      setIsDragging(false);
      setTimeout(() => { if (!wasDragged.current) { setIsOpen(true); setShowDot(false); setShowGreeting(false); } }, 0);
    };
    if (isDragging) {
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
    }
  }, [isDragging]);

  const handleMouseDown = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    wasDragged.current = false;
    dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    setIsDragging(true);
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const addBotMessage = (content: string) => {
    setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), content, sender: "bot", timestamp: new Date() }]);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    const query = inputMessage.trim();
    const userMsg: Message = { id: Date.now().toString(), content: query, sender: "user", timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    // Build conversation history for API
    const apiMessages: ApiMessage[] = messages.slice(-8).map(m => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.content,
    }));
    apiMessages.push({ role: "user", content: query });

    try {
      if (isVercel()) {
        // ── Production: call Vercel edge function ──────────────────────────
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages }),
        });
        if (!response.ok) throw new Error(`API ${response.status}`);
        const data = await response.json();
        addBotMessage(data.reply || buildFallback(query));
      } else {
        // ── Localhost: use comprehensive local fallback ─────────────────────
        await new Promise(r => setTimeout(r, 600)); // simulate thinking
        addBotMessage(buildFallback(query));
      }
    } catch {
      addBotMessage(buildFallback(query));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now().toString(),
      content: "Chat cleared! 🔄 Ask me anything about waste management, app features, or any other topic.",
      sender: "bot",
      timestamp: new Date(),
    }]);
  };

  const quickQuestions = [
    "Where does plastic go?",
    "How do I earn points?",
    "How to compost at home?",
    "App features?",
  ];

  // Render message with bold and newlines
  const renderContent = (text: string) => ({
    __html: text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br/>"),
  });

  // ── Bubble ──────────────────────────────────────────────────────────────────
  if (!isOpen) return (
    <div className="fixed z-50" style={{ top: position.y, left: position.x }}>
      {showGreeting && (
        <div className="absolute bottom-0 right-full mr-4 w-max max-w-[200px] bg-card text-card-foreground p-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-left-2 duration-500">
          <p className="text-sm font-medium">Hello! 👋</p>
          <p className="text-sm text-muted-foreground">Ask me anything!</p>
          <div className="absolute right-[-8px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-card" />
        </div>
      )}
      <Button onMouseDown={handleMouseDown} className="relative h-14 w-14 rounded-full shadow-lg p-0 cursor-grab active:cursor-grabbing" size="icon" variant="ghost">
        {showDot && <span className="absolute top-0 right-0 block h-3.5 w-3.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />}
        <img src="/chatbot.png" alt="EcoBuddy" className="h-20 w-20 rounded-full object-cover" style={{ pointerEvents: "none" }} />
      </Button>
    </div>
  );

  // ── Chat window ─────────────────────────────────────────────────────────────
  return (
    <Card className="fixed w-96 shadow-2xl z-50 flex flex-col overflow-hidden rounded-2xl border"
      style={{ top: chatboxPos.y, left: chatboxPos.x, height: CHATBOX_HEIGHT }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-primary/10 to-accent/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <img src="/chatbot.png" alt="EcoBuddy" className="h-9 w-9 rounded-full" />
          <div>
            <p className="font-bold text-sm leading-tight">EcoBuddy</p>
            <p className="text-xs text-muted-foreground leading-tight">AI Assistant · Ask anything</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={clearChat} className="h-7 w-7" title="Clear chat">
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-7 w-7">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            {msg.sender === "bot" && <img src="/chatbot.png" alt="Bot" className="h-7 w-7 rounded-full flex-shrink-0 mt-0.5" />}
            <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed
              ${msg.sender === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"}`}>
              <span dangerouslySetInnerHTML={renderContent(msg.content)} />
              <p className={`text-xs mt-1 ${msg.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            {msg.sender === "user" && (
              <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="h-4 w-4 text-primary" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2 justify-start">
            <img src="/chatbot.png" alt="Bot" className="h-7 w-7 rounded-full flex-shrink-0" />
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              {[0, 150, 300].map(d => (
                <span key={d} className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick questions — only on first open */}
      {messages.length === 1 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
          {quickQuestions.map((q, i) => (
            <button key={i} onClick={() => setInputMessage(q)}
              className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20">
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t flex gap-2 items-center bg-background flex-shrink-0">
        <Input
          value={inputMessage}
          onChange={e => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask anything..."
          className="flex-1 rounded-xl text-sm h-9"
          disabled={isLoading}
        />
        <Button onClick={sendMessage} disabled={!inputMessage.trim() || isLoading} size="icon" className="h-9 w-9 rounded-xl flex-shrink-0">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </Card>
  );
};

export default WasteChatbot;
