import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

// Manual .env parser
function getApiKey() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const lines = envContent.split('\n');
        for (const line of lines) {
            if (line.startsWith('VITE_GEMINI_API_KEY=')) {
                return line.split('=')[1].trim().replace(/["']/g, ''); // simple cleanup
            }
        }
    } catch (e) {
        console.error("Could not read .env file");
    }
    return null;
}

async function run() {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error("No API KEY found in .env");
        return;
    }
    console.log("Using API Key: " + apiKey.substring(0, 5) + "...");

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        console.log("Fetching available models...");
        const modelResponse = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        // Note: The SDK doesn't expose listModels() directly on the client instance in some versions,
        // it's often a separate manager or just trial and error.
        // Wait, looking at docs, typically it's NOT exposed in the web-client focused SDK easily without google-generative-ai/server or similar.
        // Actually, let's try a direct REST call to be sure, avoiding SDK quirks.
    } catch {
        // ignore
    }

    // Direct fetch is safer for debugging raw access
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("API Error:", data.error);
        } else if (data.models) {
            console.log("\n--- AVAILABLE MODELS ---");
            data.models.forEach(m => {
                if (m.name.includes('gemini')) {
                    console.log(`- ${m.name}`); // e.g. models/gemini-pro
                }
            });
            console.log("------------------------\n");
        } else {
            console.log("No models found or unexpected format:", data);
        }
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

run();
