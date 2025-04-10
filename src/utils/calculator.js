/**
 * Calculator utility functions for LLM hardware requirements
 */

/**
 * Get bytes per parameter based on quantization type
 * @param {string} quantization - Quantization type (FP32, FP16, BF16, INT8, INT4, etc.)
 * @returns {number} Bytes per parameter
 */
export const getBytesPerParameter = (quantization) => {
  switch (quantization) {
    // Full precision
    case 'FP32':
      return 4; // 32 bits = 4 bytes
    
    // 16-bit formats
    case 'FP16':
    case 'BF16':
      return 2; // 16 bits = 2 bytes
    
    // 8-bit formats
    case 'INT8':
    case 'FP8':
    case 'E5M2':
    case 'E4M3':
      return 1; // 8 bits = 1 byte
    
    // 5-bit format
    case 'INT5':
      return 0.625; // 5 bits = 0.625 bytes
    
    // 4-bit formats
    case 'INT4':
    case 'NF4':
    case 'GPTQ4':
      return 0.5; // 4 bits = 0.5 bytes
    
    // 3-bit format
    case 'INT3':
      return 0.375; // 3 bits = 0.375 bytes
    
    // 2-bit format
    case 'INT2':
      return 0.25; // 2 bits = 0.25 bytes
    
    // GGUF specific formats
    case 'GGUF_Q4_0':
    case 'GGUF_Q4_1':
      return 0.5; // Approx 4 bits for Q4 formats
      
    case 'GGUF_Q5_0':
    case 'GGUF_Q5_1':
      return 0.625; // Approx 5 bits for Q5 formats
      
    case 'GGUF_Q8_0':
      return 1.0; // Approx 8 bits
      
    case 'GGUF_Q2_K':
      return 0.25; // Approx 2 bits
      
    case 'GGUF_Q3_K':
      return 0.375; // Approx 3 bits
      
    case 'GGUF_Q6_K':
      return 0.75; // Approx 6 bits
      
    default:
      return 2; // Default to FP16
  }
};

/**
 * Estimate model size in GB
 * @param {number} modelParams - Model parameters in billions
 * @param {number} bytesPerParam - Bytes per parameter
 * @returns {number} Model size in GB
 */
export const calculateModelSizeGB = (modelParams, bytesPerParam) => {
  // Convert billions of parameters to actual number and multiply by bytes per parameter
  return (modelParams * 1e9 * bytesPerParam) / (1024 * 1024 * 1024);
};

/**
 * Estimate number of layers based on model size (very rough approximation)
 * @param {number} modelParams - Model parameters in billions
 * @returns {number} Estimated number of layers
 */
export const estimateLayers = (modelParams) => {
  // Very simplified estimation - adjust based on empirical data
  if (modelParams <= 1) return 12;
  if (modelParams <= 7) return 32;
  if (modelParams <= 13) return 40;
  if (modelParams <= 70) return 80;
  return 96; // For very large models
};

/**
 * Estimate hidden dimension based on model size (very rough approximation)
 * @param {number} modelParams - Model parameters in billions
 * @returns {number} Estimated hidden dimension
 */
export const estimateHiddenDim = (modelParams) => {
  // Very simplified estimation - adjust based on empirical data
  if (modelParams <= 1) return 768;
  if (modelParams <= 7) return 4096;
  if (modelParams <= 13) return 5120;
  if (modelParams <= 70) return 8192;
  return 12288; // For very large models
};

/**
 * Calculate KV Cache size in GB
 * @param {number} contextLength - Maximum sequence length
 * @param {number} layers - Number of transformer layers
 * @param {number} hiddenDim - Hidden dimension size
 * @param {number} bytesPerParam - Bytes per parameter
 * @param {number} batchSize - Batch size
 * @returns {number} KV Cache size in GB
 */
export const calculateKVCacheGB = (contextLength, layers, hiddenDim, modelBytesPerParam, kvBytesPerParam, batchSize) => {
  // KV cache stores key and value states for each layer, each head, for the entire sequence
  // Formula: 2 (for K and V) * layers * hidden_dim * context_length * batch_size * bytes_per_param
  // Divide by 1024^3 to convert to GB
  const kvBytesParameter = kvBytesPerParam || modelBytesPerParam; // If no specific KV quantization, use model quantization
  return (2 * layers * hiddenDim * contextLength * batchSize * kvBytesParameter) / (1024 * 1024 * 1024);
};

/**
 * Calculate activation memory in GB (simplified)
 * @param {number} modelSizeGB - Model size in GB
 * @returns {number} Activation memory in GB
 */
export const calculateActivationGB = (modelSizeGB) => {
  // Simplified estimation - typically a fraction of model size
  return modelSizeGB * 0.2; // Assuming 20% of model size for activations
};

/**
 * Calculate hardware requirements for running an LLM
 * @param {number} modelParams - Model parameters in billions
 * @param {string} quantization - Quantization type
 * @param {number} contextLength - Maximum sequence length
 * @param {number} batchSize - Batch size
 * @param {boolean} isUnifiedMemory - Whether system uses unified memory (GPU and RAM share memory)
 * @param {number} numGpus - Number of GPUs in the system or server rack
 * @returns {Object} Object containing VRAM and RAM estimates
 */
export const calculateHardware = (modelParams, quantization, kvQuantization, contextLength, batchSize, isUnifiedMemory = false, numGpus = 1) => {
  const modelBytesPerParam = getBytesPerParameter(quantization);
  const kvBytesPerParam = kvQuantization ? getBytesPerParameter(kvQuantization) : modelBytesPerParam;
  const modelSizeGB = calculateModelSizeGB(modelParams, modelBytesPerParam);
  
  // Estimate layers and hidden dim based on model size
  const estLayers = estimateLayers(modelParams);
  const estHiddenDim = estimateHiddenDim(modelParams);
  
  // Calculate KV Cache size
  const kvCacheGB = calculateKVCacheGB(contextLength, estLayers, estHiddenDim, modelBytesPerParam, kvBytesPerParam, batchSize);
  
  // Calculate activation memory (simplified)
  const activationGB = calculateActivationGB(modelSizeGB);
  
  // Fixed overhead for CUDA context, framework, etc.
  const fixedOverheadGB = 1.5;
  
  // Fixed overhead for OS
  const osOverheadGB = 4; // Arbitrary OS overhead
  
  // Handle the case of unified memory (like Apple Silicon)
  if (isUnifiedMemory) {
    // In unified memory, VRAM and RAM share the same pool
    // For calculation purposes, we treat it as one memory pool with a cap of 512GB
    const unifiedMemoryMax = 512; // Maximum unified memory in GB
    
    // Calculate original values (before capping)
    const originalUnifiedMinGB = modelSizeGB + fixedOverheadGB + osOverheadGB;
    const originalUnifiedRecGB = modelSizeGB + kvCacheGB + activationGB + fixedOverheadGB + osOverheadGB;
    
    // Then apply caps
    const unifiedMinGB = Math.min(originalUnifiedMinGB, unifiedMemoryMax);
    const unifiedRecGB = Math.min(originalUnifiedRecGB, unifiedMemoryMax);
    
    // Check if values were capped
    const minExceedsLimit = originalUnifiedMinGB > unifiedMemoryMax;
    const recExceedsLimit = originalUnifiedRecGB > unifiedMemoryMax;
    
    // Set both VRAM and RAM to the same values for unified memory
    const vramMinGB = unifiedMinGB;
    const vramRecGB = unifiedRecGB;
    const ramMinGB = unifiedMinGB;
    const ramRecGB = unifiedRecGB;
    
    return {
      modelSizeGB: parseFloat(modelSizeGB.toFixed(2)),
      kvCacheGB: parseFloat(kvCacheGB.toFixed(2)),
      activationGB: parseFloat(activationGB.toFixed(2)),
      overheadGB: fixedOverheadGB,
      vramMinGB: parseFloat(vramMinGB.toFixed(2)),
      vramRecGB: parseFloat(vramRecGB.toFixed(2)),
      ramMinGB: parseFloat(ramMinGB.toFixed(2)),
      ramRecGB: parseFloat(ramRecGB.toFixed(2)),
      isUnifiedMemory: true,
      unifiedMemoryMax,
      // Track if limits were exceeded
      minExceedsLimit,
      recExceedsLimit,
      // Original values before capping
      originalUnifiedMinGB: parseFloat(originalUnifiedMinGB.toFixed(2)),
      originalUnifiedRecGB: parseFloat(originalUnifiedRecGB.toFixed(2)),
      // Include assumptions for transparency
      assumptions: {
        estLayers,
        estHiddenDim,
        bytesPerParam: modelBytesPerParam,
        kvBytesPerParam,
        osOverheadGB,
        activationFactor: 0.2,
        numGpus: 1 // Unified memory typically means 1 GPU/SoC
      }
    };
  }
  
  // For multi-GPU setups with non-unified memory
  // Calculate per-GPU VRAM requirements
  const vramMinPerGpu = (modelSizeGB + fixedOverheadGB) / numGpus;
  const vramRecPerGpu = (modelSizeGB + kvCacheGB + activationGB + fixedOverheadGB) / numGpus;
  
  // Total VRAM across all GPUs
  const vramMinGB = vramMinPerGpu * numGpus;
  const vramRecGB = vramRecPerGpu * numGpus;
  
  // Calculate RAM requirements - this doesn't change much with multi-GPU, except maybe for a small overhead
  const ramMinGB = modelSizeGB + osOverheadGB;
  const ramRecGB = ramMinGB * 1.2; // Add 20% buffer
  
  // Return all calculated values
  return {
    modelSizeGB: parseFloat(modelSizeGB.toFixed(2)),
    kvCacheGB: parseFloat(kvCacheGB.toFixed(2)),
    activationGB: parseFloat(activationGB.toFixed(2)),
    overheadGB: fixedOverheadGB,
    vramMinGB: parseFloat(vramMinGB.toFixed(2)),
    vramRecGB: parseFloat(vramRecGB.toFixed(2)),
    vramMinPerGpu: parseFloat(vramMinPerGpu.toFixed(2)),
    vramRecPerGpu: parseFloat(vramRecPerGpu.toFixed(2)),
    ramMinGB: parseFloat(ramMinGB.toFixed(2)),
    ramRecGB: parseFloat(ramRecGB.toFixed(2)),
    isUnifiedMemory: false,
    // Include assumptions for transparency
      assumptions: {
        estLayers,
        estHiddenDim,
        bytesPerParam: modelBytesPerParam,
        kvBytesPerParam,
      osOverheadGB,
      activationFactor: 0.2,
      numGpus
    }
  };
};
