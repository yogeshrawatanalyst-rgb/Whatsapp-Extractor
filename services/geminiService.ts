import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ExtractedData } from "../types";

const SYSTEM_INSTRUCTION = `
You are a real-time data extraction assistant monitoring a WhatsApp Web screen.
Your goal is to identify and extract 6-digit numeric verification codes and the sender's identity.

CONTEXT:
- You are viewing a screenshot of a WhatsApp Web interface.
- The "Sender" is likely the contact name at the top of the active chat window, or the phone number in the message bubble.
- Messages may be messy or contain conversational text.
- Ignore messages that do not contain a distinct 6-digit code.

RULES:
1. Extract the **Sender Name/Number**. Look at the chat header or the message metadata.
2. Extract the **6-digit Code**. Remove spaces, dashes, or hyphens (e.g., "123-456" -> "123456").
3. If multiple codes are visible, extract all of them as separate entries.
4. If a code is split across lines, join it.
5. High confidence only. If it looks like a phone number and not a code, ignore it.
`;

const RESPONSE_SCHEMA: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      sender: {
        type: Type.STRING,
        description: "The name or phone number of the sender. Check chat header first.",
      },
      code: {
        type: Type.STRING,
        description: "The clean 6-digit code.",
      },
      originalMessage: {
        type: Type.STRING,
        description: "The text context surrounding the code.",
      },
      confidence: {
        type: Type.NUMBER,
        description: "Confidence score between 0 and 1.",
      },
    },
    required: ["sender", "code", "originalMessage"],
  },
};

export const extractCodesFromImage = async (base64Image: string, mimeType: string): Promise<ExtractedData[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: "Analyze this WhatsApp screen. Extract any 6-digit verification codes and the sender.",
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) return [];

    const parsed = JSON.parse(text) as Omit<ExtractedData, 'timestamp'>[];
    
    // Add client-side timestamp
    return parsed.map(item => ({
      ...item,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error("Gemini Vision Extraction Error:", error);
    // Return empty array on error to keep monitor running
    return [];
  }
};

export const extractCodesFromText = async (rawText: string): Promise<ExtractedData[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Extract 6-digit codes and senders from this text dump: \n\n${rawText}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) return [];

    const parsed = JSON.parse(text) as Omit<ExtractedData, 'timestamp'>[];
    return parsed.map(item => ({
      ...item,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error("Gemini Text Extraction Error:", error);
    throw error;
  }
};