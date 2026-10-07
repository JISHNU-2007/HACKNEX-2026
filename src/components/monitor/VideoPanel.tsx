import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Cpu, AlertTriangle } from 'lucide-react';
import type { Zone, Worker } from '../../types';
import { useVideoSync } from '../../hooks/useVideoSync';
import { formatVideoTime } from '../../lib/format';
import { getSeverityColor } from '../../lib/severity';
import { Switch } from '../ui/Switch';
import { api } from '../../services/api';

export interface VideoPanelProps {
  zones: Zone[];
  workers: Worker[];
  onSelectWorker: (workerId: number) => void;
  selectedWorkerId: number | null;
}

export const VideoPanel: React.FC<VideoPanelProps> = ({
  zones,
  workers,
  onSelectWorker,
  selectedWorkerId,
}) => {
  const videoRef  = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { currentTime, duration, isPlaying, currentTracks, togglePlay, seek, setPlaybackSpeed } =
    useVideoSync(videoRef);

  const [showBoxes,  setShowBoxes]  = useState(false);
  const [showIDs,    setShowIDs]    = useState(false);
  const [showTrails, setShowTrails] = useState(false);
  const [showZones,  setShowZones]  = useState(true);
  const [speed,      setSpeed]      = useState(1);

  // Get actual uploaded video URL
  const uploadedUrl = api.getUploadedVideoUrl();
  const uploadedVideoId = api.getUploadedVideoId();
  const [videoSrc, setVideoSrc] = useState<string | undefined>(uploadedUrl ?? undefined);
  const [isAnnotated, setIsAnnotated] = useState(false);

  // Poll until default or uploaded video URL is available (handles async startup fetch)
  useEffect(() => {
    if (videoSrc) return; // already have a source
    const poll = setInterval(() => {
      const url = api.getUploadedVideoUrl();
      if (url) { setVideoSrc(url); clearInterval(poll); }
    }, 500);
    return () => clearInterval(poll);
  }, [videoSrc]);

  useEffect(() => {
    if (!uploadedVideoId || uploadedVideoId === 'default_demo') return;
    const interval = setInterval(async () => {
      const status = await api.getVideoStatus(uploadedVideoId);
      if (status && status.annotated_url) {
        setVideoSrc(status.annotated_url);
        setIsAnnotated(true);
        clearInterval(interval);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [uploadedVideoId]);

  // ── Canvas overlay drawing ───────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // 1. Safety Zones
    if (showZones) {
      zones.forEach((z) => {
        const x = z.coordinates.x * width;
        const y = z.coordinates.y * height;
        const w = z.coordinates.w * width;
        const h = z.coordinates.h * height;
        ctx.lineWidth = 2;
        const palette: Record<string, [string, string]> = {
          restricted: ['#EF4444', 'rgba(239,68,68,0.12)'],
          danger:     ['#F97316', 'rgba(249,115,22,0.12)'],
          machine:    ['#F59E0B', 'rgba(245,158,11,0.1)'],
        };
        const [stroke, fill] = palette[z.zone_type] ?? ['#14B8A6', 'rgba(20,184,166,0.08)'];
        ctx.strokeStyle = stroke;
        ctx.fillStyle   = fill;
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = stroke;
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText(z.zone_name.toUpperCase(), x + 6, y + 16);
      });
    }

    // 2. Trajectory trails
    if (showTrails) {
      currentTracks.forEach((track) => {
        const wi     = workers.find(w => w.worker_id === track.worker_id);
        const status = wi?.status ?? 'safe';
        const color  = status === 'high_risk' ? '#EF4444' : status === 'warning' ? '#F59E0B' : '#22C55E';
        const cx     = (track.x + track.w / 2) * width;
        const cy     = (track.y + track.h) * height;
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      });
    }

    // 3. Bounding boxes + labels
    if (showBoxes && !isAnnotated) {
      currentTracks.forEach((track) => {
        const x  = track.x * width;
        const y  = track.y * height;
        const w  = track.w * width;
        const h  = track.h * height;
        const wi = workers.find(wr => wr.worker_id === track.worker_id);
        const st = wi?.status ?? 'safe';
        const color = st === 'high_risk' ? '#EF4444' : st === 'warning' ? '#F59E0B' : '#22C55E';
        const sel   = selectedWorkerId === track.worker_id;

        ctx.lineWidth   = sel ? 3 : 2;
        ctx.strokeStyle = color;
        ctx.strokeRect(x, y, w, h);
        if (sel || st === 'high_risk') {
          ctx.fillStyle = st === 'high_risk' ? 'rgba(239,68,68,0.15)' : 'rgba(20,184,166,0.15)';
          ctx.fillRect(x, y, w, h);
        }

        if (showIDs) {
          const lbl = `Worker #${track.worker_id} · ${st === 'high_risk' ? 'HIGH RISK' : st === 'warning' ? 'WARNING' : 'SAFE'}`;
          ctx.font = 'bold 10px JetBrains Mono, monospace';
          const tw  = ctx.measureText(lbl).width;
          const cy  = y - 24;
          ctx.fillStyle = color;
          ctx.fillRect(x, cy, tw + 16, 20);
          ctx.fillStyle = '#0B0F14';
          ctx.fillText(lbl, x + 6, cy + 14);
        }
      });
    }
  }, [currentTracks, showBoxes, showIDs, showTrails, showZones, workers, selectedWorkerId, zones, isAnnotated]);

  // ── Canvas click to select worker ────────────────────────────────────────
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect   = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top)  / rect.height;
    const hit    = currentTracks.find(t =>
      clickX >= t.x && clickX <= t.x + t.w &&
      clickY >= t.y && clickY <= t.y + t.h
    );
    if (hit) onSelectWorker(hit.worker_id);
  };

  const handleSpeedChange = (s: number) => { setSpeed(s); setPlaybackSpeed(s); };

  // ── Worker HUD panels (show real YOLO results) ───────────────────────────
  const criticalWorkers = workers.filter(w => w.status === 'high_risk');

  return (
    <div className="flex flex-col bg-[#121821] border border-[#243041] rounded-xl overflow-hidden h-full">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#243041] bg-[#0B0F14]/60">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-[#E6EDF3]">
            YOLOv8 · best.pt · Live Detection Feed
          </h3>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <Switch checked={showZones}  onChange={setShowZones}  label="Zones"  />
        </div>
      </div>

      {/* Video + Canvas stage */}
      <div className="relative flex-1 bg-black min-h-[340px] flex items-center justify-center overflow-hidden">
        {/* background grid */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b131e] via-[#111927] to-[#080d14] pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,rgba(36,48,65,0.15) 0px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,rgba(36,48,65,0.15) 0px,transparent 1px,transparent 40px)' }}
        />

        {/* Actual uploaded video */}
        {videoSrc ? (
          <video
            ref={videoRef}
            className="w-full h-full object-contain relative z-0"
            src={videoSrc}
            muted
            autoPlay
            loop
            playsInline
            crossOrigin="anonymous"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-0">
            <Cpu className="w-12 h-12 text-teal-500/40 animate-pulse" />
            <div className="text-center">
              <p className="text-sm font-bold font-mono text-[#8B98A9]">No Video Loaded</p>
              <p className="text-xs text-[#8B98A9]/60 mt-1">Go to Configure → upload a construction video to analyze</p>
            </div>
          </div>
        )}

        {/* Canvas overlay */}
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          onClick={handleCanvasClick}
          className="absolute inset-0 w-full h-full z-10 cursor-pointer"
        />

        {/* Critical worker HUD */}
        {criticalWorkers.length > 0 && (
          <div className="absolute top-3 left-3 z-20 space-y-1.5">
            {criticalWorkers.slice(0, 3).map(w => (
              <div
                key={w.worker_id}
                className="flex items-center gap-2 bg-red-900/80 backdrop-blur-md border border-red-500/50 rounded-lg px-3 py-1.5 text-xs font-mono cursor-pointer hover:bg-red-800/80 transition-colors"
                onClick={() => onSelectWorker(w.worker_id)}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                <span className="text-red-200 font-bold">Worker #{w.worker_id}</span>
                <span className="text-red-400">HIGH RISK · {w.risk_score}/100</span>
              </div>
            ))}
          </div>
        )}

        {/* Selected worker HUD */}
        {selectedWorkerId && (
          <div className="absolute top-3 right-3 z-20 bg-[#0B0F14]/90 backdrop-blur-md border border-[#243041] rounded-lg p-2.5 text-xs font-mono">
            <p className="text-teal-400 font-bold">Worker #{selectedWorkerId} selected</p>
            <p className="text-[#8B98A9]">Click a box or roster row to open drawer</p>
          </div>
        )}

        {/* YOLO model badge */}
        <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 bg-[#0B0F14]/80 backdrop-blur border border-teal-500/30 rounded-full px-2.5 py-1">
          <Cpu className="w-3 h-3 text-teal-400" />
          <span className="text-[10px] font-mono text-teal-400 font-bold">YOLOv8 · best.pt</span>
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
        </div>
      </div>

      {/* Video controls */}
      {videoSrc && (
        <div className="p-3 bg-[#0B0F14] border-t border-[#243041] flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#8B98A9] min-w-[55px]">{formatVideoTime(currentTime)}</span>
            <input
              type="range" min={0} max={duration || 120} step={0.1} value={currentTime}
              onChange={e => seek(Number(e.target.value))}
              className="flex-1 h-1.5 bg-[#243041] rounded-lg appearance-none cursor-pointer accent-teal-500"
            />
            <span className="text-xs font-mono text-[#8B98A9] min-w-[55px]">{formatVideoTime(duration || 120)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="p-2 rounded-lg bg-[#18202B] border border-[#243041] text-[#E6EDF3] hover:bg-[#243041] transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4 text-teal-400" /> : <Play className="w-4 h-4 text-teal-400 fill-teal-400" />}
              </button>
              <button onClick={() => seek(0)} className="p-2 rounded-lg bg-[#18202B] border border-[#243041] text-[#8B98A9] hover:text-[#E6EDF3] transition-colors">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-1 bg-[#18202B] p-1 rounded-lg border border-[#243041] text-xs font-mono">
              {[0.5, 1, 1.5, 2].map(s => (
                <button
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={`px-2 py-0.5 rounded ${speed === s ? 'bg-teal-500 text-white font-bold' : 'text-[#8B98A9] hover:text-[#E6EDF3]'}`}
                >{s}x</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
