/**
 * Zero-Dependency AI Provider
 * Uses standard fetch to call Google Generative AI
 * Tries multiple models in order: gemini-2.5-flash, gemini-2.0-flash-lite, gemini-1.5-flash
 *
 * Setup: Get a free API key at https://aistudio.google.com/app/apikey
 * Then set NEXT_PUBLIC_GEMINI_API_KEY in .env.local
 */

// Cache API availability so we don't spam 404s on every call
let geminiAvailable: boolean | null = null;
let errorLogged = false; // Only log error once
let workingModel: string | null = null; // Cache which model works

const MODELS_TO_TRY = [
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];

const FALLBACK = (routeName: string, riskLevel: string, score: number) =>
  `${routeName} is recommended for its ${riskLevel} risk profile and high safety rating of ${score}/100.`;

export const generateSafetyExplanation = async (
  routeName: string,
  score: number,
  riskLevel: string,
  metrics: { congestion: string; weather: string; zone: string }
): Promise<string> => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  // No key configured — use fallback silently
  if (!apiKey) {
    return `${routeName} is currently ${riskLevel} risk with a safety score of ${score}/100. Recommended based on current traffic and environmental data.`;
  }

  // API previously failed (bad key / not enabled) — skip to avoid 404 spam
  if (geminiAvailable === false) {
    return FALLBACK(routeName, riskLevel, score);
  }

  const prompt = `You are the Velora SafeRoute AI assistant. 
Explain why "${routeName}" is a good route choice:
- Safety Score: ${score}/100
- Risk Level: ${riskLevel}
- Congestion: ${metrics.congestion}
- Weather: ${metrics.weather}
- Area Risk: ${metrics.zone}
Keep it under 25 words. Be premium, reassuring, professional.`;

  // If we already know which model works, use it
  if (workingModel) {
    try {
      const result = await tryModel(workingModel, apiKey, prompt);
      if (result) return result;
    } catch (err) {
      // Model stopped working, reset and try others
      console.warn('[Velora] Cached model failed, trying alternatives');
      workingModel = null;
    }
  }

  // Try each model until one works
  for (const model of MODELS_TO_TRY) {
    try {
      const result = await tryModel(model, apiKey, prompt);
      if (result) {
        workingModel = model; // Cache successful model
        geminiAvailable = true;
        console.log(`[Velora] Using Gemini model: ${model}`);
        return result;
      }
    } catch (err) {
      // Continue to next model
      console.warn(`[Velora] Model ${model} failed, trying next`);
      continue;
    }
  }

  // All models failed
  geminiAvailable = false;
  if (!errorLogged) {
    console.warn(
      `[Velora] Gemini API unavailable (quota exceeded or models not accessible). Using smart fallback explanations.`
    );
    errorLogged = true;
  }
  
  return FALLBACK(routeName, riskLevel, score);
};

async function tryModel(model: string, apiKey: string, prompt: string): Promise<string | null> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
}
