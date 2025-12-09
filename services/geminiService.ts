import { GoogleGenAI } from "@google/genai";
import { BoardType } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please ensure process.env.API_KEY is available.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateMakerGuide = async (
  board: BoardType,
  topic: string,
  type: 'sensor' | 'game' | 'barcode' | 'network' | 'scratch' | 'general'
): Promise<string> => {
  const ai = getAiClient();
  const modelId = 'gemini-2.5-flash';

  let systemInstruction = "You are an expert embedded systems engineer and maker. You specialize in Raspberry Pi, Arduino, ESP32, Pico W, Micro:bit, and M5Stick projects.";
  let prompt = "";

  switch (type) {
    case 'sensor':
      systemInstruction += " Provide concise, clear wiring instructions and complete, well-commented code examples. Use Python for Raspberry Pi/Pico, C++ for Arduino/ESP32/M5Stick, and MakeCode (JavaScript/Blocks description) or MicroPython for Micro:bit.";
      prompt = `Create a step-by-step tutorial for connecting and using a "${topic}" with a ${board}. Include a wiring diagram description (pin to pin) and the necessary code to read data from the sensor.`;
      break;
    case 'game':
      systemInstruction += " You are an expert in retro gaming emulation and game development for microcontrollers. Focus on performance.";
      prompt = `Explain how to run or create the game "${topic}" on a ${board}. If it's a microcontroller (Arduino, ESP32, Pico, Micro:bit, M5Stick), provide the source code (Arduino C++, MicroPython, or MakeCode) to build a simple version. If it's a Raspberry Pi, explain setup or installation.`;
      break;
    case 'barcode':
      systemInstruction += " You are an expert in industrial automation and computer vision.";
      prompt = `Create a comprehensive guide to build a barcode reader using a ${board}. The user is interested in using: ${topic}. Provide the hardware list, wiring instructions, and the complete software implementation.`;
      break;
    case 'network':
      systemInstruction += " You are a network engineer for IoT devices. Focus on connectivity, signal strength, and protocol handling.";
      prompt = `Create a guide to check network connectivity on the ${board}. specifically regarding "${topic}". Include code to scan for WiFi networks (if applicable), connect to a network, check signal strength (RSSI), and perform a simple ping or HTTP request to verify internet access. If the board (like Micro:bit) uses Radio/BLE, explain how to test that connection instead.`;
      break;
    case 'scratch':
      systemInstruction += " You are an educator specializing in STEM and visual programming.";
      prompt = `Explain how to use the ${board} with Scratch or a block-based coding environment like MakeCode or UIFlow. Focus on the task: "${topic}". Explain the required firmware, software/extensions (like Scratch Link), and provide a logical description of the block arrangement or equivalent code to achieve the task.`;
      break;
    default:
      prompt = `Explain how to use ${topic} with ${board} in a maker project.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3, 
      }
    });

    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Return a user-friendly error message formatted in Markdown
    return `### ⚠️ AI Connection Error
    
I'm having trouble connecting to the MakerForge intelligence right now. This is usually temporary.

**Suggestions:**
1. Check your internet connection.
2. Wait a few moments and try clicking **Generate** again.
3. If the issue persists, the AI service might be experiencing high traffic.

_Technical Error Details: ${(error as Error).message}_`;
  }
};