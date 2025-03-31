/**
 * GPU data utilities for hardware compatibility checks
 */

// Function to parse and clean GPU data from the raw JSON
export const processGpuData = async () => {
  try {
    // Fetch GPU data
    const response = await fetch('https://raw.githubusercontent.com/voidful/gpu-info-api/gpu-data/gpu.json');
    const text = await response.text();
    
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
    
      // Extract relevant GPU information
      const gpuList = [];
      
      // Process GPU data
      Object.entries(data).forEach(([id, gpu]) => {
        // Skip entries without proper information
        if (!gpu || typeof gpu !== 'object') return;
        if (!gpu.Model) return;
        
        // Extract memory size
        const memSizeStr = gpu["Memory Size"];
        let memSize = 0;
        
        if (typeof memSizeStr === 'string') {
          // Handle various formats like "24 GB", "8 GB, 16 GB" or ranges like "4-8 GB"
          const match = memSizeStr?.match(/(\d+)(?:\s*(?:GB|GiB|G|MB|MiB))/i);
          if (match) {
            memSize = parseInt(match[1], 10);
          }
        } else if (typeof memSizeStr === 'number' && !isNaN(memSizeStr)) {
          memSize = memSizeStr;
        }
        
        // Skip GPUs with no memory or very low memory (likely not useful for LLMs)
        if (memSize < 2) return;
        
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
          vram: memSize,
          launchDate: gpu.Launch || null
        });
      });
      
      // Sort by memory size (descending) and then by name
      return gpuList.sort((a, b) => {
        if (b.vram !== a.vram) {
          return b.vram - a.vram; // Sort by memory size (descending)
        }
        return a.name.localeCompare(b.name); // Then sort by name
      });
      
    } catch (error) {
      console.error("Error parsing JSON data:", error);
      return []; // Return empty array if there's an error
    }
  } catch (error) {
    console.error("Error processing GPU data:", error);
    return []; // Return empty array if there's an error
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

// Filter for consumer GPUs from major vendors (NVIDIA, AMD, Intel)
export const getConsumerGpus = (gpuList, limit = 20) => {
  return gpuList
    .filter(gpu => {
      const vendor = gpu.vendor?.toLowerCase() || '';
      const name = gpu.name?.toLowerCase() || '';
      
      // Check vendor if available
      const vendorMatch = vendor.includes('nvidia') || 
             vendor.includes('amd') || 
             vendor.includes('intel') || 
             vendor.includes('apple');
             
      // Check name for consumer GPU indicators
      const nameMatch = 
             // NVIDIA GeForce series
             name.includes('gtx') || 
             name.includes('rtx') && !name.includes('rtx a') || // Exclude RTX A workstation series
             name.includes('geforce') || 
             // AMD gaming GPUs
             name.includes('radeon') ||
             name.includes('rx') || 
             // Intel Gaming GPUs  
             name.includes('arc') ||
             name.includes('iris') ||
             // Apple integrated GPUs
             name.includes('m1') ||
             name.includes('m2') ||
             name.includes('m3');
             
      return vendorMatch || nameMatch;
    })
    .slice(0, limit);
};

// Filter for professional/workstation GPUs
export const getWorkstationGpus = (gpuList, limit = 15) => {
  return gpuList
    .filter(gpu => {
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
             name.includes('w') && /\bw\d{4}\b/.test(name); // Match W series like W6800
             
      // Professional Intel GPUs
      const intelProMatch = name.includes('xeon');
      
      // General matching based on keywords
      const generalProMatch = 
             name.includes('workstation') ||
             name.includes('professional') ||
             name.includes('datacenter');
             
      return nvidiaProMatch || amdProMatch || intelProMatch || generalProMatch;
    })
    .slice(0, limit);
};
