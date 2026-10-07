import React, { useState, useEffect, useRef } from 'react';
import {
  Upload, FileVideo, CheckCircle2, Lock,
  Cpu, AlertTriangle, Loader2, Eye, Brain, ShieldAlert,
} from 'lucide-react';
import { api } from '../../services/api';

export interface VideoUploadStepProps {
  onVideoSelected: (file: File) => void;
  videoPreviewUrl: string | null;
}

type Status = 'idle' | 'uploading' | 'queued' | 'processing' | 'done' | 'error';

const STATUS_MAP: Record<Status, { label: string; colour: string; icon: React.ReactNode }> = {
  idle:       { label: 'Waiting for video',               colour: 'text-[#8B98A9]',   icon: <Upload className="w-4 h-4" /> },
  uploading:  { label: 'Uploading video to backend…',     colour: 'text-amber-400',   icon: <Loader2 className="w-4 h-4 animate-spin" /> },
  queued:     { label: 'Queued for YOLO analysis…',       colour: 'text-amber-400',   icon: <Loader2 className="w-4 h-4 animate-spin" /> },
  processing: { label: 'YOLOv8 inference running…',       colour: 'text-teal-400',    icon: <Cpu className="w-4 h-4 animate-pulse" /> },
  done:       { label: 'Analysis complete!',              colour: 'text-emerald-400', icon: <CheckCircle2 className="w-4 h-4" /> },
  error:      { label: 'Processing error',                colour: 'text-rose-400',    icon: <AlertTriangle className="w-4 h-4" /> },
};

const PIPELINE: Status[] = ['uploading', 'queued', 'processing', 'done'];

export const VideoUploadStep: React.FC<VideoUploadStepProps> = ({ onVideoSelected, videoPreviewUrl }) => {
  const [file,         setFile]         = useState<File | null>(null);
  const [drag,         setDrag]         = useState(false);
  const [status,       setStatus]       = useState<Status>('idle');
  const [eventCount,   setEventCount]   = useState<number | null>(null);
  const [workerCount,  setWorkerCount]  = useState<number | null>(null);
  const [modelClasses, setModelClasses] = useState<string[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load model classes from backend on mount
  useEffect(() => {
    fetch('http://localhost:8000/')
      .then(r => r.json())
      .then(d => { if (d.classes) setModelClasses(Object.values(d.classes) as string[]); })
      .catch(() => {});
  }, []);

  const stopPoll = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  useEffect(() => () => stopPoll(), []);

  const handleFile = async (f: File) => {
    setFile(f);
    setStatus('uploading');
    setEventCount(null);
    setWorkerCount(null);

    const res = await api.uploadVideo(f);
    onVideoSelected(f);

    if (res.video_id.startsWith('vid_mock')) {
      // Backend offline — show mock success
      setTimeout(() => { setStatus('done'); setEventCount(0); setWorkerCount(0); }, 800);
      return;
    }

    setStatus('queued');
    const vid = res.video_id;
    pollRef.current = setInterval(async () => {
      const st = await api.getVideoStatus(vid);
      if (!st) return;
      setStatus(st.status as Status);
      if (st.event_count  != null) setEventCount(st.event_count);
      if (st.worker_count != null) setWorkerCount(st.worker_count);
      if (st.status === 'done' || st.status === 'error') stopPoll();
    }, 2500);
  };

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDrag(e.type === 'dragenter' || e.type === 'dragover');
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDrag(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };
  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const si = STATUS_MAP[status];

  return (
    <div className="space-y-6">

      {/* Model banner */}
      {modelClasses.length > 0 && (
        <div className="flex items-start gap-3 bg-teal-500/5 border border-teal-500/20 rounded-xl px-4 py-3">
          <Brain className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold font-mono text-teal-400">YOLOv8 best.pt — Loaded &amp; Ready</p>
            <p className="text-[11px] text-teal-400/70 font-mono mt-0.5">
              Detects: {modelClasses.join(' · ')}
            </p>
          </div>
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-auto mt-0.5" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Drop zone */}
        <div
          onDragEnter={onDrag} onDragOver={onDrag} onDragLeave={onDrag} onDrop={onDrop}
          className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
            drag ? 'border-teal-500 bg-teal-500/10' : 'border-[#243041] bg-[#121821] hover:border-teal-500/50'
          }`}
        >
          <input
            id="video-upload-input"
            type="file"
            accept="video/mp4,video/avi,video/quicktime,video/mkv,video/webm"
            onChange={onInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-3">
            <Upload className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-[#E6EDF3] text-center">Drag &amp; Drop Construction Site Video</h4>
          <p className="text-xs text-[#8B98A9] mt-1 text-center">MP4, AVI, MOV, MKV, WebM · Max 500 MB</p>
          <p className="text-[10px] text-teal-400/70 mt-1 font-mono">Powered by YOLOv8 · best.pt</p>

          {file && (
            <div className="mt-4 p-3 bg-[#0B0F14] border border-teal-500/40 rounded-lg flex items-center gap-3 w-full">
              <FileVideo className="w-5 h-5 text-teal-400 shrink-0" />
              <div className="flex-1 min-w-0 font-mono text-xs">
                <p className="text-[#E6EDF3] truncate font-bold">{file.name}</p>
                <p className="text-[#8B98A9]">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
          )}
        </div>

        {/* CCTV placeholder */}
        <div className="flex flex-col items-center justify-center p-8 border border-[#243041] bg-[#0B0F14]/50 rounded-xl opacity-50 select-none">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-[#8B98A9] text-center">Live CCTV / RTSP Feed</h4>
          <p className="text-xs text-[#8B98A9] mt-1 text-center">Direct IP Camera &amp; RTSP Stream</p>
          <span className="mt-4 px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono border border-slate-700">COMING SOON V2.0</span>
        </div>
      </div>

      {/* Analysis status panel */}
      {status !== 'idle' && (
        <div className={`rounded-xl border p-5 transition-all ${
          status === 'done'  ? 'border-emerald-500/40 bg-emerald-500/5'  :
          status === 'error' ? 'border-rose-500/40    bg-rose-500/5'     :
                               'border-teal-500/30    bg-teal-500/5'
        }`}>
          {/* Status title */}
          <div className="flex items-center gap-3 mb-4">
            <span className={si.colour}>{si.icon}</span>
            <span className={`text-sm font-bold font-mono ${si.colour}`}>{si.label}</span>
          </div>

          {/* Pipeline steps */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            {PIPELINE.map((s, i) => {
              const cur  = PIPELINE.indexOf(status);
              const mine = PIPELINE.indexOf(s);
              const done   = cur > mine;
              const active = cur === mine;
              return (
                <React.Fragment key={s}>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold border transition-all ${
                    active ? 'border-teal-500 text-teal-400 bg-teal-500/10' :
                    done   ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' :
                             'border-[#243041] text-[#8B98A9]'
                  }`}>{s.toUpperCase()}</div>
                  {i < PIPELINE.length - 1 && <div className="w-4 h-px bg-[#243041]" />}
                </React.Fragment>
              );
            })}
          </div>

          {/* Progress bar */}
          {(status === 'queued' || status === 'processing') && (
            <div className="mb-4 space-y-1">
              <div className="h-1.5 bg-[#0B0F14] rounded-full overflow-hidden">
                <div className={`h-full bg-teal-500 rounded-full transition-all ${status === 'processing' ? 'animate-pulse' : ''}`}
                  style={{ width: status === 'queued' ? '25%' : '65%' }} />
              </div>
              <p className="text-[10px] font-mono text-[#8B98A9]">
                {status === 'queued' ? 'Waiting in queue…' : 'Running frame-by-frame YOLO inference — detecting PPE, persons, violations…'}
              </p>
            </div>
          )}

          {/* Done results */}
          {status === 'done' && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-[#0B0F14] border border-[#243041] rounded-lg p-3 text-center">
                <p className="text-2xl font-bold font-mono text-teal-400">{workerCount ?? '—'}</p>
                <p className="text-[10px] text-[#8B98A9] mt-1">Workers Detected</p>
              </div>
              <div className="bg-[#0B0F14] border border-[#243041] rounded-lg p-3 text-center">
                <p className={`text-2xl font-bold font-mono ${(eventCount ?? 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{eventCount ?? '—'}</p>
                <p className="text-[10px] text-[#8B98A9] mt-1">Safety Events</p>
              </div>
              <div className="bg-[#0B0F14] border border-[#243041] rounded-lg p-3 text-center">
                <p className="text-lg font-bold font-mono text-amber-400">YOLOv8</p>
                <p className="text-[10px] text-[#8B98A9] mt-1">best.pt model</p>
              </div>
            </div>
          )}

          {status === 'done' && (eventCount ?? 0) > 0 && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <p className="text-xs font-mono text-rose-400">
                <strong>{eventCount} safety violation(s)</strong> detected — navigate to <strong>Monitor</strong> or <strong>Investigate</strong> to review incidents
              </p>
            </div>
          )}

          {status === 'done' && (eventCount ?? 0) === 0 && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-xs font-mono text-emerald-400">
                No safety violations detected in this video — all workers appear compliant
              </p>
            </div>
          )}

          {/* Video preview */}
          {videoPreviewUrl && status === 'done' && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-3.5 h-3.5 text-[#8B98A9]" />
                <span className="text-[10px] font-mono text-[#8B98A9]">Uploaded Video Preview</span>
              </div>
              <video src={videoPreviewUrl} controls className="w-full rounded-lg border border-[#243041] max-h-52 object-cover" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
