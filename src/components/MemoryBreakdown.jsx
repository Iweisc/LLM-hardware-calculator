const MemoryBreakdown = ({ results }) => {
  return (
    <div className="card p-5"> {/* Card styled globally */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Adjusted background and text colors */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Model Size</div>
          <div className="text-lg font-semibold text-primary-600 dark:text-primary-400">{results.modelSizeGB} GB</div>
        </div>
        
        {/* Adjusted background and text colors */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">KV Cache</div>
          <div className="text-lg font-semibold text-accent-600 dark:text-accent-400">{results.kvCacheGB} GB</div>
        </div>
        
        {/* Adjusted background and text colors */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Activations</div>
          <div className="text-lg font-semibold text-secondary-600 dark:text-secondary-400">{results.activationGB} GB</div>
        </div>
        
        {/* Adjusted background and text colors */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Overhead</div>
          <div className="text-lg font-semibold text-gray-600 dark:text-gray-300">{results.overheadGB} GB</div>
        </div>
      </div>
      
      {/* Adjusted background and text colors for details section */}
      <div className="mt-5 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Model Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Estimated layers:</span>
            <span className="font-medium text-gray-800 dark:text-gray-200">{results.assumptions.estLayers}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Estimated hidden dimension:</span>
            <span className="font-medium text-gray-800 dark:text-gray-200">{results.assumptions.estHiddenDim}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Bytes per parameter:</span>
            <span className="font-medium text-gray-800 dark:text-gray-200">{results.assumptions.bytesPerParam}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">OS overhead:</span>
            <span className="font-medium text-gray-800 dark:text-gray-200">{results.assumptions.osOverheadGB} GB</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Activation factor:</span>
            <span className="font-medium text-gray-800 dark:text-gray-200">{results.assumptions.activationFactor * 100}%</span>
          </div>
          {results.isUnifiedMemory ? (
            <div className="flex justify-between items-center md:col-span-2">
              <span className="text-gray-600 dark:text-gray-400">Memory type:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200 flex items-center">
                Unified (max {results.unifiedMemoryMax} GB)
              </span>
            </div>
          ) : (
            <div className="flex justify-between items-center md:col-span-2">
              <span className="text-gray-600 dark:text-gray-400">Number of GPUs:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {results.assumptions.numGpus} GPU{results.assumptions.numGpus > 1 ? 's' : ''}
                {results.assumptions.numGpus > 1 ? ` (${results.vramRecPerGpu.toFixed(1)} GB/GPU)` : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemoryBreakdown;
