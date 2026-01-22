const REMOVE_BG_API_KEY = import.meta.env.VITE_REMOVE_BG_API;

export const ImageService = {
  async removeBackground(file: File): Promise<Blob> {
    if (!REMOVE_BG_API_KEY || REMOVE_BG_API_KEY.trim() === "") {
      console.log("Mock Mode: Simulating background removal");

      return new Promise(async (resolve) => {
        setTimeout(async () => {
          const blob = new Blob(
            [await file.arrayBuffer()],
            { type: file.type }
          );
          resolve(blob);
        }, 1500);
      });
    }

    const formData = new FormData();
    formData.append("image_file", file);
    formData.append("size", "auto");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": REMOVE_BG_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to remove background");
    }

    const contentType = response.headers.get("content-type");
    if (!contentType?.startsWith("image/")) {
      throw new Error("Invalid response from background removal service");
    }

    return await response.blob();
  },
};
