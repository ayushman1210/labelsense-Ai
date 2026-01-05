import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* ------------ GEMINI CLIENT ------------ */

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/* ------------ SYSTEM PROMPT ------------ */

const SYSTEM_PROMPT = `
You are an AI-native consumer health co-pilot.

Rules:
- Do not judge food as good or bad
- Do not use fear-based language
- Do not provide medical advice

Ingredient clustering is REQUIRED:
- Group ingredients into 3–5 functional clusters
- Each cluster must explain a system-level purpose
- Do NOT create one cluster per ingredient

Summary rules:
- EXACTLY 3 insights
- Insights must depend on the ingredient list

Return VALID JSON ONLY in this format:
{
  "clusters": [
    {
      "name": "Cluster name",
      "ingredients": ["ingredient"],
      "purpose": "Why this cluster exists"
    }
  ],
  "summary": ["Insight 1", "Insight 2", "Insight 3"],
  "why": "Why these ingredients exist",
  "tradeoffs": "What is gained and lost",
  "uncertainty": "What science knows and does not"
}

Do not include markdown, explanations, or extra text.
`;

/* ------------ ROUTE ------------ */

app.post("/analyze", async (req, res) => {
  try {
    const { ingredients } = req.body;

    if (!ingredients || typeof ingredients !== "string") {
      return res.status(400).json({ error: "Ingredients must be a string" });
    }

    const prompt = `
${SYSTEM_PROMPT}

Ingredients:
${ingredients}

Context seed: ${Date.now()}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim();

    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      console.error("❌ JSON PARSE FAILED:", text);
      return res.status(500).json({
        error: "AI returned invalid JSON",
        raw: text,
      });
    }

    return res.json(parsed);

  } catch (err) {
    console.error("❌ ANALYZE ERROR:", err.message);
    res.status(500).json({
      error: "Failed to analyze ingredients",
      detail: err.message,
    });
  }
});

/* ------------ SERVER ------------ */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`  backend running on port ${PORT}`);
});
