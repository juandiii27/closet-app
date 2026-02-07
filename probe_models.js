
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

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
    console.error("No API KEY found");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

const CANDIDATES = [
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash-lite-001",
    "gemini-2.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-flash-latest", // We know this has 20 limit, might be used up
    "gemini-1.5-flash-8b", // Sometimes available
    "gemini-1.5-flash-002" // Newer alias?
];

async function probe() {
    console.log("🔍 Probing models for Working Quota...");

    for (const modelName of CANDIDATES) {
        try {
            console.log(`\nTesting: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            // Generate simple text
            const result = await model.generateContent("Test");
            const response = await result.response;
            const text = response.text();

            if (text) {
                console.log(`✅ SUCCESS! ${modelName} is working.`);
                console.log(`   (Response: ${text.substring(0, 20)}...)`);
                // Found one! We can stop if we just want the first working one.
                // But let's check strict limits.
            }
        } catch (error) {
            let msg = error.message.split('[')[0];
            if (error.message.includes('404')) msg = "404 Not Found";
            if (error.message.includes('429')) msg = "429 Quota Exceeded";
            console.log(`❌ FAILED: ${modelName} -> ${msg}`);
        }
    }
}

probe();
