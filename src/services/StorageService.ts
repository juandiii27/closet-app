import { supabase } from '../lib/supabase';

// Mock storage implementation for local dev without keys
const mockStorage = {
    upload: async (_path: string, file: File) => {
        return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });
    }
};

export const StorageService = {
    async uploadImage(userId: string, file: File): Promise<string> {
        if (!supabase) {
            console.log('Mock Mode: Converting file to Base64 (Local Storage)');
            return mockStorage.upload(`${userId}/${Date.now()}_${file.name}`, file);
        }

        const fileName = `${userId}/${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
            .from('closet-items')
            .upload(fileName, file);

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('closet-items')
            .getPublicUrl(data.path);

        return publicUrl;
    }
};
