'use client';

import { PlaywrightConfig } from './PlaywrightStepBuilder';
import { Card, CardHeader, CardBody, CardTitle, Badge } from '@/components/ui';

interface PlaywrightConfigDisplayProps {
  config: PlaywrightConfig;
}

const ACTION_LABELS: Record<string, string> = {
  'goto': 'Navigate to URL',
  'wait_for_selector': 'Wait for Element',
  'fill': 'Fill Input',
  'click': 'Click Element',
  'extract_text': 'Extract Text',
  'screenshot': 'Take Screenshot',
  'wait': 'Wait/Delay',
};

const ACTION_ICONS: Record<string, string> = {
  'goto': '🌐',
  'wait_for_selector': '⏳',
  'fill': '✏️',
  'click': '👆',
  'extract_text': '📝',
  'screenshot': '📸',
  'wait': '⏱️',
};

export default function PlaywrightConfigDisplay({ config }: PlaywrightConfigDisplayProps) {
  return (
    <div className="space-y-4">
      {/* Browser Settings */}
      <Card variant="gradient" className="bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2 text-purple-900">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            Browser Settings
          </CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600 font-medium">Browser:</span>
              <Badge variant="purple" className="ml-2">{config.browser}</Badge>
            </div>
            <div>
              <span className="text-gray-600 font-medium">Mode:</span>
              <Badge variant={config.headless ? 'gray' : 'green'} className="ml-2">
                {config.headless ? 'Headless' : 'Visible'}
              </Badge>
            </div>
            {config.base_url && (
              <div className="col-span-2">
                <span className="text-gray-600 font-medium">Base URL:</span>
                <code className="ml-2 text-xs bg-purple-100 text-purple-900 px-2 py-0.5 rounded">
                  {config.base_url}
                </code>
              </div>
            )}
            <div className="col-span-2">
              <span className="text-gray-600 font-medium">Screenshot on Error:</span>
              <Badge variant={config.screenshot_on_error ? 'green' : 'gray'} className="ml-2">
                {config.screenshot_on_error ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Test Steps */}
      <Card variant="gradient" className="bg-gradient-to-br from-blue-50 to-cyan-50">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2 text-blue-900">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
            </svg>
            Test Steps ({config.steps.length})
          </CardTitle>
        </CardHeader>
        <CardBody>
          {config.steps.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-sm">
              No steps configured
            </div>
          ) : (
            <div className="space-y-2">
              {config.steps.map((step, index) => (
                <div
                key={index}
                className="bg-white rounded-lg p-3 border border-blue-200 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{ACTION_ICONS[step.action] || '⚡'}</span>
                      <span className="text-sm font-semibold text-blue-900">
                        {ACTION_LABELS[step.action] || step.action}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs">
                      {step.url && (
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 font-medium min-w-[60px]">URL:</span>
                          <code className="bg-blue-50 text-blue-900 px-1.5 py-0.5 rounded font-mono flex-1 break-all">
                            {step.url}
                          </code>
                        </div>
                      )}
                      {step.selector && (
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 font-medium min-w-[60px]">Selector:</span>
                          <code className="bg-blue-50 text-blue-900 px-1.5 py-0.5 rounded font-mono flex-1 break-all">
                            {step.selector}
                          </code>
                        </div>
                      )}
                      {step.value && (
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 font-medium min-w-[60px]">Value:</span>
                          <code className="bg-blue-50 text-blue-900 px-1.5 py-0.5 rounded flex-1 break-all">
                            {step.value}
                          </code>
                        </div>
                      )}
                      {step.timeout && (
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 font-medium min-w-[60px]">Timeout:</span>
                          <span className="text-gray-700">{step.timeout}ms</span>
                        </div>
                      )}
                      {step.save_as && (
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 font-medium min-w-[60px]">Save As:</span>
                          <code className="bg-green-50 text-green-900 px-1.5 py-0.5 rounded font-mono">
                            {step.save_as}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
