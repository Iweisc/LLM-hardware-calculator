import Tooltip from './Tooltip';

const GpuRecommendations = ({ results, gpuList, gpuListLoading, isUnifiedMemory }) => {
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

  if (gpuListLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
        <p className="mt-3 text-sm text-gray-600">Loading GPU recommendations...</p>
      </div>
    );
  }

  // Function to get GPU recommendations based on requirements
  const getRecommendations = () => {
    if (isUnifiedMemory) {
      return {
        optimal: null,
        performance: null,
        budget: null
      };
    }

    const vramNeeded = results.vramRecGB;
    const vramMinimum = results.vramMinGB;

    // Filter GPUs that meet minimum requirements
    const compatibleGpus = gpuList.filter(gpu => {
      const vram = getVramFromGpuModel(gpu.name);
      return vram >= vramMinimum;
    });

    if (compatibleGpus.length === 0) {
      return {
        optimal: null,
        performance: null,
        budget: null
      };
    }

    // Sort by various metrics
    const rankedGpus = compatibleGpus.map(gpu => {
      const vram = getVramFromGpuModel(gpu.name);
      const performance = calculatePerformanceScore(gpu);
      const efficiency = calculateEfficiencyScore(gpu);
      return {
        gpu,
        vram,
        performance,
        efficiency,
        meetsRecommended: vram >= vramNeeded
      };
    });

    // Sort by different criteria
    const byPerformance = [...rankedGpus].sort((a, b) => b.performance - a.performance);
    const byEfficiency = [...rankedGpus].sort((a, b) => b.efficiency - a.efficiency);
    const byBalanced = [...rankedGpus].sort((a, b) => 
      (b.performance * 0.5 + b.efficiency * 0.5) - (a.performance * 0.5 + a.efficiency * 0.5)
    );

    // Helper function to prepare recommendation
    const prepareRecommendation = (gpu) => ({
      gpu: gpu.gpu,
      count: 1,
      totalVram: gpu.vram,
      performance: gpu.performance,
      efficiency: gpu.efficiency,
      meetsRecommended: gpu.meetsRecommended
    });

    return {
      optimal: byBalanced[0] ? prepareRecommendation(byBalanced[0]) : null,
      performance: byPerformance[0] ? prepareRecommendation(byPerformance[0]) : null,
      budget: byEfficiency[0] ? prepareRecommendation(byEfficiency[0]) : null
    };
  };

  const recommendations = getRecommendations();

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
};

// Helper functions for GPU calculations
const calculatePerformanceScore = (gpu) => {
  const vram = getVramFromGpuModel(gpu.name);
  let score = vram; // Base score from VRAM

  // Generation multipliers
  if (gpu.name.toLowerCase().includes('rtx 40')) score *= 1.5;
  if (gpu.name.toLowerCase().includes('rtx 30')) score *= 1.3;
  if (gpu.name.toLowerCase().includes('rx 7')) score *= 1.4;
  if (gpu.name.toLowerCase().includes('rx 6')) score *= 1.2;

  return score;
};

const calculateEfficiencyScore = (gpu) => {
  const vram = getVramFromGpuModel(gpu.name);
  let score = vram; // Base score from VRAM

  // Efficiency adjustments
  if (gpu.name.toLowerCase().includes('ti')) score *= 0.8;
  if (gpu.name.toLowerCase().includes('super')) score *= 0.85;
  if (gpu.name.toLowerCase().includes('xt')) score *= 0.9;

  return score;
};

const getVramFromGpuModel = (modelName) => {
  if (!modelName) return 6;
  modelName = modelName.toLowerCase();

  // Basic fallbacks for demo
  if (modelName.includes('rtx 4090')) return 24;
  if (modelName.includes('rtx 4080')) return 16;
  if (modelName.includes('rtx 3090')) return 24;
  if (modelName.includes('rtx 3080')) return 10;
  if (modelName.includes('rx 7900')) return 24;
  if (modelName.includes('arc a770')) return 16;

  return 8; // Default fallback
};

export default GpuRecommendations;
