const Groq = require('groq-sdk');

let groqClient = null;

function getClient() {
  if (!groqClient) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured in environment variables');
    }
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

/**
 * Extracts the first valid JSON object from a string, tolerating
 * accidental markdown code fences or leading/trailing text.
 */
function extractJSON(text) {
  if (!text) throw new Error('Empty response from AI model');

  let cleaned = text.trim();
  cleaned = cleaned.replace(/```json/gi, '').replace(/```/g, '').trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    throw new Error('No JSON object found in AI response');
  }

  const jsonStr = cleaned.slice(firstBrace, lastBrace + 1);
  return JSON.parse(jsonStr);
}

/**
 * Sends a prompt to Groq's chat completion endpoint and returns the
 * parsed JSON object from the model's reply.
 */
async function getStructuredCompletion(prompt, { temperature = 0.3, maxTokens = 1500 } = {}) {
  const client = getClient();
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
  });

  const content = completion?.choices?.[0]?.message?.content;
  return extractJSON(content);
}

module.exports = { getStructuredCompletion, extractJSON };
