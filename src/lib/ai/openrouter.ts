export async function queryOpenRouter(
  messages: { role: string; content: string }[],
  options?: { model?: string; temperature?: number; max_tokens?: number }
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY || '';
  const model = options?.model || 'google/gemini-2.5-flash';
  const temperature = options?.temperature ?? 0.3;

  if (!apiKey || apiKey === 'your-openrouter-api-key-here' || apiKey === '') {
    throw new Error('OpenRouter API Key not configured');
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'LicitaHub',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: options?.max_tokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter returned status ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('OpenRouter query failed:', error);
    throw error;
  }
}
