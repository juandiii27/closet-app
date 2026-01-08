const REQUIRED_KEYS = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_REMOVE_BG_API_KEY',
    'VITE_OPENAI_API_KEY'
] as const;

export function validateEnvironment() {
    const missing: string[] = [];

    // Only check if we are NOT in some explicit mock mode, 
    // although our app defaults to mock if keys are missing.
    // This function is useful for debugging why "Real Mode" isn't working.

    REQUIRED_KEYS.forEach(key => {
        if (!import.meta.env[key]) {
            missing.push(key);
        }
    });

    if (missing.length > 0) {
        console.groupCollapsed('⚠️ Environment Variables Missing');
        console.warn('The following environment variables are missing. The app will fallback to MOCK mode for related features.');
        missing.forEach(key => console.warn(`- ${key}`));
        console.info('To enable Real Mode, add these to your .env file.');
        console.groupEnd();

        return {
            isValid: false,
            missing
        };
    }

    console.log('✅ Environment verified. Running in Real Mode.');
    return { isValid: true, missing: [] };
}
