import React, { useState, useEffect } from 'react';
import type { TimelineItem } from '../../types';
import { api } from '../../services/api';
import { Clock, UserCheck, AlertTriangle } from 'lucide-react';
import { getSeverityBadgeStyle } from '../../lib/severity';

export interface BehaviourTimelinePanelProps {
  selectedWorkerId: number | null;
}

export const BehaviourTimelinePanel: React.FC<BehaviourTimelinePanelProps> = ({
  selectedWorkerId,
}) => {
  const targetWorkerId = selectedWorkerId || 17; // Default to highest-risk worker #17
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api.getTimeline(targetWorkerId).then((items) => {
      if (isMounted) {
        setTimeline(items);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [targetWorkerId]);

  return (
    <div className="flex flex-col bg-[#121821] border border-[#243041] rounded-xl overflow-hidden h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#243041] bg-[#0B0F14]/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-teal-400" />
          <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-[#E6EDF3]">
            Worker Behaviour Timeline
          </h3>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-mono">
          <UserCheck className="w-3.5 h-3.5" />
          Worker #{targetWorkerId}
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="p-4 flex-1 overflow-y-auto max-h-[460px]">
        {loading ? (
          <div className="flex items-center justify-center p-8 text-xs font-mono text-[#8B98A9]">
            Loading timeline trajectory...
          </div>
        ) : timeline.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-[#8B98A9]">
            No behavior events recorded for Worker #{targetWorkerId}.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#243041]">
            {timeline.map((item, index) => {
              const sev = getSeverityBadgeStyle(item.severity);
              return (
                <div key={index} className="relative group">
                  {/* Severity Dot */}
                  <span
                    className={`absolute -left-[19px] top-1 w-3 h-3 rounded-full border-2 border-[#121821] transition-transform group-hover:scale-125 ${sev.dot}`}
                  />

                  {/* Content Box */}
                  <div className="bg-[#0B0F14] border border-[#243041] p-3 rounded-lg flex items-start justify-between gap-3 shadow-sm">
                    <div className="space-y-0.5">
                      <span className="text-xs font-mono text-[#8B98A9] block">
                        {item.timestamp}
                      </span>
                      <p className="text-xs font-semibold text-[#E6EDF3] leading-snug">
                        {item.label}
                      </p>
                    </div>

                    {item.severity === 'critical' && (
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
