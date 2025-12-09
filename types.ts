export enum BoardType {
  RPI5 = 'Raspberry Pi 5',
  ARDUINO_R4 = 'Arduino Uno R4',
  ESP32 = 'ESP32',
  PICO_W = 'Raspberry Pi Pico W',
  MICROBIT = 'Micro:bit V2',
  M5STICK = 'M5StickC Plus',
  ESP8266 = 'ESP8266 (NodeMCU)',
  ARDUINO_NANO = 'Arduino Nano'
}

export enum AppView {
  HOME = 'home',
  SENSORS = 'sensors',
  GAMES = 'games',
  BARCODE = 'barcode',
  NETWORK = 'network',
  SCRATCH = 'scratch',
  SAVED = 'saved'
}

export interface GeneratorConfig {
  board: BoardType;
  topic: string;
  context?: string;
}

export interface GuideResponse {
  title: string;
  content: string;
  codeSnippet?: string;
}

export interface SavedProject {
  id: string;
  title: string;
  timestamp: number;
  board: BoardType;
  view: AppView;
  topic: string;
  content: string;
}