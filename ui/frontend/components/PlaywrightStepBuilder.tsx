'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';

export interface PlaywrightStep {
  action: string;
  selector?: string;
  url?: string;
  value?: string;
  timeout?: number;
  save_as?: string;
}

export interface PlaywrightConfig {
  browser: string;
  headless: boolean;
  base_url: string;
  steps: PlaywrightStep[];
  screenshot_on_error: boolean;
}

interface PlaywrightStepBuilderProps {
  config: PlaywrightConfig;
  onChange: (config: PlaywrightConfig) => void;
}

const ACTION_TEMPLATES = [
  { value: 'goto', label: 'Navigate to URL', fields: ['url'] },
  { value: 'wait_for_selector', label: 'Wait for Element', fields: ['selector', 'timeout'] },
  { value: 'fill', label: 'Fill Input', fields: ['selector', 'value'] },
  { value: 'click', label: 'Click Element', fields: ['selector'] },
  { value: 'extract_text', label: 'Extract Text', fields: ['selector', 'save_as'] },
  { value: 'screenshot', label: 'Take Screenshot', fields: ['save_as'] },
  { value: 'wait', label: 'Wait/Delay', fields: ['timeout'] },
];

export default function PlaywrightStepBuilder({ config, onChange }: PlaywrightStepBuilderProps) {
  const [expandedSteps, setExpandedSteps] = useState<number[]>([]);

  const updateConfig = (updates: Partial<PlaywrightConfig>) => {
    onChange({ ...config, ...updates });
  };

  const addStep = () => {
    const newStep: PlaywrightStep = {
      action: 'goto',
      url: '',
    };
    updateConfig({ steps: [...config.steps, newStep] });
    setExpandedSteps([...expandedSteps, config.steps.length]);
  };

  const removeStep = (index: number) => {
    updateConfig({ steps: config.steps.filter((_, i) => i !== index) });
    setExpandedSteps(expandedSteps.filter(i => i !== index).map(i => i > index ? i - 1 : i));
  };

  const updateStep = (index: number, updates: Partial<PlaywrightStep>) => {
    const newSteps = [...config.steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    updateConfig({ steps: newSteps });
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === config.steps.length - 1) return;

    const newSteps = [...config.steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    updateConfig({ steps: newSteps });
  };

  const toggleStepExpanded = (index: number) => {
    setExpandedSteps(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const getActionTemplate = (action: string) => {
    return ACTION_TEMPLATES.find(t => t.value === action) || ACTION_TEMPLATES[0];
  };

  const changeStepAction = (index: number, action: string) => {
    const template = getActionTemplate(action);
    const newStep: PlaywrightStep = { action };
    
    // Initialize fields based on template
    template.fields.forEach(field => {
      if (field === 'timeout') {
        newStep.timeout = 5000;
      } else if (field === 'selector') {
        newStep.selector = '';
      } else if (field === 'url') {
        newStep.url = '';
      } else if (field === 'value') {
        newStep.value = '';
      } else if (field === 'save_as') {
        newStep.save_as = '';
      }
    });
    
    updateStep(index, newStep);
  };

  return (
    <div className="space-y-6">
      {/* Browser Settings */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-200">
        <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
          Browser Configuration
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Browser</label>
            <select
              value={config.browser}
              onChange={(e) => updateConfig({ browser: e.target.value })}
              className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            >
              <option value="chromium">Chromium</option>
              <option value="firefox">Firefox</option>
              <option value="webkit">WebKit (Safari)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Base URL</label>
            <input
              type="text"
              value={config.base_url}
              onChange={(e) => updateConfig({ base_url: e.target.value })}
              placeholder="https://example.com or file://"
              className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="headless"
              checked={config.headless}
              onChange={(e) => updateConfig({ headless: e.target.checked })}
              className="w-5 h-5 text-purple-600 border-2 border-purple-300 rounded focus:ring-2 focus:ring-purple-500"
            />
            <label htmlFor="headless" className="text-sm font-semibold text-gray-700 cursor-pointer">
              Run in Headless Mode (no visible browser)
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="screenshot_on_error"
              checked={config.screenshot_on_error}
              onChange={(e) => updateConfig({ screenshot_on_error: e.target.checked })}
              className="w-5 h-5 text-purple-600 border-2 border-purple-300 rounded focus:ring-2 focus:ring-purple-500"
            />
            <label htmlFor="screenshot_on_error" className="text-sm font-semibold text-gray-700 cursor-pointer">
              Screenshot on Error
            </label>
          </div>
        </div>
      </div>

      {/* Steps Builder */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
            </svg>
            Test Steps ({config.steps.length})
          </h3>
          <button
            onClick={addStep}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-semibold"
          >
            <Plus className="w-4 h-4" />
            Add Step
          </button>
        </div>

        {config.steps.length === 0 ? (
          <div className="text-center py-12 bg-white/50 rounded-lg border-2 border-dashed border-blue-300">
            <svg className="w-16 h-16 mx-auto text-blue-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-blue-600 font-semibold">No steps defined yet</p>
            <p className="text-blue-500 text-sm mt-1">Click "Add Step" to start building your test</p>
          </div>
        ) : (
          <div className="space-y-3">
            {config.steps.map((step, index) => {
              const template = getActionTemplate(step.action);
              const isExpanded = expandedSteps.includes(index);

              return (
                <div
                  key={index}
                  className="bg-white rounded-lg border-2 border-blue-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Step Header */}
                  <div className="flex items-center gap-3 p-4">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                      <span className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                          {template.label}
                        </span>
                        {step.selector && (
                          <span className="text-xs text-gray-500 font-mono truncate max-w-xs">
                            {step.selector}
                          </span>
                        )}
                        {step.url && (
                          <span className="text-xs text-gray-500 font-mono truncate max-w-xs">
                            {step.url}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => moveStep(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move up"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      </button>
                      <button
                        onClick={() => moveStep(index, 'down')}
                        disabled={index === config.steps.length - 1}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move down"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </button>
                      <button
                        onClick={() => toggleStepExpanded(index)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title={isExpanded ? "Collapse" : "Expand"}
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => removeStep(index)}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Step Configuration (Expanded) */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t-2 border-blue-100 bg-gradient-to-br from-blue-50/50 to-purple-50/50 space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Action Type</label>
                        <select
                          value={step.action}
                          onChange={(e) => changeStepAction(index, e.target.value)}
                          className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                        >
                          {ACTION_TEMPLATES.map(template => (
                            <option key={template.value} value={template.value}>
                              {template.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {template.fields.includes('url') && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            URL <span className="text-xs text-gray-500">(relative to base_url or absolute)</span>
                          </label>
                          <input
                            type="text"
                            value={step.url || ''}
                            onChange={(e) => updateStep(index, { url: e.target.value })}
                            placeholder="/path or https://example.com"
                            className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                          />
                        </div>
                      )}

                      {template.fields.includes('selector') && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            CSS Selector <span className="text-xs text-gray-500">(e.g., #id, .class, [data-test])</span>
                          </label>
                          <input
                            type="text"
                            value={step.selector || ''}
                            onChange={(e) => updateStep(index, { selector: e.target.value })}
                            placeholder="#chat-input, .btn-primary"
                            className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                          />
                        </div>
                      )}

                      {template.fields.includes('value') && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Value <span className="text-xs text-gray-500">(use {'{{input}}'} for test case input)</span>
                          </label>
                          <input
                            type="text"
                            value={step.value || ''}
                            onChange={(e) => updateStep(index, { value: e.target.value })}
                            placeholder="Text to enter or {{input}}"
                            className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                      )}

                      {template.fields.includes('timeout') && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Timeout (ms)
                          </label>
                          <input
                            type="number"
                            value={step.timeout || 5000}
                            onChange={(e) => updateStep(index, { timeout: parseInt(e.target.value) || 5000 })}
                            min="0"
                            step="100"
                            className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                      )}

                      {template.fields.includes('save_as') && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Save As <span className="text-xs text-gray-500">(variable name, use "actual_output" for evaluation)</span>
                          </label>
                          <input
                            type="text"
                            value={step.save_as || ''}
                            onChange={(e) => updateStep(index, { save_as: e.target.value })}
                            placeholder="actual_output"
                            className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* JSON Preview */}
      <details className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border-2 border-gray-200">
        <summary className="cursor-pointer text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2 hover:text-purple-600 transition-colors">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          View Generated JSON Configuration
        </summary>
        <pre className="mt-4 p-4 bg-gray-900 text-green-400 rounded-lg overflow-x-auto text-xs font-mono">
          {JSON.stringify(config, null, 2)}
        </pre>
      </details>
    </div>
  );
}
