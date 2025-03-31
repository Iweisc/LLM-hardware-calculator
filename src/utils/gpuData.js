/**
 * GPU data utilities for hardware compatibility checks
 */

// Function to parse and clean GPU data from the raw JSON
export const processGpuData = async () => {
  try {
    // Fetch GPU data from local file
    console.log("Loading local GPU database...");
    const response = await fetch('/gpu.json');
    const text = await response.text();
    
    console.log(`Loaded data length: ${text.length} characters`);
    
    if (!text || text.length < 1000) {
      console.error("Failed to load local GPU database");
      return defaultGpuList;
    }
    
    // Fix JSON format by adding commas between objects and fixing the format
    // This is a detailed workaround for the malformed JSON in the source
    let fixedJson = text
      // Add comma between GPU objects
      .replace(/\}\s+\"([^\"]+)\"/g, '},\n"$1"')
      
      // Fix property-value pairs (strings)
      .replace(/\"([^\"]+)\"\s+\"([^\"]+)\"/g, '"$1": "$2",')
      
      // Fix property-value pairs (numbers)
      .replace(/\"([^\"]+)\"\s+(\d+\.?\d*)/g, '"$1": $2,')
      
      // Fix property-value pairs for dates in quotes
      .replace(/\"([^\"]+)\"\s+\"(\d{4}-\d{2}-\d{2}[^\"]*)\"/g, '"$1": "$2",')
      
      // Fix 'NaN' values that are not in quotes
      .replace(/\"([^\"]+)\"\s*:\s*NaN/g, '"$1": "NaN"')
      
      // Remove trailing commas before closing braces
      .replace(/,\s*\}/g, '}');
    
    try {
      // Parse the fixed JSON
      const data = JSON.parse(fixedJson);
      
      console.log(`Successfully parsed JSON with ${Object.keys(data).length} entries`);
    
      // Extract relevant GPU information
      const gpuList = [];
      
      // Process GPU data
      Object.entries(data).forEach(([id, gpu]) => {
        // Skip entries without proper information
        if (!gpu || typeof gpu !== 'object') return;
        if (!gpu.Model) return;
        
        let memSize = 0;
        
        // Step 1: Extract memory size from GPU's fields
        memSize = extractMemorySize(gpu);
        
        // Step 2: If not found, try to infer from model name
        if (memSize === 0) {
          memSize = inferMemorySizeFromModelName(gpu.Model);
        }
        
        // Step 3: Use GPU database heuristics for common models
        if (memSize === 0) {
          const modelName = (gpu.Model || "").toLowerCase();
          
          // NVIDIA RTX cards
          if (modelName.includes("rtx 4090")) memSize = 24;
          else if (modelName.includes("rtx 4080")) memSize = 16;
          else if (modelName.includes("rtx 4070")) memSize = 12;
          else if (modelName.includes("rtx 3090")) memSize = 24;
          else if (modelName.includes("rtx 3080")) memSize = 10;
          else if (modelName.includes("rtx 3070")) memSize = 8;
          else if (modelName.includes("rtx 2080 ti")) memSize = 11;
          else if (modelName.includes("rtx 2080")) memSize = 8;
          else if (modelName.includes("rtx 2070")) memSize = 8;
          else if (modelName.includes("rtx")) memSize = 6;
          else if (modelName.includes("gtx")) memSize = 4;
          
          // AMD cards
          else if (modelName.includes("rx 7900")) memSize = 24;
          else if (modelName.includes("rx 6900") || modelName.includes("rx 6800")) memSize = 16;
          else if (modelName.includes("rx 6700")) memSize = 12;
          else if (modelName.includes("rx")) memSize = 8;
          
          // Professional cards
          else if (modelName.includes("a100")) memSize = 80;
          else if (modelName.includes("a6000")) memSize = 48;
          else if (modelName.includes("a5000")) memSize = 24;
          else if (modelName.includes("a4000")) memSize = 16;
          else if (modelName.includes("quadro") || modelName.includes("tesla")) memSize = 8;
          
          // Step 4: Absolute minimum fallback of 4GB (better than 0)
          else memSize = 4;
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
        gpuList.push({
          id: `${id}_${modelName}_${memSize}`, // Create a more unique ID
          name: modelName || "Unknown GPU",
          vendor: vendor || "",
          vram: memSize || 0,
          launchDate: gpu.Launch || null
        });
      });
      
      console.log(`Created GPU list with ${gpuList.length} entries`);
      
      // Sort by memory size (descending) and then by name
      return gpuList.sort((a, b) => {
        if (b.vram !== a.vram) {
          return b.vram - a.vram; // Sort by memory size (descending)
        }
        return a.name.localeCompare(b.name); // Then sort by name
      });
      
    } catch (error) {
      console.error("Error parsing JSON data:", error);
      console.error(error.stack);
      return defaultGpuList; // Return default list if there's an error
    }
  } catch (error) {
    console.error("Error processing GPU data:", error);
    console.error(error.stack);
    return defaultGpuList; // Return default list if there's an error
  }
};

// Default list of common GPUs (fallback if API fails)
export const defaultGpuList = [
  { name: "RTX 4090", vram: 24 },
  { name: "RTX 4080", vram: 16 },
  { name: "RTX 4070 Ti", vram: 12 },
  { name: "RTX 3090", vram: 24 },
  { name: "RTX 3080", vram: 10 },
  { name: "RTX 3070", vram: 8 },
  { name: "RTX 2080 Ti", vram: 11 },
  { name: "RTX 2080", vram: 8 },
  { name: "RTX 2070", vram: 8 },
  { name: "A100", vram: 80 },
  { name: "A6000", vram: 48 },
  { name: "A5000", vram: 24 },
  { name: "A4000", vram: 16 },
  { name: "Radeon RX 7900 XTX", vram: 24 },
  { name: "Radeon RX 6900 XT", vram: 16 },
  { name: "Radeon RX 6800 XT", vram: 16 },
  { name: "Apple M2 Ultra", vram: 76 },
  { name: "Apple M2 Pro", vram: 32 },
  { name: "Apple M1 Ultra", vram: 64 },
  { name: "Apple M1 Max", vram: 32 }
];

// Get all GPUs (no filtering except by memory threshold)
export const getAllGpus = (gpuList) => {
  return gpuList;
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
  
  // First try the Memory Size field
  if (gpu["Memory Size"]) {
    const memSizeStr = gpu["Memory Size"];
    
    if (typeof memSizeStr === 'string') {
      // Try multiple regex patterns for different formats
      
      // Pattern 1: Basic number followed by unit (with or without space): "24GB", "24 GB"
      const basicMatch = memSizeStr.match(/(\d+)\s*(?:GB|GiB|G|MB|MiB)/i);
      
      // Pattern 2: Range format using hyphen: "4-8 GB" (take larger number)
      const rangeMatch = memSizeStr.match(/(\d+)\s*-\s*(\d+)\s*(?:GB|GiB|G|MB|MiB)/i);
      
      // Pattern 3: Format with slash: "8/16 GB" (take larger number)
      const slashMatch = memSizeStr.match(/(\d+)\s*\/\s*(\d+)\s*(?:GB|GiB|G|MB|MiB)/i);
      
      // Pattern 4: Multiple options separated by commas: "8 GB, 16 GB" (take largest)
      const commaMatch = memSizeStr.match(/(\d+)\s*(?:GB|GiB|G|MB|MiB)/gi);
      
      // Pattern 5: Just extract first number (last resort)
      const numberMatch = memSizeStr.match(/(\d+)/);
      
      if (basicMatch) {
        memSize = parseInt(basicMatch[1], 10);
      } else if (rangeMatch) {
        // Take the larger number in the range
        memSize = Math.max(parseInt(rangeMatch[1], 10), parseInt(rangeMatch[2], 10));
      } else if (slashMatch) {
        // Take the larger number in the slash format
        memSize = Math.max(parseInt(slashMatch[1], 10), parseInt(slashMatch[2], 10));
      } else if (commaMatch && commaMatch.length > 0) {
        // Find the largest value from comma-separated options
        const sizes = commaMatch.map(m => {
          const match = m.match(/(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        });
        memSize = Math.max(...sizes);
      } else if (numberMatch) {
        // Just take the first number we find
        memSize = parseInt(numberMatch[1], 10);
      }
    } else if (typeof memSizeStr === 'number' && !isNaN(memSizeStr)) {
      memSize = memSizeStr;
    }
  }
  
  // If no memory size found, try alternate field names
  if (memSize === 0) {
    const memoryFields = [
      "Memory", "VRAM", "Video RAM", "Graphics Memory", "Video Memory", 
      "Memory Size (GB)", "VRAM Size", "Memory.Size", "Memory (GB)"
    ];
    
    for (const field of memoryFields) {
      if (gpu[field]) {
        const fieldValue = gpu[field];
        
        if (typeof fieldValue === 'string') {
          const match = fieldValue.match(/(\d+)/);
          if (match) {
            memSize = parseInt(match[1], 10);
            break;
          }
        } else if (typeof fieldValue === 'number' && !isNaN(fieldValue)) {
          memSize = fieldValue;
          break;
        }
      }
    }
  }
  
  // Check if memory size is reasonable (over 100 might be in MB not GB)
  if (memSize > 100) {
    memSize = memSize / 1024; // Convert MB to GB
  }
  
  return memSize;
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
    if (model.includes('m2 ultra')) return 76;
    if (model.includes('m1 ultra')) return 64;
    if (model.includes('m2 max')) return 38;
    if (model.includes('m1 max')) return 32;
    if (model.includes('m2 pro')) return 32;
    if (model.includes('m1 pro')) return 32;
    // Add more Apple models as needed
  }
  
  // Couldn't determine from common models
  return 0;
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
