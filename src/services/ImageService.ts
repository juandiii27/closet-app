import { removeBackground } from "@imgly/background-removal";

export const ImageService = {
  /**
   * Removes the background from an image file using a local WASM library.
   * This runs entirely in the browser, is free, and unlimited.
   */
  async removeBackground(file: File): Promise<Blob> {
    console.log("Starting local background removal...");

    try {
      // The library handles everything: resizing, processing, and returning a Blob.
      // It downloads ~10MB of models on the first run, then caches them.
      const blob = await removeBackground(file, {
        progress: (key, current, total) => {
          console.debug(`RemoveBG Progress [${key}]: ${Math.round(current / total * 100)}%`);
        }
      });

      console.log("Background removed successfully!");
      return blob;

    } catch (error) {
      console.error("Local background removal failed:", error);
      alert("Background removal failed on this device. Using original image.");
      // Fallback: Return original file if the WASM crashes (e.g., extremely low memory)
      return file;
    }
  },
};
