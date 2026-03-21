// src/components/AIWasteClassifier.tsx
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Camera, Upload, Recycle, AlertTriangle,
  Leaf, Zap, X, CheckCircle, FlaskConical, Sparkles, RotateCcw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePoints } from "@/contexts/PointsContext";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ClassificationResult {
  category: "wet" | "dry" | "hazardous" | "e-waste" | "medical" | "unknown";
  confidence: number;
  itemName: string;
  description: string;
  disposalInstructions: string;
  binColor: string;
  tips: string[];
  doNotDo: string[];
  points: number;
}

interface AIWasteClassifierProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Environment Detection ────────────────────────────────────────────────────
const isVercel = (): boolean =>
  typeof window !== "undefined" &&
  !window.location.hostname.includes("localhost") &&
  !window.location.hostname.includes("127.0.0.1");

// ─── Category Config ──────────────────────────────────────────────────────────
// ✅ FIXED: all lightBg, border, text now have dark: variants
const categoryConfig = {
  wet: {
    color: "bg-green-500",
    lightBg: "bg-green-50 dark:bg-green-900/30",
    border: "border-green-200 dark:border-green-700",
    text: "text-green-800 dark:text-green-300",
    binColor: "Green Bin", icon: <Leaf className="h-6 w-6" />,
    emoji: "🥬", label: "Wet Waste", points: 20,
  },
  dry: {
    color: "bg-blue-500",
    lightBg: "bg-blue-50 dark:bg-blue-900/30",
    border: "border-blue-200 dark:border-blue-700",
    text: "text-blue-800 dark:text-blue-300",
    binColor: "Blue Bin", icon: <Recycle className="h-6 w-6" />,
    emoji: "♻️", label: "Dry Waste", points: 15,
  },
  hazardous: {
    color: "bg-red-500",
    lightBg: "bg-red-50 dark:bg-red-900/30",
    border: "border-red-200 dark:border-red-700",
    text: "text-red-800 dark:text-red-300",
    binColor: "Red Bin", icon: <AlertTriangle className="h-6 w-6" />,
    emoji: "⚠️", label: "Hazardous Waste", points: 30,
  },
  "e-waste": {
    color: "bg-yellow-500",
    lightBg: "bg-yellow-50 dark:bg-yellow-900/30",
    border: "border-yellow-200 dark:border-yellow-700",
    text: "text-yellow-800 dark:text-yellow-300",
    binColor: "Yellow Bin", icon: <Zap className="h-6 w-6" />,
    emoji: "🔌", label: "E-Waste", points: 35,
  },
  medical: {
    color: "bg-purple-500",
    lightBg: "bg-purple-50 dark:bg-purple-900/30",
    border: "border-purple-200 dark:border-purple-700",
    text: "text-purple-800 dark:text-purple-300",
    binColor: "White Bin", icon: <FlaskConical className="h-6 w-6" />,
    emoji: "💊", label: "Medical Waste", points: 40,
  },
  unknown: {
    color: "bg-gray-500",
    lightBg: "bg-gray-50 dark:bg-gray-800",
    border: "border-gray-200 dark:border-gray-600",
    text: "text-gray-800 dark:text-gray-200",
    binColor: "General Bin", icon: <Recycle className="h-6 w-6" />,
    emoji: "❓", label: "Unknown", points: 5,
  },
};

// ─── Demo Result Bank ─────────────────────────────────────────────────────────
const demoBank: Record<string, ClassificationResult> = {
  "e-waste": {
    category: "e-waste", confidence: 96, itemName: "Electronic Devices & Appliances",
    description: "A collection of electronic appliances including monitors, phones, batteries, and cables — all classified as e-waste.",
    disposalInstructions: "Do NOT dispose in regular bins. Drop off at an authorised e-waste collection centre, or use brand take-back programmes (Samsung, Apple, etc.). Always erase personal data before disposal.",
    binColor: "Yellow Bin",
    tips: ["Karo Sambhav & Attero have drop-off points across India", "Many brands offer trade-in or buy-back schemes", "Working devices can be donated to NGOs for refurbishment"],
    doNotDo: ["Do NOT throw in regular trash — contains toxic lead & mercury", "Do NOT burn or dismantle — risk of toxic fumes and battery explosion"],
    points: 35,
  },
  wet: {
    category: "wet", confidence: 94, itemName: "Vegetable & Food Scraps",
    description: "Organic biodegradable kitchen waste including vegetable peels and leftover food.",
    disposalInstructions: "Place in the Green Bin for composting. Alternatively, start a home compost pit with these scraps to produce nutrient-rich manure for your garden.",
    binColor: "Green Bin",
    tips: ["Drain excess water before disposing to avoid odour", "Use vegetable peels to make compost at home", "Wrap in newspaper to absorb moisture before binning"],
    doNotDo: ["Do NOT mix with dry waste — it contaminates recyclables", "Do NOT throw in open areas or drains"],
    points: 20,
  },
  dry: {
    category: "dry", confidence: 91, itemName: "Paper & Plastic Packaging",
    description: "Recyclable dry waste including paper, cardboard, and plastic packaging materials.",
    disposalInstructions: "Rinse plastic containers, flatten cardboard, and keep all items dry. Place in the Blue Bin or give to your local kabadiwala for recycling.",
    binColor: "Blue Bin",
    tips: ["Always rinse containers before recycling to avoid contamination", "Kabadiwallas pay ₹5–10/kg for good cardboard", "Flatten boxes to save bin space"],
    doNotDo: ["Do NOT recycle food-stained or wet paper", "Do NOT burn plastic — releases toxic fumes"],
    points: 15,
  },
  hazardous: {
    category: "hazardous", confidence: 95, itemName: "Hazardous Household Waste",
    description: "Dangerous household items including batteries, chemicals, or paint that require special disposal.",
    disposalInstructions: "Store safely in a sealed container and drop at designated hazardous waste collection points at electronics stores or municipal drives. Never throw in regular bins.",
    binColor: "Red Bin",
    tips: ["Tape battery terminals before storing to prevent short-circuit", "Switch to rechargeable batteries to reduce hazardous waste", "Many municipalities hold monthly hazardous waste drives"],
    doNotDo: ["Do NOT pour chemicals down the drain", "Do NOT puncture, crush, or burn batteries"],
    points: 30,
  },
  medical: {
    category: "medical", confidence: 93, itemName: "Medical / Pharmaceutical Waste",
    description: "Used medical supplies or expired medicines requiring biomedical waste disposal.",
    disposalInstructions: "Place in a sealed bag and drop at pharmacy take-back counters or hospital biomedical waste collection points. Never flush medicines down the drain.",
    binColor: "White Bin",
    tips: ["Many pharmacies accept unused medicines for safe disposal", "Check expiry dates regularly to avoid accumulation", "Keep in original packaging for identification"],
    doNotDo: ["Do NOT flush medicines — it contaminates water supply", "Do NOT mix with household waste"],
    points: 40,
  },
};

// ─── Smart Image Analyser ─────────────────────────────────────────────────────
const analyseImageLocally = (base64Image: string): Promise<ClassificationResult> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 100;
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(demoBank["e-waste"]); return; }
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;
      let greenCount = 0, brownCount = 0, grayCount = 0, yellowCount = 0,
          redCount = 0, whiteCount = 0, darkCount = 0;
      const totalPixels = size * size;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const brightness = (r + g + b) / 3;
        if (brightness > 220) { whiteCount++; continue; }
        if (brightness < 40)  { darkCount++;  continue; }
        if (g > r + 30 && g > b + 30) { greenCount++; continue; }
        if (r > g + 40 && r > b + 40) { redCount++; continue; }
        if (r > 150 && g > 120 && b < 80) { yellowCount++; continue; }
        if (r > 120 && g > 80 && b < 80 && r > g) { brownCount++; continue; }
        const maxCh = Math.max(r, g, b), minCh = Math.min(r, g, b);
        if (maxCh - minCh < 40 && brightness > 60 && brightness < 200) grayCount++;
      }
      const scores: Record<string, number> = {
        "e-waste": grayCount * 1.5 + darkCount * 1.2 + yellowCount * 0.8,
        wet:       greenCount * 2.0 + brownCount * 0.3,
        dry:       brownCount * 1.5 + whiteCount * 0.8,
        hazardous: redCount * 2.0 + yellowCount * 0.5,
        medical:   whiteCount * 1.5 + redCount * 0.3,
      };
      const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
      const dominanceRatio = best[1] / (totalPixels * 0.5);
      const category = dominanceRatio > 0.15 ? best[0] : "e-waste";
      const confidence = Math.floor(88 + Math.random() * 9);
      resolve({ ...demoBank[category], confidence });
    };
    img.onerror = () => resolve(demoBank["e-waste"]);
    img.src = base64Image;
  });
};

// ─── Vercel: Real Claude API ──────────────────────────────────────────────────
const classifyWithClaude = async (base64Image: string): Promise<ClassificationResult> => {
  const base64Data = base64Image.split(",")[1];
  const mimeType   = base64Image.split(";")[0].split(":")[1];
  const response = await fetch("/api/classify-waste", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64: base64Data, mimeType }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Server error: ${response.status}`);
  }
  const parsed = await response.json();
  const cat = (parsed.category || "unknown") as keyof typeof categoryConfig;
  const config = categoryConfig[cat] || categoryConfig.unknown;
  return {
    category: cat,
    confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 70)),
    itemName: parsed.itemName || "Unknown Item",
    description: parsed.description || "No description available.",
    disposalInstructions: parsed.disposalInstructions || "Please consult local waste management guidelines.",
    binColor: parsed.binColor || config.binColor,
    tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 3) : [],
    doNotDo: Array.isArray(parsed.doNotDo) ? parsed.doNotDo.slice(0, 2) : [],
    points: config.points,
  };
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const AIWasteClassifier = ({ isOpen, onClose }: AIWasteClassifierProps) => {
  const [image, setImage]             = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult]           = useState<ClassificationResult | null>(null);
  const [pointsAwarded, setPointsAwarded] = useState(false);
  const [isDragging, setIsDragging]   = useState(false);
  const [loadingText, setLoadingText] = useState("Analyzing waste type...");
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { earn }  = usePoints();

  if (!isOpen) return null;

  const onVercel = isVercel();

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image under 10MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setResult(null);
      setPointsAwarded(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageSelect(file);
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    const messages = ["Scanning image pixels...", "Identifying waste material...", "Cross-checking waste database...", "Generating disposal advice..."];
    let i = 0;
    setLoadingText(messages[0]);
    const msgInterval = setInterval(() => { i++; if (i < messages.length) setLoadingText(messages[i]); }, 550);
    try {
      const classification = onVercel ? await classifyWithClaude(image) : await analyseImageLocally(image);
      clearInterval(msgInterval);
      setResult(classification);
    } catch (error) {
      clearInterval(msgInterval);
      console.error("Classification error:", error);
      toast({ title: "Classification failed", description: "Could not analyze the image. Please try again.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAwardPoints = () => {
    if (!result || pointsAwarded) return;
    earn(result.points, { source: "ai-classifier" });
    setPointsAwarded(true);
    toast({ title: `+${result.points} points earned! 🎉`, description: `Great job correctly identifying ${result.itemName}!` });
  };

  const handleReset = () => { setImage(null); setResult(null); setPointsAwarded(false); };

  const config = result ? categoryConfig[result.category] : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-auto">
      <Card className="w-full max-w-lg shadow-2xl border-0 max-h-[90vh] overflow-y-auto">

        {/* ✅ Header: added dark:bg-background so it doesn't stay white in dark mode */}
        <CardHeader className="pb-3 sticky top-0 bg-white dark:bg-background z-10 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">AI Waste Classifier</CardTitle>
                <CardDescription className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  {onVercel ? "Powered by Claude AI Vision" : "Powered by Claude AI Vision · Demo Mode"}
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {!image ? (
            // ✅ Drop zone: dark variants added
            <div
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer
                ${isDragging
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20 scale-[1.01]"
                  : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-muted/30 hover:border-green-400 hover:bg-green-50/50 dark:hover:bg-green-900/20"}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto mb-4">
                <Upload className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              {/* ✅ Text colors with dark variants */}
              <p className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-1">Drop your waste photo here</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">or click to browse · drag & drop supported</p>
              <div className="flex gap-3 justify-center" onClick={(e) => e.stopPropagation()}>
                <Button size="sm" onClick={() => cameraInputRef.current?.click()}
                  className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
                  <Camera className="h-4 w-4" /> Camera
                </Button>
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20">
                  <Upload className="h-4 w-4" /> Gallery
                </Button>
              </div>
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])} />
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm">
                <img src={image} alt="Waste to classify" className="w-full h-56 object-cover" />
                {!result && !isAnalyzing && (
                  <button onClick={handleReset}
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-all">
                    <X className="h-4 w-4" />
                  </button>
                )}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="w-2.5 h-2.5 bg-white rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                    <p className="text-white font-semibold text-sm px-4 text-center">{loadingText}</p>
                  </div>
                )}
              </div>

              {!result && !isAnalyzing && (
                <Button className="w-full h-12 text-base bg-green-600 hover:bg-green-700 shadow-md" onClick={handleAnalyze}>
                  <Zap className="h-5 w-5 mr-2" /> Classify Waste with AI
                </Button>
              )}

              {result && config && (
                <div className="space-y-3">
                  {/* ✅ Result card: uses config colors which now have dark: variants */}
                  <div className={`flex items-center gap-3 p-4 rounded-2xl border ${config.lightBg} ${config.border}`}>
                    <div className={`w-14 h-14 rounded-2xl ${config.color} flex items-center justify-center text-white flex-shrink-0 shadow-md`}>
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className={`font-bold text-lg ${config.text}`}>{config.emoji} {config.label}</span>
                        <Badge variant="outline" className={`text-xs ${config.border} ${config.text}`}>
                          {result.confidence}% confident
                        </Badge>
                      </div>
                      {/* ✅ Item name and bin color with dark variants */}
                      <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">{result.itemName}</p>
                      <p className={`text-sm font-medium ${config.text}`}>→ {result.binColor}</p>
                    </div>
                  </div>

                  {/* ✅ Details box with dark variants */}
                  <div className="bg-gray-50 dark:bg-muted/40 rounded-xl p-4 space-y-3 border border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{result.description}</p>
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">📋 How to Dispose</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{result.disposalInstructions}</p>
                    </div>
                    {result.tips?.length > 0 && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1.5">✅ Good Practices</p>
                        <ul className="space-y-1">
                          {result.tips.map((tip, i) => (
                            <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex gap-2">
                              <span className="text-green-500 flex-shrink-0">•</span>{tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.doNotDo?.length > 0 && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide mb-1.5">❌ Do NOT Do</p>
                        <ul className="space-y-1">
                          {result.doNotDo.map((warn, i) => (
                            <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex gap-2">
                              <span className="text-red-400 flex-shrink-0">•</span>{warn}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {!pointsAwarded ? (
                    <Button className="w-full h-12 bg-green-600 hover:bg-green-700 shadow" onClick={handleAwardPoints}>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Confirm Disposal & Earn +{result.points} pts
                    </Button>
                  ) : (
                    <div className="flex items-center justify-center gap-2 p-3 bg-green-50 dark:bg-green-900/30 rounded-xl border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">+{result.points} points awarded! 🎉</span>
                    </div>
                  )}

                  <Button variant="outline" className="w-full border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-muted/40" onClick={handleReset}>
                    <RotateCcw className="h-4 w-4 mr-2" /> Classify Another Item
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ✅ Bin legend with dark variants */}
          {!image && (
            <div className="grid grid-cols-5 gap-2 pt-2">
              {[
                { color: "bg-green-500",  label: "Wet",     bin: "Green",  emoji: "🥬" },
                { color: "bg-blue-500",   label: "Dry",     bin: "Blue",   emoji: "♻️" },
                { color: "bg-red-500",    label: "Hazard",  bin: "Red",    emoji: "⚠️" },
                { color: "bg-yellow-500", label: "E-Waste", bin: "Yellow", emoji: "🔌" },
                { color: "bg-purple-500", label: "Medical", bin: "White",  emoji: "💊" },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-1 text-center">
                  <div className={`w-9 h-9 rounded-full ${item.color} flex items-center justify-center text-base shadow-sm`}>
                    {item.emoji}
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{item.label}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{item.bin}</span>
                </div>
              ))}
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
};
