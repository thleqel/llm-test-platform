'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { AVAILABLE_METRICS } from '@/lib/metrics';

interface MetricSelectorProps {
  selectedMetrics: string[];
  onChange: (metrics: string[]) => void;
  thresholds?: Record<string, number>;
  onThresholdsChange?: (thresholds: Record<string, number>) => void;
}

export default function MetricSelector({ selectedMetrics, onChange, thresholds = {}, onThresholdsChange }: MetricSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Ensure all selected metrics have thresholds
  useEffect(() => {
    if (onThresholdsChange && selectedMetrics.length > 0) {
      const needsUpdate = selectedMetrics.some(metric => thresholds[metric] === undefined);
      if (needsUpdate) {
        const updatedThresholds = { ...thresholds };
        selectedMetrics.forEach(metric => {
          if (updatedThresholds[metric] === undefined) {
            updatedThresholds[metric] = 0.7;
          }
        });
        onThresholdsChange(updatedThresholds);
      }
    }
  }, [selectedMetrics, thresholds, onThresholdsChange]);

  const toggleMetric = (metricValue: string) => {
    if (selectedMetrics.includes(metricValue)) {
      onChange(selectedMetrics.filter(m => m !== metricValue));
      // Remove threshold when metric is deselected
      if (onThresholdsChange) {
        const newThresholds = { ...thresholds };
        delete newThresholds[metricValue];
        onThresholdsChange(newThresholds);
      }
    } else {
      onChange([...selectedMetrics, metricValue]);
      // Set default threshold when metric is selected
      if (onThresholdsChange && !thresholds[metricValue]) {
        onThresholdsChange({ ...thresholds, [metricValue]: 0.7 });
      }
    }
  };

  const handleThresholdChange = (metric: string, value: number) => {
    if (onThresholdsChange) {
      onThresholdsChange({ ...thresholds, [metric]: value });
    }
  };

  const selectedCount = selectedMetrics.length;

  return (
    <div className="relative">
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group w-full rounded-xl border-2 border-gray-200 bg-white px-5 py-4 text-left transition-all duration-200 hover:border-purple-300 hover:shadow-md focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/10 flex items-center justify-between"
      >
        <span className="text-sm font-semibold">
          {selectedCount === 0 ? (
            <span className="text-gray-400">Select metrics to evaluate...</span>
          ) : (
            <span className="text-gray-900 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-xs font-bold text-white shadow-sm">
                {selectedCount}
              </span>
              <span>Metric{selectedCount !== 1 ? 's' : ''} configured</span>
            </span>
          )}
        </span>
        <ChevronDown className={`h-5 w-5 text-gray-400 transition-all duration-200 group-hover:text-purple-500 ${isOpen ? 'rotate-180 text-purple-500' : ''}`} />
      </button>

      {/* Selected Metrics Display with Thresholds */}
      {selectedCount > 0 && (
        <div className="mt-4 space-y-3">
          {selectedMetrics.map((metric, index) => {
            const metricInfo = AVAILABLE_METRICS.find(m => m.value === metric);
            const threshold = thresholds[metric] ?? 0.7; // Use ?? to handle 0 values correctly
            return (
              <div
                key={metric}
                className="group relative overflow-hidden rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-white to-purple-50/30 p-5 shadow-sm transition-all duration-200 hover:border-purple-300 hover:shadow-lg animate-in slide-in-from-left duration-300"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Accent bar */}
                <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-purple-500 via-purple-600 to-indigo-600 shadow-sm" />
                
                <div className="flex items-center gap-4 pl-3">
                  {/* Number Badge */}
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-sm font-bold text-white shadow-md">
                    {index + 1}
                  </div>

                  {/* Metric Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-bold text-gray-900 mb-1">
                      {metricInfo?.label || metric}
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {metricInfo?.description}
                    </p>
                  </div>

                  {/* Threshold Input */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <label className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                      Threshold
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        value={threshold}
                        onChange={(e) => handleThresholdChange(metric, parseFloat(e.target.value) || 0)}
                        className="w-24 rounded-lg border-2 border-purple-300 bg-white px-3 py-2.5 text-center text-lg font-bold text-purple-700 transition-all duration-200 hover:border-purple-400 focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 shadow-md hover:shadow-lg"
                        required
                      />
                      <div className="absolute -bottom-5 right-0 left-0 text-center text-xs font-semibold text-purple-600">
                        {(threshold * 100).toFixed(0)}% pass
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => toggleMetric(metric)}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 transition-all duration-200 hover:bg-red-50 hover:text-red-600 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    title="Remove metric"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10 bg-black/5 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute z-20 mt-2 w-full animate-in fade-in slide-in-from-top-2 duration-200 rounded-xl border-2 border-purple-200 bg-white shadow-2xl max-h-96 overflow-hidden">
            <div className="max-h-96 overflow-y-auto p-3">
              <div className="mb-3 px-3 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Available Metrics
                </h3>
              </div>
              {AVAILABLE_METRICS.map(metric => {
                const isSelected = selectedMetrics.includes(metric.value);
                return (
                  <button
                    key={metric.value}
                    type="button"
                    onClick={() => toggleMetric(metric.value)}
                    className={`group w-full rounded-xl px-4 py-3.5 text-left transition-all duration-200 mb-2 ${
                      isSelected
                        ? 'bg-gradient-to-r from-purple-100 via-purple-50 to-indigo-50 border-2 border-purple-300 shadow-md scale-[0.98]'
                        : 'hover:bg-gray-50 text-gray-700 hover:shadow-sm border-2 border-transparent hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <div className={`mt-0.5 flex-shrink-0 h-5 w-5 rounded-md border-2 transition-all duration-200 ${
                        isSelected
                          ? 'bg-gradient-to-br from-purple-600 to-purple-700 border-purple-600 shadow-md'
                          : 'border-gray-300 group-hover:border-purple-400 bg-white'
                      } flex items-center justify-center`}>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                        )}
                      </div>
                      
                      {/* Label & Description */}
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-bold mb-1 ${isSelected ? 'text-purple-900' : 'text-gray-900'}`}>
                          {metric.label}
                        </div>
                        <div className={`text-xs leading-relaxed ${isSelected ? 'text-purple-700' : 'text-gray-600'}`}>
                          {metric.description}
                        </div>
                      </div>

                      {/* Selected indicator */}
                      {isSelected && (
                        <div className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md animate-in zoom-in duration-200">
                          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
