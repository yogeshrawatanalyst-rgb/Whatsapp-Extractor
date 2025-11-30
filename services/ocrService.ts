import Tesseract from 'tesseract.js';
import { ExtractedData } from '../types';

let worker: any = null;
let isWorkerLoading = false;

// Initialize the OCR worker once to improve performance
export const initOCR = async () => {
  if (worker || isWorkerLoading) return;
  
  try {
    isWorkerLoading = true;
    // Use Tesseract.createWorker (default export)
    worker = await Tesseract.createWorker('eng');
    console.log("OCR Worker initialized");
  } catch (error) {
    console.error("Failed to initialize OCR worker:", error);
  } finally {
    isWorkerLoading = false;
  }
};

// Regex to find 6-digit codes (e.g., 123456 or 123-456)
// Negative lookbehind/ahead ensures we don't grab parts of longer numbers
const CODE_REGEX = /(?<!\d)(\d{3}[-\s]?\d{3})(?!\d)/g;

export const extractDataFromImage = async (imageSource: string): Promise<ExtractedData[]> => {
  if (!worker) await initOCR();
  if (!worker) return []; // Safety check

  try {
    // Tesseract expects a base64 string with prefix or a blob/url
    // Ensure the image source is formatted correctly
    const finalSource = imageSource.startsWith('data:') 
      ? imageSource 
      : `data:image/jpeg;base64,${imageSource}`;

    const { data: { text, lines } } = await worker.recognize(finalSource);
    
    // Heuristic: In WhatsApp Web, the header (Sender Name) is usually the first line of text
    // We filter out common status words like "online" or timestamps
    let probableSender = "Unknown Sender";
    const cleanLines = lines.filter((l: any) => l.text.trim().length > 0);
    
    if (cleanLines.length > 0) {
       // Take the first line that doesn't look like a time or common UI element
       const firstLine = cleanLines[0].text.trim();
       if (!firstLine.match(/^\d{1,2}:\d{2}$/) && firstLine.toLowerCase() !== 'online') {
          probableSender = firstLine;
       }
    }

    return parseTextForCodes(text, probableSender);
  } catch (error) {
    console.error("OCR Extraction Error:", error);
    return [];
  }
};

export const parseTextForCodes = (fullText: string, defaultSender: string = "Unknown"): ExtractedData[] => {
  const matches = [...fullText.matchAll(CODE_REGEX)];
  const results: ExtractedData[] = [];

  matches.forEach(match => {
    const rawCode = match[0];
    const cleanCode = rawCode.replace(/[-\s]/g, ''); // Remove dash/space
    
    // Find the line containing this code for context
    const lines = fullText.split('\n');
    const contextLine = lines.find(line => line.includes(rawCode)) || rawCode;

    results.push({
      sender: defaultSender, // We apply the header sender to all codes found in this frame
      code: cleanCode,
      originalMessage: contextLine.trim(),
      confidence: 1.0, // OCR matches are "certain" regarding the regex pattern
      timestamp: Date.now()
    });
  });

  return results;
};