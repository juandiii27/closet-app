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

        // Valid models found via list_models.js (Gemini 1.5 is missing for this key)
        const MODELS_TO_TRY = ["gemini-2.0-flash", "gemini-flash-latest", "gemini-2.5-flash"];
        let lastError: any = null;

        // 1. Prepare Image
        const base64Image = await fileToGenerativePart(file);
        const genAI = new GoogleGenerativeAI(API_KEY);

        // 2. Prompt Engineering
        const prompt = `
            You provide tags for a fashion app. 
            Identify the item in this image. 
            Return ONLY a single string of keywords separated by underscores.
            
            Focus on:
            1. The specific item type (e.g. "polo", "t-shirt", "dress_shirt", "hoodie").
            2. The material if visible (e.g. "cotton", "linen", "knit").
            3. The color (e.g. "navy", "white").
            4. The style/vibe based on these rules:
               - "old_money" if it has a collar, buttons, or looks like a polo/oxford.
               - "sporty" if it looks like gym wear, dry-fit, or mesh.
               - "casual" if it looks like a plain t-shirt.
            
            Example output format: "navy_blue_polo_shirt_cotton_old_money_smart_casual"
            Do not include any other text.
            `;

        // 3. Try Models Sequentially
        for (const modelName of MODELS_TO_TRY) {
            try {
                console.log(`VisionService: Attempting model '${modelName}'...`);
                const model = genAI.getGenerativeModel({ model: modelName });

                const result = await model.generateContent([prompt, base64Image]);
                const response = await result.response;
                const text = response.text().trim();

                if (!text) throw new Error("API returned empty response");

                // 4. Clean output and Return immediately on success
                const safeTagString = text.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase().substring(0, 100);
                return safeTagString;

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
