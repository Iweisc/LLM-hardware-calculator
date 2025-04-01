/**
 * GPU data utilities for hardware compatibility checks
 */

// GitHub API URL for gpu-info-api
const GPU_API_URL = 'https://raw.githubusercontent.com/voidful/gpu-info-api/gpu-data/gpu.json';

// Function to parse and clean GPU data from the raw JSON
export const processGpuData = async () => {
  try {
    // Check if we have cached data and it's not too old (24 hours)
    const cachedData = getCachedGpuData();
    if (cachedData) {
      console.log("Using cached GPU data");
      return cachedData;
    }
    
    // Maximum number of retries
    const MAX_RETRIES = 3;
    // Timeout for fetch in milliseconds (5 seconds)
    const FETCH_TIMEOUT = 5000;
    
    // Create a function for fetch with timeout
    const fetchWithTimeout = async (url, options, timeout) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        clearTimeout(id);
        return response;
      } catch (error) {
        clearTimeout(id);
        throw error;
      }
    };
    
    // Retry logic for fetch operation
    let lastError = null;
    let data = null;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Loading GPU database from API (attempt ${attempt} of ${MAX_RETRIES})...`);
        
        const response = await fetchWithTimeout(GPU_API_URL, {}, FETCH_TIMEOUT);
        
        if (!response.ok) {
          const errorMessage = `Failed to fetch GPU data: ${response.status} ${response.statusText}`;
          console.warn(errorMessage);
          lastError = new Error(errorMessage);
          // Wait before retry, with exponential backoff
          if (attempt < MAX_RETRIES) {
            const delayMs = Math.pow(2, attempt) * 500; // 1s, 2s, 4s
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
          continue;
        }
        
        data = await response.json();
        console.log(`Successfully loaded GPU database with ${Object.keys(data).length} entries`);
        
        // Cache the successful response
        cacheGpuData(data);
        
        // Successfully retrieved data, break out of the retry loop
        break;
      } catch (error) {
        console.error(`Error on attempt ${attempt}: ${error.message}`);
        lastError = error;
        
        // Wait before retry if not the last attempt
        if (attempt < MAX_RETRIES) {
          const delayMs = Math.pow(2, attempt) * 500;
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
    
    // If all retries failed, use default data
    if (!data) {
      console.error("All attempts to fetch GPU data failed, using default list");
      return defaultGpuList;
    }
    
    // Extract relevant GPU information
    const gpuList = [];
    let memoryExtractionStats = {
      direct: 0,
      inferred: 0,
      fallback: 0,
      total: 0
    };
    
    // Process GPU data
    Object.entries(data).forEach(([id, gpu]) => {
      // Skip entries without proper information
      if (!gpu || typeof gpu !== 'object') return;
      if (!gpu.Model) return;
      
      memoryExtractionStats.total++;
      
      let memSize = 0;
      let memorySource = '';
      
      // Step 1: Extract memory size directly from GPU data
      // This is our primary source and should be most accurate
      const extractionResult = extractMemorySize(gpu);
      memSize = extractionResult.memSize;
      
      if (memSize > 0) {
        memorySource = `from ${extractionResult.source}`;
        memoryExtractionStats.direct++;
      } else {
        // Step 2: If not found in direct fields, try to infer from model name
        memSize = inferMemorySizeFromModelName(gpu.Model);
        
        if (memSize > 0) {
          memorySource = 'inferred from model name';
          memoryExtractionStats.inferred++;
        } else {
          // Step 3: Use smarter fallback based on GPU family and generation
          const modelName = (gpu.Model || "").toLowerCase();
          memSize = getVramFromGpuModel(modelName);
          memorySource = 'fallback database';
          memoryExtractionStats.fallback++;
        }
      }
      
      // Round to 1 decimal place for cleaner display
      if (memSize > 0) {
        memSize = Math.round(memSize * 10) / 10;
      }
      
      // Extract vendor
      let vendor = gpu.Vendor || "";
      
      // Create a clean model name
      let modelName = gpu.Model;
      if (typeof modelName === 'string') {
        // Remove vendor name if it's already in the model string
        if (vendor && modelName.includes(vendor)) {
          modelName = modelName.replace(new RegExp(`^${vendor}\\s+`), '');
        }
        
        // Clean up model name
        modelName = modelName.replace(/\s+\(.*?\)/g, '').trim();
      }
      
      // Skip if no valid model name
      if (!modelName) return;
      
      // Add to GPU list
      const gpuEntry = {
        id: `${id}_${modelName}_${memSize}`, // Create a more unique ID
        name: modelName || "Unknown GPU",
        vendor: vendor || "",
        vram: memSize || 0,
        launchDate: gpu.Launch || null
      };
      
      // Add a flag for debugging if needed
      if (process.env.NODE_ENV === 'development') {
        gpuEntry._memorySource = memorySource;
      }
      
      // Add the GPU to our list
      gpuList.push(gpuEntry);
    });
    
    console.log(`Created GPU list with ${gpuList.length} entries`);
    console.log(`Memory extraction stats: ${JSON.stringify(memoryExtractionStats)}`);
    
    // Sort by memory size (descending) and then by name
    return gpuList.sort((a, b) => {
      if (b.vram !== a.vram) {
        return b.vram - a.vram; // Sort by memory size (descending)
      }
      return a.name.localeCompare(b.name); // Then sort by name
    });
  } catch (error) {
    console.error("Error processing GPU data:", error);
    console.error(error.stack);
    return defaultGpuList; // Return default list if there's an error
  }
};

// Default list of common GPUs (fallback if API fails)
export const defaultGpuList = [
  // NVIDIA Consumer GPUs
  { name: "RTX 4090", vram: 24, isUnified: false },
  { name: "RTX 4080", vram: 16, isUnified: false },
  { name: "RTX 4070 Ti", vram: 12, isUnified: false },
  { name: "RTX 3090", vram: 24, isUnified: false },
  { name: "RTX 3080", vram: 10, isUnified: false },
  { name: "RTX 3070", vram: 8, isUnified: false },
  { name: "RTX 2080 Ti", vram: 11, isUnified: false },
  { name: "RTX 2080", vram: 8, isUnified: false },
  { name: "RTX 2070", vram: 8, isUnified: false },
  
  // NVIDIA Professional GPUs
  { name: "A100", vram: 80, isUnified: false },
  { name: "A6000", vram: 48, isUnified: false },
  { name: "A5000", vram: 24, isUnified: false },
  { name: "A4000", vram: 16, isUnified: false },
  
  // AMD GPUs
  { name: "Radeon RX 7900 XTX", vram: 24, isUnified: false },
  { name: "Radeon RX 6900 XT", vram: 16, isUnified: false },
  { name: "Radeon RX 6800 XT", vram: 16, isUnified: false },
  
  // Apple Silicon (Unified Memory)
  { name: "Apple M1", vendor: "Apple", vram: 8, isUnified: true },
  { name: "Apple M1", vendor: "Apple", vram: 16, isUnified: true },
  { name: "Apple M1 Pro", vendor: "Apple", vram: 16, isUnified: true },
  { name: "Apple M1 Pro", vendor: "Apple", vram: 32, isUnified: true },
  { name: "Apple M1 Max", vendor: "Apple", vram: 32, isUnified: true },
  { name: "Apple M1 Max", vendor: "Apple", vram: 64, isUnified: true },
  { name: "Apple M1 Ultra", vendor: "Apple", vram: 64, isUnified: true },
  { name: "Apple M1 Ultra", vendor: "Apple", vram: 128, isUnified: true },
  
  { name: "Apple M2", vendor: "Apple", vram: 8, isUnified: true },
  { name: "Apple M2", vendor: "Apple", vram: 16, isUnified: true },
  { name: "Apple M2", vendor: "Apple", vram: 24, isUnified: true },
  { name: "Apple M2 Pro", vendor: "Apple", vram: 16, isUnified: true },
  { name: "Apple M2 Pro", vendor: "Apple", vram: 32, isUnified: true },
  { name: "Apple M2 Max", vendor: "Apple", vram: 32, isUnified: true },
  { name: "Apple M2 Max", vendor: "Apple", vram: 64, isUnified: true },
  { name: "Apple M2 Max", vendor: "Apple", vram: 96, isUnified: true },
  { name: "Apple M2 Ultra", vendor: "Apple", vram: 64, isUnified: true },
  { name: "Apple M2 Ultra", vendor: "Apple", vram: 128, isUnified: true },
  { name: "Apple M2 Ultra", vendor: "Apple", vram: 192, isUnified: true },
  
  { name: "Apple M3", vendor: "Apple", vram: 8, isUnified: true },
  { name: "Apple M3", vendor: "Apple", vram: 16, isUnified: true },
  { name: "Apple M3", vendor: "Apple", vram: 24, isUnified: true },
  { name: "Apple M3 Pro", vendor: "Apple", vram: 18, isUnified: true },
  { name: "Apple M3 Pro", vendor: "Apple", vram: 36, isUnified: true },
  { name: "Apple M3 Max", vendor: "Apple", vram: 36, isUnified: true },
  { name: "Apple M3 Max", vendor: "Apple", vram: 64, isUnified: true },
  { name: "Apple M3 Max", vendor: "Apple", vram: 128, isUnified: true },
  { name: "Apple M3 Ultra", vendor: "Apple", vram: 128, isUnified: true },
  { name: "Apple M3 Ultra", vendor: "Apple", vram: 192, isUnified: true },
  
  // AMD APUs with unified memory
  { name: "Ryzen 7 7840U", vendor: "AMD", vram: 32, isUnified: true },
  { name: "Ryzen 9 7940HS", vendor: "AMD", vram: 32, isUnified: true },
  { name: "Ryzen 7 6800U", vendor: "AMD", vram: 32, isUnified: true },
  { name: "Ryzen 9 6900HX", vendor: "AMD", vram: 32, isUnified: true },
  { name: "Ryzen 7 5800U", vendor: "AMD", vram: 32, isUnified: true },
  
  // Intel integrated graphics with unified memory
  { name: "Core Ultra 7 155H (Meteor Lake)", vendor: "Intel", vram: 32, isUnified: true },
  { name: "Core Ultra 9 185H", vendor: "Intel", vram: 32, isUnified: true },
  { name: "Core i7-1370P (Iris Xe)", vendor: "Intel", vram: 32, isUnified: true },
  { name: "Core i9-13900H (Iris Xe)", vendor: "Intel", vram: 32, isUnified: true },
  
  // Qualcomm
  { name: "Snapdragon X Elite", vendor: "Qualcomm", vram: 32, isUnified: true },
  { name: "Snapdragon 8cx Gen 3", vendor: "Qualcomm", vram: 32, isUnified: true },
  
  // Intel Data Center GPUs
  { name: "Data Center GPU Max 1550", vendor: "Intel", vram: 128, isUnified: false },
  { name: "Data Center GPU Max 1100", vendor: "Intel", vram: 48, isUnified: false }
];

// Get all GPUs (no filtering except by memory threshold)
export const getAllGpus = (gpuList) => {
  return gpuList;
};

// Filter for unified memory GPUs/APUs
export const getUnifiedMemoryGpus = (gpuList, limit = null) => {
  // First check if the GPU list has the isUnified property
  const hasUnifiedProperty = gpuList.some(gpu => 'isUnified' in gpu);
  
  const unifiedGpus = hasUnifiedProperty
    ? gpuList.filter(gpu => gpu.isUnified === true)
    : gpuList.filter(gpu => {
        const name = (gpu.name || '').toLowerCase();
        const vendor = (gpu.vendor || '').toLowerCase();
        
        // Apple Silicon
        if (name.includes('m1') || name.includes('m2') || name.includes('m3') || name.includes('m4')) {
          return true;
        }
        
        // AMD APUs
        if (name.includes('ryzen') && (name.includes('u') || name.includes('h') || name.includes('hs'))) {
          return true;
        }
        
        // Intel integrated
        if (name.includes('core') && (name.includes('iris') || name.includes('uhd') || name.includes('ultra'))) {
          return true;
        }
        
        // Qualcomm
        if (name.includes('snapdragon')) {
          return true;
        }
        
        return false;
      });
  
  return limit ? unifiedGpus.slice(0, limit) : unifiedGpus;
};

// Filter for consumer GPUs - now with more relaxed matching
export const getConsumerGpus = (gpuList, limit = null) => {
  const consumerGpus = gpuList.filter(gpu => {
    const vendor = gpu.vendor?.toLowerCase() || '';
    const name = gpu.name?.toLowerCase() || '';
    
    // Check for known professional/enterprise GPUs first and exclude them
    if (isWorkstationGpu(gpu)) {
      return false;
    }
    
    // Consider all other GPUs as potentially consumer models
    // especially if they have common consumer vendor names
    return true;
  });
  
  return limit ? consumerGpus.slice(0, limit) : consumerGpus;
};

// Helper function to check if a GPU is a workstation/professional model
const isWorkstationGpu = (gpu) => {
  const vendor = gpu.vendor?.toLowerCase() || '';
  const name = gpu.name?.toLowerCase() || '';
  
  // Professional NVIDIA GPUs
  const nvidiaProMatch = 
         name.includes('rtx a') || 
         name.includes('tesla') || 
         name.includes('quadro') || 
         name.includes('a100') || 
         name.includes('h100') ||
         name.includes('a40') ||
         name.includes('a30') ||
         name.includes('a10') ||
         name.includes('a16') ||
         name.includes('a2') ||
         name.includes('t4') ||
         name.includes('v100');
         
  // Professional AMD GPUs  
  const amdProMatch = 
         name.includes('radeon pro') ||
         name.includes('firepro') ||
         name.includes('radeon instinct') ||
         (name.includes('w') && /\bw\d{4}\b/.test(name)); // Match W series like W6800
         
  // Professional Intel GPUs
  const intelProMatch = name.includes('xeon');
  
  // General matching based on keywords
  const generalProMatch = 
         name.includes('workstation') ||
         name.includes('professional') ||
         name.includes('datacenter');
         
  return nvidiaProMatch || amdProMatch || intelProMatch || generalProMatch;
};

// Filter for professional/workstation GPUs
export const getWorkstationGpus = (gpuList, limit = null) => {
  const workstationGpus = gpuList.filter(gpu => isWorkstationGpu(gpu));
  return limit ? workstationGpus.slice(0, limit) : workstationGpus;
};

// Cache for processed GPU list to avoid reprocessing
let cachedGpuList = null;

// Functions to handle localStorage caching of GPU data
// Cache expiration time - 24 hours in milliseconds
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

// Get cached GPU data from localStorage
const getCachedGpuData = () => {
  try {
    const cachedData = localStorage.getItem('gpu_data_cache');
    if (!cachedData) return null;
    
    const parsed = JSON.parse(cachedData);
    const now = new Date().getTime();
    
    // Check if cache is still valid (not expired)
    if (parsed.timestamp && (now - parsed.timestamp < CACHE_EXPIRATION)) {
      console.log('Found valid GPU data in cache');
      return parsed.data;
    } else {
      console.log('GPU cache expired, fetching fresh data');
      localStorage.removeItem('gpu_data_cache');
      return null;
    }
  } catch (error) {
    console.error('Error reading GPU cache:', error);
    return null;
  }
};

// Save GPU data to localStorage cache
const cacheGpuData = (data) => {
  try {
    const cacheObject = {
      timestamp: new Date().getTime(),
      data: data
    };
    localStorage.setItem('gpu_data_cache', JSON.stringify(cacheObject));
    console.log('GPU data saved to cache');
  } catch (error) {
    console.error('Error saving GPU data to cache:', error);
  }
};

// Process and cache GPU data
export const getCachedGpuList = async () => {
  if (cachedGpuList && cachedGpuList.length > 0) {
    console.log(`Using cached GPU list with ${cachedGpuList.length} entries`);
    return cachedGpuList;
  }
  
  const freshList = await processGpuData();
  cachedGpuList = freshList;
  return freshList;
};

// Helper function to extract memory size from GPU data
const extractMemorySize = (gpu) => {
  let memSize = 0;
  let source = 'unknown';
  
  // Define all possible memory field names in order of priority
  const memoryFields = [
    "Memory Size (GB)", // API format from the example
    "Memory Size",      // Common format
    "Memory (GB)",
    "Memory",
    "VRAM",
    "Video RAM",
    "Graphics Memory",
    "Video Memory", 
    "VRAM Size",
    "Memory.Size"
  ];
  
  // First check for memory size in any of the known fields
  for (const field of memoryFields) {
    if (gpu[field] !== undefined && gpu[field] !== null && gpu[field] !== "") {
      const fieldValue = gpu[field];
      source = field;
      
      // Handle numeric values directly (like in the API example)
      if (typeof fieldValue === 'number' && !isNaN(fieldValue)) {
        memSize = fieldValue;
        break;
      }
      
      // Handle string values with various formats
      if (typeof fieldValue === 'string') {
        // Pattern 1: Basic number followed by unit (with or without space): "24GB", "24 GB"
        const basicMatch = fieldValue.match(/(\d+)\s*(?:GB|GiB|G|MB|MiB)/i);
        
        // Pattern 2: Range format using hyphen: "4-8 GB" (take larger number)
        const rangeMatch = fieldValue.match(/(\d+)\s*-\s*(\d+)\s*(?:GB|GiB|G|MB|MiB)/i);
        
        // Pattern 3: Format with slash: "8/16 GB" (take larger number)
        const slashMatch = fieldValue.match(/(\d+)\s*\/\s*(\d+)\s*(?:GB|GiB|G|MB|MiB)/i);
        
        // Pattern 4: Multiple options separated by commas: "8 GB, 16 GB" (take largest)
        const commaMatch = fieldValue.match(/(\d+)\s*(?:GB|GiB|G|MB|MiB)/gi);
        
        // Pattern 5: Just extract first number (last resort)
        const numberMatch = fieldValue.match(/(\d+)/);
        
        if (basicMatch) {
          memSize = parseInt(basicMatch[1], 10);
          break;
        } else if (rangeMatch) {
          // Take the larger number in the range
          memSize = Math.max(parseInt(rangeMatch[1], 10), parseInt(rangeMatch[2], 10));
          break;
        } else if (slashMatch) {
          // Take the larger number in the slash format
          memSize = Math.max(parseInt(slashMatch[1], 10), parseInt(slashMatch[2], 10));
          break;
        } else if (commaMatch && commaMatch.length > 0) {
          // Find the largest value from comma-separated options
          const sizes = commaMatch.map(m => {
            const match = m.match(/(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
          });
          memSize = Math.max(...sizes);
          break;
        } else if (numberMatch) {
          // Just take the first number we find
          memSize = parseInt(numberMatch[1], 10);
          break;
        }
      }
    }
  }
  
  // Check if memory size is reasonable (over 100 might be in MB not GB)
  if (memSize > 100) {
    memSize = memSize / 1024; // Convert MB to GB
  }
  
  return { memSize, source };
};

// Helper function to infer memory size from GPU model name
const inferMemorySizeFromModelName = (modelName) => {
  if (!modelName || typeof modelName !== 'string') return 0;
  
  const model = modelName.toLowerCase();
  
  // Look for memory size directly in the model name (e.g., "RTX 3080 12GB")
  const directMemoryMatch = model.match(/(\d+)\s*gb/i);
  if (directMemoryMatch) {
    return parseInt(directMemoryMatch[1], 10);
  }
  
  // Try to infer from common model numbering schemes
  // NVIDIA RTX and GTX series
  if (model.includes('rtx')) {
    if (model.includes('4090')) return 24;
    if (model.includes('4080')) return 16;
    if (model.includes('4070 ti')) return 12;
    if (model.includes('4070')) return 12;
    if (model.includes('4060 ti')) return 8;
    if (model.includes('4060')) return 8;
    if (model.includes('3090 ti') || model.includes('3090')) return 24;
    if (model.includes('3080 ti')) return 12;
    if (model.includes('3080 12gb')) return 12;
    if (model.includes('3080')) return 10;
    if (model.includes('3070 ti')) return 8;
    if (model.includes('3070')) return 8;
    if (model.includes('3060 ti')) return 8;
    if (model.includes('3060')) return 12;
    if (model.includes('2080 ti')) return 11;
    if (model.includes('2080 super')) return 8;
    if (model.includes('2080')) return 8;
    if (model.includes('2070 super')) return 8;
    if (model.includes('2070')) return 8;
    if (model.includes('2060 super')) return 8;
    if (model.includes('2060')) return 6;
    // Add more RTX models as needed
  }
  
  if (model.includes('gtx')) {
    if (model.includes('1080 ti')) return 11;
    if (model.includes('1080')) return 8;
    if (model.includes('1070 ti')) return 8;
    if (model.includes('1070')) return 8;
    if (model.includes('1060 6gb')) return 6;
    if (model.includes('1060')) return 3; // Default to 3GB for 1060 if not specified
    if (model.includes('1050 ti')) return 4;
    if (model.includes('1050')) return 2;
    if (model.includes('1650')) return 4;
    if (model.includes('1660 ti') || model.includes('1660 super')) return 6;
    if (model.includes('1660')) return 6;
    // Add more GTX models as needed
  }
  
  // AMD Radeon RX series
  if (model.includes('radeon') || model.includes('rx')) {
    if (model.includes('rx 7900 xtx')) return 24;
    if (model.includes('rx 7900 xt')) return 20;
    if (model.includes('rx 7800 xt')) return 16;
    if (model.includes('rx 7700 xt')) return 12;
    if (model.includes('rx 6950 xt')) return 16;
    if (model.includes('rx 6900 xt')) return 16;
    if (model.includes('rx 6800 xt')) return 16;
    if (model.includes('rx 6800')) return 16;
    if (model.includes('rx 6750 xt')) return 12;
    if (model.includes('rx 6700 xt')) return 12;
    if (model.includes('rx 6650 xt')) return 8;
    if (model.includes('rx 6600 xt')) return 8;
    if (model.includes('rx 6600')) return 8;
    if (model.includes('rx 5700 xt')) return 8;
    if (model.includes('rx 5700')) return 8;
    if (model.includes('rx 5600 xt')) return 6;
    if (model.includes('rx 5500 xt')) return 8; // 8GB or 4GB variants exist
    // Add more RX models as needed
  }
  
  // NVIDIA Quadro series
  if (model.includes('quadro')) {
    if (model.includes('rtx 8000')) return 48;
    if (model.includes('rtx 6000')) return 24;
    if (model.includes('rtx 5000')) return 16;
    if (model.includes('rtx 4000')) return 8;
    if (model.includes('p6000')) return 24;
    if (model.includes('p5000')) return 16;
    if (model.includes('p4000')) return 8;
    // Add more Quadro models as needed
  }
  
  // NVIDIA Tesla/Ampere series
  if (model.includes('tesla') || model.includes('a100') || model.includes('v100')) {
    if (model.includes('a100')) {
      if (model.includes('80gb')) return 80;
      return 40; // Default for A100
    }
    if (model.includes('v100')) {
      if (model.includes('32gb')) return 32;
      return 16; // Default for V100
    }
    if (model.includes('a40') || model.includes('a40g')) return 48;
    if (model.includes('a30') || model.includes('a30g')) return 24;
    if (model.includes('a10') || model.includes('a10g')) return 24;
    // Add more Tesla/Data center models as needed
  }
  
  // Apple GPUs
  if (model.includes('apple')) {
    // M1 series
    if (model.includes('m1 ultra')) {
      if (model.includes('128')) return 128;
      return 64; // Default for M1 Ultra
    }
    if (model.includes('m1 max')) {
      if (model.includes('64')) return 64;
      return 32; // Default for M1 Max
    }
    if (model.includes('m1 pro')) {
      if (model.includes('32')) return 32;
      return 16; // Default for M1 Pro
    }
    if (model.includes('m1')) {
      if (model.includes('16')) return 16;
      return 8; // Default for M1
    }
    
    // M2 series
    if (model.includes('m2 ultra')) {
      if (model.includes('192')) return 192;
      if (model.includes('128')) return 128;
      return 64; // Default for M2 Ultra
    }
    if (model.includes('m2 max')) {
      if (model.includes('96')) return 96;
      if (model.includes('64')) return 64;
      return 32; // Default for M2 Max
    }
    if (model.includes('m2 pro')) {
      if (model.includes('32')) return 32;
      return 16; // Default for M2 Pro
    }
    if (model.includes('m2')) {
      if (model.includes('24')) return 24;
      if (model.includes('16')) return 16;
      return 8; // Default for M2
    }
    
    // M3 series
    if (model.includes('m3 ultra')) {
      if (model.includes('192')) return 192;
      return 128; // Default for M3 Ultra
    }
    if (model.includes('m3 max')) {
      if (model.includes('128')) return 128;
      if (model.includes('64')) return 64;
      return 36; // Default for M3 Max
    }
    if (model.includes('m3 pro')) {
      if (model.includes('36')) return 36;
      return 18; // Default for M3 Pro
    }
    if (model.includes('m3')) {
      if (model.includes('24')) return 24;
      if (model.includes('16')) return 16;
      return 8; // Default for M3
    }
  }
  
  // Couldn't determine from common models
  return 0;
};

// Helper function to determine VRAM based on GPU model name and generation
// This provides more accurate estimates for GPUs that don't have explicit memory info
const getVramFromGpuModel = (modelName) => {
  if (!modelName) return 4; // Absolute minimum fallback
  
  modelName = modelName.toLowerCase();
  
  // NVIDIA RTX Series - with improved handling for RTX 50 series and future generations
  if (modelName.includes('rtx')) {
    // RTX 50 series (future)
    if (modelName.includes('5090')) return 32; // Estimated future VRAM
    if (modelName.includes('5080')) return 24; // Estimated future VRAM
    if (modelName.includes('5070')) return 16; // Estimated future VRAM
    if (modelName.includes('5060')) return 12; // Estimated future VRAM
    if (modelName.includes('50')) return 16;   // Generic RTX 50 fallback
    
    // RTX 40 series
    if (modelName.includes('4090')) return 24;
    if (modelName.includes('4080')) return 16;
    if (modelName.includes('4070 ti')) return 12;
    if (modelName.includes('4070')) return 12;
    if (modelName.includes('4060 ti')) return 8;
    if (modelName.includes('4060')) return 8;
    if (modelName.includes('40')) return 12;   // Generic RTX 40 fallback
    
    // RTX 30 series
    if (modelName.includes('3090 ti') || modelName.includes('3090')) return 24;
    if (modelName.includes('3080 ti')) return 12;
    if (modelName.includes('3080 12gb')) return 12;
    if (modelName.includes('3080')) return 10;
    if (modelName.includes('3070 ti')) return 8;
    if (modelName.includes('3070')) return 8;
    if (modelName.includes('3060 ti')) return 8;
    if (modelName.includes('3060')) return 12;
    if (modelName.includes('30')) return 8;    // Generic RTX 30 fallback
    
    // RTX 20 series
    if (modelName.includes('2080 ti')) return 11;
    if (modelName.includes('2080 super')) return 8;
    if (modelName.includes('2080')) return 8;
    if (modelName.includes('2070 super')) return 8;
    if (modelName.includes('2070')) return 8;
    if (modelName.includes('2060 super')) return 8;
    if (modelName.includes('2060')) return 6;
    if (modelName.includes('20')) return 6;    // Generic RTX 20 fallback
    
    // If we have an RTX but don't know which specific model, estimate based on digits
    const rtxGenMatch = modelName.match(/rtx\s*(\d)/i);
    if (rtxGenMatch) {
      const gen = parseInt(rtxGenMatch[1], 10);
      if (gen >= 5) return 24;  // Future generations (50+)
      if (gen >= 4) return 16;  // RTX 40 series typical
      if (gen >= 3) return 10;  // RTX 30 series typical
      return 8;                 // RTX 20 series typical
    }
    
    return 12; // Default for unknown RTX (better than previous 6GB)
  }
  
  // GTX Series
  if (modelName.includes('gtx')) {
    if (modelName.includes('1080 ti')) return 11;
    if (modelName.includes('1080')) return 8;
    if (modelName.includes('1070 ti')) return 8;
    if (modelName.includes('1070')) return 8;
    if (modelName.includes('1060 6gb')) return 6;
    if (modelName.includes('1060')) return 3; // Default to 3GB for 1060 if not specified
    if (modelName.includes('1650')) return 4;
    if (modelName.includes('1660 ti') || modelName.includes('1660 super')) return 6;
    if (modelName.includes('1660')) return 6;
    return 4; // General GTX fallback (better than previous which was not specified)
  }
  
  // AMD Radeon RX series - including future generations
  if (modelName.includes('radeon') || modelName.includes('rx')) {
    // RX 8000 series (future)
    if (modelName.includes('rx 8900')) return 32; // Estimated future VRAM
    if (modelName.includes('rx 8800')) return 24; // Estimated future VRAM
    if (modelName.includes('rx 8700')) return 16; // Estimated future VRAM
    if (modelName.includes('rx 80')) return 24;   // Generic RX 8000 fallback
    
    // RX 7000 series
    if (modelName.includes('rx 7900 xtx')) return 24;
    if (modelName.includes('rx 7900 xt')) return 20;
    if (modelName.includes('rx 7800 xt')) return 16;
    if (modelName.includes('rx 7700 xt')) return 12;
    if (modelName.includes('rx 70')) return 16;   // Generic RX 7000 fallback
    
    // RX 6000 series
    if (modelName.includes('rx 6950 xt')) return 16;
    if (modelName.includes('rx 6900 xt')) return 16;
    if (modelName.includes('rx 6800 xt')) return 16;
    if (modelName.includes('rx 6800')) return 16;
    if (modelName.includes('rx 6750 xt')) return 12;
    if (modelName.includes('rx 6700 xt')) return 12;
    if (modelName.includes('rx 6650 xt')) return 8;
    if (modelName.includes('rx 6600 xt')) return 8;
    if (modelName.includes('rx 6600')) return 8;
    if (modelName.includes('rx 60')) return 8;    // Generic RX 6000 fallback
    
    // RX 5000 series
    if (modelName.includes('rx 5700 xt')) return 8;
    if (modelName.includes('rx 5700')) return 8;
    if (modelName.includes('rx 5600 xt')) return 6;
    if (modelName.includes('rx 5500 xt')) return 8;
    if (modelName.includes('rx 50')) return 8;    // Generic RX 5000 fallback
    
    // If we have an RX but don't know the specific model, estimate based on digits
    const rxGenMatch = modelName.match(/rx\s*(\d)/i);
    if (rxGenMatch) {
      const gen = parseInt(rxGenMatch[1], 10);
      if (gen >= 8) return 24;  // Future generations (8000+)
      if (gen >= 7) return 16;  // RX 7000 series typical
      if (gen >= 6) return 12;  // RX 6000 series typical
      if (gen >= 5) return 8;   // RX 5000 series typical
      return 8;                 // Earlier series typical
    }
    
    return 8; // Default for unknown RX (better than not specified)
  }
  
  // NVIDIA Professional GPUs
  if (modelName.includes('a100')) return 80;
  if (modelName.includes('h100')) return 80;
  if (modelName.includes('a6000')) return 48;
  if (modelName.includes('a5000')) return 24;
  if (modelName.includes('a4000')) return 16;
  if (modelName.includes('quadro') || modelName.includes('rtx a')) return 16; // Typical modern Quadro
  if (modelName.includes('tesla') || modelName.includes('v100')) return 32;   // Typical Tesla
  
  // Intel Data Center GPUs
  if (modelName.includes('intel') && modelName.includes('max')) {
    if (modelName.includes('1550')) return 128; // Intel Data Center GPU Max 1550 has 128GB HBM2e
    if (modelName.includes('1100')) return 48;  // Intel Data Center GPU Max 1100 has 48GB HBM2e
    return 48; // Default for other Intel Max series
  }
  
  // Basic fallbacks by vendor
  if (modelName.includes('nvidia')) return 8;    // Newer NVIDIA cards typically have at least 8GB
  if (modelName.includes('amd')) return 8;       // Newer AMD cards typically have at least 8GB
  if (modelName.includes('intel arc')) return 8; // Intel Arc series
  
  // Absolute minimum fallback (better than previous 4GB)
  return 6;
};

// Add isUnified property to GPU objects when processing JSON data
const addIsUnifiedProperty = (gpu) => {
  const name = (gpu.name || '').toLowerCase();
  const vendor = (gpu.vendor || '').toLowerCase();
  
  // Check for unified memory architectures
  if (vendor === 'apple' || name.includes('apple m')) {
    gpu.isUnified = true;
  } else if (name.includes('ryzen') && (name.includes('u') || name.includes('h') || name.includes('hs'))) {
    gpu.isUnified = true;
  } else if ((vendor === 'intel' || name.includes('intel')) && 
             (name.includes('iris') || name.includes('uhd') || name.includes('ultra'))) {
    gpu.isUnified = true;
  } else if (name.includes('snapdragon')) {
    gpu.isUnified = true;
  } else {
    gpu.isUnified = false;
  }
  
  return gpu;
};

// Evaluates performance rating for a GPU (higher is better)
// This is an estimation based on VRAM and generation
export const estimateGpuPerformance = (gpu) => {
  if (!gpu) return 0;
  
  const name = (gpu.name || '').toLowerCase();
  const vendor = (gpu.vendor || '').toLowerCase();
  let perfScore = 0;
  
  // VRAM contributes significantly to performance for LLMs
  perfScore += gpu.vram * 10;
  
  // Add bonus for newer architectures
  if (name.includes('rtx')) {
    if (name.includes('40')) perfScore += 200; // RTX 40 series
    else if (name.includes('30')) perfScore += 150; // RTX 30 series
    else if (name.includes('20')) perfScore += 100; // RTX 20 series
  }
  
  if (name.includes('radeon') || name.includes('rx')) {
    if (name.includes('7')) perfScore += 180; // RX 7000 series
    else if (name.includes('6')) perfScore += 130; // RX 6000 series
    else if (name.includes('5')) perfScore += 80;  // RX 5000 series
  }
  
  // Workstation GPUs often have better compute performance
  if (isWorkstationGpu(gpu)) {
    perfScore += 50;
    
    // Specific high-end workstation cards
    if (name.includes('a100')) perfScore += 300;
    else if (name.includes('h100')) perfScore += 400;
    else if (name.includes('a6000')) perfScore += 250;
  }
  
  // Apple Silicon bonus for ML optimizations
  if (vendor.includes('apple') && (name.includes('m2') || name.includes('m3'))) {
    perfScore += 100;
    if (name.includes('max') || name.includes('ultra')) perfScore += 50;
  }
  
  return perfScore;
};

// Calculate cost-effectiveness score (higher is better)
// This is a relative score to compare GPUs
export const calculateEfficiencyScore = (gpu, requiredVram) => {
  if (!gpu || !gpu.vram || gpu.vram < requiredVram) return 0;
  
  const name = (gpu.name || '').toLowerCase();
  const vendor = (gpu.vendor || '').toLowerCase();
  
  // Base score - how efficiently the VRAM requirement is met
  // Higher scores for GPUs that don't waste too much VRAM
  const vramUtilization = requiredVram / gpu.vram;
  let efficiencyScore = 100 * vramUtilization;
  
  // Consumer GPUs are generally more cost-effective than workstation GPUs
  if (!isWorkstationGpu(gpu)) {
    efficiencyScore += 50;
  }
  
  // Newer generations tend to be more power efficient
  if (name.includes('rtx')) {
    if (name.includes('40')) efficiencyScore += 40;
    else if (name.includes('30')) efficiencyScore += 30;
    else if (name.includes('20')) efficiencyScore += 20;
  }
  
  if (name.includes('radeon') || name.includes('rx')) {
    if (name.includes('7')) efficiencyScore += 35;
    else if (name.includes('6')) efficiencyScore += 25;
  }
  
  // Apple Silicon is very power efficient
  if (vendor.includes('apple') && (name.includes('m2') || name.includes('m3'))) {
    efficiencyScore += 60;
  }
  
  return efficiencyScore;
};

/**
 * Recommend optimal GPU configuration based on memory requirements
 * @param {Object} memoryRequirements - Object containing VRAM requirements
 * @param {Array} availableGpus - Array of available GPUs to choose from
 * @param {boolean} isUnifiedMemory - Whether system uses unified memory
 * @returns {Object} Recommended GPU configurations
 */
export const recommendOptimalGpuSetup = (memoryRequirements, availableGpus, isUnifiedMemory) => {
  // Ensure we have the necessary inputs
  if (!memoryRequirements || !availableGpus || availableGpus.length === 0) {
    console.warn("Invalid inputs for GPU recommendation");
    return {
      optimal: null,
      performance: null,
      budget: null,
      isUnifiedMemory
    };
  }

  // Extract memory requirements
  const requiredVramMin = memoryRequirements.vramMinGB || 0;
  const requiredVramRec = memoryRequirements.vramRecGB || 0;
  
  console.log(`Finding optimal GPU setup for: ${requiredVramRec}GB VRAM (recommended), ${requiredVramMin}GB VRAM (minimum)`);
  
  // Handle unified memory differently
  if (isUnifiedMemory) {
    return recommendUnifiedMemorySetup(memoryRequirements, availableGpus);
  }
  
  // Filter GPUs that meet the minimum requirements
  const compatibleGpus = availableGpus.filter(gpu => 
    !gpu.isUnified && gpu.vram > 0
  );
  
  // Sort GPUs by VRAM size in descending order - useful for extremely large models
  const sortedGpus = [...compatibleGpus].sort((a, b) => b.vram - a.vram);
  
  // If no compatible GPUs, return null
  if (compatibleGpus.length === 0) {
    console.log("No compatible GPUs found that meet the minimum requirements");
    return {
      optimal: null,
      performance: null,
      budget: null,
      isUnifiedMemory
    };
  }
  
  // First, try to find single-GPU solutions that meet recommended requirements
  const singleGpuSolutions = sortedGpus
    .filter(gpu => gpu.vram >= requiredVramRec)
    .map(gpu => ({
      gpu: gpu,
      count: 1,
      totalVram: gpu.vram,
      performance: estimateGpuPerformance(gpu),
      efficiency: calculateEfficiencyScore(gpu, requiredVramRec),
      meetsRecommended: true
    }));
  
  // For GPUs that need multiple units to meet the recommended requirement
  // First handle the case where even the best GPU needs multiple units
  const bestGpu = sortedGpus[0]; // The GPU with most VRAM
  const multiGpuSolutions = [];
  
  // If the best GPU doesn't meet recommended by itself, calculate how many are needed
  if (bestGpu && bestGpu.vram > 0 && bestGpu.vram < requiredVramRec) {
    const count = Math.ceil(requiredVramRec / bestGpu.vram);
    // Limit to a reasonable number
    const actualCount = Math.min(count, 16);  // cap at 16 GPUs max
    
    multiGpuSolutions.push({
      gpu: bestGpu,
      count: actualCount,
      totalVram: bestGpu.vram * actualCount,
      performance: estimateGpuPerformance(bestGpu) * Math.sqrt(actualCount), // Multi-GPU scaling not linear
      efficiency: calculateEfficiencyScore(bestGpu, requiredVramRec / actualCount), // Efficiency per GPU
      meetsRecommended: bestGpu.vram * actualCount >= requiredVramRec
    });
  }
  
  // For GPUs that only meet minimum requirements but not recommended with a single GPU
  const minimumGpuSolutions = sortedGpus
    .filter(gpu => gpu.vram >= requiredVramMin && gpu.vram < requiredVramRec && gpu !== bestGpu)
    .map(gpu => {
      // Calculate how many GPUs we need to meet the recommended requirement
      const count = Math.ceil(requiredVramRec / gpu.vram);
      // Limit to a reasonable number
      const actualCount = Math.min(count, 16);  // cap at 16 GPUs max
      
      return {
        gpu: gpu,
        count: actualCount,
        totalVram: gpu.vram * actualCount,
        performance: estimateGpuPerformance(gpu) * Math.sqrt(actualCount), // Multi-GPU scaling not linear
        efficiency: calculateEfficiencyScore(gpu, requiredVramRec / actualCount), // Efficiency per GPU
        meetsRecommended: gpu.vram * actualCount >= requiredVramRec
      };
    });
  
  // Combine all solutions
  const allSolutions = [...singleGpuSolutions, ...multiGpuSolutions, ...minimumGpuSolutions];
  
  // Sort by different criteria to get optimal recommendations
  const optimalSolutions = [...allSolutions].sort((a, b) => {
    // First prioritize single GPU solutions
    if (a.count !== b.count) return a.count - b.count;
    // Then prioritize efficiency
    return b.efficiency - a.efficiency;
  });
  
  const performanceSolutions = [...allSolutions].sort((a, b) => {
    return b.performance - a.performance;
  });
  
  const budgetSolutions = [...allSolutions].sort((a, b) => {
    // First ensure adequate VRAM
    if (a.totalVram >= requiredVramRec && b.totalVram < requiredVramRec) return -1;
    if (a.totalVram < requiredVramRec && b.totalVram >= requiredVramRec) return 1;
    // Then prioritize efficiency (cost-effectiveness)
    return b.efficiency - a.efficiency;
  });
  
  // If we couldn't find a solution that meets recommended requirements,
  // include the best GPU that meets minimum requirements
  if (allSolutions.length === 0 && compatibleGpus.length > 0) {
    const bestMinimumGpu = compatibleGpus
      .sort((a, b) => b.vram - a.vram)[0];
      
    const minimumSolution = {
      gpu: bestMinimumGpu,
      count: 1,
      totalVram: bestMinimumGpu.vram,
      performance: estimateGpuPerformance(bestMinimumGpu),
      efficiency: calculateEfficiencyScore(bestMinimumGpu, requiredVramMin),
      meetsRecommended: false
    };
    
    return {
      optimal: minimumSolution,
      performance: minimumSolution,
      budget: minimumSolution,
      isUnifiedMemory
    };
  }
  
  return {
    optimal: optimalSolutions[0] || null,
    performance: performanceSolutions[0] || null,
    budget: budgetSolutions[0] || null,
    isUnifiedMemory
  };
};

/**
 * Recommend optimal unified memory setup
 * @param {Object} memoryRequirements - Object containing VRAM requirements
 * @param {Array} availableGpus - Array of available GPUs to choose from
 * @returns {Object} Recommended unified memory configuration
 */
export const recommendUnifiedMemorySetup = (memoryRequirements, availableGpus) => {
  // For unified memory, we want to find devices that have enough unified memory
  // Extract memory requirements - for unified memory, vramRecGB and ramRecGB are the same
  const requiredMemoryMin = memoryRequirements.vramMinGB || 0;
  const requiredMemoryRec = memoryRequirements.vramRecGB || 0;
  
  // Filter for unified memory devices with adequate memory
  const unifiedDevices = availableGpus.filter(gpu => 
    gpu.isUnified && gpu.vram >= requiredMemoryMin
  );
  
  if (unifiedDevices.length === 0) {
    console.log("No compatible unified memory devices found");
    return {
      optimal: null,
      performance: null,
      budget: null,
      isUnifiedMemory: true
    };
  }
  
  // Categorize devices into those that meet recommended and minimum requirements
  const recommendedDevices = unifiedDevices
    .filter(gpu => gpu.vram >= requiredMemoryRec)
    .map(gpu => ({
      gpu: gpu,
      count: 1, // Unified memory devices are always single units
      totalVram: gpu.vram,
      performance: estimateGpuPerformance(gpu),
      efficiency: calculateEfficiencyScore(gpu, requiredMemoryRec),
      meetsRecommended: true
    }));
  
  const minimumDevices = unifiedDevices
    .filter(gpu => gpu.vram >= requiredMemoryMin && gpu.vram < requiredMemoryRec)
    .map(gpu => ({
      gpu: gpu,
      count: 1,
      totalVram: gpu.vram,
      performance: estimateGpuPerformance(gpu),
      efficiency: calculateEfficiencyScore(gpu, requiredMemoryMin),
      meetsRecommended: false
    }));
  
  // Combine and sort
  const allDevices = [...recommendedDevices, ...minimumDevices];
  
  // If no devices found, return null
  if (allDevices.length === 0) {
    return {
      optimal: null,
      performance: null,
      budget: null,
      isUnifiedMemory: true
    };
  }
  
  // For unified memory, optimal balances performance and memory efficiency
  const optimalDevices = [...allDevices].sort((a, b) => {
    // First prioritize meeting recommended requirements
    if (a.meetsRecommended !== b.meetsRecommended) 
      return a.meetsRecommended ? -1 : 1;
    // Then prioritize performance
    return b.performance - a.performance;
  });
  
  // Performance prioritizes raw compute power and available memory
  const performanceDevices = [...allDevices].sort((a, b) => {
    return b.performance - a.performance;
  });
  
  // Budget prioritizes efficiency
  const budgetDevices = [...allDevices].sort((a, b) => {
    // First ensure it meets minimum requirements
    if (a.meetsRecommended !== b.meetsRecommended) 
      return a.meetsRecommended ? -1 : 1;
    // Then prioritize efficiency
    return b.efficiency - a.efficiency;
  });
  
  return {
    optimal: optimalDevices[0] || null,
    performance: performanceDevices[0] || null,
    budget: budgetDevices[0] || null,
    isUnifiedMemory: true
  };
};

// Filter GPUs by search query - significantly enhanced version
export const filterGpusBySearch = (gpuList, searchQuery) => {
  if (!searchQuery || !searchQuery.trim()) return gpuList;
  
  // Ensure we have GPUs to search through
  if (!gpuList || gpuList.length === 0) {
    console.warn("No GPU list available for search");
    return [];
  }
  
  const query = searchQuery.toLowerCase().trim();
  console.log(`Searching for: "${query}" in ${gpuList.length} GPUs`);
  
  // Check if search is for VRAM size
  const vramMatch = query.match(/(\d+)\s*(?:gb|gib|g|vram)/i);
  if (vramMatch) {
    const vramSize = parseInt(vramMatch[1], 10);
    console.log(`VRAM search: ${vramSize}GB`);
    return gpuList.filter(gpu => gpu.vram === vramSize);
  }
  
  // Handle series searches (RTX 30 series, etc.)
  const seriesMatch = query.match(/(rtx|gtx|rx)\s*(\d{1,4})\s*(series|ti|super)?/i);
  if (seriesMatch) {
    const prefix = seriesMatch[1].toLowerCase();
    const series = seriesMatch[2];
    const suffix = seriesMatch[3]?.toLowerCase() || '';
    
    console.log(`Series search: ${prefix} ${series} ${suffix}`);
    
    return gpuList.filter(gpu => {
      const name = gpu.name?.toLowerCase() || '';
      
      // Match series number with prefix
      if (suffix === 'series') {
        return name.includes(prefix) && name.includes(series);
      } 
      // Match specific models (with potential suffix like Ti or SUPER)
      else if (suffix) {
        return name.includes(prefix) && name.includes(series) && name.includes(suffix);
      } 
      // Just match prefix + number
      else {
        return name.includes(prefix) && name.includes(series);
      }
    });
  }
  
  // Handle brand-specific searches
  const brandSearch = ['nvidia', 'amd', 'intel', 'radeon', 'geforce'].includes(query);
  if (brandSearch) {
    console.log(`Brand search: ${query}`);
    return gpuList.filter(gpu => {
      const name = gpu.name?.toLowerCase() || '';
      const vendor = gpu.vendor?.toLowerCase() || '';
      
      return vendor.includes(query) || name.includes(query);
    });
  }
  
  // For regular searches, use more flexible matching
  const results = gpuList.filter(gpu => {
    const name = gpu.name?.toLowerCase() || '';
    const vendor = gpu.vendor?.toLowerCase() || '';
    const fullName = `${vendor} ${name}`.toLowerCase();
    const gpuId = gpu.id?.toLowerCase() || '';
    
    // Split search terms and check if all of them are included
    const terms = query.split(/\s+/);
    const allTermsMatch = terms.every(term => fullName.includes(term));
    
    // Also match partial model numbers (e.g. "3080" would match "RTX 3080")
    const isNumericSearch = /^\d{3,4}$/.test(query);
    const matchesModelNumber = isNumericSearch && name.includes(query);
    
    return fullName.includes(query) || 
           name.includes(query) || 
           vendor.includes(query) ||
           gpuId.includes(query) ||
           allTermsMatch ||
           matchesModelNumber;
  });
  
  console.log(`Search for "${query}" returned ${results.length} results`);
  return results;
};
