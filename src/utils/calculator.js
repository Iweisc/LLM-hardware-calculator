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
export const calculateKVCacheGB = (contextLength, layers, hiddenDim, bytesPerParam, batchSize) => {
  // KV cache stores key and value states for each layer, each head, for the entire sequence
  // Formula: 2 (for K and V) * layers * hidden_dim * context_length * batch_size * bytes_per_param
  // Divide by 1024^3 to convert to GB
  return (2 * layers * hiddenDim * contextLength * batchSize * bytesPerParam) / (1024 * 1024 * 1024);
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
 * @returns {Object} Object containing VRAM and RAM estimates
 */
export const calculateHardware = (modelParams, quantization, contextLength, batchSize) => {
  const bytesPerParam = getBytesPerParameter(quantization);
  const modelSizeGB = calculateModelSizeGB(modelParams, bytesPerParam);
  
  // Estimate layers and hidden dim based on model size
  const estLayers = estimateLayers(modelParams);
  const estHiddenDim = estimateHiddenDim(modelParams);
  
  // Calculate KV Cache size
  const kvCacheGB = calculateKVCacheGB(contextLength, estLayers, estHiddenDim, bytesPerParam, batchSize);
  
  // Calculate activation memory (simplified)
  const activationGB = calculateActivationGB(modelSizeGB);
  
  // Fixed overhead for CUDA context, framework, etc.
  const fixedOverheadGB = 1.5;
  
  // Calculate VRAM requirements
  const vramMinGB = modelSizeGB + fixedOverheadGB;
  const vramRecGB = modelSizeGB + kvCacheGB + activationGB + fixedOverheadGB;
  
  // Calculate RAM requirements
  const osOverheadGB = 4; // Arbitrary OS overhead
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
    ramMinGB: parseFloat(ramMinGB.toFixed(2)),
    ramRecGB: parseFloat(ramRecGB.toFixed(2)),
    // Include assumptions for transparency
    assumptions: {
      estLayers,
      estHiddenDim,
      bytesPerParam,
      osOverheadGB,
      activationFactor: 0.2,
    }
  };
};
