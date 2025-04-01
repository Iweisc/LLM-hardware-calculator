import { useState, useEffect } from 'react';
import './App.css';
import { calculateHardware } from './utils/calculator';
import { 
  defaultGpuList, 
  getCachedGpuList,
  recommendOptimalGpuSetup
} from './utils/gpuData';

// Component to display a tooltip on hover
const Tooltip = ({ text, children }) => (
  <div className="tooltip">
    {children}
    <span className="tooltip-text">{text}</span>
  </div>
);

// Component for displaying a bar chart with memory details
const BarChart = ({ value, max, type }) => {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div className="memory-display mt-2">
      <div className="bar-container relative">
        <div className="bar-chart">
          <div 
            className={`bar-fill bar-fill-${type}`} 
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="memory-details mt-1 text-xs text-gray-600 flex justify-between items-center">
          <div>
            <span className="font-medium">{value} GB</span> required
          </div>
          <div className="text-right">
            {type === "vram" ? (
              <div className="flex gap-2 items-center">
                <span className={value <= 8 ? "text-green-600 font-medium" : "text-gray-400"}>8GB</span>
                <span className={value <= 12 ? "text-green-600 font-medium" : "text-gray-400"}>12GB</span>
                <span className={value <= 16 ? "text-green-600 font-medium" : "text-gray-400"}>16GB</span>
                <span className={value <= 24 ? "text-green-600 font-medium" : "text-gray-400"}>24GB</span>
              </div>
            ) : (
              <div className="flex gap-2 items-center">
                <span className={value <= 8 ? "text-green-600 font-medium" : "text-gray-400"}>8GB</span>
                <span className={value <= 16 ? "text-green-600 font-medium" : "text-gray-400"}>16GB</span>
                <span className={value <= 32 ? "text-green-600 font-medium" : "text-gray-400"}>32GB</span>
                <span className={value <= 64 ? "text-green-600 font-medium" : "text-gray-400"}>64GB</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Component for displaying memory cards
const MemoryCard = ({ title, minimum, recommended, description, type, minExceedsLimit, recExceedsLimit, originalMin, originalRec, unifiedMemoryMax }) => {
  // Fixed max values for consistent scaling across all model sizes
  const maxVram = 32; // 24GB is typical high-end GPU VRAM (RTX 4090)
  const maxRam = 96; // 64GB is typical high-end system RAM
  const max = type === "vram" ? maxVram : maxRam;
  
  // For unified memory, check if values were capped due to exceeding the limit
  const showMinWarning = minExceedsLimit && type === "vram";
  const showRecWarning = recExceedsLimit && type === "vram";
  return (
    <div className={`bg-gray-50 p-5 rounded-xl animated-bg`}>
      <h4 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
        {title}
        <span className="ml-2 text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full">
          {type === "vram" ? "GPU" : "System"}
        </span>
      </h4>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className={`result-card pulse-on-hover ${type}-card`}>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm font-medium text-gray-600">Minimum</div>
              <div className={`result-value ${type}-value flex items-center`}>
                {minimum} GB
                
                {/* Show warning for capped values */}
                {showMinWarning && (
                  <Tooltip text={`Exceeds unified memory limit! Original: ${originalMin} GB (capped to ${unifiedMemoryMax} GB)`}>
                    <div className="ml-2 flex items-center justify-end rounded-full bg-amber-50 p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-amber-500">
                        <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </Tooltip>
                )}
              </div>
            </div>
            <Tooltip text="The absolute minimum memory required to run the model">
              <div className="cursor-help text-gray-400 hover:text-primary-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
              </div>
            </Tooltip>
          </div>
          <BarChart value={minimum} max={max} type={type} />
          <div className="text-xs text-gray-400 mt-2">{description.minimum}</div>
        </div>
        
        <div className={`result-card pulse-on-hover ${type}-card`}>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm font-medium text-gray-600">Recommended</div>
              <div className={`result-value ${type}-value flex items-center`}>
                {recommended} GB
                
                {/* Show warning for capped values */}
                {showRecWarning && (
                  <Tooltip text={`Exceeds unified memory limit! Original: ${originalRec} GB (capped to ${unifiedMemoryMax} GB)`}>
                    <div className="ml-2 flex items-center justify-end rounded-full bg-amber-50 p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-amber-500">
                        <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </Tooltip>
                )}
              </div>
            </div>
            <Tooltip text="The recommended amount of memory for optimal performance">
              <div className="cursor-help text-gray-400 hover:text-primary-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
              </div>
            </Tooltip>
          </div>
          <BarChart value={recommended} max={max} type={type} />
          <div className="text-xs text-gray-400 mt-2">{description.recommended}</div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [modelParams, setModelParams] = useState(7);
  const [quantization, setQuantization] = useState('FP16');
  const [contextLength, setContextLength] = useState(4096);
  const [batchSize, setBatchSize] = useState(1);
  const [isUnifiedMemory, setIsUnifiedMemory] = useState(false);
  const [results, setResults] = useState(null);
  const [gpuList, setGpuList] = useState(defaultGpuList);
  const [gpuListLoading, setGpuListLoading] = useState(true);
  
  // Fetch and cache GPU data when component mounts
  useEffect(() => {
    const fetchGpuData = async () => {
      try {
        setGpuListLoading(true);
        const fetchedGpuList = await getCachedGpuList();
        if (fetchedGpuList && fetchedGpuList.length > 0) {
          setGpuList(fetchedGpuList);
          console.log(`Loaded ${fetchedGpuList.length} GPUs`);
        } else {
          console.warn("Failed to load GPU database, using fallback list");
          setGpuList(defaultGpuList);
        }
      } catch (error) {
        console.error("Failed to fetch GPU data:", error);
        setGpuList(defaultGpuList);
      } finally {
        setGpuListLoading(false);
      }
    };
    
    fetchGpuData();
  }, []);
  
  // Quantization options with descriptions
  const quantizationOptions = [
    // Floating Point Formats
    { value: 'FP32', label: 'FP32 (32-bit)', desc: 'Full precision, highest accuracy, highest memory usage' },
    { value: 'FP16', label: 'FP16 (16-bit)', desc: 'Half precision, good accuracy, moderate memory usage' },
    { value: 'BF16', label: 'BF16 (16-bit brain float)', desc: 'Better numerical stability than FP16' },
    { value: 'FP8', label: 'FP8 (8-bit float)', desc: '8-bit floating point format, experimental' },
    { value: 'E5M2', label: 'E5M2 (8-bit)', desc: '5-bit exponent, 2-bit mantissa floating point' },
    { value: 'E4M3', label: 'E4M3 (8-bit)', desc: '4-bit exponent, 3-bit mantissa floating point' },
    
    // Integer Quantization
    { value: 'INT8', label: 'INT8 (8-bit)', desc: 'Integer quantization, reduced accuracy, lower memory usage' },
    { value: 'INT5', label: 'INT5 (5-bit)', desc: '5-bit integer quantization' },
    { value: 'INT4', label: 'INT4 (4-bit)', desc: '4-bit integer quantization, commonly used' },
    { value: 'INT3', label: 'INT3 (3-bit)', desc: '3-bit integer quantization, experimental' },
    { value: 'INT2', label: 'INT2 (2-bit)', desc: '2-bit integer quantization, heavy accuracy loss' },
    
    // Special Formats
    { value: 'NF4', label: 'NF4 (4-bit)', desc: '4-bit normalized float, better accuracy than INT4' },
    { value: 'GPTQ4', label: 'GPTQ4 (4-bit)', desc: 'Optimized 4-bit quantization for transformers' },
    
    // GGUF Specific Formats
    { value: 'GGUF_Q4_0', label: 'GGUF Q4_0', desc: '4-bit quantization without f16 scales' },
    { value: 'GGUF_Q4_1', label: 'GGUF Q4_1', desc: '4-bit quantization with f16 scales' },
    { value: 'GGUF_Q5_0', label: 'GGUF Q5_0', desc: '5-bit quantization without f16 scales' },
    { value: 'GGUF_Q5_1', label: 'GGUF Q5_1', desc: '5-bit quantization with f16 scales' },
    { value: 'GGUF_Q8_0', label: 'GGUF Q8_0', desc: '8-bit quantization, good for base models' },
    { value: 'GGUF_Q2_K', label: 'GGUF Q2_K', desc: '2-bit quantization with k-means' },
    { value: 'GGUF_Q3_K', label: 'GGUF Q3_K', desc: '3-bit quantization with k-means' },
    { value: 'GGUF_Q6_K', label: 'GGUF Q6_K', desc: '6-bit quantization with k-means' },
  ];
  
  // Common model sizes for quick selection
  const commonModelSizes = [
    { size: 0.5, name: "0.5B" },
    { size: 1, name: "1B" },
    { size: 3, name: "3B" },
    { size: 7, name: "7B" },
    { size: 13, name: "13B" },
    { size: 34, name: "34B" },
    { size: 70, name: "70B" }
  ];
  
  // Common context length presets
  const contextLengthPresets = [2048, 4096, 8192, 16384, 32768];
  
  useEffect(() => {
    // Calculate hardware requirements whenever inputs change
    const calculationResults = calculateHardware(
      modelParams,
      quantization,
      contextLength,
      batchSize,
      isUnifiedMemory,
      1
    );
    setResults(calculationResults);
  }, [modelParams, quantization, contextLength, batchSize, isUnifiedMemory]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="header-gradient">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                LLM Hardware Calculator
              </h1>
              <p className="text-primary-100 text-sm md:text-base max-w-xl">
                Estimate GPU and system memory requirements for running large language models locally
              </p>
            </div>
            
            <div className="model-badge mt-4 md:mt-0 animate-float">
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
                {modelParams}B Parameters
              </span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
          {/* Input Form - Left Column */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-5 text-gray-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-primary-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
                Model Parameters
              </h2>
              
              {/* Model Parameters */}
              <div className="mb-6">
                <label htmlFor="modelParams" className="input-label">
                  Model Size (billions of parameters)
                </label>
                
                {/* Common model size quick selection */}
                <div className="mt-1 mb-3 flex flex-wrap gap-2">
                  {commonModelSizes.map(model => (
                    <button
                      key={model.name}
                      type="button"
                      onClick={() => setModelParams(model.size)}
                      className={`px-2 py-1 text-xs rounded-md transition-all ${
                        modelParams === model.size 
                          ? 'bg-primary-100 text-primary-700 font-medium ring-1 ring-primary-400' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {model.name}
                    </button>
                  ))}
                </div>
                
                <input
                  type="number"
                  id="modelParams"
                  className="block w-full"
                  value={modelParams}
                  onChange={(e) => setModelParams(Number(e.target.value) || 0)}
                  min="0.1"
                  step="0.1"
                />
                <p className="help-text">
                  Number of parameters in billions (e.g., 7 for a 7B model like Llama 2)
                </p>
              </div>
              
              {/* Quantization Precision */}
              <div className="mb-6">
                <label htmlFor="quantization" className="input-label flex items-center">
                  Quantization Precision
                  <Tooltip text="Lower precision uses less memory but may reduce model quality">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-1.17 1.025-3.07 1.025-4.242 0-1.172-1.025-1.172-2.687 0-3.712z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </Tooltip>
                </label>
                <select
                  id="quantization"
                  className="block w-full py-2"
                  value={quantization}
                  onChange={(e) => setQuantization(e.target.value)}
                  size="5"
                >
                  {quantizationOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="help-text">
                  {quantizationOptions.find(opt => opt.value === quantization)?.desc}
                </p>
              </div>
              
              {/* Context Length */}
              <div className="mb-6">
                <label htmlFor="contextLength" className="input-label flex items-center">
                  Context Length
                  <Tooltip text="Longer contexts use more memory for attention KV cache">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                    </svg>
                  </Tooltip>
                </label>
                
                {/* Context length presets */}
                <div className="mt-1 mb-3 flex flex-wrap gap-2">
                  {contextLengthPresets.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setContextLength(preset)}
                      className={`px-2 py-1 text-xs rounded-md transition-all ${
                        contextLength === preset 
                          ? 'bg-secondary-100 text-secondary-700 font-medium ring-1 ring-secondary-400' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {preset.toLocaleString()}
                    </button>
                  ))}
                </div>
                
                <input
                  type="number"
                  id="contextLength"
                  className="block w-full"
                  value={contextLength}
                  onChange={(e) => setContextLength(Number(e.target.value) || 0)}
                  min="512"
                  step="512"
                />
                <p className="help-text">
                  Maximum sequence length the model can process
                </p>
              </div>
              
              {/* Batch Size */}
              <div className="mb-5">
                <label htmlFor="batchSize" className="input-label flex items-center">
                  Batch Size
                  <Tooltip text="Number of sequences to process in parallel">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                    </svg>
                  </Tooltip>
                </label>
                <input
                  type="number"
                  id="batchSize"
                  className="block w-full"
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value) || 1)}
                  min="1"
                  step="1"
                />
                <p className="help-text">
                  Number of sequences to process simultaneously (higher values use more memory)
                </p>
              </div>
              
              {/* Memory Type Selection */}
              <div className="mb-5">
                <label className="input-label flex items-center">
                  Memory Architecture
                  <Tooltip text="Choose between unified memory (shared RAM/VRAM) and discrete GPU memory">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-1.17 1.025-3.07 1.025-4.242 0-1.172-1.025-1.172-2.687 0-3.712z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </Tooltip>
                </label>
                
                <div className="mt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsUnifiedMemory(false)}
                    className={`flex-1 px-3 py-2 rounded-md text-sm transition-all ${
                      !isUnifiedMemory 
                        ? 'bg-primary-100 text-primary-700 font-medium ring-1 ring-primary-400' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Discrete GPU Memory
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsUnifiedMemory(true)}
                    className={`flex-1 px-3 py-2 rounded-md text-sm transition-all ${
                      isUnifiedMemory 
                        ? 'bg-primary-100 text-primary-700 font-medium ring-1 ring-primary-400' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Unified Memory
                  </button>
                </div>
                <p className="help-text">
                  {isUnifiedMemory 
                    ? "Unified memory (Apple Silicon, some AMD APUs) - RAM and VRAM share the same pool, max 512GB"
                    : "Discrete GPU memory - Separate memory pools for GPU and system RAM"}
                </p>
              </div>
              
            </div>
          </div>
          
          {/* Results Section - Right Column */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2 text-primary-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
              Hardware Requirements
            </h2>
            
            {results && (
              <div className="space-y-8">
                {/* VRAM Requirements - Only show for discrete GPU memory */}
                {!isUnifiedMemory && (
                  <MemoryCard 
                    title="VRAM Requirements"
                    minimum={results.vramMinGB}
                    recommended={results.vramRecGB}
                    description={{
                      minimum: "Model + Basic Overhead",
                      recommended: "Model + KV Cache + Activations + Overhead"
                    }}
                    type="vram"
                    minExceedsLimit={results.minExceedsLimit}
                    recExceedsLimit={results.recExceedsLimit}
                    originalMin={results.originalUnifiedMinGB}
                    originalRec={results.originalUnifiedRecGB}
                    unifiedMemoryMax={results.unifiedMemoryMax}
                  />
                )}
                
                {/* RAM Requirements */}
                <MemoryCard 
                  title="RAM Requirements"
                  minimum={results.ramMinGB}
                  recommended={results.ramRecGB}
                  description={{
                    minimum: "Model + OS Overhead",
                    recommended: "Minimum + 20% Buffer"
                  }}
                  type="ram"
                  minExceedsLimit={results.minExceedsLimit}
                  recExceedsLimit={results.recExceedsLimit}
                  originalMin={results.originalUnifiedMinGB}
                  originalRec={results.originalUnifiedRecGB}
                  unifiedMemoryMax={results.unifiedMemoryMax}
                />
                
                {/* Memory Breakdown */}
                <div className="bg-gray-50 p-5 rounded-xl animated-bg">
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-primary-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75m0 0h3.75m-3.75 0h7.5M9 21h3.75m-3.75 0h7.5m3-6H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.423 48.423 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75m0 0h3.75m-3.75 0h7.5M9 21h3.75m-3.75 0h7.5"></path>
                    </svg>
                    Memory Breakdown
                  </h3>
                  
                <div className="card p-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <div className="text-xs text-gray-500 mb-1">Model Size</div>
                      <div className="text-lg font-semibold text-primary-600">{results.modelSizeGB} GB</div>
                    </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <div className="text-xs text-gray-500 mb-1">KV Cache</div>
                        <div className="text-lg font-semibold text-accent-600">{results.kvCacheGB} GB</div>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <div className="text-xs text-gray-500 mb-1">Activations</div>
                        <div className="text-lg font-semibold text-secondary-600">{results.activationGB} GB</div>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <div className="text-xs text-gray-500 mb-1">Overhead</div>
                        <div className="text-lg font-semibold text-gray-600">{results.overheadGB} GB</div>
                      </div>
                    </div>
                    
                    <div className="mt-5 p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Model Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Estimated layers:</span>
                          <span className="font-medium text-gray-800">{results.assumptions.estLayers}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Estimated hidden dimension:</span>
                          <span className="font-medium text-gray-800">{results.assumptions.estHiddenDim}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Bytes per parameter:</span>
                          <span className="font-medium text-gray-800">{results.assumptions.bytesPerParam}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">OS overhead:</span>
                          <span className="font-medium text-gray-800">{results.assumptions.osOverheadGB} GB</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Activation factor:</span>
                          <span className="font-medium text-gray-800">{results.assumptions.activationFactor * 100}%</span>
                        </div>
                        {results.isUnifiedMemory ? (
                          <div className="flex justify-between items-center md:col-span-2">
                            <span className="text-gray-600">Memory type:</span>
                            <span className="font-medium text-gray-800 flex items-center">
                              Unified (max {results.unifiedMemoryMax} GB)
                              
                              {/* Show warning if either value exceeds the limit */}
                              {(results.minExceedsLimit || results.recExceedsLimit) && (
                                <Tooltip text={`Some calculations exceed the unified memory limit of ${results.unifiedMemoryMax} GB!`}>
                                  <div className="ml-2 flex items-center justify-end rounded-full bg-amber-50 p-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-amber-500">
                                      <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                </Tooltip>
                              )}
                            </span>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center md:col-span-2">
                            <span className="text-gray-600">Number of GPUs:</span>
                            <span className="font-medium text-gray-800">
                              {results.assumptions.numGpus} GPU{results.assumptions.numGpus > 1 ? 's' : ''}
                              {results.assumptions.numGpus > 1 ? ` (${results.vramRecPerGpu.toFixed(1)} GB/GPU)` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Recommended GPU Setup */}
                <div className="bg-gray-50 p-5 rounded-xl animated-bg">
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-primary-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                    Recommended GPU Configuration
                  </h3>
                  
                  <div className="card p-5">
                    {gpuListLoading ? (
                      <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
                        <p className="mt-3 text-sm text-gray-600">Loading GPU recommendations...</p>
                      </div>
                    ) : (
                      <>
                        {/* Calculate recommendations using the GPU recommendation engine */}
                        {(() => {
                          const recommendations = recommendOptimalGpuSetup(
                            results,
                            gpuList,
                            isUnifiedMemory
                          );
                          
                          if (!recommendations.optimal && !recommendations.performance && !recommendations.budget) {
                            return (
                              <div className="text-center py-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto text-amber-500 mb-2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                </svg>
                                <p className="text-sm text-gray-700">
                                  No compatible GPU configurations found for these requirements.
                                </p>
                                <p className="mt-2 text-xs text-gray-500">
                                  Try lowering the model size, changing quantization, or reducing context length.
                                </p>
                              </div>
                            );
                          }
                          
                          // Helper function to render a GPU recommendation card
                          const renderGpuRecommendation = (recommendation, title, description) => {
                            if (!recommendation) return null;
                            
                            const { gpu, count, totalVram, performance, efficiency, meetsRecommended } = recommendation;
                            
                            // Prepare display name
                            const displayName = [
                              gpu.vendor && gpu.vendor !== "nan" ? gpu.vendor : "",
                              gpu.name && gpu.name !== "nan" ? gpu.name : "GPU"
                            ].filter(Boolean).join(" ");
                            
                            // Status based on requirements
                            let statusClass = meetsRecommended 
                              ? "bg-green-100 text-green-800" 
                              : "bg-yellow-100 text-yellow-800";
                              
                            // Performance score normalization (make it out of 100)
                            const normalizedPerformance = Math.min(100, Math.round(performance / 5));
                            const normalizedEfficiency = Math.min(100, Math.round(efficiency / 2));
                            
                            return (
                              <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm mb-4">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h4 className="text-base font-semibold text-gray-900">{title}</h4>
                                    <p className="text-xs text-gray-600">{description}</p>
                                  </div>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusClass}`}>
                                    {meetsRecommended ? 'Meets All Requirements' : 'Meets Minimum Requirements'}
                                  </span>
                                </div>
                                
                                <div className="flex items-center mb-3">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-gray-700">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                                  </svg>
                                  <span className="text-sm font-medium">{displayName}</span>
                                </div>
                                
                                <div className="mb-4 grid grid-cols-2 gap-2">
                                  <div className="p-2 bg-gray-50 rounded text-center">
                                    <div className="text-xs text-gray-500 mb-1">Required Quantity</div>
                                    <div className="text-base font-bold text-gray-800">
                                      {count} {count === 1 ? 'GPU' : 'GPUs'}
                                    </div>
                                  </div>
                                  <div className="p-2 bg-gray-50 rounded text-center">
                                    <div className="text-xs text-gray-500 mb-1">Total VRAM</div>
                                    <div className="text-base font-bold text-gray-800">
                                      {totalVram} GB
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="mb-2">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-gray-600">Performance</span>
                                    <span className="text-xs font-medium text-gray-700">{normalizedPerformance}/100</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-gray-100 rounded-full">
                                    <div 
                                      className="h-1.5 bg-primary-500 rounded-full" 
                                      style={{ width: `${normalizedPerformance}%` }}
                                    ></div>
                                  </div>
                                </div>
                                
                                <div>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-gray-600">Cost-Efficiency</span>
                                    <span className="text-xs font-medium text-gray-700">{normalizedEfficiency}/100</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-gray-100 rounded-full">
                                    <div 
                                      className="h-1.5 bg-secondary-500 rounded-full" 
                                      style={{ width: `${normalizedEfficiency}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            );
                          };
                          
                          return (
                            <div className="space-y-2">
                              {renderGpuRecommendation(
                                recommendations.optimal, 
                                "Optimal GPU Configuration", 
                                "Best balance of performance, compatibility and cost"
                              )}
                              
                              {recommendations.performance && recommendations.performance !== recommendations.optimal && renderGpuRecommendation(
                                recommendations.performance, 
                                "Highest Performance", 
                                "Maximum processing power for fastest inference"
                              )}
                              
                              {recommendations.budget && recommendations.budget !== recommendations.optimal && recommendations.budget !== recommendations.performance && renderGpuRecommendation(
                                recommendations.budget, 
                                "Budget-Friendly Option", 
                                "Most cost-effective solution that meets requirements"
                              )}
                              
                              <div className="text-xs text-gray-500 mt-2">
                                <p className="mb-1">Recommendations based on: {results.vramRecGB}GB VRAM (recommended), {results.vramMinGB}GB (minimum)</p>
                                <p>Values are estimates and may vary based on specific GPU models, drivers, and workloads.</p>
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>
                </div>
                
              </div>
            )}
          </div>
        </div>
      </main>
      
      <footer className="footer-gradient mt-8 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-center text-sm text-gray-600 font-medium">
              LLM Hardware Calculator - Estimate resources for running large language models locally
            </p>
            <p className="text-center text-xs text-gray-500 mt-2 md:mt-0">
              © {new Date().getFullYear()} - Made with Tailwind CSS and React
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
