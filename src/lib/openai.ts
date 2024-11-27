import OpenAI from 'openai';

export function createOpenAIClient(apiKey: string | null) {
  if (!apiKey) return null;
  
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });
}