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
  type: 'sensor' | 'game' | 'barcode' | 'network' | 'scratch' | 'general',
  languagePreference: string = 'default'
): Promise<string> => {
  const ai = getAiClient();
  const modelId = 'gemini-2.5-flash';

  let systemInstruction = "You are an expert embedded systems engineer and maker. You specialize in Raspberry Pi, Arduino (Uno, Nano, R4), ESP32, ESP8266, Pico W, Micro:bit, and M5Stick projects.";
  
  // Language preference handling
  if (languagePreference === 'micropython') {
    systemInstruction += " STRICT REQUIREMENT: You MUST provide the code examples in MicroPython. \n" +
      "- Ensure the code uses the correct libraries for the selected board (e.g., 'machine' for ESP32/Pico, specific Micro:bit libraries).\n" +
      "- START the code block with a comment explicitly stating the firmware compatibility, e.g., '# MicroPython for ESP32' or '# MicroPython for Pico W'.\n" +
      "- If the board (like standard Arduino Uno/Nano) does not natively support MicroPython, clearly explain this constraint and provide a CircuitPython or MicroPython example for a compatible alternative (like Pico/ESP32) as the solution.";
  } else if (languagePreference === 'cpp') {
    systemInstruction += " STRICT REQUIREMENT: You MUST provide the code examples in C++ (Arduino Framework/PlatformIO). \n" +
      "- Ensure compatibility with the specific board architecture (e.g. AVR for Uno/Nano, ESP-IDF/Arduino for ESP32, Renesas for R4).\n" +
      "- Include necessary library imports (e.g., <Wire.h>, <SPI.h>, <Adafruit_Sensor.h>).\n" +
      "- START the code block with a comment explicitly stating compatibility, e.g., '// C++ (Arduino) for ESP32'.";
  } else if (languagePreference === 'circuitpython') {
    systemInstruction += " STRICT REQUIREMENT: You MUST provide the code examples in CircuitPython. \n" +
      "- Assume the user has flashed the latest CircuitPython firmware.\n" +
      "- Specify any required libraries from the CircuitPython Bundle (e.g., adafruit_bus_device, adafruit_displayio).\n" +
      "- START the code block with a comment explicitly stating compatibility, e.g., '# CircuitPython for Pico W'.\n" +
      "- If the selected board (like standard Arduino Uno/Nano) does not support CircuitPython, explain this and provide code for a supported board (like Pico W or Metro M4) as an alternative.";
  } else {
    // Default behavior
    systemInstruction += " Provide concise, clear wiring instructions and complete, well-commented code examples. Use Python for Raspberry Pi/Pico, C++ for Arduino/ESP32/M5Stick, and MakeCode (JavaScript/Blocks description) or MicroPython for Micro:bit.";
  }

  let prompt = "";

  switch (type) {
    case 'sensor':
      prompt = `Create a step-by-step tutorial for connecting and using a "${topic}" with a ${board}. Include a wiring diagram description (pin to pin) and the necessary code to read data from the sensor.`;
      break;
    case 'game':
      systemInstruction += " You are an expert in retro gaming emulation and game development for microcontrollers. Focus on performance.";
      prompt = `Explain how to run or create the game "${topic}" on a ${board}. If it's a microcontroller (Arduino, ESP32, Pico, Micro:bit, M5Stick), provide the source code to build a simple version. If it's a Raspberry Pi, explain setup or installation.`;
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
    return `### ⚠️ Connection Error
    
I'm having trouble connecting to the backend right now. This is usually temporary.

**Suggestions:**
1. Check your internet connection.
2. Wait a few moments and try clicking **Generate** again.
3. If the issue persists, the service might be experiencing high traffic.

_Technical Error Details: ${(error as Error).message}_`;
  }
};