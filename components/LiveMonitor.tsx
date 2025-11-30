import React, { useRef, useState, useEffect } from 'react';
import { Monitor, Square, Activity, Video } from 'lucide-react';

interface LiveMonitorProps {
  onFrameCapture: (base64Image: string) => Promise<void>;
  isProcessing: boolean;
}

export const LiveMonitor: React.FC<LiveMonitorProps> = ({ onFrameCapture, isProcessing }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const startShare = async () => {
    try {
      // Prompt user to select the WhatsApp Web tab/window
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always"
        } as any,
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Handle stream stop (user clicks "Stop Sharing" in browser UI)
      mediaStream.getTracks()[0].onended = () => {
        stopMonitoring();
      };
      
      setIsMonitoring(true);
    } catch (err) {
      console.error("Error starting screen share:", err);
    }
  };

  const stopMonitoring = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsMonitoring(false);
  };

  // Frame Capture Interval
  useEffect(() => {
    if (isMonitoring && stream && !intervalRef.current) {
      // Capture every 5 seconds
      intervalRef.current = window.setInterval(() => {
        captureFrame();
      }, 5000);
    }
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [isMonitoring, stream]);

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !stream) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context && video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      await onFrameCapture(base64Image);
    }
  };

  return (
    <div className="space-y-4">
      {/* Control Area */}
      <div className="flex flex-col items-center justify-center p-8 bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden relative min-h-[400px]">
        
        {!isMonitoring ? (
          <div className="text-center z-10 space-y-6 max-w-md">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/50">
               <Video className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white">Connect to WhatsApp</h2>
            <p className="text-slate-400">
              1. Open <strong>web.whatsapp.com</strong> in a new tab.<br/>
              2. Click Start below and select that tab.<br/>
              3. We will monitor for new codes automatically.
            </p>
            <button
              onClick={startShare}
              className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-full font-bold text-lg shadow-lg shadow-green-900/50 transition-all flex items-center justify-center gap-2 w-full"
            >
              <Monitor className="w-5 h-5" />
              Start Monitoring
            </button>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col relative z-10">
            {/* Header Overlay */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/10">
                <div className="relative">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="w-3 h-3 bg-red-500 rounded-full absolute top-0 left-0 animate-ping opacity-75"></div>
                </div>
                <span className="text-sm font-medium">Live Recording</span>
              </div>
              <button 
                onClick={stopMonitoring}
                className="bg-red-500/80 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md flex items-center gap-2 transition-colors"
              >
                <Square className="w-4 h-4 fill-current" /> Stop
              </button>
            </div>

            {/* Live Video Feed */}
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              className="w-full h-full object-contain rounded-lg shadow-2xl bg-black"
            />
            
            {/* Status Footer */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20">
               <div className={`px-4 py-2 rounded-full backdrop-blur-md border border-white/10 flex items-center gap-3 transition-colors ${isProcessing ? 'bg-blue-500/30 text-blue-100' : 'bg-black/50 text-slate-300'}`}>
                  {isProcessing ? (
                    <>
                       <Activity className="w-4 h-4 animate-spin" />
                       <span className="text-sm font-medium">Analyzing frame...</span>
                    </>
                  ) : (
                    <>
                       <Activity className="w-4 h-4" />
                       <span className="text-sm">Scanning every 5s</span>
                    </>
                  )}
               </div>
            </div>
          </div>
        )}
        
        {/* Decorative Grid */}
        {!isMonitoring && (
            <div className="absolute inset-0 opacity-10" 
                style={{backgroundImage: 'radial-gradient(#4ade80 1px, transparent 1px)', backgroundSize: '24px 24px'}}>
            </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};