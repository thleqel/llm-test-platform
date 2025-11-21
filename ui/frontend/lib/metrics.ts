// Available DeepEval metrics
export const AVAILABLE_METRICS = [
  { value: 'answer_relevancy', label: 'Answer Relevancy', description: 'Measures how relevant the answer is to the question' },
  { value: 'faithfulness', label: 'Faithfulness', description: 'Measures factual consistency with context' },
  { value: 'contextual_relevancy', label: 'Contextual Relevancy', description: 'Measures relevance of retrieved context' },
  { value: 'contextual_precision', label: 'Contextual Precision', description: 'Measures precision of context retrieval' },
  { value: 'contextual_recall', label: 'Contextual Recall', description: 'Measures completeness of context retrieval' },
  { value: 'hallucination', label: 'Hallucination', description: 'Detects fabricated or unsupported information' },
  { value: 'bias', label: 'Bias', description: 'Detects biased content in responses' },
  { value: 'toxicity', label: 'Toxicity', description: 'Detects toxic or harmful content' },
  { value: 'summarization', label: 'Summarization', description: 'Evaluates quality of summaries' },
  { value: 'correctness', label: 'Correctness', description: 'Evaluates factual correctness of the answer' },
];

// Default metrics for new test cases
export const DEFAULT_METRICS = ['answer_relevancy'];
