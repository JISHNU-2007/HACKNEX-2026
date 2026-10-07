import React, { useRef, useEffect, useState, useCallback } from "react";
import { Thermometer, AlertTriangle, Eye, Cpu, Wifi, WifiOff } from "lucide-react";
import { api } from "../../services/api";
import type { Worker } from "../../types";

export interface ThermalPanelProps {
  workers: Worker[];
  onSelectWorker: (workerId: number) => void;
  selectedWorkerId: number | null;
}

const THERMAL_ZONES = [
  { id: 1, x: 0.10, y: 0.20, w: 0.13, h: 0.24, temp: 36.8, label: "W#1" },
  { id: 2, x: 0.35, y: 0.15, w: 0.12, h: 0.22, temp: 37.4, label: "W#2" },
  { id: 3, x: 0.58, y: 0.32, w: 0.14, h: 0.23, temp: 38.1, label: "W#3" },
  { id: 4, x: 0.74, y: 0.18, w: 0.11, h: 0.21, temp: 37.9, label: "W#4" },
  { id: 5, x: 0.25, y: 0.52, w: 0.13, h: 0.22, temp: 36.5, label: "W#5" },
];

function getTempColor(temp: number): string {
  if (temp >= 38.0) return "#FF2D00";
  if (temp >= 37.5) return "#FF8C00";
  if (temp >= 37.0) return "#FFD700";
  return "#00BFFF";
}

function getTempStatus(temp: number): string {
  if (temp >= 38.0) return "HIGH RISK";
  if (temp >= 37.5) return "WARNING";
  if (temp >= 37.0) return "ELEVATED";
  return "NORMAL";
}

export const ThermalPanel: React.FC<ThermalPanelProps> = ({
  workers,
  onSelectWorker,
  selectedWorkerId,
}) => {
  const videoRef  = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [thermalSrc, setThermalSrc] = useState<string | undefined>(undefined);
  const [isOnline,   setIsOnline]   = useState(false);
  const [tick,       setTick]       = useState(0);

  useEffect(() => {
    const url = api.getThermalVideoUrl();
    if (url) { setThermalSrc(url); setIsOnline(true); return; }
    const poll = setInterval(() => {
      const u = api.getThermalVideoUrl();
      if (u) { setThermalSrc(u); setIsOnline(true); clearInterval(poll); }
    }, 500);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    const t = Date.now() / 1000;

    THERMAL_ZONES.forEach((zone, i) => {
      const temp  = zone.temp + Math.sin(t * 0.8 + i) * 0.2;
      const color = getTempColor(temp);
      const x = zone.x * width;
      const y = zone.y * height;
      const w = zone.w * width;
      const h = zone.h * height;
      const pulse = (Math.sin(t * 2 + i * 1.2) + 1) / 2;
      const glowAlpha = 0.12 + pulse * 0.14;

      // Glow aura
      ctx.save();
      ctx.globalAlpha = glowAlpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, w * 0.75, h * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();

      // Dashed animated box
      ctx.save();
      ctx.setLineDash([6, 4]);
      ctx.lineDashOffset = -t * 8;
      ctx.lineWidth = selectedWorkerId === zone.id ? 2.5 : 1.8;
      ctx.strokeStyle = color;
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
      ctx.restore();

      // Corner ticks
      const tc = 10;
      ctx.lineWidth = 2;
      ctx.strokeStyle = color;
      ctx.beginPath(); ctx.moveTo(x, y + tc); ctx.lineTo(x, y); ctx.lineTo(x + tc, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + w - tc, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + tc); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y + h - tc); ctx.lineTo(x, y + h); ctx.lineTo(x + tc, y + h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + w - tc, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - tc); ctx.stroke();

      // Label pill
      const label = `${zone.label}  ${temp.toFixed(1)}\u00b0C`;
      ctx.font = "bold 10px monospace";
      const tw = ctx.measureText(label).width + 12;
      const pillY = y - 22;
      ctx.fillStyle = color;
      if (ctx.roundRect) {
        ctx.beginPath(); ctx.roundRect(x, pillY, tw, 18, 4); ctx.fill();
      } else {
        ctx.fillRect(x, pillY, tw, 18);
      }
      ctx.fillStyle = "#000";
      ctx.fillText(label, x + 6, pillY + 13);

      // Crosshair
      const cx = x + w / 2, cy = y + h / 2;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - 8, cy); ctx.lineTo(cx + 8, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - 8); ctx.lineTo(cx, cy + 8); ctx.stroke();

      // Selected fill
      if (selectedWorkerId === zone.id) {
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    });

    // Scanlines
    for (let sy = 0; sy < height; sy += 4) {
      ctx.fillStyle = "rgba(0,0,0,0.05)";
      ctx.fillRect(0, sy, width, 1);
    }

    // Moving scan line
    const scanY = ((t * 60) % height);
    ctx.fillStyle = "rgba(0,255,180,0.04)";
    ctx.fillRect(0, scanY - 20, width, 40);
  }, [tick, workers, selectedWorkerId]);

  useEffect(() => {
    const v = videoRef.current;
    if (v && thermalSrc) { v.play().catch(() => {}); }
  }, [thermalSrc]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect   = canvas.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) / rect.width;
      const clickY = (e.clientY - rect.top) / rect.height;
      const hit = THERMAL_ZONES.find(
        (z) => clickX >= z.x && clickX <= z.x + z.w && clickY >= z.y && clickY <= z.y + z.h
      );
      if (hit) onSelectWorker(hit.id);
    },
    [onSelectWorker]
  );

  const avgTemp = (THERMAL_ZONES.reduce((s, z) => s + z.temp, 0) / THERMAL_ZONES.length).toFixed(1);
  const hotWorkers = THERMAL_ZONES.filter((z) => z.temp >= 37.5);

  return (
    <div className="flex flex-col bg-[#0A0F1A] border border-[#1A2535] rounded-xl overflow-hidden h-full relative">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1A2535] bg-[#060A10]/80 z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_6px_#f97316]" />
          <Thermometer className="w-3.5 h-3.5 text-orange-400" />
          <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-[#E6EDF3]">
            Thermal IR &middot; Detection Feed
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="flex items-center gap-1 text-orange-300">
            <span className="w-1 h-1 rounded-full bg-orange-400 animate-pulse" />
            {THERMAL_ZONES.length} Workers
          </span>
          {hotWorkers.length > 0 && (
            <span className="flex items-center gap-1 text-red-400 font-bold animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              {hotWorkers.length} HIGH TEMP
            </span>
          )}
          {isOnline ? (
            <Wifi className="w-3.5 h-3.5 text-teal-400" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-[#8B98A9]" />
          )}
        </div>
      </div>

      {/* Video + Overlay stage */}
      <div className="relative flex-1 min-h-[300px] bg-black overflow-hidden">

        {/* Warm vignette overlay */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 30%, rgba(255,60,0,0.05) 100%)",
          }}
        />

        {thermalSrc ? (
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            src={thermalSrc}
            muted
            autoPlay
            loop
            playsInline
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-0">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 rounded-full border-2 border-orange-500/30 animate-ping" />
              <div
                className="absolute inset-4 rounded-full border-2 border-orange-400/40 animate-ping"
                style={{ animationDelay: "0.3s" }}
              />
              <div
                className="absolute inset-8 rounded-full border-2 border-red-400/50 animate-ping"
                style={{ animationDelay: "0.6s" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Thermometer className="w-10 h-10 text-orange-400/60" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold font-mono text-orange-400/80">
                Connecting to Thermal Feed&hellip;
              </p>
              <p className="text-[10px] text-[#8B98A9]/60 mt-1">
                Start the backend to load thermal_detection.mp4
              </p>
            </div>
          </div>
        )}

        {/* Canvas overlay */}
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          onClick={handleCanvasClick}
          className="absolute inset-0 w-full h-full z-10 cursor-crosshair"
        />

        {/* Camera badge */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-black/70 backdrop-blur border border-orange-500/30 rounded-lg px-2.5 py-1.5 text-[10px] font-mono">
          <Eye className="w-3 h-3 text-orange-400" />
          <span className="text-orange-300 font-bold">CAM-IR &middot; THERMAL</span>
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
        </div>

        {/* Temp stats HUD */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-1 bg-black/70 backdrop-blur border border-[#1A2535] rounded-lg p-2 text-[10px] font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[#8B98A9]">AVG TEMP</span>
            <span className="text-orange-300 font-bold">{avgTemp}&deg;C</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#8B98A9]">ALERTS</span>
            <span className={`font-bold ${hotWorkers.length > 0 ? "text-red-400 animate-pulse" : "text-emerald-400"}`}>
              {hotWorkers.length > 0 ? `${hotWorkers.length} HIGH TEMP` : "NOMINAL"}
            </span>
          </div>
        </div>

        {/* Model badge */}
        <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 bg-black/80 backdrop-blur border border-orange-500/30 rounded-full px-2.5 py-1">
          <Cpu className="w-3 h-3 text-orange-400" />
          <span className="text-[10px] font-mono text-orange-400 font-bold">THERMAL IR &middot; YOLOv8</span>
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
        </div>

        {/* Temp legend */}
        <div className="absolute bottom-3 left-3 z-20 bg-black/80 backdrop-blur border border-[#1A2535] rounded-lg px-3 py-2">
          <p className="text-[9px] font-mono text-[#8B98A9] mb-1.5 uppercase tracking-wider">Temp Scale</p>
          <div className="flex flex-col gap-0.5 text-[9px] font-mono">
            {[
              { color: "#FF2D00", label: ">= 38.0\u00b0C  HIGH RISK" },
              { color: "#FF8C00", label: ">= 37.5\u00b0C  WARNING" },
              { color: "#FFD700", label: ">= 37.0\u00b0C  ELEVATED" },
              { color: "#00BFFF", label: "< 37.0\u00b0C   NORMAL" },
            ].map(({ color, label }) => (
              <div key={color} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
                <span style={{ color }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Worker heat list */}
      <div className="border-t border-[#1A2535] bg-[#060A10]/60 px-3 py-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {THERMAL_ZONES.map((zone, i) => {
            const color = getTempColor(zone.temp);
            const status = getTempStatus(zone.temp);
            return (
              <button
                key={zone.id}
                onClick={() => onSelectWorker(zone.id)}
                className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg border text-[9px] font-mono transition-all hover:scale-105 ${
                  selectedWorkerId === zone.id
                    ? "bg-[#1A2535] border-orange-500/60"
                    : "bg-[#0D1420] border-[#1A2535] hover:border-orange-500/30"
                }`}
                style={{ minWidth: "64px" }}
              >
                <span className="text-[#E6EDF3] font-bold">{zone.label}</span>
                <span style={{ color }} className="font-bold">
                  {zone.temp.toFixed(1)}&deg;C
                </span>
                <span style={{ color }} className="opacity-80">
                  {status}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
