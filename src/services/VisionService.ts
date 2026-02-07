import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const VisionService = {
    /**
     * Analyzes an image file and returns a descriptive filename string 
     * formatted for StyleMemory consumption.
     * Example output: "blue_polo_cotton_old_money"
     */
    async analyzeClothing(file: File): Promise<string> {
        if (!API_KEY) {
            throw new Error("Configuration Error: VITE_GEMINI_API_KEY is missing in .env");
        }

        // Valid models found via list_models.js
        const MODELS_TO_TRY = ["gemini-2.5-flash-lite"];
        let lastError: any = null;

        // 1. Prepare Image
        const base64Image = await fileToGenerativePart(file);
        const genAI = new GoogleGenerativeAI(API_KEY);

        // 2. Prompt Engineering (Structured JSON)
        const prompt = `
            You are a fashion-aware computer vision assistant used in a clothing outfit builder.
            Your task is to analyze a single clothing item image and return a structured, conservative description.

            IMPORTANT RULES:
            - Do NOT guess brand names.
            - Do NOT guess occasion.
            - Do NOT invent missing details.
            - If unsure, mark the field as "unknown".
            - Prefer precision over creativity.
            - Your output will be used by a strict rule-based outfit engine.

            Return ONLY valid JSON. No commentary.

            Analyze the clothing item in this image and extract its visual attributes.
            Return the following fields:
            - category: One of [Top, Bottom, Shoes, Accessory]
            - subCategory: Specific garment type if clear (e.g., Polo, TShirt, Hoodie, Chino, Jeans, Loafer, Sneaker, Watch). Otherwise "unknown".
            - neckline_or_structure: Describe presence of collar, buttons, structure, or lack thereof.
            - primaryColor: The dominant visible color.
            - secondaryColors: Any additional visible colors (array).
            - fabricAppearance: Visual guess only (e.g., knit, woven, denim, leather, fleece). If unclear, "unknown".
            - fitAppearance: One of [slim, regular, oversized, unknown].
            - formalitySignal: One of [casual, smart-casual, formal, unknown] based purely on visual cues.
            - patterns: Any visible patterns (e.g., stripes, solid, logo). If none, "none".
            - confidenceScore: A number from 0 to 1 representing how confident you are in this analysis.
            `;

        // 3. Try Models Sequentially
        for (const modelName of MODELS_TO_TRY) {
            try {
                console.log(`VisionService: Attempting model '${modelName}'...`);
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: { responseMimeType: "application/json" }
                });

                const result = await model.generateContent([prompt, base64Image]);
                const response = await result.response;
                const text = response.text().trim();

                if (!text) throw new Error("API returned empty response");

                // 4. Parse JSON and convert to tag string for compatibility
                try {
                    const data = JSON.parse(text);
                    console.log("Vision JSON:", data);

                    // Flatten to tags: "navy_blue_polo_cotton_smart_casual"
                    const tags = [
                        data.primaryColor,
                        data.subCategory !== 'unknown' ? data.subCategory : data.category,
                        data.fabricAppearance !== 'unknown' ? data.fabricAppearance : '',
                        data.formalitySignal !== 'unknown' ? data.formalitySignal : '',
                        ...(Array.isArray(data.secondaryColors) ? data.secondaryColors : []),
                        data.patterns !== 'none' ? data.patterns : ''
                    ].filter(t => t && t !== 'unknown').join('_').toLowerCase();

                    const safeTagString = tags.replace(/[^a-zA-Z0-9_]/g, '_');
                    return safeTagString;
                } catch (jsonError) {
                    console.warn("Failed to parse Vision JSON, falling back to raw text cleanup", jsonError);
                    const safeTagString = text.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase().substring(0, 100);
                    return safeTagString;
                }

            } catch (error: any) {
                console.warn(`VisionService: Model '${modelName}' failed:`, error.message);
                lastError = error;
                // Continue to next model
            }
        }

        // If all failed
        console.error("VisionService: All models failed.");
        throw new Error(lastError?.message || "All Vision models failed.");
    }
};

async function fileToGenerativePart(file: File) {
    let mimeType = file.type;
    let base64Data = "";

    // Gemini API does not support AVIF, so we convert it to PNG
    if (mimeType === "image/avif") {
        try {
            console.log("VisionService: Converting AVIF to PNG for compatibility...");
            base64Data = await convertAvifToPng(file);
            mimeType = "image/png";
        } catch (e) {
            console.warn("VisionService: Failed to convert AVIF, trying original file...", e);
            // Fallback to original behavior if conversion fails
            base64Data = await readFileToBase64(file);
        }
    } else {
        base64Data = await readFileToBase64(file);
    }

    return {
        inlineData: { data: base64Data, mimeType },
    };
}

function readFileToBase64(file: File): Promise<string> {
    return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
}

function convertAvifToPng(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("Could not get canvas context"));
                return;
            }
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL("image/png");
            resolve(dataUrl.split(",")[1]); // Return only base64 data
            URL.revokeObjectURL(img.src); // Clean up
        };
        img.onerror = (e) => {
            URL.revokeObjectURL(img.src);
            reject(e);
        };
        img.src = URL.createObjectURL(file);
    });
}
