import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Jimp from 'jimp';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Workaround for __dirname in ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors()); // Enable CORS for all routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure the display directory exists
const displayDir = path.join(__dirname, 'display');
if (!fs.existsSync(displayDir)) {
  fs.mkdirSync(displayDir); // Create the directory if it doesn't exist
}

// Function to generate the next image name
const getNextImageName = () => {
  const files = fs.readdirSync(displayDir);
  const imageCount = files.filter(file => file.startsWith('image') && file.endsWith('.png')).length;
  return `image${imageCount + 1}.png`;
};

// Endpoint to embed text in image
app.post('/embed', upload.single('image'), async (req, res) => {
  const { text } = req.body;
  const imagePath = req.file.path;

  try {
    const image = await Jimp.read(imagePath);
    const binaryText = text.split('').map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join('');
    const binaryEnd = '00000000'; // Termination sequence (null character)
    const completeBinaryText = binaryText + binaryEnd;
    let index = 0;

    for (let y = 0; y < image.bitmap.height; y++) {
      for (let x = 0; x < image.bitmap.width; x++) {
        if (index < completeBinaryText.length) {
          const pixel = Jimp.intToRGBA(image.getPixelColor(x, y));
          const binaryPixel = pixel.b.toString(2).padStart(8, '0').slice(0, -1) + completeBinaryText[index];
          pixel.b = parseInt(binaryPixel, 2);
          image.setPixelColor(Jimp.rgbaToInt(pixel.r, pixel.g, pixel.b, pixel.a), x, y);
          index++;
        }
      }
    }

    // Save the embedded image in the display directory with the next image name
    const outputPath = path.join(displayDir, getNextImageName());
    await image.writeAsync(outputPath);
    fs.unlinkSync(imagePath); // Remove the original uploaded file

    res.status(200).json({ message: 'Text embedded successfully', imagePath: outputPath });
  } catch (error) {
    res.status(500).json({ message: 'Error embedding text in image', error });
  }
});

// Endpoint to extract text from image
app.post('/extract', upload.single('image'), async (req, res) => {
  const imagePath = req.file.path;

  try {
    const image = await Jimp.read(imagePath);
    let binaryText = '';
    let charBinary = '';
    let text = '';

    for (let y = 0; y < image.bitmap.height; y++) {
      for (let x = 0; x < image.bitmap.width; x++) {
        const pixel = Jimp.intToRGBA(image.getPixelColor(x, y));
        const binaryPixel = pixel.b.toString(2).padStart(8, '0');
        charBinary += binaryPixel[binaryPixel.length - 1];

        if (charBinary.length === 8) {
          const charCode = parseInt(charBinary, 2);
          if (charCode === 0) { // Null character termination
            break;
          }
          text += String.fromCharCode(charCode);
          charBinary = '';
        }
      }
    }

    fs.unlinkSync(imagePath); // Remove the uploaded file after processing

    res.status(200).json({ message: 'Text extracted successfully', text });
  } catch (error) {
    res.status(500).json({ message: 'Error extracting text from image', error });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
