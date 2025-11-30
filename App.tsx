import React, { useState, useCallback, useRef } from 'react';
import { LiveMonitor } from './components/LiveMonitor';
import { ExtractionTable } from './components/ExtractionTable';
import { Uploader } from './components/Uploader';
import { ExtractedData, ExtractionStatus } from './types';
import { extractCodesFromImage, extractCodesFromText } from './services/geminiService';
import { ShieldAlert, MessageSquareText, FileText, MonitorPlay } from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<ExtractedData[]>([]);
  const [status, setStatus] = useState<ExtractionStatus>(ExtractionStatus.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'manual'>('live');
  const [textInput, setTextInput] = useState('');
  
  // Use a ref to keep track of processed signatures to prevent duplicates during live stream
  const processedSignatures = useRef<Set<string>>(new Set());

  const handleNewData = (newData: ExtractedData[]) => {
    const uniqueItems: ExtractedData[] = [];
    
    newData.forEach(item => {
      // Create a unique signature for this message
      // We assume if sender + code is same, it's the same message
      const signature = `${item.sender}-${item.code}`;
      
      if (!processedSignatures.current.has(signature)) {
        processedSignatures.current.add(signature);
        uniqueItems.push(item);
      }
    });

    if (uniqueItems.length > 0) {
      setData(prev => [...prev, ...uniqueItems]);
    }
  };

  const handleFrameCapture = async (base64Image: string) => {
    setStatus(ExtractionStatus.MONITORING);
    try {
      const results = await extractCodesFromImage(base64Image, 'image/jpeg');
      handleNewData(results);
      // We don't set SUCCESS status here to keep the "Scanning" UI active
      setStatus(ExtractionStatus.IDLE); 
    } catch (err) {
      console.error(err);
      // Silent fail in live mode to keep stream going
      setStatus(ExtractionStatus.IDLE);
    }
  };

  const handleImageUpload = useCallback(async (file: File) => {
    setStatus(ExtractionStatus.PROCESSING);
    setErrorMsg(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        
        try {
          const results = await extractCodesFromImage(base64Data, file.type);
          handleNewData(results);
          setStatus(ExtractionStatus.SUCCESS);
        } catch (err) {
          setErrorMsg("Failed to analyze image. Please try a clearer screenshot.");
          setStatus(ExtractionStatus.ERROR);
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {
      setErrorMsg("Error reading file.");
      setStatus(ExtractionStatus.ERROR);
    }
  }, []);

  const handleTextProcessing = async () => {
    if (!textInput.trim()) return;
    setStatus(ExtractionStatus.PROCESSING);
    setErrorMsg(null);

    try {
      const results = await extractCodesFromText(textInput);
      handleNewData(results);
      setStatus(ExtractionStatus.SUCCESS);
      setTextInput('');
    } catch (err) {
      setErrorMsg("Failed to process text.");
      setStatus(ExtractionStatus.ERROR);
    }
  };

  const handleDelete = (index: number) => {
    const itemToDelete = data[index];
    if (itemToDelete) {
        // Remove from signature set so it can be re-detected if needed
        processedSignatures.current.delete(`${itemToDelete.sender}-${itemToDelete.code}`);
    }
    setData((prev) => prev.filter((_, i) => i !== index));
  };
  
  const handleClearAll = () => {
      setData([]);
      processedSignatures.current.clear();
  };

  return (
    <div className="min-h-screen pb-20 bg-[#f0f2f5]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#25D366] rounded-xl flex items-center justify-center shadow-lg shadow-green-100">
              <MessageSquareText className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">WhatsApp Live Extractor</h1>
              <p className="text-xs text-gray-500 font-medium">Real-time Code Monitor</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
            <ShieldAlert className="w-4 h-4 text-gray-400" />
            <span>Secure Client-Side Processing</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Controls */}
        <div className="lg:col-span-7 space-y-6">
            
            {/* Tab Navigation */}
            <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex">
                <button
                    onClick={() => setActiveTab('live')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                        activeTab === 'live' 
                        ? 'bg-[#e7fceb] text-green-800 shadow-sm ring-1 ring-green-200' 
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                    <MonitorPlay className="w-4 h-4" />
                    Live Monitor
                </button>
                 <button
                    onClick={() => setActiveTab('manual')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                        activeTab === 'manual' 
                        ? 'bg-blue-50 text-blue-800 shadow-sm ring-1 ring-blue-200' 
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                    <FileText className="w-4 h-4" />
                    Manual Upload
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {activeTab === 'live' ? (
                   <div className="p-1">
                      <LiveMonitor 
                        onFrameCapture={handleFrameCapture} 
                        isProcessing={status === ExtractionStatus.MONITORING}
                      />
                   </div>
                ) : (
                    <div className="p-6 space-y-8">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Option 1: Upload Screenshot</h3>
                            <Uploader 
                                onImageSelected={handleImageUpload} 
                                isLoading={status === ExtractionStatus.PROCESSING} 
                            />
                        </div>
                        <div className="border-t border-gray-100 pt-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Option 2: Paste Text</h3>
                             <textarea
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                placeholder="Paste copied messages here..."
                                className="w-full h-32 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                                disabled={status === ExtractionStatus.PROCESSING}
                            />
                            <div className="flex justify-end mt-3">
                                <button
                                    onClick={handleTextProcessing}
                                    disabled={!textInput.trim() || status === ExtractionStatus.PROCESSING}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
                                >
                                    Extract Text
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {errorMsg && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2 animate-fade-in">
                    <ShieldAlert className="w-4 h-4" />
                    {errorMsg}
                </div>
            )}
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-5">
            <div className="sticky top-24">
                <ExtractionTable 
                    data={data} 
                    onDelete={handleDelete} 
                    onClearAll={handleClearAll}
                />
                
                {data.length === 0 && (
                    <div className="mt-8 text-center p-8 border-2 border-dashed border-gray-200 rounded-xl">
                        <p className="text-gray-400 font-medium">No codes detected yet</p>
                        <p className="text-gray-400 text-xs mt-1">Start the monitor or upload a file</p>
                    </div>
                )}
            </div>
        </div>

      </main>
    </div>
  );
};

export default App;