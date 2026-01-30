import { File } from 'expo-file-system';
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

// TODO: Replace with your Google Cloud Vision API key.
const GOOGLE_VISION_API_KEY = 'YOUR_API_KEY_HERE';

/**
 * Performs OCR using Google Cloud Vision API
 */
export async function performOCR(imageUri: string): Promise<string> {
  // Read image as base64 using new File API
  const file = new File(imageUri);
  const arrayBuffer = await file.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );

  // Call Google Cloud Vision API
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: base64 },
          features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
        }],
      }),
    }
  );

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'Google Vision API error');
  }

  const text = data.responses?.[0]?.fullTextAnnotation?.text || '';

  if (!text) {
    throw new Error('No text detected in image');
  }

  return text;
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

  const result = await RunAnywhere.generate(prompt, {
    maxTokens: 200,
    temperature: 0.1, // Low temperature for more deterministic output
  });

  const response = result.text;

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
 * Full pipeline: Cloud OCR + LLM parsing
 */
export async function processReceipt(
  imageUri: string,
  onProgress?: DownloadProgressCallback
): Promise<ReceiptData> {
  // Step 1: Ensure model is ready
  await ensureModelReady(onProgress);

  // Step 2: Perform OCR using Google Cloud Vision
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

/**
 * Parse text directly without OCR (for manual input or testing)
 */
export async function parseTextDirectly(
  rawText: string,
  onProgress?: DownloadProgressCallback
): Promise<ReceiptData> {
  // Step 1: Ensure model is ready
  await ensureModelReady(onProgress);

  if (!rawText.trim()) {
    throw new Error('No text provided');
  }

  // Step 2: Parse with LLM
  const parsed = await parseReceiptText(rawText);

  return {
    ...parsed,
    rawText,
  };
}
