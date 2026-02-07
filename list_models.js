
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

// Simple .env parser since we don't want to install dotenv just for this
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        const envContent = fs.readFileSync(envPath, 'utf-8');
        for (const line of envContent.split('\n')) {
            const [key, ...values] = line.split('=');
            if (key && values.length > 0) {
                process.env[key.trim()] = values.join('=').trim();
            }
        }
    } catch (e) {
        console.error("Could not read .env file");
    }
}

loadEnv();

const apiKey = process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.error("No API KEY found in .env");
    process.exit(1);
}

async function listModels() {
    const genAI = new GoogleGenerativeAI(apiKey);
    // There is no direct "listModels" on the client instance in some versions, 
    // but we can try to get a model and run a test, 
    // OR use the ModelService if exposed. 
    // Actually, the Node SDK *does* have a ModelManager or similar?
    // Looking at docs, typically one uses curl to list. 
    // But let's try a simple generation test on known aliases to see which one works.

    const candidates = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash-001",
        "gemini-1.5-pro",
        "gemini-pro",
        "gemini-2.0-flash-exp"
    ];

    console.log("Testing Model Availability...");

    for (const modelName of candidates) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello check");
            await result.response;
            console.log(`✅ ${modelName} is AVAILABLE`);
        } catch (error) {
            console.log(`❌ ${modelName} FAILED: ${error.message.split('[')[0]}`); // Short error
        }
    }
}

listModels();
