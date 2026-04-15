/**
 * Zero-Dependency AI Provider
 * Uses standard fetch to call Google Generative AI with OpenRouter fallback
 * Tries multiple models in order: gemini-2.5-flash, gemini-2.0-flash-lite, gemini-1.5-flash
 * Falls back to OpenRouter (openai/gpt-oss-120b:free) if Gemini is unavailable
 *
 * Setup: Get a free API key at https://aistudio.google.com/app/apikey
 * Then set NEXT_PUBLIC_GEMINI_API_KEY in .env.local
 */

// Cache API availability so we don't spam 404s on every call
let geminiAvailable: boolean | null = null;
let openRouterAvailable: boolean | null = null;
let errorLogged = false; // Only log error once
let workingModel: string | null = null; // Cache which model works

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];

const OPENROUTER_MODEL = 'openai/gpt-oss-120b:free';

const FALLBACK = (routeName: string, riskLevel: string, score: number) =>
  `${routeName} is recommended for its ${riskLevel} risk profile and high safety rating of ${score}/100.`;

export const generateSafetyExplanation = async (
  routeName: string,
  score: number,
  riskLevel: string,
  metrics: { congestion: string; weather: string; zone: string }
): Promise<string> => {
  const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const openRouterKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

  const prompt = `You are the Velora SafeRoute AI assistant. 
Explain why "${routeName}" is a good route choice:
- Safety Score: ${score}/100
- Risk Level: ${riskLevel}
- Congestion: ${metrics.congestion}
- Weather: ${metrics.weather}
- Area Risk: ${metrics.zone}
Keep it under 25 words. Be premium, reassuring, professional.`;

  // Try Gemini first if key is available
  if (geminiKey && geminiAvailable !== false) {
    // If we already know which model works, use it
    if (workingModel) {
      try {
        const result = await tryGeminiModel(workingModel, geminiKey, prompt);
        if (result) return result;
      } catch (err) {
        // Model stopped working, reset and try others
        workingModel = null;
      }
    }

    // Try each Gemini model until one works
    for (const model of GEMINI_MODELS) {
      try {
        const result = await tryGeminiModel(model, geminiKey, prompt);
        if (result) {
          workingModel = model; // Cache successful model
          geminiAvailable = true;
          console.log(`[Velora] Using Gemini model: ${model}`);
          return result;
        }
      } catch (err) {
        continue;
      }
    }

    // All Gemini models failed
    geminiAvailable = false;
    console.warn('[Velora] Gemini API unavailable, trying OpenRouter fallback');
  }

  // Try OpenRouter fallback
  if (openRouterKey && openRouterAvailable !== false) {
    try {
      const result = await tryOpenRouter(openRouterKey, prompt);
      if (result) {
        openRouterAvailable = true;
        console.log('[Velora] Using OpenRouter fallback');
        return result;
      }
    } catch (err) {
      openRouterAvailable = false;
      console.warn('[Velora] OpenRouter fallback failed');
    }
  }

  // All AI providers failed, use template fallback
  if (!errorLogged) {
    console.warn('[Velora] All AI providers unavailable. Using template explanations.');
    errorLogged = true;
  }
  
  return FALLBACK(routeName, riskLevel, score);
};

async function tryGeminiModel(model: string, apiKey: string, prompt: string): Promise<string | null> {
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

async function tryOpenRouter(apiKey: string, prompt: string): Promise<string | null> {
  const response = await fetch(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://mineral-bonus-493403-a1.web.app',
        'X-Title': 'Velora SafeRoute'
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.7
      }),
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || null;
}
