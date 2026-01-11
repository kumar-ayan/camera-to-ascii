export const DENSITY_STRING_DEFAULT = 'Ñ@#W$9876543210?!abc;:+=-,._ ';
export const DENSITY_STRING_COMPLEX = '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\|()1{}[]?-_+~<>i!lI;:,"^`\'. ';

export const getAsciiChar = (gray: number, density: string = DENSITY_STRING_DEFAULT): string => {
  const charIndex = Math.floor(mapRange(gray, 0, 255, density.length - 1, 0));
  return density[charIndex];
};

export const mapRange = (value: number, inMin: number, inMax: number, outMin: number, outMax: number): number => {
  return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
};

// This function processes the image data directly to avoid overhead of function calls in loops if possible
export const convertImageDataToAscii = (
  imageData: ImageData, 
  width: number, 
  height: number, 
  density: string
): string => {
  const pixels = imageData.data;
  let asciiImage = "";

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const r = pixels[offset];
      const g = pixels[offset + 1];
      const b = pixels[offset + 2];
      
      // Calculate luminosity (perceived brightness)
      // const gray = 0.21 * r + 0.72 * g + 0.07 * b;
      // Average brightness is faster and often sufficient for this
      const gray = (r + g + b) / 3;

      asciiImage += getAsciiChar(gray, density);
    }
    asciiImage += '\n';
  }
  return asciiImage;
};
