import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  Check,
  TrendingUp,
} from 'lucide-react';
import type { SafetyEvent } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { getSeverityBadgeStyle, getSeverityColor } from '../../lib/severity';
import { formatDuration } from '../../lib/format';

export interface IncidentCardProps {
  event: SafetyEvent;
  onAcknowledge?: (eventId: string) => void;
  onResolve?: (eventId: string) => void;
  compact?: boolean;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({
  event,
  onAcknowledge,
  onResolve,
  compact = false,
}) => {
  const navigate = useNavigate();
  const [showBreakdown, setShowBreakdown] = useState(false);

  const sevStyle = getSeverityBadgeStyle(event.severity);
  const scorePercent = Math.min(100, Math.max(0, event.risk_score));

  // Visual ASCII-style risk score progress block bar
  const totalBlocks = 20;
  const filledBlocks = Math.round((scorePercent / 100) * totalBlocks);
  const blockString = '█'.repeat(filledBlocks) + '░'.repeat(totalBlocks - filledBlocks);

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        event.severity === 'critical'
          ? 'bg-[#18202B] border-red-500/40 shadow-lg shadow-red-950/20'
          : event.severity === 'high'
          ? 'bg-[#18202B] border-orange-500/40'
          : 'bg-[#121821] border-[#243041]'
      }`}
    >
      {/* Top Banner */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#243041]/60 bg-[#0B0F14]/50">
        <div className="flex items-center gap-2">
          <Badge variant={event.severity} showDot>
            {event.severity}
          </Badge>
          <span className="text-xs font-semibold tracking-wide text-[#E6EDF3] uppercase">
            {event.event_type.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono text-[#8B98A9]">
          <Clock className="w-3.5 h-3.5 text-[#8B98A9]" />
          <span>{event.start_time}</span>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-4 space-y-3">
        {/* Worker & Location Info */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-[#E6EDF3] font-mono flex items-center gap-2">
              Worker #{event.worker_id}
              <span className="text-xs font-sans text-[#8B98A9] font-normal">
                · {event.reason.split(' ')[0]} Safety Incident
              </span>
            </h4>
            <div className="flex items-center gap-4 mt-1.5 text-xs text-[#8B98A9] font-mono">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-teal-400" />
                {event.zone}
              </span>
              <span>Duration: {formatDuration(event.duration)}</span>
              <span>Confidence: {Math.round(event.confidence * 100)}%</span>
            </div>
          </div>

          {/* Status Chip */}
          {event.status === 'acknowledged' && (
            <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-[10px]">
              ACKNOWLEDGED
            </Badge>
          )}
          {event.status === 'resolved' && (
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[10px]">
              RESOLVED
            </Badge>
          )}
        </div>

        {/* Risk Score Progress Bar */}
        <div className="bg-[#0B0F14] p-2.5 rounded-lg border border-[#243041] font-mono text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[#8B98A9]">Risk Score</span>
            <span
              className="font-bold text-sm"
              style={{ color: getSeverityColor(event.severity) }}
            >
              {event.risk_score}/100
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs overflow-x-auto whitespace-nowrap">
            <span style={{ color: getSeverityColor(event.severity) }}>[{blockString}]</span>
          </div>
        </div>

        {/* Detailed Reason Explanation */}
        <p className="text-xs text-[#8B98A9] leading-relaxed bg-[#18202B]/40 p-2.5 rounded-lg border border-[#243041]/40">
          <strong className="text-[#E6EDF3]">Reason:</strong> {event.reason}
        </p>

        {/* Explainable Risk Breakdown (Toggleable) */}
        {!compact && (
          <div>
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="flex items-center justify-between w-full text-xs text-teal-400 hover:text-teal-300 font-medium py-1 transition-colors"
            >
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Explainable Risk Breakdown & Escalation
              </span>
              {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showBreakdown && (
              <div className="mt-2 p-3 bg-[#0B0F14] rounded-lg border border-[#243041] space-y-2 text-xs font-mono animate-fade-in">
                <p className="text-[11px] text-[#8B98A9] uppercase font-sans tracking-wider">
                  Calculated Risk Factor Points
                </p>
                <div className="space-y-1.5 divide-y divide-[#243041]/40">
                  {event.risk_breakdown.map((factor, idx) => (
                    <div key={idx} className="flex justify-between pt-1 text-[#E6EDF3]">
                      <span>{factor.label}</span>
                      <span className="text-amber-400">+{factor.points}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 font-bold text-sm">
                    <span className="text-[#E6EDF3]">Total Score</span>
                    <span style={{ color: getSeverityColor(event.severity) }}>
                      {event.risk_score} &rarr; {event.severity.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Risk Escalation Timeline steps */}
                {event.risk_history && event.risk_history.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-[#243041]">
                    <span className="text-[10px] text-[#8B98A9] uppercase font-sans">
                      Risk Escalation Trajectory:
                    </span>
                    <div className="flex items-center gap-1.5 mt-1 overflow-x-auto text-[11px]">
                      {event.risk_history.map((h, i) => (
                        <React.Fragment key={i}>
                          <span className="px-1.5 py-0.5 rounded bg-[#18202B] border border-[#243041] text-[#E6EDF3]">
                            t={h.t}s: <strong className="text-teal-400">{h.score}</strong>
                          </span>
                          {i < event.risk_history.length - 1 && (
                            <span className="text-[#8B98A9]">&rarr;</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[#243041]/60">
          {/* Thumbnail Preview */}
          <div
            onClick={() => navigate(`/investigate/${event.event_id}`)}
            className="group flex items-center gap-2 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-md overflow-hidden bg-black border border-[#243041] shrink-0 relative">
              <img
                src={event.evidence_path}
                alt="Evidence frame"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
              />
            </div>
            <span className="text-xs font-medium text-[#8B98A9] group-hover:text-[#E6EDF3] transition-colors">
              Evidence Frame
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/investigate/${event.event_id}`)}
            >
              <Eye className="w-3.5 h-3.5 text-teal-400" />
              View Details
            </Button>

            {event.status === 'new' && onAcknowledge && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onAcknowledge(event.event_id)}
              >
                <Check className="w-3.5 h-3.5 text-amber-400" />
                Acknowledge
              </Button>
            )}

            {event.status !== 'resolved' && onResolve && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onResolve(event.event_id)}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Resolve
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
