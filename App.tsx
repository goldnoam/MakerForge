import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Gamepad2, 
  ScanLine, 
  Zap, 
  Terminal, 
  Bot,
  Box,
  Layers,
  Wifi,
  Puzzle,
  Radio,
  Save,
  Archive,
  Trash2,
  Mail,
  ArrowRight,
  Code2,
  ChevronDown,
  Check,
  Calendar
} from 'lucide-react';
import { BoardType, AppView, SavedProject } from './types';
import { generateMakerGuide } from './services/geminiService';
import MarkdownView from './components/MarkdownView';
import LoadingSpinner from './components/LoadingSpinner';

// --- Data Constants ---

const BOARDS = [
  { id: BoardType.RPI5, name: 'Raspberry Pi 5', icon: <Cpu className="w-6 h-6" />, desc: 'Powerhouse for vision & heavy processing.' },
  { id: BoardType.ARDUINO_R4, name: 'Arduino Uno R4', icon: <Box className="w-6 h-6" />, desc: 'The classic with 32-bit power & LED matrix.' },
  { id: BoardType.ESP32, name: 'ESP32', icon: <Zap className="w-6 h-6" />, desc: 'WiFi + Bluetooth IoT standard.' },
  { id: BoardType.PICO_W, name: 'Pico W', icon: <Terminal className="w-6 h-6" />, desc: 'Dual-core RP2040 with native WiFi.' },
  { id: BoardType.MICROBIT, name: 'Micro:bit V2', icon: <Radio className="w-6 h-6" />, desc: 'Education focused with Radio/BLE & sensors.' },
  { id: BoardType.M5STICK, name: 'M5StickC Plus', icon: <Zap className="w-6 h-6 text-orange-400" />, desc: 'Portable ESP32 with screen & battery.' },
  { id: BoardType.ESP8266, name: 'ESP8266', icon: <Wifi className="w-6 h-6" />, desc: 'Low-cost WiFi microchip (NodeMCU/D1 Mini).' },
  { id: BoardType.ARDUINO_NANO, name: 'Arduino Nano', icon: <Cpu className="w-6 h-6 text-green-400" />, desc: 'Compact, breadboard-friendly classic.' },
];

const SENSORS_LIST = [
  "DHT22 (Temp/Humidity)", 
  "HC-SR04 (Ultrasonic)", 
  "MPU6050 (Gyro/Accel)", 
  "BME280 (Pressure/Temp)",
  "OLED Display (SSD1306)",
  "Servo Motor (SG90)"
];

const GAMES_LIST = [
  "Snake",
  "Tetris",
  "Pong",
  "Space Invaders",
  "Doom (RPi Only)",
  "Dino Run"
];

const NETWORK_TASKS = [
  "Scan WiFi Networks",
  "Connect & Ping Google",
  "Check Signal Strength (RSSI)",
  "Simple Web Server",
  "MQTT Client Setup",
  "Radio/BLE Chat (Micro:bit)"
];

const SCRATCH_TASKS = [
  "Blink LED with Scratch",
  "Read Button Press",
  "Move Sprite with Tilt Sensor",
  "Create a Controller Game",
  "Display Text on Matrix/Screen"
];

const LANGUAGES = [
  { id: 'default', label: 'Auto Detect', desc: 'Best match for board', icon: <Bot className="w-4 h-4" /> },
  { id: 'micropython', label: 'MicroPython', desc: 'Python for microcontrollers', icon: <Terminal className="w-4 h-4 text-yellow-400" /> },
  { id: 'cpp', label: 'C++ / Arduino', desc: 'Standard embedded code', icon: <Code2 className="w-4 h-4 text-blue-400" /> },
  { id: 'circuitpython', label: 'CircuitPython', desc: 'Adafruit python flavor', icon: <Zap className="w-4 h-4 text-purple-400" /> },
];

const isLanguageSupported = (board: BoardType, langId: string) => {
  if (langId === 'default') return true;
  
  // Linux SBCs: RPi 5 uses Standard Python (covered by default) or C++
  if (board === BoardType.RPI5) return langId === 'cpp';

  // 8-bit / Classic AVR: C++ only
  if (board === BoardType.ARDUINO_NANO) return langId === 'cpp';

  // Arduino R4: Renesas based, mostly C++. Early MP/CP support exists but stick to C++ for reliability.
  if (board === BoardType.ARDUINO_R4) return langId === 'cpp'; 

  // ESP8266: No CircuitPython support
  if (board === BoardType.ESP8266) return langId !== 'circuitpython';

  // Micro:bit: MicroPython or MakeCode (Default). No CircuitPython.
  if (board === BoardType.MICROBIT) return langId !== 'circuitpython';

  // ESP32, Pico W, M5Stick support all options
  return true;
};

// --- Sub Components ---

interface BoardCardProps {
  board: typeof BOARDS[0];
  isSelected: boolean;
  onSelect: (id: BoardType) => void;
}

const BoardCard: React.FC<BoardCardProps> = ({ board, isSelected, onSelect }) => (
  <div 
    onClick={() => onSelect(board.id)}
    className={`cursor-pointer border p-3 rounded-xl transition-all h-full flex flex-col ${
      isSelected 
        ? 'border-maker-accent bg-maker-accent/10 shadow-lg shadow-maker-accent/10' 
        : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
    }`}
  >
    <div className="flex items-center justify-between mb-2">
      <div className={`p-2 rounded-lg ${isSelected ? 'bg-maker-accent text-maker-dark' : 'bg-slate-700 text-slate-300'}`}>
        {board.icon}
      </div>
      {isSelected && <div className="w-2 h-2 rounded-full bg-maker-accent shadow-[0_0_8px_rgba(56,189,248,0.8)]"></div>}
    </div>
    <h3 className="font-bold text-white text-sm mb-1">{board.name}</h3>
    <p className="text-[10px] text-slate-400 leading-tight">{board.desc}</p>
  </div>
);

interface NavButtonProps {
  view: AppView;
  isActive: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: (view: AppView) => void;
}

const NavButton: React.FC<NavButtonProps> = ({ view, isActive, icon, label, onClick }) => (
  <button
    onClick={() => onClick(view)}
    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 w-full mb-1 ${
      isActive
        ? 'bg-maker-accent text-maker-dark font-bold shadow-lg shadow-maker-accent/20' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    {icon}
    <span className="text-sm font-medium">{label}</span>
  </button>
);

const LanguageSelector: React.FC<{ value: string; onChange: (val: string) => void; selectedBoard: BoardType }> = ({ value, onChange, selectedBoard }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Validate if current selection is supported, else fallback to visual default
  const validValue = isLanguageSupported(selectedBoard, value) ? value : 'default';
  const selected = LANGUAGES.find(l => l.id === validValue) || LANGUAGES[0];

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-slate-300 mb-2">Code Language</label>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:border-maker-accent transition-colors group focus:outline-none focus:ring-2 focus:ring-maker-accent"
        >
          <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-md bg-slate-800 group-hover:bg-slate-700 transition-colors border border-slate-700`}>
              {selected.icon}
            </div>
            <div>
              <div className="font-medium text-white text-sm leading-none mb-1">{selected.label}</div>
              <div className="text-[10px] text-slate-500 leading-none">{selected.desc}</div>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden animate-fade-in">
              {LANGUAGES.map((lang) => {
                const supported = isLanguageSupported(selectedBoard, lang.id);
                return (
                  <button
                    key={lang.id}
                    disabled={!supported}
                    onClick={() => {
                      if (supported) {
                        onChange(lang.id);
                        setIsOpen(false);
                      }
                    }}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors border-l-2 
                      ${value === lang.id ? 'bg-slate-700/30 border-maker-accent' : 'border-transparent'}
                      ${supported ? 'hover:bg-slate-700/50 cursor-pointer' : 'opacity-40 cursor-not-allowed bg-slate-900/50'}
                    `}
                  >
                    <div className="p-1.5 rounded-md bg-slate-900 border border-slate-700">
                      {lang.icon}
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${value === lang.id ? 'text-maker-accent' : 'text-slate-200'}`}>
                        {lang.label} {supported ? '' : '(N/A)'}
                      </div>
                      <div className="text-[10px] text-slate-500">{lang.desc}</div>
                    </div>
                    {value === lang.id && <Check className="w-4 h-4 text-maker-accent" />}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// --- Main Component ---

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [selectedBoard, setSelectedBoard] = useState<BoardType>(BoardType.RPI5);
  
  // Generation State
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inputs
  const [customInput, setCustomInput] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");
  const [languagePreference, setLanguagePreference] = useState("default");

  // Saved Projects
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeProject, setActiveProject] = useState<SavedProject | null>(null);
  const [saveTitle, setSaveTitle] = useState("");

  useEffect(() => {
    // Load projects from localStorage
    const saved = localStorage.getItem('makerforge_saved_projects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration for legacy data without title
        const migrated = parsed.map((p: any) => ({
          ...p,
          title: p.title || p.topic || "Untitled Project"
        }));
        setSavedProjects(migrated);
      } catch (e) {
        console.error("Failed to parse saved projects", e);
      }
    }
  }, []);

  useEffect(() => {
    // Reset generation state when view changes
    if (currentView !== AppView.SAVED) {
      setError(null);
    }
  }, [currentView, selectedBoard]);

  // Reset language to default if the board changes to ensure compatibility
  useEffect(() => {
    setLanguagePreference('default');
  }, [selectedBoard]);

  const handleGenerate = async () => {
    const topic = customInput || selectedPreset;
    if (!topic) {
      setError("Please select an option or enter a custom topic.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedContent(null);
    setSaveSuccess(false);
    setActiveProject(null);
    setSaveTitle(topic); // Auto-populate title with topic

    let type: 'sensor' | 'game' | 'barcode' | 'network' | 'scratch' = 'sensor';
    if (currentView === AppView.GAMES) type = 'game';
    if (currentView === AppView.BARCODE) type = 'barcode';
    if (currentView === AppView.NETWORK) type = 'network';
    if (currentView === AppView.SCRATCH) type = 'scratch';

    try {
      const content = await generateMakerGuide(selectedBoard, topic, type, languagePreference);
      setGeneratedContent(content);
    } catch (e) {
      setError("Failed to generate content. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProject = () => {
    if (!generatedContent) return;
    if (!saveTitle.trim()) {
      // Basic validation
      const topic = customInput || selectedPreset || "Untitled Project";
      setSaveTitle(topic);
    }
    
    const newProject: SavedProject = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      board: selectedBoard,
      view: currentView,
      topic: customInput || selectedPreset || "Untitled Project",
      content: generatedContent,
      title: saveTitle.trim() || customInput || selectedPreset || "Untitled Project"
    };

    const updatedProjects = [newProject, ...savedProjects];
    setSavedProjects(updatedProjects);
    localStorage.setItem('makerforge_saved_projects', JSON.stringify(updatedProjects));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedProjects.filter(p => p.id !== id);
    setSavedProjects(updated);
    localStorage.setItem('makerforge_saved_projects', JSON.stringify(updated));
    
    if (activeProject?.id === id) {
      setActiveProject(null);
      setGeneratedContent(null);
    }
  };

  const handleLoadProject = (project: SavedProject) => {
    setSelectedBoard(project.board);
    setCurrentView(project.view);
    setGeneratedContent(project.content);
    setCustomInput(project.topic); 
    setSelectedPreset("");
    setActiveProject(project);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPlaceholder = () => {
    const commonClasses = "text-center p-12 text-slate-500 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/20";
    
    switch (currentView) {
      case AppView.SENSORS:
        return (
          <div className={commonClasses}>
            <Layers className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <h3 className="text-xl text-slate-300 font-semibold mb-2">Sensor Lab</h3>
            <p>Generate wiring guides and driver code for any sensor.</p>
          </div>
        );
      case AppView.GAMES:
        return (
          <div className={commonClasses}>
            <Gamepad2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <h3 className="text-xl text-slate-300 font-semibold mb-2">Arcade Builder</h3>
            <p>Create retro games or emulators on your {selectedBoard}.</p>
          </div>
        );
      case AppView.BARCODE:
        return (
          <div className={commonClasses}>
            <ScanLine className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <h3 className="text-xl text-slate-300 font-semibold mb-2">Barcode Systems</h3>
            <p>Integrate industrial scanning with your maker project.</p>
          </div>
        );
      case AppView.NETWORK:
        return (
          <div className={commonClasses}>
            <Wifi className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <h3 className="text-xl text-slate-300 font-semibold mb-2">Network Diagnostics</h3>
            <p>Generate code to check WiFi, signal strength, and connectivity.</p>
          </div>
        );
      case AppView.SCRATCH:
        return (
          <div className={commonClasses}>
            <Puzzle className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <h3 className="text-xl text-slate-300 font-semibold mb-2">Block Coding</h3>
            <p>Learn to control your board with Scratch or MakeCode blocks.</p>
          </div>
        );
      case AppView.SAVED:
         return (
          <div className={commonClasses}>
            <Archive className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <h3 className="text-xl text-slate-300 font-semibold mb-2">Saved Projects</h3>
            <p>Select a project from the list to view it.</p>
          </div>
         );
      default:
        return null;
    }
  };

  const getPresets = () => {
    switch (currentView) {
      case AppView.SENSORS: return SENSORS_LIST;
      case AppView.GAMES: return GAMES_LIST;
      case AppView.NETWORK: return NETWORK_TASKS;
      case AppView.SCRATCH: return SCRATCH_TASKS;
      case AppView.BARCODE: return [
        "USB Barcode Scanner (HID Mode)", 
        "Serial/UART Barcode Module (e.g., GM65)", 
        "Camera Module (OpenCV/ZBar)",
        "Pi Camera Module V3"
      ];
      default: return [];
    }
  };

  // Render logic for Saved Projects List
  const renderSavedProjects = () => {
    if (savedProjects.length === 0) {
      return (
        <div className="text-center p-12 bg-slate-800/30 rounded-xl border border-slate-700">
          <Archive className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-300">No Saved Projects</h3>
          <p className="text-slate-500">Generate a guide and click "Save Project" to store it here.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {savedProjects.map((project) => (
          <div 
            key={project.id}
            onClick={() => handleLoadProject(project)}
            className="group relative bg-slate-800/40 border border-slate-700 rounded-xl p-5 hover:border-maker-accent hover:bg-slate-800/80 transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2 text-maker-accent">
                {project.board === BoardType.RPI5 && <Cpu className="w-5 h-5" />}
                {project.board === BoardType.ARDUINO_R4 && <Box className="w-5 h-5" />}
                {project.board === BoardType.ESP32 && <Zap className="w-5 h-5" />}
                {project.board === BoardType.PICO_W && <Terminal className="w-5 h-5" />}
                {project.board === BoardType.MICROBIT && <Radio className="w-5 h-5" />}
                {project.board === BoardType.M5STICK && <Zap className="w-5 h-5 text-orange-400" />}
                {project.board === BoardType.ESP8266 && <Wifi className="w-5 h-5" />}
                {project.board === BoardType.ARDUINO_NANO && <Cpu className="w-5 h-5 text-green-400" />}
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-maker-accent/10 border border-maker-accent/20">
                  {project.board}
                </span>
              </div>
              <button 
                onClick={(e) => handleDeleteProject(project.id, e)}
                className="text-slate-500 hover:text-red-400 p-1 rounded-md hover:bg-slate-700 transition-colors"
                title="Delete Project"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <h3 className="font-bold text-white mb-1 group-hover:text-maker-accent transition-colors truncate">
              {project.title}
            </h3>
            <p className="text-xs text-slate-500 mb-2 truncate">Topic: {project.topic}</p>
            <div className="flex justify-between items-center text-xs text-slate-500 mt-4 border-t border-slate-700/50 pt-3">
              <span>{new Date(project.timestamp).toLocaleDateString()}</span>
              <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-maker-accent">
                View <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-maker-dark text-slate-100 font-sans selection:bg-maker-accent selection:text-maker-dark">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-maker-panel border-r border-slate-700 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-maker-accent to-maker-success bg-clip-text text-transparent flex items-center gap-2">
            <Bot className="w-8 h-8 text-maker-accent" />
            MakerForge
          </h1>
          <p className="text-xs text-slate-400 mt-1">Smart Maker Workbench</p>
        </div>

        <nav className="p-4 flex-1 overflow-y-auto">
          <NavButton view={AppView.HOME} isActive={currentView === AppView.HOME} onClick={setCurrentView} icon={<Cpu className="w-5 h-5" />} label="Workbench" />
          <NavButton view={AppView.SENSORS} isActive={currentView === AppView.SENSORS} onClick={setCurrentView} icon={<Zap className="w-5 h-5" />} label="Sensor Lab" />
          <NavButton view={AppView.GAMES} isActive={currentView === AppView.GAMES} onClick={setCurrentView} icon={<Gamepad2 className="w-5 h-5" />} label="Arcade" />
          <NavButton view={AppView.BARCODE} isActive={currentView === AppView.BARCODE} onClick={setCurrentView} icon={<ScanLine className="w-5 h-5" />} label="Barcode Reader" />
          <NavButton view={AppView.NETWORK} isActive={currentView === AppView.NETWORK} onClick={setCurrentView} icon={<Wifi className="w-5 h-5" />} label="Network Check" />
          <NavButton view={AppView.SCRATCH} isActive={currentView === AppView.SCRATCH} onClick={setCurrentView} icon={<Puzzle className="w-5 h-5" />} label="Scratch / Blocks" />
          
          <div className="my-2 border-t border-slate-700/50"></div>
          
          <NavButton view={AppView.SAVED} isActive={currentView === AppView.SAVED} onClick={setCurrentView} icon={<Archive className="w-5 h-5" />} label="Saved Projects" />
        </nav>

        <div className="p-4 border-t border-slate-700 hidden md:block">
          <div className="text-xs text-slate-500 text-center">
            Powered by Gemini
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden h-screen relative">
        
        {/* Header - Board Selector (Sticky) */}
        <header className="bg-maker-dark/95 backdrop-blur z-10 border-b border-slate-800 p-4 sticky top-0 shrink-0">
           <div className="max-w-6xl mx-auto">
             <div className="flex items-center justify-between mb-3">
               <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Board</h2>
               <span className="text-xs text-maker-accent bg-maker-accent/10 px-2 py-0.5 rounded-full border border-maker-accent/20">
                 {BOARDS.find(b => b.id === selectedBoard)?.name} Selected
               </span>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
               {BOARDS.map(b => (
                 <BoardCard 
                   key={b.id} 
                   board={b} 
                   isSelected={selectedBoard === b.id} 
                   onSelect={setSelectedBoard} 
                 />
               ))}
             </div>
           </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
          <div className="max-w-4xl mx-auto pb-20">
            
            {/* View Specific Controls */}
            {currentView === AppView.HOME ? (
              <div className="space-y-8 animate-fade-in">
                <div className="bg-gradient-to-br from-indigo-900/50 to-slate-900 border border-indigo-500/30 rounded-2xl p-8 shadow-2xl">
                  <h2 className="text-3xl font-bold text-white mb-4">Welcome, Maker.</h2>
                  <p className="text-lg text-slate-300 mb-6 max-w-2xl">
                    This workbench helps you generate code, wiring diagrams, and tutorials for your electronics projects. 
                    Now supporting <strong>Micro:bit</strong>, <strong>M5Stick</strong>, <strong>ESP8266</strong>, and <strong>Arduino Nano</strong>!
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <button onClick={() => setCurrentView(AppView.SENSORS)} className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 hover:border-maker-accent transition-colors text-left group">
                      <Zap className="w-8 h-8 text-yellow-400 mb-3 group-hover:scale-110 transition-transform" />
                      <h3 className="font-bold text-white">Sensor Integration</h3>
                      <p className="text-sm text-slate-400 mt-2">Wiring & Code for any module.</p>
                    </button>
                    
                    <button onClick={() => setCurrentView(AppView.NETWORK)} className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 hover:border-maker-accent transition-colors text-left group">
                      <Wifi className="w-8 h-8 text-sky-400 mb-3 group-hover:scale-110 transition-transform" />
                      <h3 className="font-bold text-white">Connectivity</h3>
                      <p className="text-sm text-slate-400 mt-2">WiFi, Bluetooth & Radio checks.</p>
                    </button>

                    <button onClick={() => setCurrentView(AppView.SCRATCH)} className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 hover:border-maker-accent transition-colors text-left group">
                      <Puzzle className="w-8 h-8 text-green-400 mb-3 group-hover:scale-110 transition-transform" />
                      <h3 className="font-bold text-white">Scratch & Blocks</h3>
                      <p className="text-sm text-slate-400 mt-2">Visual coding integration.</p>
                    </button>
                  </div>
                </div>
              </div>
            ) : currentView === AppView.SAVED ? (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Saved Projects</h2>
                  <span className="text-sm text-slate-400">{savedProjects.length} Projects</span>
                </div>
                {renderSavedProjects()}
              </div>
            ) : (
              <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700 mb-8 backdrop-blur-sm sticky top-0 z-0 shadow-lg">
                <div className="flex flex-col gap-4">
                  
                  {/* Top Row: Language and Preset */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    
                    <div className="md:col-span-4 z-30">
                      <LanguageSelector value={languagePreference} onChange={setLanguagePreference} selectedBoard={selectedBoard} />
                    </div>

                    <div className="md:col-span-8">
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        {currentView === AppView.SENSORS ? "Choose Sensor" : 
                        currentView === AppView.GAMES ? "Choose Game" : 
                        currentView === AppView.NETWORK ? "Network Task" :
                        currentView === AppView.SCRATCH ? "Coding Task" :
                        "Hardware Type"}
                      </label>
                      <select 
                        value={selectedPreset}
                        onChange={(e) => {
                          setSelectedPreset(e.target.value);
                          setCustomInput("");
                        }}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-maker-accent focus:border-transparent outline-none"
                      >
                        <option value="">-- Select from Presets --</option>
                        {getPresets().map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                  </div>

                  {/* Bottom Row: Custom Input and Button */}
                  <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full relative">
                      <span className="absolute -top-6 left-0 text-xs text-slate-500 uppercase font-bold pt-4">Or Type Custom</span>
                      <input 
                        type="text" 
                        value={customInput}
                        onChange={(e) => {
                          setCustomInput(e.target.value);
                          setSelectedPreset("");
                        }}
                        placeholder="e.g., Custom requirements..."
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-maker-accent focus:border-transparent outline-none"
                      />
                    </div>

                    <button 
                      onClick={handleGenerate}
                      disabled={isLoading || (!selectedPreset && !customInput)}
                      className="w-full md:w-auto px-8 py-3 bg-maker-accent hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-maker-dark font-bold rounded-lg shadow-lg shadow-maker-accent/20 transition-all flex items-center justify-center gap-2"
                    >
                      {isLoading ? <span className="animate-spin">⟳</span> : <Zap className="w-5 h-5" />}
                      Generate
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* AI Output Section (Not for Home or Saved List) */}
            {currentView !== AppView.HOME && currentView !== AppView.SAVED && (
              <div className="min-h-[400px]">
                {isLoading ? <LoadingSpinner /> : (
                  <>
                    {error && (
                      <div className="p-6 bg-red-900/20 border border-red-800 text-red-200 rounded-lg flex items-center gap-4 animate-shake">
                        <div className="p-2 bg-red-900/50 rounded-full">⚠️</div>
                        {error}
                      </div>
                    )}
                    
                    {generatedContent ? (
                      <div className="relative">
                        {/* If viewing a loaded project, show details banner. Else show Save controls. */}
                        {activeProject ? (
                           <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
                              <div>
                                 <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Archive className="w-5 h-5 text-maker-accent" />
                                    {activeProject.title}
                                 </h2>
                                 <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-400">
                                    <span className="flex items-center gap-1"><Cpu className="w-3 h-3"/> {BOARDS.find(b => b.id === activeProject.board)?.name}</span>
                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {new Date(activeProject.timestamp).toLocaleDateString()}</span>
                                    <span className="bg-slate-700 px-2 py-0.5 rounded text-xs text-slate-300">Topic: {activeProject.topic}</span>
                                 </div>
                              </div>
                              <button 
                                onClick={() => { 
                                  setActiveProject(null); 
                                  setGeneratedContent(null);
                                  setCustomInput("");
                                }} 
                                className="text-slate-500 hover:text-white text-sm underline whitespace-nowrap"
                              >
                                Close Project
                              </button>
                           </div>
                        ) : (
                          <div className="flex flex-col md:flex-row justify-end items-center gap-3 mb-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                             <input 
                               type="text" 
                               value={saveTitle}
                               onChange={(e) => setSaveTitle(e.target.value)}
                               placeholder="Project Title"
                               className="w-full md:w-64 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-1 focus:ring-maker-accent outline-none"
                             />
                             <button 
                               onClick={handleSaveProject}
                               disabled={saveSuccess || !saveTitle.trim()}
                               className={`w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                 saveSuccess 
                                   ? 'bg-maker-success text-maker-dark' 
                                   : 'bg-maker-accent text-maker-dark hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed'
                               }`}
                             >
                               {saveSuccess ? <CheckIcon /> : <Save className="w-4 h-4" />}
                               {saveSuccess ? 'Saved!' : 'Save Project'}
                             </button>
                          </div>
                        )}

                        <MarkdownView content={generatedContent} />
                      </div>
                    ) : renderPlaceholder()}
                  </>
                )}
              </div>
            )}
            
            {/* Footer */}
            <footer className="mt-20 pt-8 border-t border-slate-800 text-center">
               <div className="flex flex-col items-center gap-4">
                 <p className="text-slate-500 text-sm">
                   (C) Noam Gold 2025
                 </p>
                 <a 
                   href="mailto:gold.noam@gmail.com" 
                   className="flex items-center gap-2 text-slate-400 hover:text-maker-accent transition-colors text-sm"
                 >
                   <Mail className="w-4 h-4" />
                   Send Feedback: gold.noam@gmail.com
                 </a>
               </div>
            </footer>

          </div>
        </div>
      </main>
    </div>
  );
};

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export default App;