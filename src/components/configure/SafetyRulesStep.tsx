import React from 'react';
import { Switch } from '../ui/Switch';
import { Slider } from '../ui/Slider';
import { Input } from '../ui/Input';
import { HardHat, ShieldCheck, Lock, Clock, Users, Flame, Zap } from 'lucide-react';

export interface SafetyRulesStepProps {
  rules: {
    helmet: boolean;
    vest: boolean;
    restricted: boolean;
    max_idle_sec: number;
    crowd_limit: number;
  };
  onChangeRules: (rules: any) => void;
}

export const SafetyRulesStep: React.FC<SafetyRulesStepProps> = ({
  rules,
  onChangeRules,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Active Rules Card */}
      <div className="bg-[#121821] border border-[#243041] rounded-xl p-5 space-y-5">
        <h4 className="text-xs font-bold font-mono tracking-wider uppercase text-teal-400">
          Core Safety Rule Enforcement
        </h4>

        {/* Toggles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-[#0B0F14] border border-[#243041] rounded-lg">
            <div className="flex items-center gap-3">
              <HardHat className="w-5 h-5 text-teal-400" />
              <div>
                <span className="text-xs font-bold text-[#E6EDF3] block">Mandatory Safety Helmet</span>
                <span className="text-[11px] text-[#8B98A9]">Flag workers operating without head protection</span>
              </div>
            </div>
            <Switch
              checked={rules.helmet}
              onChange={(c) => onChangeRules({ ...rules, helmet: c })}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-[#0B0F14] border border-[#243041] rounded-lg">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
              <div>
                <span className="text-xs font-bold text-[#E6EDF3] block">Mandatory High-Vis Vest</span>
                <span className="text-[11px] text-[#8B98A9]">Enforce high-reflectivity vest compliance</span>
              </div>
            </div>
            <Switch
              checked={rules.vest}
              onChange={(c) => onChangeRules({ ...rules, vest: c })}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-[#0B0F14] border border-[#243041] rounded-lg">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-[#F97316]" />
              <div>
                <span className="text-xs font-bold text-[#E6EDF3] block">Restricted Zone Enforcement</span>
                <span className="text-[11px] text-[#8B98A9]">Trigger alerts on unauthorized perimeter entry</span>
              </div>
            </div>
            <Switch
              checked={rules.restricted}
              onChange={(c) => onChangeRules({ ...rules, restricted: c })}
            />
          </div>
        </div>

        {/* Sliders & Numerical Controls */}
        <div className="space-y-4 pt-2 border-t border-[#243041]">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#E6EDF3] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-400" /> Max Idle / Loitering Threshold
              </span>
              <span className="text-xs font-mono text-amber-400 font-bold">
                {rules.max_idle_sec} Seconds
              </span>
            </div>
            <Slider
              min={15}
              max={180}
              step={5}
              value={rules.max_idle_sec}
              onChange={(v) => onChangeRules({ ...rules, max_idle_sec: v })}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#E6EDF3] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-teal-400" /> Crowd Capacity Limit
              </span>
              <span className="text-xs font-mono text-teal-400 font-bold">
                {rules.crowd_limit} Workers Max
              </span>
            </div>
            <Input
              type="number"
              min={1}
              max={20}
              value={rules.crowd_limit}
              onChange={(e) => onChangeRules({ ...rules, crowd_limit: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      {/* Advanced Rules (Coming Soon) */}
      <div className="bg-[#121821] border border-[#243041] rounded-xl p-5 space-y-4 opacity-75">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold font-mono tracking-wider uppercase text-[#8B98A9]">
            Advanced Behavioural Analytics
          </h4>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono border border-slate-700">
            COMING SOON
          </span>
        </div>

        <div className="space-y-3 font-mono text-xs text-[#8B98A9]">
          <div className="p-3 bg-[#0B0F14]/60 border border-[#243041] rounded-lg flex items-center justify-between opacity-50">
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Worker Slips &amp; Falls Detection
            </span>
            <Switch checked={false} onChange={() => {}} disabled label="Disabled" />
          </div>

          <div className="p-3 bg-[#0B0F14]/60 border border-[#243041] rounded-lg flex items-center justify-between opacity-50">
            <span className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-400" /> Rapid Running / Panic Motion
            </span>
            <Switch checked={false} onChange={() => {}} disabled label="Disabled" />
          </div>

          <div className="p-3 bg-[#0B0F14]/60 border border-[#243041] rounded-lg flex items-center justify-between opacity-50">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-400" /> Crowd Anomaly Gathering
            </span>
            <Switch checked={false} onChange={() => {}} disabled label="Disabled" />
          </div>
        </div>
      </div>
    </div>
  );
};
