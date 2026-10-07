import React, { useState } from 'react';
import type { SafetyEvent } from '../../types';
import { Badge } from '../ui/Badge';
import { formatDuration } from '../../lib/format';
import { getSeverityColor } from '../../lib/severity';
import { ArrowUpDown, Eye } from 'lucide-react';

export interface EventTableProps {
  events: SafetyEvent[];
  onSelectEvent: (event: SafetyEvent) => void;
}

type SortField = 'event_id' | 'worker_id' | 'event_type' | 'zone' | 'start_time' | 'duration' | 'risk_score' | 'severity' | 'confidence' | 'status';

export const EventTable: React.FC<EventTableProps> = ({ events, onSelectEvent }) => {
  const [sortField, setSortField] = useState<SortField>('start_time');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedEvents = [...events].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  return (
    <div className="bg-[#121821] border border-[#243041] rounded-xl overflow-hidden shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="bg-[#0B0F14] border-b border-[#243041] text-[#8B98A9] select-none">
              <th className="p-3 font-semibold cursor-pointer hover:text-[#E6EDF3]" onClick={() => handleSort('event_id')}>
                <div className="flex items-center gap-1">Event ID <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th className="p-3 font-semibold cursor-pointer hover:text-[#E6EDF3]" onClick={() => handleSort('worker_id')}>
                <div className="flex items-center gap-1">Worker <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th className="p-3 font-semibold cursor-pointer hover:text-[#E6EDF3]" onClick={() => handleSort('event_type')}>
                <div className="flex items-center gap-1">Event Type <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th className="p-3 font-semibold cursor-pointer hover:text-[#E6EDF3]" onClick={() => handleSort('zone')}>
                <div className="flex items-center gap-1">Zone <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th className="p-3 font-semibold cursor-pointer hover:text-[#E6EDF3]" onClick={() => handleSort('start_time')}>
                <div className="flex items-center gap-1">Start <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th className="p-3 font-semibold">End</th>
              <th className="p-3 font-semibold cursor-pointer hover:text-[#E6EDF3]" onClick={() => handleSort('duration')}>
                <div className="flex items-center gap-1">Duration <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th className="p-3 font-semibold cursor-pointer hover:text-[#E6EDF3]" onClick={() => handleSort('risk_score')}>
                <div className="flex items-center gap-1">Risk <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th className="p-3 font-semibold cursor-pointer hover:text-[#E6EDF3]" onClick={() => handleSort('severity')}>
                <div className="flex items-center gap-1">Severity <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th className="p-3 font-semibold cursor-pointer hover:text-[#E6EDF3]" onClick={() => handleSort('confidence')}>
                <div className="flex items-center gap-1">Conf. <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th className="p-3 font-semibold cursor-pointer hover:text-[#E6EDF3]" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-1">Status <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th className="p-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#243041]">
            {sortedEvents.length === 0 ? (
              <tr>
                <td colSpan={12} className="p-8 text-center text-[#8B98A9]">
                  No safety events matched your filter criteria.
                </td>
              </tr>
            ) : (
              sortedEvents.map((e) => (
                <tr
                  key={e.event_id}
                  onClick={() => onSelectEvent(e)}
                  className="hover:bg-[#18202B] cursor-pointer transition-colors group"
                >
                  <td className="p-3 text-teal-400 font-bold">{e.event_id}</td>
                  <td className="p-3 text-[#E6EDF3]">Worker #{e.worker_id}</td>
                  <td className="p-3 text-[#E6EDF3] capitalize">{e.event_type.replace(/_/g, ' ')}</td>
                  <td className="p-3 text-[#8B98A9]">{e.zone}</td>
                  <td className="p-3 text-[#E6EDF3]">{e.start_time}</td>
                  <td className="p-3 text-[#8B98A9]">{e.end_time || 'Active'}</td>
                  <td className="p-3 text-[#E6EDF3]">{formatDuration(e.duration)}</td>
                  <td className="p-3 font-bold" style={{ color: getSeverityColor(e.severity) }}>
                    {e.risk_score}/100
                  </td>
                  <td className="p-3">
                    <Badge variant={e.severity}>{e.severity}</Badge>
                  </td>
                  <td className="p-3 text-[#8B98A9]">{Math.round(e.confidence * 100)}%</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono border uppercase ${
                        e.status === 'resolved'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : e.status === 'acknowledged'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={(evt) => {
                        evt.stopPropagation();
                        onSelectEvent(e);
                      }}
                      className="p-1.5 rounded-lg bg-[#0B0F14] border border-[#243041] text-[#8B98A9] group-hover:text-teal-400 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
