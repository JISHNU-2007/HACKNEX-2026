import React from 'react';
import { Factory, HardHat, Wrench, Warehouse, Building2, Check } from 'lucide-react';

export interface ScenarioStepProps {
  selectedScenario: string;
  onSelectScenario: (scenario: string) => void;
}

export const ScenarioStep: React.FC<ScenarioStepProps> = ({
  selectedScenario,
  onSelectScenario,
}) => {
  const scenarios = [
    {
      id: 'Factory',
      title: 'Industrial Factory Floor',
      desc: 'Heavy machinery, assembly lines, active crane zones & high-noise areas.',
      icon: Factory,
    },
    {
      id: 'Construction',
      title: 'Construction Site',
      desc: 'Scaffolding, excavators, open edges & mandatory hard-hat enforcement.',
      icon: HardHat,
    },
    {
      id: 'Workshop',
      title: 'Engineering Workshop',
      desc: 'Welding bays, precision tooling machines, grinding stations & sparks.',
      icon: Wrench,
    },
    {
      id: 'Warehouse',
      title: 'Logistics Warehouse',
      desc: 'Forklift traffic lanes, high-shelf storage racks & loading docks.',
      icon: Warehouse,
    },
    {
      id: 'Industrial Plant',
      title: 'Chemical / Energy Plant',
      desc: 'Pipeline corridors, hazardous gas zones & strict thermal monitoring.',
      icon: Building2,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {scenarios.map((s) => {
        const Icon = s.icon;
        const isSelected = selectedScenario === s.id;
        return (
          <div
            key={s.id}
            onClick={() => onSelectScenario(s.id)}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between relative ${
              isSelected
                ? 'bg-teal-500/10 border-teal-500 text-[#E6EDF3] shadow-md shadow-teal-950/20'
                : 'bg-[#121821] border-[#243041] hover:border-[#3a4b63] text-[#8B98A9]'
            }`}
          >
            {isSelected && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-teal-500 text-white flex items-center justify-center">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-[#0B0F14] border border-[#243041] flex items-center justify-center text-teal-400">
                <Icon className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-[#E6EDF3]">{s.title}</h4>
              <p className="text-xs text-[#8B98A9] leading-relaxed">{s.desc}</p>
            </div>

            <div className="mt-4 pt-2 border-t border-[#243041]/40 text-[10px] font-mono uppercase tracking-wider text-teal-400">
              Scenario Preset Loaded
            </div>
          </div>
        );
      })}
    </div>
  );
};
