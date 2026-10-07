import React from 'react';
import { Sliders, ShieldCheck, AlertCircle, AlertTriangle } from 'lucide-react';
import { Input } from '../ui/Input';

export interface AlertThresholdsStepProps {
  thresholds: {
    low: [number, number];
    medium: [number, number];
    high: [number, number];
    critical: [number, number];
  };
  onChangeThresholds: (thresholds: any) => void;
}

export const AlertThresholdsStep: React.FC<AlertThresholdsStepProps> = ({
  thresholds,
  onChangeThresholds,
}) => {
  return (
    <div className="bg-[#121821] border border-[#243041] rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-[#E6EDF3] tracking-tight flex items-center gap-2">
            <Sliders className="w-4 h-4 text-teal-400" />
            Alert Severity Score Bands Configuration
          </h4>
          <p className="text-xs text-[#8B98A9] mt-0.5">
            Configure risk score boundaries (0 to 100) for safety alert triggers
          </p>
        </div>
      </div>

      {/* Visual Colored Score Band Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-[#8B98A9]">
          <span>0 (Min Risk)</span>
          <span>100 (Max Risk)</span>
        </div>
        <div className="h-6 w-full rounded-lg overflow-hidden flex border border-[#243041]">
          <div
            style={{ width: `${thresholds.low[1]}%` }}
            className="bg-emerald-500/80 flex items-center justify-center text-[10px] font-mono font-bold text-black"
          >
            SAFE (0-{thresholds.low[1]})
          </div>
          <div
            style={{ width: `${thresholds.medium[1] - thresholds.low[1]}%` }}
            className="bg-amber-500/80 flex items-center justify-center text-[10px] font-mono font-bold text-black"
          >
            WARN ({thresholds.medium[0]}-{thresholds.medium[1]})
          </div>
          <div
            style={{ width: `${thresholds.high[1] - thresholds.medium[1]}%` }}
            className="bg-orange-500/80 flex items-center justify-center text-[10px] font-mono font-bold text-white"
          >
            HIGH ({thresholds.high[0]}-{thresholds.high[1]})
          </div>
          <div
            style={{ width: `${100 - thresholds.high[1]}%` }}
            className="bg-red-500/80 flex items-center justify-center text-[10px] font-mono font-bold text-white"
          >
            CRITICAL ({thresholds.critical[0]}-100)
          </div>
        </div>
      </div>

      {/* Editable Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Low / Safe Band */}
        <div className="p-4 bg-[#0B0F14] border border-emerald-500/30 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono text-xs">
            <ShieldCheck className="w-4 h-4" /> SAFE / LOW
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#8B98A9]">Max Score:</span>
            <Input
              type="number"
              min={10}
              max={40}
              value={thresholds.low[1]}
              onChange={(e) => {
                const max = Number(e.target.value);
                onChangeThresholds({
                  ...thresholds,
                  low: [0, max],
                  medium: [max + 1, thresholds.medium[1]],
                });
              }}
            />
          </div>
        </div>

        {/* Medium / Warning Band */}
        <div className="p-4 bg-[#0B0F14] border border-amber-500/30 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold font-mono text-xs">
            <AlertCircle className="w-4 h-4" /> MEDIUM / WARNING
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#8B98A9]">Max Score:</span>
            <Input
              type="number"
              min={41}
              max={70}
              value={thresholds.medium[1]}
              onChange={(e) => {
                const max = Number(e.target.value);
                onChangeThresholds({
                  ...thresholds,
                  medium: [thresholds.medium[0], max],
                  high: [max + 1, thresholds.high[1]],
                });
              }}
            />
          </div>
        </div>

        {/* High Band */}
        <div className="p-4 bg-[#0B0F14] border border-orange-500/30 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-orange-400 font-bold font-mono text-xs">
            <AlertTriangle className="w-4 h-4" /> HIGH RISK
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#8B98A9]">Max Score:</span>
            <Input
              type="number"
              min={71}
              max={90}
              value={thresholds.high[1]}
              onChange={(e) => {
                const max = Number(e.target.value);
                onChangeThresholds({
                  ...thresholds,
                  high: [thresholds.high[0], max],
                  critical: [max + 1, 100],
                });
              }}
            />
          </div>
        </div>

        {/* Critical Band */}
        <div className="p-4 bg-[#0B0F14] border border-red-500/30 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-red-400 font-bold font-mono text-xs">
            <AlertTriangle className="w-4 h-4 animate-pulse" /> CRITICAL
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#8B98A9]">Range:</span>
            <span className="text-red-400 font-bold">
              {thresholds.critical[0]} - 100
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
