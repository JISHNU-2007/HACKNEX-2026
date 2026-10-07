import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { VideoUploadStep } from '../components/configure/VideoUploadStep';
import { ScenarioStep } from '../components/configure/ScenarioStep';
import { ZoneEditorCanvas } from '../components/configure/ZoneEditorCanvas';
import { SafetyRulesStep } from '../components/configure/SafetyRulesStep';
import { AlertThresholdsStep } from '../components/configure/AlertThresholdsStep';
import { Button } from '../components/ui/Button';
import { Toast } from '../components/ui/Toast';
import type { SafetyConfig, Zone } from '../types';
import { api } from '../services/api';
import { Play, Video, Factory, Layers, ShieldCheck, Sliders, CheckCircle2 } from 'lucide-react';

export const ConfigurePage: React.FC = () => {
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState<number>(1);
  const [config, setConfig] = useState<SafetyConfig | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    api.getConfig().then((cfg) => setConfig(cfg));
  }, []);

  const handleVideoSelected = async (file: File) => {
    const uploadRes = await api.uploadVideo(file);
    setVideoPreviewUrl(uploadRes.url);
  };

  const handleSaveAndStartAnalysis = async () => {
    if (!config) return;
    await api.saveConfig(config);
    setShowToast(true);
    setTimeout(() => {
      navigate('/monitor');
    }, 1200);
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-xs font-mono text-[#8B98A9]">
        Loading configuration presets...
      </div>
    );
  }

  const steps = [
    { id: 1, title: 'Video Source', icon: Video },
    { id: 2, title: 'Workplace Scenario', icon: Factory },
    { id: 3, title: 'Safety Zones', icon: Layers },
    { id: 4, title: 'Safety Rules', icon: ShieldCheck },
    { id: 5, title: 'Alert Thresholds', icon: Sliders },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-7xl mx-auto">
      {/* Toast Confirmation */}
      {showToast && (
        <Toast
          id="config_saved"
          title="Safety Configuration Saved"
          desc="AI Computer-Vision pipeline initialized. Redirecting to live monitor..."
          severity="low"
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121821] border border-[#243041] p-5 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-[#E6EDF3] tracking-tight">
            Safety AI &amp; Environment Setup
          </h2>
          <p className="text-xs text-[#8B98A9] mt-0.5">
            Configure safety zones, PPE compliance rules, and risk score thresholds prior to video analysis
          </p>
        </div>

        <Button variant="primary" size="lg" onClick={handleSaveAndStartAnalysis} className="shadow-lg shadow-teal-900/30">
          <Play className="w-4 h-4 fill-white" /> Start AI Analysis
        </Button>
      </div>

      {/* Stepper Navigation Bar */}
      <div className="flex items-center justify-between bg-[#121821] border border-[#243041] p-2 rounded-xl overflow-x-auto">
        {steps.map((s) => {
          const Icon = s.icon;
          const isActive = activeStep === s.id;
          const isDone = activeStep > s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveStep(s.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-mono font-medium transition-all shrink-0 ${
                isActive
                  ? 'bg-teal-500/10 text-teal-400 border border-teal-500/40 shadow-sm'
                  : isDone
                  ? 'text-[#E6EDF3] hover:bg-[#18202B]'
                  : 'text-[#8B98A9] hover:text-[#E6EDF3]'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  isActive
                    ? 'bg-teal-500 text-white'
                    : isDone
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-[#0B0F14] text-[#8B98A9]'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.id}
              </div>
              <span>{s.title}</span>
            </button>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="bg-[#121821] border border-[#243041] p-6 rounded-xl">
        {activeStep === 1 && (
          <VideoUploadStep
            onVideoSelected={handleVideoSelected}
            videoPreviewUrl={videoPreviewUrl}
          />
        )}

        {activeStep === 2 && (
          <ScenarioStep
            selectedScenario={config.scenario}
            onSelectScenario={(sc) => setConfig({ ...config, scenario: sc })}
          />
        )}

        {activeStep === 3 && (
          <ZoneEditorCanvas
            zones={config.zones}
            onChangeZones={(zones: Zone[]) => setConfig({ ...config, zones })}
            videoPreviewUrl={videoPreviewUrl}
          />
        )}

        {activeStep === 4 && (
          <SafetyRulesStep
            rules={config.rules}
            onChangeRules={(rules) => setConfig({ ...config, rules })}
          />
        )}

        {activeStep === 5 && (
          <AlertThresholdsStep
            thresholds={config.thresholds}
            onChangeThresholds={(thresholds) => setConfig({ ...config, thresholds })}
          />
        )}
      </div>

      {/* Footer Navigation Controls */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          disabled={activeStep === 1}
          onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
        >
          Previous Step
        </Button>

        {activeStep < 5 ? (
          <Button
            variant="secondary"
            onClick={() => setActiveStep((prev) => Math.min(5, prev + 1))}
          >
            Next Step &rarr;
          </Button>
        ) : (
          <Button variant="primary" onClick={handleSaveAndStartAnalysis}>
            <Play className="w-4 h-4 fill-white" /> Save &amp; Launch Monitor
          </Button>
        )}
      </div>
    </div>
  );
};
