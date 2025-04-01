import BarChart from './BarChart';
import Tooltip from './Tooltip';

const MemoryCard = ({ 
  title, 
  minimum, 
  recommended, 
  description, 
  type, 
  minExceedsLimit, 
  recExceedsLimit, 
  originalMin, 
  originalRec, 
  unifiedMemoryMax 
}) => {
  // Fixed max values for consistent scaling across all model sizes
  const maxVram = 32; // 24GB is typical high-end GPU VRAM (RTX 4090)
  const maxRam = 96; // 64GB is typical high-end system RAM
  const max = type === "vram" ? maxVram : maxRam;
  
  // For unified memory, check if values were capped due to exceeding the limit
  const showMinWarning = minExceedsLimit && type === "vram";
  const showRecWarning = recExceedsLimit && type === "vram";

  return (
    // Added dark background to the main container
    <div className={`bg-white dark:bg-gray-800 p-5 rounded-xl shadow-card animated-bg dark:animated-bg-dark`}> 
      {/* Adjusted heading and badge colors */}
      <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
        {title}
        <span className="ml-2 text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full">
          {type === "vram" ? "GPU" : "System"}
        </span>
      </h4>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* result-card and type-card classes handled globally */}
        <div className={`result-card pulse-on-hover ${type}-card`}>
          <div className="flex justify-between items-center">
            <div>
              {/* Adjusted label color */}
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Minimum</div>
              {/* result-value and type-value classes handled globally */}
              <div className={`result-value ${type}-value flex items-center`}>
                {minimum} GB
                
                {/* Show warning for capped values */}
                {showMinWarning && (
                  <Tooltip text={`Exceeds unified memory limit! Original: ${originalMin} GB (capped to ${unifiedMemoryMax} GB)`}>
                    {/* Adjusted warning icon background and color */}
                    <div className="ml-2 flex items-center justify-end rounded-full bg-amber-100 dark:bg-amber-900 p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-amber-600 dark:text-amber-400">
                        <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </Tooltip>
                )}
              </div>
            </div>
            <Tooltip text="The absolute minimum memory required to run the model">
              {/* Adjusted help icon colors */}
              <div className="cursor-help text-gray-400 dark:text-gray-500 hover:text-primary-500 dark:hover:text-primary-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
              </div>
            </Tooltip>
          </div>
          <BarChart value={minimum} max={max} type={type} />
          {/* Adjusted description text color */}
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">{description.minimum}</div>
        </div>
        
        {/* result-card and type-card classes handled globally */}
        <div className={`result-card pulse-on-hover ${type}-card`}>
          <div className="flex justify-between items-center">
            <div>
               {/* Adjusted label color */}
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Recommended</div>
              {/* result-value and type-value classes handled globally */}
              <div className={`result-value ${type}-value flex items-center`}>
                {recommended} GB
                
                {/* Show warning for capped values */}
                {showRecWarning && (
                  <Tooltip text={`Exceeds unified memory limit! Original: ${originalRec} GB (capped to ${unifiedMemoryMax} GB)`}>
                     {/* Adjusted warning icon background and color */}
                    <div className="ml-2 flex items-center justify-end rounded-full bg-amber-100 dark:bg-amber-900 p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-amber-600 dark:text-amber-400">
                        <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </Tooltip>
                )}
              </div>
            </div>
            <Tooltip text="The recommended amount of memory for optimal performance">
              {/* Adjusted help icon colors */}
              <div className="cursor-help text-gray-400 dark:text-gray-500 hover:text-primary-500 dark:hover:text-primary-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
              </div>
            </Tooltip>
          </div>
          <BarChart value={recommended} max={max} type={type} />
           {/* Adjusted description text color */}
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">{description.recommended}</div>
        </div>
      </div>
    </div>
  );
};

export default MemoryCard;
