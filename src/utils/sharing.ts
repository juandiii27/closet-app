import { toPng } from 'html-to-image';

/**
 * Captures a DOM element and downloads it as an image
 * @param elementId The ID of the DOM element to capture
 * @param fileName The name of the downloaded file
 */
export async function downloadElementAsImage(elementId: string, fileName: string = 'outfit.png') {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with id ${elementId} not found`);
        return;
    }

    try {
        const dataUrl = await toPng(element, {
            backgroundColor: '#f4f1ea', // Match the collage background
            cacheBust: true,
            pixelRatio: 2, // High resolution
        });

        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        link.click();
    } catch (error) {
        console.error('Failed to capture image', error);
    }
}
