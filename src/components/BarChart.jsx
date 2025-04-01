const BarChart = ({ value, max, type }) => {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div className="memory-display mt-2">
      <div className="bar-container relative">
        <div className="bar-chart">
          <div 
            className={`bar-fill bar-fill-${type}`} 
            style={{ width: `${percentage}%` }}
          />
        </div>
        {/* Adjust text colors */}
        <div className="memory-details mt-1 text-xs text-gray-600 dark:text-gray-400 flex justify-between items-center">
          <div>
            <span className="font-medium">{value} GB</span> required
          </div>
          <div className="text-right">
            {type === "vram" ? (
              <div className="flex gap-2 items-center">
                 {/* Adjust text colors */}
                <span className={value <= 8 ? "text-green-600 dark:text-green-400 font-medium" : "text-gray-400 dark:text-gray-500"}>8GB</span>
                <span className={value <= 12 ? "text-green-600 dark:text-green-400 font-medium" : "text-gray-400 dark:text-gray-500"}>12GB</span>
                <span className={value <= 16 ? "text-green-600 dark:text-green-400 font-medium" : "text-gray-400 dark:text-gray-500"}>16GB</span>
                <span className={value <= 24 ? "text-green-600 dark:text-green-400 font-medium" : "text-gray-400 dark:text-gray-500"}>24GB</span>
              </div>
            ) : (
              <div className="flex gap-2 items-center">
                 {/* Adjust text colors */}
                <span className={value <= 8 ? "text-green-600 dark:text-green-400 font-medium" : "text-gray-400 dark:text-gray-500"}>8GB</span>
                <span className={value <= 16 ? "text-green-600 dark:text-green-400 font-medium" : "text-gray-400 dark:text-gray-500"}>16GB</span>
                <span className={value <= 32 ? "text-green-600 dark:text-green-400 font-medium" : "text-gray-400 dark:text-gray-500"}>32GB</span>
                <span className={value <= 64 ? "text-green-600 dark:text-green-400 font-medium" : "text-gray-400 dark:text-gray-500"}>64GB</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarChart;
