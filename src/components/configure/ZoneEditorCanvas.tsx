import React, { useRef, useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, ShieldAlert, AlertTriangle, Layers } from 'lucide-react';
import type { Zone, ZoneType } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Switch } from '../ui/Switch';

export interface ZoneEditorCanvasProps {
  zones: Zone[];
  onChangeZones: (zones: Zone[]) => void;
  videoPreviewUrl?: string | null;
}

export const ZoneEditorCanvas: React.FC<ZoneEditorCanvasProps> = ({
  zones,
  onChangeZones,
  videoPreviewUrl,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(zones[0]?.zone_id || null);

  // New zone editing form state
  const [editingZone, setEditingZone] = useState<Zone | null>(null);

  // Redraw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw background image pattern or video frame placeholder
    ctx.fillStyle = '#0B0F14';
    ctx.fillRect(0, 0, width, height);

    // Factory background grid aesthetic
    ctx.strokeStyle = '#243041';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw existing zones
    zones.forEach((z) => {
      const zx = z.coordinates.x * width;
      const zy = z.coordinates.y * height;
      const zw = z.coordinates.w * width;
      const zh = z.coordinates.h * height;

      const isSelected = selectedZoneId === z.zone_id;

      let color = '#14B8A6';
      if (z.zone_type === 'restricted') color = '#EF4444';
      if (z.zone_type === 'danger') color = '#F97316';
      if (z.zone_type === 'machine') color = '#F59E0B';

      ctx.fillStyle = `${color}20`; // 20 opacity hex
      ctx.strokeStyle = color;
      ctx.lineWidth = isSelected ? 3 : 2;

      ctx.fillRect(zx, zy, zw, zh);
      ctx.strokeRect(zx, zy, zw, zh);

      // Label
      ctx.fillStyle = color;
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(z.zone_name, zx + 8, zy + 20);
    });

    // Draw current active drawing rectangle
    if (currentRect) {
      const rx = currentRect.x * width;
      const ry = currentRect.y * height;
      const rw = currentRect.w * width;
      const rh = currentRect.h * height;

      ctx.strokeStyle = '#14B8A6';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(rx, ry, rw, rh);
      ctx.setLineDash([]);
    }
  }, [zones, currentRect, selectedZoneId]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setIsDrawing(true);
    setStartPoint({ x, y });
    setCurrentRect({ x, y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const currentX = (e.clientX - rect.left) / rect.width;
    const currentY = (e.clientY - rect.top) / rect.height;

    const x = Math.min(startPoint.x, currentX);
    const y = Math.min(startPoint.y, currentY);
    const w = Math.abs(currentX - startPoint.x);
    const h = Math.abs(currentY - startPoint.y);

    setCurrentRect({ x, y, w, h });
  };

  const handleMouseUp = () => {
    if (isDrawing && currentRect && currentRect.w > 0.05 && currentRect.h > 0.05) {
      const newZoneId = `zone_${Date.now()}`;
      const newZone: Zone = {
        zone_id: newZoneId,
        zone_name: `New Safety Zone ${zones.length + 1}`,
        zone_type: 'restricted',
        coordinates: { ...currentRect },
        ppe_required: { helmet: true, vest: true },
        duration_threshold: 60,
      };

      onChangeZones([...zones, newZone]);
      setSelectedZoneId(newZoneId);
      setEditingZone(newZone);
    }
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentRect(null);
  };

  const handleUpdateZone = (updated: Zone) => {
    onChangeZones(zones.map((z) => (z.zone_id === updated.zone_id ? updated : z)));
    setEditingZone(null);
  };

  const handleDeleteZone = (zoneId: string) => {
    onChangeZones(zones.filter((z) => z.zone_id !== zoneId));
    if (selectedZoneId === zoneId) setSelectedZoneId(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Canvas Area */}
      <div className="lg:col-span-2 flex flex-col bg-[#121821] border border-[#243041] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#243041] bg-[#0B0F14]/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-400" />
            <h4 className="text-xs font-bold font-mono tracking-wider uppercase text-[#E6EDF3]">
              Safety Zone Editor (Click &amp; Drag Rectangle)
            </h4>
          </div>
          <span className="text-xs font-mono text-[#8B98A9]">
            Coordinates: Normalised (0-1)
          </span>
        </div>

        <div className="relative flex-1 bg-black min-h-[360px] flex items-center justify-center p-2 select-none">
          <canvas
            ref={canvasRef}
            width={800}
            height={450}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="w-full h-full object-contain cursor-crosshair rounded-lg border border-[#243041]"
          />
        </div>

        <div className="p-3 bg-[#0B0F14] border-t border-[#243041] text-xs font-mono text-[#8B98A9] flex items-center justify-between">
          <span>Click and drag on canvas to draw a new safety zone</span>
          <span>{zones.length} Zones Defined</span>
        </div>
      </div>

      {/* Zone Side List & Editor Panel */}
      <div className="flex flex-col bg-[#121821] border border-[#243041] rounded-xl p-4 space-y-4">
        <h4 className="text-xs font-bold font-mono tracking-wider uppercase text-[#E6EDF3]">
          Configured Zones List
        </h4>

        {/* Zone List */}
        <div className="space-y-2 flex-1 overflow-y-auto max-h-[320px]">
          {zones.map((zone) => {
            const isSelected = selectedZoneId === zone.zone_id;
            return (
              <div
                key={zone.zone_id}
                onClick={() => setSelectedZoneId(zone.zone_id)}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#18202B] border-teal-500'
                    : 'bg-[#0B0F14] border-[#243041] hover:border-[#3a4b63]'
                }`}
              >
                <div>
                  <h5 className="text-xs font-bold text-[#E6EDF3]">{zone.zone_name}</h5>
                  <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-[#8B98A9]">
                    <span className="capitalize">{zone.zone_type}</span>
                    <span>· Threshold: {zone.duration_threshold}s</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingZone(zone);
                    }}
                    className="p-1 text-[#8B98A9] hover:text-teal-400 rounded"
                    title="Edit Zone"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteZone(zone.zone_id);
                    }}
                    className="p-1 text-[#8B98A9] hover:text-red-400 rounded"
                    title="Delete Zone"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Edit Selected Zone Inline Form */}
        {editingZone && (
          <div className="bg-[#0B0F14] border border-teal-500/40 p-3 rounded-xl space-y-3 animate-fade-in text-xs">
            <h5 className="font-bold text-teal-400 uppercase font-mono">Edit Zone Settings</h5>
            <div>
              <label className="text-[#8B98A9] block mb-1">Zone Name</label>
              <Input
                value={editingZone.zone_name}
                onChange={(e) => setEditingZone({ ...editingZone, zone_name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-[#8B98A9] block mb-1">Zone Type</label>
              <Select
                value={editingZone.zone_type}
                options={[
                  { value: 'general', label: 'General Area' },
                  { value: 'restricted', label: 'Restricted Zone' },
                  { value: 'danger', label: 'High Danger Zone' },
                  { value: 'machine', label: 'Machine Area' },
                  { value: 'ppe_required', label: 'PPE Required' },
                ]}
                onChange={(e) =>
                  setEditingZone({ ...editingZone, zone_type: e.target.value as ZoneType })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Switch
                checked={editingZone.ppe_required.helmet}
                onChange={(c) =>
                  setEditingZone({
                    ...editingZone,
                    ppe_required: { ...editingZone.ppe_required, helmet: c },
                  })
                }
                label="Helmet Required"
              />
              <Switch
                checked={editingZone.ppe_required.vest}
                onChange={(c) =>
                  setEditingZone({
                    ...editingZone,
                    ppe_required: { ...editingZone.ppe_required, vest: c },
                  })
                }
                label="Vest Required"
              />
            </div>

            <div>
              <label className="text-[#8B98A9] block mb-1">
                Duration Threshold: {editingZone.duration_threshold}s
              </label>
              <input
                type="range"
                min={10}
                max={300}
                step={5}
                value={editingZone.duration_threshold}
                onChange={(e) =>
                  setEditingZone({ ...editingZone, duration_threshold: Number(e.target.value) })
                }
                className="w-full h-1.5 bg-[#243041] rounded appearance-none accent-teal-500"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="primary" className="w-full" onClick={() => handleUpdateZone(editingZone)}>
                Save Zone Changes
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
