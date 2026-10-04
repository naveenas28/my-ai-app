import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenAI } from '@google/genai';

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('FAIL: No GEMINI_API_KEY in process.env');
    process.exit(1);
  }
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Provide a 1-sentence agricultural advice for tomato irrigation in hot weather.'
    });
    console.log('SUCCESS: Gemini response received:');
    console.log(response.text?.trim());
  } catch (err) {
    console.error('ERROR calling Gemini:', err?.message || err);
  }
}

testGemini();
