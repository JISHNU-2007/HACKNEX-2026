import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, HardHat, ShieldCheck, Check, X } from 'lucide-react';
import type { TrajectoryPoint, Zone, Worker } from '../../types';
import { useVideoSync } from '../../hooks/useVideoSync';
import { formatVideoTime } from '../../lib/format';
import { getSeverityColor } from '../../lib/severity';
import { Switch } from '../ui/Switch';

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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { currentTime, duration, isPlaying, currentTracks, togglePlay, seek, setPlaybackSpeed } =
    useVideoSync(videoRef);

  // Overlay toggle switches
  const [showBoxes, setShowBoxes] = useState(true);
  const [showIDs, setShowIDs] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [speed, setSpeed] = useState(1);

  // Render canvas overlay on top of video
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear previous frame
    ctx.clearRect(0, 0, width, height);

    // 1. Draw Zones if enabled
    if (showZones) {
      zones.forEach((z) => {
        const x = z.coordinates.x * width;
        const y = z.coordinates.y * height;
        const w = z.coordinates.w * width;
        const h = z.coordinates.h * height;

        ctx.lineWidth = 2;
        if (z.zone_type === 'restricted') {
          ctx.strokeStyle = '#EF4444';
          ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
        } else if (z.zone_type === 'danger') {
          ctx.strokeStyle = '#F97316';
          ctx.fillStyle = 'rgba(249, 115, 22, 0.12)';
        } else if (z.zone_type === 'machine') {
          ctx.strokeStyle = '#F59E0B';
          ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
        } else {
          ctx.strokeStyle = '#14B8A6';
          ctx.fillStyle = 'rgba(20, 184, 166, 0.08)';
        }

        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);

        // Zone Name Label
        ctx.fillStyle = ctx.strokeStyle;
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText(z.zone_name.toUpperCase(), x + 6, y + 16);
      });
    }

    // 2. Draw Trajectory Trails if enabled
    if (showTrails) {
      // Group tracks by worker
      currentTracks.forEach((track) => {
        const workerInfo = workers.find((w) => w.worker_id === track.worker_id);
        const color = workerInfo
          ? getSeverityColor(
              workerInfo.status === 'high_risk'
                ? 'critical'
                : workerInfo.status === 'warning'
                ? 'medium'
                : 'low'
            )
          : '#14B8A6';

        // Draw simple trajectory tail
        const centerX = (track.x + track.w / 2) * width;
        const centerY = (track.y + track.h) * height;

        ctx.beginPath();
        ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      });
    }

    // 3. Draw Bounding Boxes and IDs
    currentTracks.forEach((track) => {
      const x = track.x * width;
      const y = track.y * height;
      const w = track.w * width;
      const h = track.h * height;

      const workerInfo = workers.find((w) => w.worker_id === track.worker_id);
      const status = workerInfo?.status || 'safe';

      const color =
        status === 'high_risk'
          ? '#EF4444'
          : status === 'warning'
          ? '#F59E0B'
          : '#22C55E';

      const isSelected = selectedWorkerId === track.worker_id;

      if (showBoxes) {
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.strokeStyle = color;
        ctx.strokeRect(x, y, w, h);

        // Semi-transparent box glow if selected or high risk
        if (isSelected || status === 'high_risk') {
          ctx.fillStyle = status === 'high_risk' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(20, 184, 166, 0.15)';
          ctx.fillRect(x, y, w, h);
        }
      }

      if (showIDs) {
        // Label Chip Above Box
        const labelText = `Worker #${track.worker_id} · ${status === 'high_risk' ? 'HIGH RISK' : status === 'warning' ? 'WARNING' : 'SAFE'}`;
        ctx.font = 'bold 10px JetBrains Mono, monospace';
        const textWidth = ctx.measureText(labelText).width;

        const chipHeight = 20;
        const chipWidth = textWidth + 16;
        const chipX = x;
        const chipY = y - chipHeight - 4;

        ctx.fillStyle = color;
        ctx.fillRect(chipX, chipY, chipWidth, chipHeight);

        ctx.fillStyle = '#0B0F14';
        ctx.fillText(labelText, chipX + 6, chipY + 14);
      }
    });
  }, [currentTracks, showBoxes, showIDs, showTrails, showZones, workers, selectedWorkerId, zones]);

  // Handle clicking on canvas to select a worker
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    // Find clicked worker box
    const clickedTrack = currentTracks.find(
      (t) => clickX >= t.x && clickX <= t.x + t.w && clickY >= t.y && clickY <= t.y + t.h
    );

    if (clickedTrack) {
      onSelectWorker(clickedTrack.worker_id);
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    setPlaybackSpeed(newSpeed);
  };

  return (
    <div className="flex flex-col bg-[#121821] border border-[#243041] rounded-xl overflow-hidden h-full">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#243041] bg-[#0B0F14]/60">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-[#E6EDF3]">
            Live AI Vision Feed &amp; Overlays
          </h3>
        </div>

        {/* Display Toggles */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <Switch checked={showBoxes} onChange={setShowBoxes} label="Boxes" />
          <Switch checked={showIDs} onChange={setShowIDs} label="IDs" />
          <Switch checked={showTrails} onChange={setShowTrails} label="Trails" />
          <Switch checked={showZones} onChange={setShowZones} label="Zones" />
        </div>
      </div>

      {/* Video + Canvas Stage */}
      <div className="relative flex-1 bg-black min-h-[340px] flex items-center justify-center overflow-hidden">
        {/* Synthetic Factory Video Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b131e] via-[#111927] to-[#080d14] flex items-center justify-center opacity-90 pointer-events-none">
          {/* Subtle grid lines matching factory camera */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                'linear-[#243041] 1px, transparent 1px), linear-gradient(90deg, #243041 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        {/* Real HTML5 Video element */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover relative z-0"
          src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
          muted
          loop
          playsInline
        />

        {/* Canvas Overlay synced with video */}
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          onClick={handleCanvasClick}
          className="absolute inset-0 w-full h-full z-10 cursor-pointer"
        />

        {/* Top-Right Active Worker HUD overlay overlaying video */}
        {selectedWorkerId && (
          <div className="absolute top-3 right-3 z-20 bg-[#0B0F14]/90 backdrop-blur-md border border-[#243041] rounded-lg p-2.5 text-xs font-mono space-y-1">
            <p className="text-teal-400 font-bold">Selected Worker #{selectedWorkerId}</p>
            <p className="text-[#8B98A9]">Click canvas box to open worker drawer</p>
          </div>
        )}
      </div>

      {/* Video Control Bar */}
      <div className="p-3 bg-[#0B0F14] border-t border-[#243041] flex flex-col gap-2">
        {/* Time Slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[#8B98A9] min-w-[55px]">
            {formatVideoTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 120}
            step={0.1}
            value={currentTime}
            onChange={(e) => seek(Number(e.target.value))}
            className="flex-1 h-1.5 bg-[#243041] rounded-lg appearance-none cursor-pointer accent-teal-500"
          />
          <span className="text-xs font-mono text-[#8B98A9] min-w-[55px]">
            {formatVideoTime(duration || 120)}
          </span>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-2 rounded-lg bg-[#18202B] border border-[#243041] text-[#E6EDF3] hover:bg-[#243041] transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4 text-teal-400" /> : <Play className="w-4 h-4 text-teal-400 fill-teal-400" />}
            </button>
            <button
              onClick={() => seek(0)}
              className="p-2 rounded-lg bg-[#18202B] border border-[#243041] text-[#8B98A9] hover:text-[#E6EDF3] transition-colors"
              title="Reset Video"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Speed selector */}
          <div className="flex items-center gap-1 bg-[#18202B] p-1 rounded-lg border border-[#243041] text-xs font-mono">
            {[0.5, 1, 1.5, 2].map((s) => (
              <button
                key={s}
                onClick={() => handleSpeedChange(s)}
                className={`px-2 py-0.5 rounded ${
                  speed === s
                    ? 'bg-teal-500 text-white font-bold'
                    : 'text-[#8B98A9] hover:text-[#E6EDF3]'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
