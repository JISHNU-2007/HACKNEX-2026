import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react';
import {
  ArrowLeft,
  Download,
  Check,
  CheckCircle2,
  MapPin,
  Clock,
  User,
  AlertTriangle,
  TrendingUp,
  FileText,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { SafetyEvent, TimelineItem } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { formatDuration } from '../lib/format';
import { getSeverityColor } from '../lib/severity';

export interface IncidentDetailPageProps {
  eventIdParam?: string;
  onCloseModal?: () => void;
}

export const IncidentDetailPage: React.FC<IncidentDetailPageProps> = ({
  eventIdParam,
  onCloseModal,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const targetId = eventIdParam || id;

  const [event, setEvent] = useState<SafetyEvent | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetId) return;
    let isMounted = true;
    setLoading(true);

    api.getEvent(targetId).then((evt) => {
      if (isMounted && evt) {
        setEvent(evt);
        api.getTimeline(evt.worker_id).then((t) => {
          if (isMounted) setTimeline(t);
        });
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [targetId]);

  const handleAcknowledge = async () => {
    if (!event) return;
    const updated = await api.updateEventStatus(event.event_id, 'acknowledged');
    if (updated) setEvent(updated);
  };

  const handleResolve = async () => {
    if (!event) return;
    const updated = await api.updateEventStatus(event.event_id, 'resolved');
    if (updated) setEvent(updated);
  };

  const handleExportJSON = () => {
    if (!event) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(event, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${event.event_id}_report.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-xs font-mono text-[#8B98A9]">
        Loading incident details...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm font-mono text-[#8B98A9]">Incident not found.</p>
        <Button variant="outline" onClick={() => navigate('/investigate')}>
          Back to Investigate
        </Button>
      </div>
    );
  }

  // Format Recharts escalation curve data
  const chartData = event.risk_history.map((h) => ({
    time: `t=${h.t}s`,
    score: h.score,
  }));

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121821] border border-[#243041] p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (onCloseModal ? onCloseModal() : navigate('/investigate'))}
            className="p-2 rounded-lg bg-[#0B0F14] border border-[#243041] text-[#8B98A9] hover:text-[#E6EDF3] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-teal-400">{event.event_id}</span>
              <Badge variant={event.severity}>{event.severity}</Badge>
            </div>
            <h2 className="text-base font-bold text-[#E6EDF3] tracking-tight mt-0.5 font-mono">
              Worker #{event.worker_id} · {event.event_type.replace(/_/g, ' ').toUpperCase()}
            </h2>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {event.status === 'new' && (
            <Button variant="secondary" size="sm" onClick={handleAcknowledge}>
              <Check className="w-3.5 h-3.5 text-amber-400" /> Acknowledge
            </Button>
          )}

          {event.status !== 'resolved' && (
            <Button variant="primary" size="sm" onClick={handleResolve}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={handleExportJSON}>
            <Download className="w-3.5 h-3.5 text-teal-400" /> Export JSON
          </Button>
        </div>
      </div>

      {/* 5-Cell Summary Grid (WHO / WHAT / WHERE / WHEN / WHY) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* WHO */}
        <div className="bg-[#121821] border border-[#243041] p-4 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-teal-400 uppercase font-bold">
            <User className="w-3.5 h-3.5" /> WHO
          </div>
          <p className="text-sm font-bold text-[#E6EDF3] font-mono">Worker #{event.worker_id}</p>
          <p className="text-[11px] text-[#8B98A9]">ID 17 · Active Personnel</p>
        </div>

        {/* WHAT */}
        <div className="bg-[#121821] border border-[#243041] p-4 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-teal-400 uppercase font-bold">
            <AlertTriangle className="w-3.5 h-3.5" /> WHAT
          </div>
          <p className="text-xs font-bold text-[#E6EDF3] font-mono capitalize">
            {event.event_type.replace(/_/g, ' ')}
          </p>
          <p className="text-[11px] text-[#8B98A9]">PPE &amp; Loitering Violation</p>
        </div>

        {/* WHERE */}
        <div className="bg-[#121821] border border-[#243041] p-4 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-teal-400 uppercase font-bold">
            <MapPin className="w-3.5 h-3.5" /> WHERE
          </div>
          <p className="text-xs font-bold text-[#E6EDF3] font-mono">{event.zone}</p>
          <p className="text-[11px] text-[#8B98A9]">Welding Restricted Sector</p>
        </div>

        {/* WHEN */}
        <div className="bg-[#121821] border border-[#243041] p-4 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-teal-400 uppercase font-bold">
            <Clock className="w-3.5 h-3.5" /> WHEN
          </div>
          <p className="text-xs font-bold text-[#E6EDF3] font-mono">{event.start_time}</p>
          <p className="text-[11px] text-[#8B98A9]">Duration: {formatDuration(event.duration)}</p>
        </div>

        {/* WHY */}
        <div className="bg-[#121821] border border-red-500/30 p-4 rounded-xl space-y-1 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-red-400 uppercase font-bold">
            <FileText className="w-3.5 h-3.5" /> WHY (UNSAFE REASON)
          </div>
          <p className="text-xs text-[#E6EDF3] leading-snug line-clamp-2">
            No safety helmet detected in restricted zone &gt;60s.
          </p>
        </div>
      </div>

      {/* Main Grid: Evidence Frame + Risk Escalation Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Large Evidence Frame with Bounding Box Overlay */}
        <div className="bg-[#121821] border border-[#243041] rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[#243041] bg-[#0B0F14]/60 flex items-center justify-between">
            <h4 className="text-xs font-bold font-mono tracking-wider uppercase text-[#E6EDF3]">
              Captured Evidence Frame
            </h4>
            <span className="text-xs font-mono text-teal-400">
              Confidence: {Math.round(event.confidence * 100)}%
            </span>
          </div>

          <div className="relative flex-1 bg-black min-h-[300px] flex items-center justify-center overflow-hidden p-2">
            <img
              src={event.evidence_path}
              alt="Incident evidence frame"
              className="w-full h-full object-cover rounded-lg border border-[#243041]"
            />

            {/* Simulated Bounding Box Overlay drawn on image */}
            <div className="absolute top-[28%] right-[22%] w-[26%] h-[48%] border-2 border-red-500 bg-red-500/10 rounded pointer-events-none">
              <div className="absolute -top-6 left-0 bg-red-600 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded shadow">
                Worker #{event.worker_id} · CRITICAL (91/100)
              </div>
            </div>
          </div>
          <div className="p-3 bg-[#0B0F14] border-t border-[#243041] text-xs font-mono text-[#8B98A9]">
            Full Evidence Metadata: Image Captured at {event.start_time} · Resolution 1920x1080
          </div>
        </div>

        {/* Dynamic Risk Escalation Chart (Recharts) */}
        <div className="bg-[#121821] border border-[#243041] rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              <h4 className="text-xs font-bold font-mono tracking-wider uppercase text-[#E6EDF3]">
                Dynamic Risk Escalation Curve
              </h4>
            </div>
            <span className="text-xs font-mono font-bold" style={{ color: getSeverityColor(event.severity) }}>
              Final Score: {event.risk_score}/100
            </span>
          </div>

          {/* Recharts Step / Line Chart */}
          <div className="w-full h-56 font-mono text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <XAxis dataKey="time" stroke="#8B98A9" fontSize={10} />
                <YAxis domain={[0, 100]} stroke="#8B98A9" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B0F14',
                    borderColor: '#243041',
                    borderRadius: '8px',
                    color: '#E6EDF3',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine y={80} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'CRITICAL THRESHOLD', fill: '#EF4444', fontSize: 9 }} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#EF4444"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#EF4444' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Risk Factors Breakdown */}
          <div className="bg-[#0B0F14] border border-[#243041] p-3 rounded-lg space-y-1.5 text-xs font-mono">
            <span className="text-[10px] text-[#8B98A9] uppercase font-sans">Risk Weight Factors:</span>
            <div className="grid grid-cols-2 gap-2 text-[#E6EDF3]">
              {event.risk_breakdown.map((rf, idx) => (
                <div key={idx} className="flex justify-between bg-[#18202B] px-2 py-1 rounded">
                  <span>{rf.label}</span>
                  <span className="text-amber-400">+{rf.points}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Worker Behaviour Timeline History */}
      <div className="bg-[#121821] border border-[#243041] rounded-xl p-5 space-y-3">
        <h4 className="text-xs font-bold font-mono tracking-wider uppercase text-[#E6EDF3]">
          Complete Worker Behaviour Sequence for Incident Window
        </h4>
        <div className="space-y-2">
          {timeline.map((item, idx) => (
            <div
              key={idx}
              className="p-3 bg-[#0B0F14] border border-[#243041] rounded-lg flex items-center justify-between font-mono text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="text-[#8B98A9] font-bold">{item.timestamp}</span>
                <span className="text-[#E6EDF3]">{item.label}</span>
              </div>
              <Badge variant={item.severity}>{item.severity}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
