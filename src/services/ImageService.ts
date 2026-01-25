
export const ImageService = {
  async removeBackground(file: File): Promise<Blob> {
    const primaryKey = import.meta.env.VITE_REMOVE_BG_API_KEY;
    const backupKey = import.meta.env.VITE_REMOVE_BG_API_KEY_BACKUP;

    if (!primaryKey) {
      console.warn("Remove.bg API key is missing. Returning original image.");
      alert("API Key missing! Please check .env file.");
      return file;
    }

    const removeBgCall = async (apiKey: string) => {
      const formData = new FormData();
      formData.append("image_file", file);
      formData.append("size", "auto");

      const response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: { "X-Api-Key": apiKey },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.blob();
    };

    try {
      console.log("Removing background via remove.bg API (Primary Key)...");
      return await removeBgCall(primaryKey);
    } catch (error: any) {
      console.error("Primary key failed:", error);

      // Check if we should try the backup key (Authorization or Credits issues)
      // 402 = Payment Required (Out of credits), 401 = Unauthorized
      const errorMessage = error.message || "";
      if (backupKey && (errorMessage.includes("402") || errorMessage.includes("401"))) {
        console.log("Switching to Backup API Key...");
        try {
          return await removeBgCall(backupKey);
        } catch (backupError: any) {
          console.error("Backup key also failed:", backupError);
          alert(`Both API keys failed. Backup error: ${backupError.message || backupError}`);
          return file;
        }
      }

      alert(`Error Removing Background: ${errorMessage}\n\nFalling back to original image.`);
      return file;
    }
  },
};
