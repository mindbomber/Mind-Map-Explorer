
import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const fetchRelatedWords = async (word: string): Promise<string[]> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide 6 to 8 unique words or very short phrases (max 2 words) that are conceptually or contextually related to "${word}". Focus on diverse associations, including scientific, cultural, metaphorical, and unexpected but logical connections.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            description: "A related word or short phrase",
          },
        },
        temperature: 0.8,
      },
    });

    if (!response.text) return [];
    const words: string[] = JSON.parse(response.text.trim());
    // Filter out the original word and duplicates
    return Array.from(new Set(words.filter(w => w.toLowerCase() !== word.toLowerCase())));
  } catch (error) {
    console.error("Error fetching related words:", error);
    return ["Error", "Retry", "Wait"];
  }
};
