import { useState, useEffect } from 'react';
import './App.css';
import { calculateHardware } from './utils/calculator';
import { 
  defaultGpuList, 
  getCachedGpuList
} from './utils/gpuData';
import ModelDetailsForm from './components/ModelDetailsForm';
import MemoryCard from './components/MemoryCard';
import MemoryBreakdown from './components/MemoryBreakdown';
import GpuRecommendations from './components/GpuRecommendations';

function App() {
  const [modelParams, setModelParams] = useState(7);
  const [quantization, setQuantization] = useState('FP16');
  const [kvQuantization, setKvQuantization] = useState('');
  const [contextLength, setContextLength] = useState(4096);
  const [batchSize, setBatchSize] = useState(1);
  const [isUnifiedMemory, setIsUnifiedMemory] = useState(false);
  const [results, setResults] = useState(null);
  const [gpuList, setGpuList] = useState(defaultGpuList);
  const [gpuListLoading, setGpuListLoading] = useState(true);
  
  // Fetch and cache GPU data when component mounts
  useEffect(() => {
    const fetchGpuData = async () => {
      try {
        setGpuListLoading(true);
        const fetchedGpuList = await getCachedGpuList();
        if (fetchedGpuList && fetchedGpuList.length > 0) {
          setGpuList(fetchedGpuList);
          console.log(`Loaded ${fetchedGpuList.length} GPUs`);
        } else {
          console.warn("Failed to load GPU database, using fallback list");
          setGpuList(defaultGpuList);
        }
      } catch (error) {
        console.error("Failed to fetch GPU data:", error);
        setGpuList(defaultGpuList);
      } finally {
        setGpuListLoading(false);
      }
    };
    
    fetchGpuData();
  }, []);

  useEffect(() => {
    // Calculate hardware requirements whenever inputs change
    const calculationResults = calculateHardware(
      modelParams,
      quantization,
      kvQuantization,
      contextLength,
      batchSize,
      isUnifiedMemory,
      1
    );
    setResults(calculationResults);
  }, [modelParams, quantization, kvQuantization, contextLength, batchSize, isUnifiedMemory]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="header-gradient">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                LLM Hardware Calculator
              </h1>
              <p className="text-primary-100 text-sm md:text-base max-w-xl">
                Estimate GPU and system memory requirements for running large language models locally
              </p>
            </div>
            
            <div className="model-badge mt-4 md:mt-0 animate-float">
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
                {modelParams}B Parameters
              </span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
          {/* Input Form - Left Column */}
          <div className="lg:col-span-1">
            <ModelDetailsForm
              modelParams={modelParams}
              setModelParams={setModelParams}
              quantization={quantization}
              setQuantization={setQuantization}
              kvQuantization={kvQuantization}
              setKvQuantization={setKvQuantization}
              contextLength={contextLength}
              setContextLength={setContextLength}
              batchSize={batchSize}
              setBatchSize={setBatchSize}
              isUnifiedMemory={isUnifiedMemory}
              setIsUnifiedMemory={setIsUnifiedMemory}
            />
          </div>
          
          {/* Results Section - Right Column */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2 text-primary-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
              Hardware Requirements
            </h2>
            
            {results && (
              <div className="space-y-8">
                {/* VRAM Requirements - Only show for discrete GPU memory */}
                {!isUnifiedMemory && (
                  <MemoryCard 
                    title="VRAM Requirements"
                    minimum={results.vramMinGB}
                    recommended={results.vramRecGB}
                    description={{
                      minimum: "Model + Basic Overhead",
                      recommended: "Model + KV Cache + Activations + Overhead"
                    }}
                    type="vram"
                    minExceedsLimit={results.minExceedsLimit}
                    recExceedsLimit={results.recExceedsLimit}
                    originalMin={results.originalUnifiedMinGB}
                    originalRec={results.originalUnifiedRecGB}
                    unifiedMemoryMax={results.unifiedMemoryMax}
                  />
                )}
                
                {/* RAM Requirements */}
                <MemoryCard 
                  title="RAM Requirements"
                  minimum={results.ramMinGB}
                  recommended={results.ramRecGB}
                  description={{
                    minimum: "Model + OS Overhead",
                    recommended: "Minimum + 20% Buffer"
                  }}
                  type="ram"
                  minExceedsLimit={results.minExceedsLimit}
                  recExceedsLimit={results.recExceedsLimit}
                  originalMin={results.originalUnifiedMinGB}
                  originalRec={results.originalUnifiedRecGB}
                  unifiedMemoryMax={results.unifiedMemoryMax}
                />
                
                {/* Memory Breakdown */}
                <div className="bg-gray-50 p-5 rounded-xl animated-bg">
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-primary-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75m0 0h3.75m-3.75 0h7.5M9 21h3.75m-3.75 0h7.5m3-6H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.423 48.423 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75m0 0h3.75m-3.75 0h7.5M9 21h3.75m-3.75 0h7.5" />
                    </svg>
                    Memory Breakdown
                  </h3>
                  <MemoryBreakdown results={results} />
                </div>
                
                {/* Recommended GPU Setup */}
                <div className="bg-gray-50 p-5 rounded-xl animated-bg">
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-primary-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                    Recommended GPU Configuration
                  </h3>
                  <GpuRecommendations 
                    results={results}
                    gpuList={gpuList}
                    gpuListLoading={gpuListLoading}
                    isUnifiedMemory={isUnifiedMemory}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <footer className="footer-gradient mt-8 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-center text-sm text-gray-600 font-medium">
              LLM Hardware Calculator - Estimate resources for running large language models locally
            </p>
            <p className="text-center text-xs text-gray-500 mt-2 md:mt-0">
              © {new Date().getFullYear()} - Made with Tailwind CSS and React
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
