import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createWorker } from "tesseract.js";

// 1. The Risky Dictionary (Moved to frontend)
const RISKY_DB = [
  { name: "Maltodextrin", risk: "high", reason: "Ultra-processed starch, high glycemic spike.", category: "additive" },
  { name: "MSG", risk: "high", reason: "Flavor enhancer linked to sensitivities.", category: "additive" },
  { name: "Aspartame", risk: "high", reason: "Artificial sweetener with health controversy.", category: "sweetener" },
  { name: "Palm Oil", risk: "moderate", reason: "High saturated fat & environment impact.", category: "oil" },
  { name: "Carrageenan", risk: "moderate", reason: "May cause digestive inflammation.", category: "thickener" },
  { name: "High Fructose Corn Syrup", risk: "high", reason: "Processed sugar linked to metabolic issues.", category: "sweetener" },
  { name: "Sodium Nitrite", risk: "high", reason: "Preservative used in processed meats.", category: "preservative" }
];

export function useOcrAnalyze(options?: { onSuccess?: (data: any) => void }) {
  return useMutation({
    mutationFn: async (payload: { imageBase64: string }) => {
      // 2. Initialize Tesseract Browser Worker
      const worker = await createWorker('eng');
      
      // 3. Perform Recognition
      const { data: { text } } = await worker.recognize(`data:image/jpeg;base64,${payload.imageBase64}`);
      await worker.terminate();

      const cleanText = text.replace(/\n/g, " ");

      // 4. Run Deterministic Matching
      const foundRisks = RISKY_DB.filter(item => 
        cleanText.toLowerCase().includes(item.name.toLowerCase())
      ).map(item => ({
        ...item,
        alternatives: ["Natural Spices", "Stevia", "Olive Oil"]
      }));

      // 5. Construct the result (Matching your UI expectations)
      const result = {
        id: crypto.randomUUID(),
        ingredients: foundRisks,
        risk_summary: {
          overall_risk: foundRisks.length > 2 ? "high" : foundRisks.length > 0 ? "moderate" : "safe",
          high_risk_count: foundRisks.filter(r => r.risk === "high").length,
          moderate_risk_count: foundRisks.filter(r => r.risk === "moderate").length,
          safe_count: foundRisks.length === 0 ? 1 : 0,
          top_concerns: foundRisks.slice(0, 2).map(r => r.name)
        },
        ai_verdict: foundRisks.length > 0 
          ? `Local Analysis: Found ${foundRisks.length} risky items.` 
          : "No common high-risk additives detected.",
        ocr: {
          ingredient_section: cleanText,
          confidence: 0.85
        }
      };

      // 6. Optional: Sync to DB for history (Non-blocking)
      fetch('/api/scan/ocr/save', {
        method: 'POST',
        body: JSON.stringify(result)
      }).catch(err => console.error("History sync failed", err));

      return result;
    },
    onSuccess: options?.onSuccess
  });
}