import { useMutation } from "@tanstack/react-query";
import { createWorker } from "tesseract.js";

// 1. EXTENSIVE PRODUCTION DICTIONARY
const RISKY_DB = [
  {
    name: "Bad Fats / Palm Oil",
    matches: ["palm", "palmolein", "vegetable fat", "hydrogenated", "cottonseed", "vanaspati"],
    risk: "moderate",
    reason: "High in saturated fats. Cottonseed and Vanaspati are common in processed snacks.",
    category: "oil"
  },
  {
    name: "MSG / Flavor Enhancers",
    matches: ["msg", "glutamate", "e621", "e627", "e631", "flavour enhancer", "yeast extract", "hydrolyzed"],
    risk: "high",
    reason: "Excitotoxins. INS 627 and 631 are often used to hide MSG content.",
    category: "additive"
  },
  {
    name: "Ultra-Processed Sugars",
    matches: ["sugar", "sucrose", "maltodextrin", "glucose", "syrup", "invert sugar", "fructose", "dextrose", "e951", "aspartame", "sucralose"],
    risk: "high",
    reason: "Causes high glycemic load. Invert sugar and maltodextrin are common in Indian biscuits/wafers.",
    category: "sweetener"
  },
  {
    name: "Synthetic Colors",
    matches: ["color", "colour", "e102", "e110", "e127", "e129", "tartrazine", "sunset yellow", "allura red", "erythrosine"],
    risk: "high",
    reason: "Linked to hyperactivity in children and potential allergic reactions.",
    category: "colorant"
  },
  {
    name: "Chemical Preservatives",
    matches: ["benzoate", "nitrite", "nitrate", "e211", "e250", "sorbate", "e202", "bha", "bht", "e320"],
    risk: "high",
    reason: "Artificial shelf-life extenders. BHA/BHT are potentially carcinogenic.",
    category: "preservative"
  },
  {
    name: "Refined Flour / Carbs",
    matches: ["maida", "refined wheat", "starch", "modified starch", "tapioca starch"],
    risk: "moderate",
    reason: "High processing removes fiber. Maida is a leading cause of metabolic issues.",
    category: "grain"
  },
  {
    name: "Acidity Regulators / Thickeners",
    matches: ["ins 330", "ins 500", "ins 415", "ins 412", "guar gum", "xanthan gum", "carrageenan"],
    risk: "low",
    reason: "Generally safe but can cause bloating or digestive issues in sensitive individuals.",
    category: "stabilizer"
  }
];

const NATURAL_DB = [
  "potato", "wheat", "milk", "oat", "rice", "fruit", "water", "corn",
  "chana", "besan", "lentil", "pulse", "turmeric", "cumin", "pepper"
];

export function useOcrAnalyze(options?: { onSuccess?: (data: any) => void }) {
  return useMutation({
    mutationFn: async (payload: { imageBase64: string, mimeType?: string }) => {
      const worker = await createWorker('eng');

      // OPTIMIZATION: Tell Tesseract to expect specific characters 
      // This reduces noise like "|" or "@"
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789(),. %',
      });

      const { data: { text } } = await worker.recognize(`data:image/jpeg;base64,${payload.imageBase64}`);
      await worker.terminate();

      // Lowercase and remove excessive special characters for matching
      const cleanText = text.toLowerCase()?.replace(/[^a-z0-9\s]/g, ' ');

      const foundRisks = [];

      for (const item of RISKY_DB) {
        const hasMatch = item.matches.some(keyword => cleanText.includes(keyword));
        if (hasMatch) {
          foundRisks.push({
            name: item.name,
            risk: item.risk,
            reason: item.reason,
            category: item.category,
            alternatives: item.category === "oil" ? ["Olive Oil", "Ghee"] : ["Natural Spices", "Jaggery"]
          });
        }
      }

      const detectedNatural = NATURAL_DB.filter(word => cleanText.includes(word));

      // Construct Result
      const result = {
        id: crypto.randomUUID(),
        ingredients: foundRisks,
        detected_natural: detectedNatural,
        risk_summary: {
          overall_risk: foundRisks.some(i => i.risk === 'high') ? 'high' : foundRisks.length > 0 ? 'moderate' : 'safe',
          high_risk_count: foundRisks.filter(r => r.risk === "high").length,
          moderate_risk_count: foundRisks.filter(r => r.risk === "moderate").length,
          safe_count: detectedNatural.length,
          top_concerns: foundRisks.slice(0, 2).map(r => r.name)
        },
        ai_verdict: foundRisks.length > 0
          ? `Analysis: Found ${foundRisks.length} additives. Watch out for ${foundRisks[0].name}.`
          : "Clean Label: No high-risk chemicals detected.",
        ocr: {
          ingredient_section: text,
          confidence: 0.85
        },
      };

      // Save to Supabase (Background)
      fetch('/api/scan/ocr/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      }).catch(() => { });

      return result;
    },
    onSuccess: options?.onSuccess
  });
}