'use client';

import { Info } from 'lucide-react';
import { Alert } from '@/components/ui';

interface AdapterConfigExamplesProps {
  adapterType: string;
}

const ADAPTER_EXAMPLES: Record<string, { example: any; description: string }> = {
  mock: {
    example: {
      actual_output: "This is a mocked response for testing",
      // Or use fixture file:
      // fixture_file: "test_artifacts/fixtures/response.txt"
    },
    description: "Mock adapter simulates responses. Use 'actual_output' for inline responses or 'fixture_file' to load from a file."
  },
  http: {
    example: {
      url: "https://api.example.com/chat",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer ${API_KEY}"
      },
      body_template: {
        message: "${input}"
      },
      response_path: "$.data.response"
    },
    description: "HTTP adapter makes REST API calls. Use ${input} to inject test input, and JSONPath in response_path to extract the response."
  },
  playwright: {
    example: {
      url: "https://example.com/chat",
      selectors: {
        input: "#chat-input",
        submit: "#send-button",
        output: ".response-text"
      },
      wait_for_selector: ".response-text",
      timeout: 30000
    },
    description: "Playwright automates browser interactions. Specify selectors for input, submit button, and output elements."
  },
  python_function: {
    example: {
      module_path: "my_app.chat",
      function_name: "get_response",
      kwargs: {
        model: "gpt-4",
        temperature: 0.7
      }
    },
    description: "Python function adapter calls functions directly. Specify the module path and function name."
  },
  langchain: {
    example: {
      chain_path: "my_chains.qa_chain",
      chain_variable: "question",
      output_key: "answer"
    },
    description: "LangChain adapter integrates with LangChain chains. Specify the chain path and input/output keys."
  },
  shell: {
    example: {
      command: "python predict.py --input '${input}'",
      output_pattern: "Response: (.*)",
      timeout: 60
    },
    description: "Shell adapter runs CLI commands. Use ${input} for test input, and regex pattern to extract output."
  },
  websocket: {
    example: {
      url: "ws://localhost:8080/chat",
      message_template: {
        type: "query",
        text: "${input}"
      },
      response_path: "$.response"
    },
    description: "WebSocket adapter for real-time communication. Specify WebSocket URL and message format."
  }
};

export default function AdapterConfigExamples({ adapterType }: AdapterConfigExamplesProps) {
  const config = ADAPTER_EXAMPLES[adapterType];

  if (!config) {
    return null;
  }

  return (
    <Alert variant="info" className="mt-3">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium mb-2">{config.description}</p>
          <details className="text-sm group">
            <summary className="cursor-pointer font-semibold hover:text-purple-600 transition-colors duration-200 flex items-center gap-1">
              <svg className="w-4 h-4 transition-transform duration-200 group-open:rotate-90" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              Example Configuration
            </summary>
            <pre className="mt-3 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 border-2 border-blue-200 p-4 overflow-x-auto font-mono text-xs shadow-sm">
{JSON.stringify(config.example, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </Alert>
  );
}
