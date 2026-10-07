import React from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

export interface FilterState {
  search: string;
  eventType: string;
  severity: string;
  zone: string;
}

export interface EventFilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
}

export const EventFilterBar: React.FC<EventFilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  return (
    <div className="bg-[#121821] border border-[#243041] p-4 rounded-xl space-y-3">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="w-full sm:w-72">
          <Input
            icon={<Search className="w-4 h-4" />}
            placeholder="Search Worker #, Event ID, Zone..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Event Type */}
          <Select
            value={filters.eventType}
            options={[
              { value: 'all', label: 'All Event Types' },
              { value: 'restricted_zone_entry', label: 'Restricted-Zone Entry' },
              { value: 'prolonged_presence', label: 'Prolonged Presence / Loitering' },
              { value: 'ppe_violation', label: 'PPE Violation' },
            ]}
            onChange={(e) => onFilterChange({ ...filters, eventType: e.target.value })}
          />

          {/* Severity */}
          <Select
            value={filters.severity}
            options={[
              { value: 'all', label: 'All Severities' },
              { value: 'low', label: 'Low (Safe)' },
              { value: 'medium', label: 'Medium (Warning)' },
              { value: 'high', label: 'High Risk' },
              { value: 'critical', label: 'CRITICAL' },
            ]}
            onChange={(e) => onFilterChange({ ...filters, severity: e.target.value })}
          />

          {/* Zone */}
          <Select
            value={filters.zone}
            options={[
              { value: 'all', label: 'All Safety Zones' },
              { value: 'general', label: 'General Area' },
              { value: 'machine', label: 'Machine Area' },
              { value: 'welding', label: 'Welding Area' },
            ]}
            onChange={(e) => onFilterChange({ ...filters, zone: e.target.value })}
          />

          <Button variant="outline" size="sm" onClick={onReset}>
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </Button>
        </div>
      </div>
    </div>
  );
};
