import Tooltip from './Tooltip';

const ModelDetailsForm = ({
  modelParams,
  setModelParams,
  quantization,
  setQuantization,
  kvQuantization,
  setKvQuantization,
  contextLength,
  setContextLength,
  batchSize,
  setBatchSize,
  isUnifiedMemory,
  setIsUnifiedMemory
}) => {
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

  return (
    <div className="card p-6 sticky top-8"> {/* Card styling handled globally */}
      <h2 className="text-xl font-semibold mb-5 text-gray-800 flex items-center dark:text-gray-200"> {/* Dark heading text */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400"> {/* Dark icon */}
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
                  ? 'bg-primary-100 text-primary-700 font-medium ring-1 ring-primary-400 dark:bg-primary-900 dark:text-primary-300 dark:ring-primary-500' // Dark active state
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600' // Dark inactive state
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
      
      {/* Model Quantization */}
      <div className="mb-6">
        <label htmlFor="quantization" className="input-label flex items-center"> {/* Label handled globally */}
          Model Quantization
          <Tooltip text="Quantization precision for model weights. Lower precision uses less memory but may reduce model quality">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1 text-gray-600 dark:text-gray-500"> {/* Changed text-gray-400 to text-gray-600 */}
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
            <option key={option.value} value={option.value} className="dark:bg-gray-700 dark:text-gray-100"> {/* Ensure option text visible */}
              {option.label}
            </option>
          ))}
        </select>
        <p className="help-text">
          {quantizationOptions.find(opt => opt.value === quantization)?.desc}
        </p>
      </div>

      {/* KV Cache Quantization */}
      <div className="mb-6">
        <label htmlFor="kvQuantization" className="input-label flex items-center"> {/* Label handled globally */}
          KV Cache Quantization
          <Tooltip text="Optional separate quantization for KV cache. If not set, uses model quantization">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1 text-gray-600 dark:text-gray-500"> {/* Changed text-gray-400 to text-gray-600 */}
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-1.17 1.025-3.07 1.025-4.242 0-1.172-1.025-1.172-2.687 0-3.712z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </Tooltip>
        </label>
        <select
          id="kvQuantization"
          className="block w-full py-2"
          value={kvQuantization}
          onChange={(e) => setKvQuantization(e.target.value)}
          size="5"
        >
          <option value="" className="dark:bg-gray-700 dark:text-gray-100">Use Model Quantization</option> {/* Style empty option */}
          {quantizationOptions.map(option => (
            <option key={option.value} value={option.value} className="dark:bg-gray-700 dark:text-gray-100"> {/* Ensure option text visible */}
              {option.label}
            </option>
          ))}
        </select>
        <p className="help-text">
          {kvQuantization ? quantizationOptions.find(opt => opt.value === kvQuantization)?.desc : 'Using same quantization as model weights'}
        </p>
      </div>
      
      {/* Context Length */}
      <div className="mb-6">
        <label htmlFor="contextLength" className="input-label flex items-center"> {/* Label handled globally */}
          Context Length
          <Tooltip text="Longer contexts use more memory for attention KV cache">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1 text-gray-600 dark:text-gray-500"> {/* Changed text-gray-400 to text-gray-600 */}
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
                  ? 'bg-secondary-100 text-secondary-700 font-medium ring-1 ring-secondary-400 dark:bg-secondary-900 dark:text-secondary-300 dark:ring-secondary-500' // Dark active
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600' // Dark inactive
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
        <label htmlFor="batchSize" className="input-label flex items-center"> {/* Label handled globally */}
          Batch Size
          <Tooltip text="Number of sequences to process in parallel">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1 text-gray-600 dark:text-gray-500"> {/* Changed text-gray-400 to text-gray-600 */}
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
        <label className="input-label flex items-center"> {/* Label handled globally */}
          Memory Architecture
          <Tooltip text="Choose between unified memory (shared RAM/VRAM) and discrete GPU memory">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1 text-gray-600 dark:text-gray-500"> {/* Changed text-gray-400 to text-gray-600 */}
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
                ? 'bg-primary-100 text-primary-700 font-medium ring-1 ring-primary-400 dark:bg-primary-900 dark:text-primary-300 dark:ring-primary-500' // Dark active
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600' // Dark inactive
            }`}
          >
            Discrete GPU Memory
          </button>
          <button
            type="button"
            onClick={() => setIsUnifiedMemory(true)}
            className={`flex-1 px-3 py-2 rounded-md text-sm transition-all ${
              isUnifiedMemory 
                ? 'bg-primary-100 text-primary-700 font-medium ring-1 ring-primary-400 dark:bg-primary-900 dark:text-primary-300 dark:ring-primary-500' // Dark active
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600' // Dark inactive
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
  );
};

export default ModelDetailsForm;
