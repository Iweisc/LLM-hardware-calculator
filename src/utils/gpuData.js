/**
 * GPU data utilities for hardware compatibility checks
 */

// Default GPU list for fallback
export const defaultGpuList = [
  { vendor: 'NVIDIA', name: 'RTX 4090', vram: 24 },
  { vendor: 'NVIDIA', name: 'RTX 4080', vram: 16 },
  { vendor: 'NVIDIA', name: 'RTX 4070 Ti', vram: 12 },
  { vendor: 'NVIDIA', name: 'RTX 3090', vram: 24 },
  { vendor: 'NVIDIA', name: 'RTX 3080', vram: 10 },
  { vendor: 'AMD', name: 'RX 7900 XTX', vram: 24 },
  { vendor: 'AMD', name: 'RX 7900 XT', vram: 20 },
  { vendor: 'Intel', name: 'Arc A770', vram: 16 },
];

// GitHub API URL for gpu-info-api
const GPU_API_URL = 'https://raw.githubusercontent.com/voidful/gpu-info-api/gpu-data/gpu.json';

// Fetch and cache GPU data
export const getCachedGpuList = async () => {
  try {
    const response = await fetch(GPU_API_URL);
    if (!response.ok) throw new Error('Failed to fetch GPU data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching GPU data:', error);
    return defaultGpuList;
  }
};

// Helper function to determine VRAM based on GPU model name and generation - Now exported
export const getVramFromGpuModel = (modelName) => {
  if (!modelName) return 0; // Return 0 if no model name
  
  modelName = modelName.toLowerCase();
  
  // NVIDIA RTX Series - with improved handling for RTX series
  if (modelName.includes('rtx')) {
    // RTX 50 series (future estimates)
    if (modelName.includes('5090')) return 32;
    if (modelName.includes('5080')) return 24;
    if (modelName.includes('5070')) return 16;
    if (modelName.includes('5060')) return 12;
    if (modelName.includes('50')) return 16;
    
    // RTX 40 SUPER series
    if (modelName.includes('4080 super')) return 16;
    if (modelName.includes('4070 ti super')) return 16;
    if (modelName.includes('4070 super')) return 12;
    
    // RTX 40 series
    if (modelName.includes('4090')) return 24;
    if (modelName.includes('4080')) return 16;
    if (modelName.includes('4070 ti')) return 12;
    if (modelName.includes('4070')) return 12;
    if (modelName.includes('4060 ti 16gb')) return 16;
    if (modelName.includes('4060 ti')) return 8;
    if (modelName.includes('4060')) return 8;
    if (modelName.includes('40')) return 12;
    
    // RTX 30 series
    if (modelName.includes('3090 ti') || modelName.includes('3090')) return 24;
    if (modelName.includes('3080 ti')) return 12;
    if (modelName.includes('3080 12gb')) return 12;
    if (modelName.includes('3080')) return 10;
    if (modelName.includes('3070 ti')) return 8;
    if (modelName.includes('3070')) return 8;
    if (modelName.includes('3060 ti')) return 8;
    if (modelName.includes('3060')) return 12;
    if (modelName.includes('30')) return 8;
    
    // RTX 20 series
    if (modelName.includes('2080 ti')) return 11;
    if (modelName.includes('2080 super')) return 8;
    if (modelName.includes('2080')) return 8;
    if (modelName.includes('2070 super')) return 8;
    if (modelName.includes('2070')) return 8;
    if (modelName.includes('2060 super')) return 8;
    if (modelName.includes('2060')) return 6;
    if (modelName.includes('20')) return 6;
    
    // Estimate based on RTX generation
    const rtxGenMatch = modelName.match(/rtx\s*(\d)/i);
    if (rtxGenMatch) {
      const gen = parseInt(rtxGenMatch[1], 10);
      if (gen >= 5) return 24;  // Future gen estimate
      if (gen >= 4) return 16;  // 40 series typical
      if (gen >= 3) return 10;  // 30 series typical
      return 8;                 // 20 series typical
    }
    
    return 12; // Default RTX fallback
  }
  
  // NVIDIA Professional GPUs
  if (modelName.includes('h200')) return 141;
  if (modelName.includes('h100')) return 80;
  if (modelName.includes('a100')) {
    if (modelName.includes('80gb')) return 80;
    return 40;
  }
  if (modelName.includes('l40s') || modelName.includes('l40')) return 48;
  if (modelName.includes('l4')) return 24;
  if (modelName.includes('a6000')) return 48;
  if (modelName.includes('a5000')) return 24;
  if (modelName.includes('a4000')) return 16;
  if (modelName.includes('a2000')) return 12;
  
  // AMD Radeon RX series - including future generations
  if (modelName.includes('radeon') || modelName.includes('rx')) {
    // RX 8000 series (future estimates)
    if (modelName.includes('rx 8900')) return 32;
    if (modelName.includes('rx 8800')) return 24;
    if (modelName.includes('rx 8700')) return 16;
    if (modelName.includes('rx 80')) return 24;
    
    // RX 7000 series
    if (modelName.includes('rx 7900 xtx')) return 24;
    if (modelName.includes('rx 7900 xt')) return 20;
    if (modelName.includes('rx 7800 xt')) return 16;
    if (modelName.includes('rx 7800')) return 16;
    if (modelName.includes('rx 7700 xt')) return 12;
    if (modelName.includes('rx 7600 xt')) return 16;
    if (modelName.includes('rx 7600')) return 8;
    if (modelName.includes('rx 70')) return 16;
    
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
    if (modelName.includes('rx 60')) return 8;
    
    // AMD Workstation/Pro
    if (modelName.includes('radeon pro w7900')) return 48;
    if (modelName.includes('radeon pro w7800')) return 32;
    
    // Estimate based on RX generation
    const rxGenMatch = modelName.match(/rx\s*(\d)/i);
    if (rxGenMatch) {
      const gen = parseInt(rxGenMatch[1], 10);
      if (gen >= 8) return 24;  // Future gen estimate
      if (gen >= 7) return 16;  // 7000 series typical
      if (gen >= 6) return 12;  // 6000 series typical
      if (gen >= 5) return 8;   // 5000 series typical
      return 8;
    }
    
    return 8; // Default AMD fallback
  }
  
  // Intel GPUs
  if (modelName.includes('intel')) {
    // Data Center
    if (modelName.includes('max 1550')) return 128;
    if (modelName.includes('max 1100')) return 48;
    
    // Arc series
    if (modelName.includes('arc')) {
      if (modelName.includes('a770 16gb')) return 16;
      if (modelName.includes('a770')) return 8;
      if (modelName.includes('a750')) return 8;
      if (modelName.includes('a580')) return 8;
      if (modelName.includes('a380')) return 6;
      return 8; // Default Arc fallback
    }
    
    // General Intel fallback
    return 8;
  }
  
  // GTX Series
  if (modelName.includes('gtx')) {
    if (modelName.includes('1080 ti')) return 11;
    if (modelName.includes('1080')) return 8;
    if (modelName.includes('1070 ti')) return 8;
    if (modelName.includes('1070')) return 8;
    if (modelName.includes('1660 ti') || modelName.includes('1660 super')) return 6;
    if (modelName.includes('1660')) return 6;
    if (modelName.includes('1060 6gb')) return 6;
    if (modelName.includes('1060')) return 3;
    if (modelName.includes('1650')) return 4;
    if (modelName.includes('1050 ti')) return 4;
    if (modelName.includes('1050')) return 2;
    return 4;
  }
  
  // Basic vendor fallbacks
  if (modelName.includes('nvidia')) return 8;
  if (modelName.includes('amd') || modelName.includes('radeon')) return 8;
  if (modelName.includes('intel')) return 8;
  
  // Absolute minimum fallback
  return 6;
};

// Helper function to calculate a performance score (simplified) - Now exported
export const calculatePerformanceScore = (gpu) => {
  const vram = getVramFromGpuModel(gpu.name);
  let score = vram; // Base score from VRAM

  // Generation multipliers
  if (gpu.name.toLowerCase().includes('rtx 40')) score *= 1.5;
  if (gpu.name.toLowerCase().includes('rtx 30')) score *= 1.3;
  if (gpu.name.toLowerCase().includes('rx 7')) score *= 1.4;
  if (gpu.name.toLowerCase().includes('rx 6')) score *= 1.2;

  return score;
};

// Helper function to calculate a cost-efficiency score (simplified) - Now exported
export const calculateEfficiencyScore = (gpu) => {
  const vram = getVramFromGpuModel(gpu.name);
  let score = vram; // Base score from VRAM

  // Efficiency adjustments
  if (gpu.name.toLowerCase().includes('ti')) score *= 0.8;
  if (gpu.name.toLowerCase().includes('super')) score *= 0.85;
  if (gpu.name.toLowerCase().includes('xt')) score *= 0.9;

  return score;
};

// Function to recommend optimal GPU setup based on requirements
export const recommendOptimalGpuSetup = (requirements, gpuList, isUnifiedMemory) => {
  // Handle unified memory or invalid requirements
  if (isUnifiedMemory || !requirements || typeof requirements.vramRecGB !== 'number' || typeof requirements.vramMinGB !== 'number') {
    return {
      optimal: null,
      performance: null,
      budget: null
    };
  }

  const MAX_GPU_COUNT = 16; // Limit recommendations to a practical number of GPUs

  const vramNeeded = requirements.vramRecGB;
  const vramMinimum = requirements.vramMinGB;

  if (!gpuList || gpuList.length === 0) return {};

  const potentialSetups = [];

  gpuList.forEach(gpu => {
    const vram = getVramFromGpuModel(gpu.name);
    if (vram <= 0) return; // Skip GPUs with invalid VRAM

    const performance = calculatePerformanceScore(gpu);
    const efficiency = calculateEfficiencyScore(gpu);

    // Calculate count needed for Recommended VRAM
    const countNeededForRec = Math.ceil(vramNeeded / vram);
    if (countNeededForRec > 0 && countNeededForRec <= MAX_GPU_COUNT) {
      potentialSetups.push({
        gpu,
        count: countNeededForRec,
        vramPerGpu: vram,
        totalVram: countNeededForRec * vram,
        performance: performance * countNeededForRec, // Simple scaling
        efficiency: efficiency * countNeededForRec, // Simple scaling
        meetsRecommended: true
      });
    } 
    
    // Calculate count needed for Minimum VRAM (only if different from recommended count)
    const countNeededForMin = Math.ceil(vramMinimum / vram);
    if (countNeededForMin > 0 && countNeededForMin <= MAX_GPU_COUNT && countNeededForMin !== countNeededForRec) {
       // Check if this config wasn't already added implicitly by a lower rec count
       const alreadyAdded = potentialSetups.some(p => p.gpu.name === gpu.name && p.count <= countNeededForMin);
       if (!alreadyAdded) {
          potentialSetups.push({
            gpu,
            count: countNeededForMin,
            vramPerGpu: vram,
            totalVram: countNeededForMin * vram,
            performance: performance * countNeededForMin, // Simple scaling
            efficiency: efficiency * countNeededForMin, // Simple scaling
            meetsRecommended: false // Only meets minimum
          });
       }
    }
  });


  if (potentialSetups.length === 0) return {};

  // Sort configurations: prioritize meeting recommended, then by scores
  const sortSetups = (setups, key) => {
    return [...setups].sort((a, b) => {
      if (a.meetsRecommended !== b.meetsRecommended) {
        return a.meetsRecommended ? -1 : 1; // true comes first
      }
      // If recommendation status is the same, sort by the specified key (descending)
      return b[key] - a[key];
    });
  };
  
  const sortBalanced = (setups) => {
     return [...setups].sort((a, b) => {
      if (a.meetsRecommended !== b.meetsRecommended) {
        return a.meetsRecommended ? -1 : 1; // true comes first
      }
      // If recommendation status is the same, sort by balanced score (descending)
      const scoreA = a.performance * 0.5 + a.efficiency * 0.5;
      const scoreB = b.performance * 0.5 + b.efficiency * 0.5;
      return scoreB - scoreA;
    });
  }

  const byPerformance = sortSetups(potentialSetups, 'performance');
  const byEfficiency = sortSetups(potentialSetups, 'efficiency');
  const byBalanced = sortBalanced(potentialSetups);

  // Prepare recommendation format (no changes needed here as the component reads these fields)
  const prepareRecommendation = (setup) => setup;

  return {
    optimal: byBalanced[0] ? prepareRecommendation(byBalanced[0]) : null,
    performance: byPerformance[0] ? prepareRecommendation(byPerformance[0]) : null,
    budget: byEfficiency[0] ? prepareRecommendation(byEfficiency[0]) : null
  };
};

// (Rest of the file content remains unchanged...) - This comment is just for context, not part of the actual file content.
