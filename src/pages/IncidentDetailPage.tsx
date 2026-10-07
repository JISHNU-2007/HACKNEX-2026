import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, Check, CheckCircle2,
  MapPin, Clock, User, AlertTriangle, TrendingUp, FileText, Brain, ShieldAlert,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { SafetyEvent, TimelineItem } from '../types';
import { api }         from '../services/api';
import { Badge }       from '../components/ui/Badge';
import { Button }      from '../components/ui/Button';
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
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const targetId = eventIdParam || id;

  const [event,    setEvent]    = useState<SafetyEvent | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!targetId) return;
    let alive = true;
    setLoading(true);
    api.getEvent(targetId).then(evt => {
      if (!alive) return;
      if (evt) {
        setEvent(evt);
        api.getTimeline(evt.worker_id).then(t => { if (alive) setTimeline(t); });
      }
      setLoading(false);
    });
    return () => { alive = false; };
  }, [targetId]);

  const handleAcknowledge = async () => {
    if (!event) return;
    const u = await api.updateEventStatus(event.event_id, 'acknowledged');
    if (u) setEvent(u as SafetyEvent);
  };
  const handleResolve = async () => {
    if (!event) return;
    const u = await api.updateEventStatus(event.event_id, 'resolved');
    if (u) setEvent(u as SafetyEvent);
  };
  const handleExport = () => {
    if (!event) return;
    const blob = new Blob([JSON.stringify(event, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${event.event_id}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[300px] text-xs font-mono text-[#8B98A9]">
      Loading incident details…
    </div>
  );
  if (!event) return (
    <div className="p-8 text-center space-y-4">
      <ShieldAlert className="w-10 h-10 text-rose-400/50 mx-auto" />
      <p className="text-sm font-mono text-[#8B98A9]">Incident not found.</p>
      <Button variant="outline" onClick={() => onCloseModal ? onCloseModal() : navigate('/investigate')}>
        Back to Investigate
      </Button>
    </div>
  );

  const chartData = event.risk_history.map(h => ({ time: `t=${h.t}s`, score: h.score }));
  const sevColor  = getSeverityColor(event.severity);

  return (
    <div className="space-y-6 pb-8 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121821] border border-[#243041] p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onCloseModal ? onCloseModal() : navigate('/investigate')}
            className="p-2 rounded-lg bg-[#0B0F14] border border-[#243041] text-[#8B98A9] hover:text-[#E6EDF3] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-teal-400">{event.event_id}</span>
              <Badge variant={event.severity}>{event.severity}</Badge>
              <span className="text-[10px] font-mono text-[#8B98A9] bg-[#0B0F14] border border-[#243041] rounded-full px-2 py-0.5">
                {event.status}
              </span>
            </div>
            <h2 className="text-base font-bold text-[#E6EDF3] font-mono mt-0.5">
              Worker #{event.worker_id} · {event.event_type.replace(/_/g, ' ').toUpperCase()}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {event.status === 'new' && (
            <Button variant="secondary" size="sm" onClick={handleAcknowledge}>
              <Check className="w-3.5 h-3.5 text-amber-400" /> Acknowledge
            </Button>
          )}
          {event.status !== 'resolved' && (
            <Button variant="primary" size="sm" onClick={handleResolve}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-3.5 h-3.5 text-teal-400" /> Export JSON
          </Button>
        </div>
      </div>

      {/* Model info */}
      <div className="flex items-center gap-2 bg-teal-500/5 border border-teal-500/20 rounded-xl px-4 py-2.5">
        <Brain className="w-3.5 h-3.5 text-teal-400" />
        <p className="text-[11px] font-mono text-teal-400">
          Detected by <strong>YOLOv8 best.pt</strong> · Confidence: <strong>{Math.round(event.confidence * 100)}%</strong> · Zone: <strong>{event.zone}</strong>
        </p>
      </div>

      {/* WHO / WHAT / WHERE / WHEN / WHY */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-[#121821] border border-[#243041] p-4 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-teal-400 uppercase font-bold"><User className="w-3.5 h-3.5" /> WHO</div>
          <p className="text-sm font-bold text-[#E6EDF3] font-mono">Worker #{event.worker_id}</p>
          <p className="text-[11px] text-[#8B98A9]">YOLO-Tracked Person ID</p>
        </div>
        <div className="bg-[#121821] border border-[#243041] p-4 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-teal-400 uppercase font-bold"><AlertTriangle className="w-3.5 h-3.5" /> WHAT</div>
          <p className="text-xs font-bold text-[#E6EDF3] font-mono capitalize">{event.event_type.replace(/_/g, ' ')}</p>
          <p className="text-[11px] text-[#8B98A9]">{event.risk_breakdown[0]?.label ?? 'PPE Violation'}</p>
        </div>
        <div className="bg-[#121821] border border-[#243041] p-4 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-teal-400 uppercase font-bold"><MapPin className="w-3.5 h-3.5" /> WHERE</div>
          <p className="text-xs font-bold text-[#E6EDF3] font-mono">{event.zone}</p>
          <p className="text-[11px] text-[#8B98A9]">Detected in frame</p>
        </div>
        <div className="bg-[#121821] border border-[#243041] p-4 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-teal-400 uppercase font-bold"><Clock className="w-3.5 h-3.5" /> WHEN</div>
          <p className="text-xs font-bold text-[#E6EDF3] font-mono">{event.start_time}</p>
          <p className="text-[11px] text-[#8B98A9]">Duration: {formatDuration(event.duration)}</p>
        </div>
        <div className="bg-[#121821] border border-red-500/30 p-4 rounded-xl space-y-1 col-span-2 lg:col-span-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-red-400 uppercase font-bold"><FileText className="w-3.5 h-3.5" /> WHY</div>
          <p className="text-xs text-[#E6EDF3] leading-snug">{event.reason}</p>
        </div>
      </div>

      {/* Evidence + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Evidence Frame */}
        <div className="bg-[#121821] border border-[#243041] rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[#243041] bg-[#0B0F14]/60 flex items-center justify-between">
            <h4 className="text-xs font-bold font-mono uppercase text-[#E6EDF3]">YOLO Evidence Frame</h4>
            <span className="text-xs font-mono text-teal-400">Conf: {Math.round(event.confidence * 100)}%</span>
          </div>
          <div className="relative flex-1 bg-black min-h-[260px] flex items-center justify-center overflow-hidden p-2">
            {!imgError ? (
              <img
                src={event.evidence_path}
                alt="YOLO detection evidence"
                className="w-full h-full object-contain rounded-lg border border-[#243041]"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-center p-6">
                <AlertTriangle className="w-8 h-8 text-amber-400/40" />
                <p className="text-xs font-mono text-[#8B98A9]">Evidence frame not yet generated<br/>— video still processing or path unavailable</p>
                <p className="text-[10px] text-[#8B98A9]/50 font-mono">{event.evidence_path}</p>
              </div>
            )}
            {/* Overlay badge */}
            <div className="absolute top-4 left-4 bg-red-600/90 text-white font-mono font-bold text-[10px] px-2 py-1 rounded shadow-lg">
              Worker #{event.worker_id} · {event.severity.toUpperCase()} {event.risk_score}/100
            </div>
          </div>
          <div className="p-3 bg-[#0B0F14] border-t border-[#243041] text-xs font-mono text-[#8B98A9]">
            Captured at {event.start_time} · Severity: {event.severity.toUpperCase()} · Risk Score: {event.risk_score}/100
          </div>
        </div>

        {/* Risk Escalation Chart */}
        <div className="bg-[#121821] border border-[#243041] rounded-xl p-5 space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              <h4 className="text-xs font-bold font-mono uppercase text-[#E6EDF3]">Risk Escalation Curve</h4>
            </div>
            <span className="text-xs font-mono font-bold" style={{ color: sevColor }}>
              Final: {event.risk_score}/100
            </span>
          </div>

          <div className="w-full h-48 font-mono text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <XAxis dataKey="time" stroke="#8B98A9" fontSize={10} />
                <YAxis domain={[0, 100]} stroke="#8B98A9" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0B0F14', borderColor: '#243041', borderRadius: 8, color: '#E6EDF3', fontSize: 12 }} />
                <ReferenceLine y={80} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'CRITICAL', fill: '#EF4444', fontSize: 9 }} />
                <ReferenceLine y={60} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: 'HIGH', fill: '#F59E0B', fontSize: 9 }} />
                <Line type="monotone" dataKey="score" stroke={sevColor} strokeWidth={3} dot={{ r: 5, fill: sevColor }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Risk breakdown */}
          <div className="bg-[#0B0F14] border border-[#243041] p-3 rounded-lg space-y-1.5 text-xs font-mono">
            <span className="text-[10px] text-[#8B98A9] uppercase">YOLO Risk Factors:</span>
            <div className="grid grid-cols-2 gap-2 text-[#E6EDF3] mt-1">
              {event.risk_breakdown.map((rf, i) => (
                <div key={i} className="flex justify-between bg-[#18202B] px-2 py-1.5 rounded">
                  <span className="truncate pr-2">{rf.label}</span>
                  <span className="text-amber-400 font-bold shrink-0">+{rf.points}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {timeline.length > 0 && (
        <div className="bg-[#121821] border border-[#243041] rounded-xl p-5 space-y-3">
          <h4 className="text-xs font-bold font-mono uppercase text-[#E6EDF3]">
            Worker #{event.worker_id} — Behaviour Timeline
          </h4>
          <div className="space-y-2">
            {timeline.map((item, idx) => (
              <div key={idx} className="p-3 bg-[#0B0F14] border border-[#243041] rounded-lg flex items-center justify-between font-mono text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-[#8B98A9] font-bold min-w-[65px]">{item.timestamp}</span>
                  <span className="text-[#E6EDF3]">{item.label}</span>
                </div>
                <Badge variant={item.severity}>{item.severity}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
