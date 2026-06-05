// supabase/functions/ocr-analyze/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { OpenAI } from "https://esm.sh/openai@4.28.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { image_base64 } = await req.json()
    
    // 1. Google Vision OCR (Using REST API for free-tier simplicity)
    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${Deno.env.get('GOOGLE_VISION_API_KEY')}`,
      {
        method: 'POST',
        body: JSON.stringify({
          requests: [{
            image: { content: image_base64.split(',')[1] },
            features: [{ type: 'TEXT_DETECTION' }]
          }]
        })
      }
    )
    const visionData = await visionRes.json()
    const rawText = visionData.responses[0]?.fullTextAnnotation?.text || ""

    // 2. OpenAI GPT-4o-mini for Structured Analysis
    const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') })
    const aiCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are a food scientist. Analyze the provided ingredient text. Return a JSON object matching the OcrAnalysisResponseSchema. Identify risks like carcinogens, high fructose corn syrup, or hidden allergens." 
        },
        { role: "user", content: rawText }
      ],
      response_format: { type: "json_object" }
    })

    return new Response(aiCompletion.choices[0].message.content, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})