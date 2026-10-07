import React, { useState } from 'react';
import { Upload, FileVideo, CheckCircle2, Lock } from 'lucide-react';
import { Button } from '../ui/Button';

export interface VideoUploadStepProps {
  onVideoSelected: (file: File) => void;
  videoPreviewUrl: string | null;
}

export const VideoUploadStep: React.FC<VideoUploadStepProps> = ({
  onVideoSelected,
  videoPreviewUrl,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      onVideoSelected(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      onVideoSelected(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Upload Card */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
            dragActive
              ? 'border-teal-500 bg-teal-500/10'
              : 'border-[#243041] bg-[#121821] hover:border-teal-500/50'
          }`}
        >
          <input
            type="file"
            accept="video/mp4,video/avi,video/quicktime"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-3">
            <Upload className="w-6 h-6" />
          </div>

          <h4 className="text-sm font-bold text-[#E6EDF3] tracking-tight text-center">
            Drag &amp; Drop Video Feed File
          </h4>
          <p className="text-xs text-[#8B98A9] mt-1 text-center">
            Supports MP4, AVI, MOV (Max 500MB)
          </p>

          {selectedFile && (
            <div className="mt-4 p-3 bg-[#0B0F14] border border-teal-500/40 rounded-lg flex items-center gap-3 w-full">
              <FileVideo className="w-5 h-5 text-teal-400 shrink-0" />
              <div className="flex-1 min-w-0 font-mono text-xs">
                <p className="text-[#E6EDF3] truncate font-bold">{selectedFile.name}</p>
                <p className="text-[#8B98A9]">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Ready for Analysis
                </p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
          )}
        </div>

        {/* Disabled CCTV / RTSP Option */}
        <div className="flex flex-col items-center justify-center p-8 border border-[#243041] bg-[#0B0F14]/50 rounded-xl opacity-60 relative select-none">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-[#8B98A9] tracking-tight text-center">
            Live CCTV / RTSP Feed
          </h4>
          <p className="text-xs text-[#8B98A9] mt-1 text-center">
            Direct IP Camera &amp; RTSP Stream Integration
          </p>
          <span className="mt-4 px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono border border-slate-700">
            COMING SOON IN V2.0
          </span>
        </div>
      </div>
    </div>
  );
};
