import Tooltip from './Tooltip';
import { 
  recommendOptimalGpuSetup, 
  getVramFromGpuModel, 
  calculatePerformanceScore, 
  calculateEfficiencyScore 
} from '../utils/gpuData.js';

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
    
    // Status based on requirements - Add dark variants
    let statusClass = meetsRecommended 
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      
    // Performance score normalization (make it out of 100)
    const normalizedPerformance = Math.min(100, Math.round(performance / 5));
    const normalizedEfficiency = Math.min(100, Math.round(efficiency / 2));
    
    return (
      // Adjusted card background, border, shadow for dark mode
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm dark:shadow-none mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            {/* Adjusted text colors */}
            <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusClass}`}>
            {meetsRecommended ? 'Meets All Requirements' : 'Meets Minimum Requirements'}
          </span>
        </div>
        
        <div className="flex items-center mb-3">
           {/* Adjusted icon color */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-gray-700 dark:text-gray-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
          </svg>
           {/* Adjusted text color */}
          <span className="text-sm font-medium dark:text-gray-200">{displayName}</span>
        </div>
        
        <div className="mb-4 grid grid-cols-2 gap-2">
          {/* Adjusted background and text colors */}
          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Required Quantity</div>
            <div className="text-base font-bold text-gray-800 dark:text-gray-200">
              {count} {count === 1 ? 'GPU' : 'GPUs'}
            </div>
          </div>
           {/* Adjusted background and text colors */}
          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total VRAM</div>
            <div className="text-base font-bold text-gray-800 dark:text-gray-200">
              {totalVram} GB
            </div>
          </div>
        </div>
        
        <div className="mb-2">
          <div className="flex justify-between items-center mb-1">
             {/* Adjusted text colors */}
            <span className="text-xs text-gray-600 dark:text-gray-400">Performance</span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{normalizedPerformance}/100</span>
          </div>
           {/* Adjusted progress bar background */}
          <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-600 rounded-full">
            {/* Adjusted progress bar fill color */}
            <div 
              className="h-1.5 bg-primary-500 dark:bg-primary-400 rounded-full" 
              style={{ width: `${normalizedPerformance}%` }}
            ></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-1">
             {/* Adjusted text colors */}
            <span className="text-xs text-gray-600 dark:text-gray-400">Cost-Efficiency</span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{normalizedEfficiency}/100</span>
          </div>
           {/* Adjusted progress bar background */}
          <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-600 rounded-full">
            {/* Adjusted progress bar fill color */}
            <div 
              className="h-1.5 bg-secondary-500 dark:bg-secondary-400 rounded-full" 
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
         {/* Adjusted spinner color */}
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 dark:border-primary-400 border-t-transparent"></div>
         {/* Adjusted text color */}
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">Loading GPU recommendations...</p>
      </div>
    );
  };

  // Get recommendations using the imported function
  const recommendations = recommendOptimalGpuSetup(
    { vramRecGB: results.vramRecGB, vramMinGB: results.vramMinGB },
    gpuList,
    isUnifiedMemory
  );

  // Check if any recommendations were found
  const noRecommendations = !recommendations || (!recommendations.optimal && !recommendations.performance && !recommendations.budget);

  if (noRecommendations) {
    return (
      <div className="text-center py-4">
         {/* Adjusted icon color */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto text-amber-500 dark:text-amber-400 mb-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
         {/* Adjusted text colors */}
        <p className="text-sm text-gray-700 dark:text-gray-300">
          No compatible GPU configurations found for these requirements.
        </p>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
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
      
       {/* Adjusted footer text color */}
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        <p className="mb-1">Recommendations based on: {results.vramRecGB}GB VRAM (recommended), {results.vramMinGB}GB (minimum)</p>
        <p>Values are estimates and may vary based on specific GPU models, drivers, and workloads.</p>
      </div>
    </div>
  );
};

// Removed duplicated helper functions:
// - calculatePerformanceScore
// - calculateEfficiencyScore
// - getVramFromGpuModel
// These are now imported from ../utils/gpuData.js

export default GpuRecommendations;
