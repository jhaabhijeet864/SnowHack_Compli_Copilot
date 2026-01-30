import TextRecognition from '@react-native-ml-kit/text-recognition';
import { RunAnywhere } from '@runanywhere/core';

export interface ReceiptData {
  vendor: string;
  date: string;      // YYYY-MM-DD
  amount: string;
  gstin: string | null;
  rawText: string;   // Keep for debugging
}

export type DownloadProgressCallback = (progress: number) => void;

const MODEL_ID = 'lfm2-350m-q8_0';

/**
 * Performs OCR on an image to extract text
 */
export async function performOCR(imageUri: string): Promise<string> {
  const result = await TextRecognition.recognize(imageUri);
  return result.text;
}

/**
 * Ensures the LLM model is downloaded and loaded
 */
export async function ensureModelReady(onProgress?: DownloadProgressCallback): Promise<void> {
  const modelInfo = await RunAnywhere.getModelInfo(MODEL_ID);

  if (!modelInfo?.localPath) {
    // Download model first
    await RunAnywhere.downloadModel(MODEL_ID, (progress) => {
      if (onProgress) {
        onProgress(progress.progress);
      }
    });
  }

  await RunAnywhere.loadModel(MODEL_ID);
}

/**
 * Parses receipt text using the LLM to extract structured data
 */
export async function parseReceiptText(rawText: string): Promise<Omit<ReceiptData, 'rawText'>> {
  // Build prompt for the LLM
  const prompt = `Extract the following information from this receipt text. Respond ONLY with valid JSON, no other text.

Receipt text:
${rawText}

Extract these fields:
- vendor: The store or merchant name
- date: The date in YYYY-MM-DD format (if you can determine it)
- amount: The total amount paid (just the number with currency symbol)
- gstin: The GST identification number if present, or null if not found

Respond with JSON like: {"vendor": "...", "date": "...", "amount": "...", "gstin": "..." or null}

JSON:`;

  const response = await RunAnywhere.runInference(MODEL_ID, prompt, {
    maxTokens: 200,
    temperature: 0.1, // Low temperature for more deterministic output
  });

  // Parse the JSON response
  try {
    // Try to extract JSON from the response (in case there's extra text)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      vendor: parsed.vendor || 'Unknown',
      date: parsed.date || 'Unknown',
      amount: parsed.amount || 'Unknown',
      gstin: parsed.gstin || null,
    };
  } catch (parseError) {
    console.error('Failed to parse LLM response:', response);
    // Return defaults if parsing fails
    return {
      vendor: 'Unknown',
      date: 'Unknown',
      amount: 'Unknown',
      gstin: null,
    };
  }
}

/**
 * Full pipeline: OCR + LLM parsing
 */
export async function processReceipt(
  imageUri: string,
  onProgress?: DownloadProgressCallback
): Promise<ReceiptData> {
  // Step 1: Ensure model is ready
  await ensureModelReady(onProgress);

  // Step 2: Perform OCR
  const rawText = await performOCR(imageUri);
  console.log('OCR Result:', rawText);

  if (!rawText.trim()) {
    throw new Error('No text found in image');
  }

  // Step 3: Parse with LLM
  const parsed = await parseReceiptText(rawText);

  return {
    ...parsed,
    rawText,
  };
}
