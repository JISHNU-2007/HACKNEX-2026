import React from 'react';
import { Users, ShieldCheck, AlertTriangle, AlertCircle, HardHat, Check, X } from 'lucide-react';
import type { Worker, SafetyEvent } from '../../types';
import { Badge } from '../ui/Badge';
import { getSeverityColor } from '../../lib/severity';

export interface SafetyStatusPanelProps {
  workers: Worker[];
  events: SafetyEvent[];
  onSelectWorker: (workerId: number) => void;
  selectedWorkerId: number | null;
}

export const SafetyStatusPanel: React.FC<SafetyStatusPanelProps> = ({
  workers,
  events,
  onSelectWorker,
  selectedWorkerId,
}) => {
  const totalWorkers = workers.length;
  const safeWorkers = workers.filter((w) => w.status === 'safe').length;
  const warningWorkers = workers.filter((w) => w.status === 'warning').length;
  const highRiskWorkers = workers.filter((w) => w.status === 'high_risk').length;
  const activeIncidents = events.filter((e) => e.status !== 'resolved').length;

  // Sort workers by risk (highest score first)
  const sortedWorkers = [...workers].sort((a, b) => b.risk_score - a.risk_score);

  return (
    <div className="flex flex-col bg-[#121821] border border-[#243041] rounded-xl overflow-hidden h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#243041] bg-[#0B0F14]/60 flex items-center justify-between">
        <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-[#E6EDF3]">
          Safety Status Overview
        </h3>
        <span className="text-xs font-mono text-[#8B98A9]">Live Worker Roster</span>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {/* KPI Tiles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {/* Total Workers */}
          <div className="bg-[#0B0F14] border border-[#243041] p-2.5 rounded-lg flex flex-col">
            <span className="text-[10px] font-mono text-[#8B98A9] uppercase">Total</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-lg font-bold font-mono text-[#E6EDF3]">{totalWorkers}</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Safe Workers */}
          <div className="bg-[#0B0F14] border border-emerald-500/20 p-2.5 rounded-lg flex flex-col">
            <span className="text-[10px] font-mono text-emerald-400 uppercase">Safe</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-lg font-bold font-mono text-emerald-400">{safeWorkers}</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
          </div>

          {/* Warning Workers */}
          <div className="bg-[#0B0F14] border border-amber-500/20 p-2.5 rounded-lg flex flex-col">
            <span className="text-[10px] font-mono text-amber-400 uppercase">Warning</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-lg font-bold font-mono text-amber-400">{warningWorkers}</span>
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
          </div>

          {/* High Risk Workers */}
          <div className="bg-[#0B0F14] border border-red-500/20 p-2.5 rounded-lg flex flex-col">
            <span className="text-[10px] font-mono text-red-400 uppercase">High Risk</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-lg font-bold font-mono text-red-400">{highRiskWorkers}</span>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
          </div>

          {/* Active Incidents */}
          <div className="bg-[#0B0F14] border border-red-500/30 p-2.5 rounded-lg flex flex-col col-span-2 sm:col-span-1">
            <span className="text-[10px] font-mono text-red-400 uppercase">Incidents</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-lg font-bold font-mono text-red-400">{activeIncidents}</span>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            </div>
          </div>
        </div>

        {/* Worker List Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#8B98A9] px-1 uppercase tracking-wider">
            <span>Worker Roster</span>
            <span>Sorted by Risk</span>
          </div>

          <div className="divide-y divide-[#243041] border border-[#243041] rounded-lg overflow-hidden bg-[#0B0F14]">
            {sortedWorkers.map((w) => {
              const isSelected = selectedWorkerId === w.worker_id;
              const color =
                w.status === 'high_risk'
                  ? '#EF4444'
                  : w.status === 'warning'
                  ? '#F59E0B'
                  : '#22C55E';

              return (
                <div
                  key={w.worker_id}
                  onClick={() => onSelectWorker(w.worker_id)}
                  className={`p-3 flex items-center justify-between hover:bg-[#18202B] cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#18202B] border-l-4 border-teal-500' : ''
                  }`}
                >
                  {/* Worker ID & Zone */}
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#E6EDF3]">
                        Worker #{w.worker_id}
                      </span>
                      <Badge variant={w.status}>{w.status.replace('_', ' ')}</Badge>
                    </div>
                    <span className="text-xs text-[#8B98A9] truncate mt-0.5">
                      {w.current_zone || 'General Area'}
                    </span>
                  </div>

                  {/* PPE Status Icons & Risk Score Bar */}
                  <div className="flex items-center gap-4">
                    {/* PPE Status */}
                    <div className="flex items-center gap-2 text-xs font-mono bg-[#121821] px-2 py-1 rounded border border-[#243041]">
                      {/* Helmet */}
                      <span className="flex items-center gap-0.5" title="Helmet Status">
                        <HardHat className="w-3.5 h-3.5 text-teal-400" />
                        {w.ppe.helmet ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <X className="w-3 h-3 text-red-400 font-bold" />
                        )}
                      </span>
                      {/* Vest */}
                      <span className="flex items-center gap-0.5" title="Vest Status">
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                        {w.ppe.vest ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <X className="w-3 h-3 text-red-400 font-bold" />
                        )}
                      </span>
                    </div>

                    {/* Risk Bar */}
                    <div className="w-20 text-right font-mono">
                      <span className="text-xs font-bold" style={{ color }}>
                        {w.risk_score}/100
                      </span>
                      <div className="w-full h-1.5 bg-[#18202B] rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${w.risk_score}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
