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
let diagnosticsLogged = false;
let workingModel: string | null = null;

const maskKey = (key: string | undefined) => {
  if (!key) return '{MISSING}';
  if (key.length < 8) return '{PRESENT_BUT_SHORT}';
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
};

const GEMINI_MODELS = [
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
  'gemini-pro',
  'gemini-1.5-flash'
];

const OPENROUTER_MODEL = 'google/gemini-flash-1.5';
const COHERE_MODEL = 'command-r-08-2024';

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
  const cohereKey = process.env.NEXT_PUBLIC_COHERE_API_KEY;

  const prompt = `You are the Velora SafeRoute AI assistant. 
Explain why "${routeName}" is a good route choice:
- Safety Score: ${score}/100
- Risk Level: ${riskLevel}
- Congestion: ${metrics.congestion}
- Weather: ${metrics.weather}
- Area Risk: ${metrics.zone}
Keep it under 25 words. Be premium, reassuring, professional.`;

  // Log Diagnostics once
  if (!diagnosticsLogged) {
    console.log(`[Velora] AI Connection Audit:
      - Gemini Status: ${geminiKey ? 'DETECTED (' + maskKey(geminiKey) + ')' : 'MISSING'}
      - OpenRouter Status: ${openRouterKey ? 'DETECTED (' + maskKey(openRouterKey) + ')' : 'MISSING'}
      - Cohere Status: ${cohereKey ? 'DETECTED (' + maskKey(cohereKey) + ')' : 'MISSING'}`);
    
    if (!cohereKey && !openRouterKey && !geminiKey) {
      console.warn('[Velora] CRITICAL: No API keys found. Please restart your dev server after updating .env.local.');
    }
    diagnosticsLogged = true;
  }

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

  // Try Cohere tertiary fallback
  if (cohereKey) {
    try {
      const result = await tryCohere(cohereKey, prompt);
      if (result) {
        console.log('[Velora] Using Cohere tertiary fallback');
        return result;
      }
    } catch (err) {
      console.warn('[Velora] Cohere fallback failed:', err);
    }
  }

  // Try Ollama Ultimate Fallback (Local)
  try {
    const result = await tryOllama(prompt);
    if (result) {
      console.log('[Velora] Using Ollama ultimate fallback (Local)');
      return result;
    }
  } catch (err) {
    // Silent fail for Ollama unless requested
  }

  // All AI providers failed, use template fallback
  if (!diagnosticsLogged) {
    console.warn('[Velora] All AI providers unavailable. Using template explanations.');
    diagnosticsLogged = true;
  }
  
  return FALLBACK(routeName, riskLevel, score);
};

export const getNeighborhoodSafetyProfile = async (neighborhoods: string[]): Promise<Array<{ name: string, risk: 'Low' | 'Medium' | 'High', description: string }>> => {
  const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!geminiKey || !neighborhoods.length) return [];

  const prompt = `Perform a tactical safety audit for these neighborhoods/areas: ${neighborhoods.join(', ')}.
For each area, provide:
1. Risk Level (Low, Medium, or High) based on urban safety data, crime trends, and pedestrian security.
2. A very brief (10 word) description of the safety profile.
Return ONLY a valid JSON array of objects with keys: name, risk, description.`;

  try {
    const result = await tryGeminiModel('gemini-1.5-flash', geminiKey, prompt);
    if (result) {
      // Clean up potential markdown formatting from AI response
      const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    }
  } catch (err) {
    console.warn('[Velora] Neighborhood Safety Audit failed, rolling back to baseline safety profiles.');
  }

  return neighborhoods.map(name => ({
    name,
    risk: 'Low',
    description: 'Standard urban safety profile. Maintain normal awareness.'
  }));
};

async function tryGeminiModel(model: string, apiKey: string, prompt: string): Promise<string | null> {
  // Using v1beta for better compatibility with current Flash aliases
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
        'Authorization': `Bearer ${apiKey.trim()}`,
        'HTTP-Referer': 'https://velora-safe-route.app', 
        'X-Title': 'Velora SafeRoute'
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.warn(`[Velora] OpenRouter error ${response.status}: ${errText.substring(0, 100)}`);
    return null;
  }
  const data = await response.json();
  return data?.choices?.[0]?.message?.content || null;
}

async function tryCohere(apiKey: string, prompt: string): Promise<string | null> {
  const response = await fetch(
    'https://api.cohere.com/v2/chat',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: COHERE_MODEL,
        messages: [{ role: 'user', content: prompt }]
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.warn(`[Velora] Cohere error ${response.status}: ${errText.substring(0, 100)}`);
    return null;
  }
  const data = await response.json();
  return data?.message?.content?.[0]?.text || data?.text || null;
}

async function tryOllama(prompt: string): Promise<string | null> {
  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2', // Standard default
        messages: [{ role: 'user', content: prompt }],
        stream: false
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.message?.content || null;
  } catch (e) {
    return null; // Local Ollama not running
  }
}
