import { gemini15Flash, googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';
import Constants from 'expo-constants';

// PLACEHOLDER gemini.ts
const GOOGLE_GENAI_API_KEY = Constants.expoConfig?.extra?.GOOGLE_GENAI_API_KEY as string;

if (!GOOGLE_GENAI_API_KEY) {
  console.warn('GOOGLE_GENAI_API_KEY is not configured in app.config.js');
}

// Configure Genkit instance with types
export const ai = genkit({
  plugins: [googleAI({
    apiKey: GOOGLE_GENAI_API_KEY
  })],
  model: gemini15Flash,
});

/
interface GenerateResponse {
  text: string;
  // Add other response properties if needed
}

// Create typed flows
export const helloFlow = async (name: string): Promise<GenerateResponse> => {
  try {
    const response = await ai.generate(`Hello Gemini, my name is ${name}`);
    return response as GenerateResponse;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
};

// Example usage in components:
/*
import { helloFlow } from '../utils/gemini';

const MyComponent = () => {
  const [response, setResponse] = useState<string>('');

  const generateResponse = async () => {
    try {
      const { text } = await helloFlow('User');
      setResponse(text);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    // ... your component JSX
  );
};
*/