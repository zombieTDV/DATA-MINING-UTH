import type {
  Paper,
  ChatSession,
  ChatMessage,
  TrendingTopic,
  CategoryStats,
  TimelineDataPoint,
  AnalyticsSummary,
  PaperChunk,
} from '@/types/entities';

/**
 * Mock papers for UI development.
 * Simulates papers crawled from arXiv (cs.AI, cs.LG, cs.CV, cs.CL, stat.ML).
 */
export const MOCK_PAPERS: Paper[] = [
  {
    id: 'arxiv:2401.12345',
    arxivId: '2401.12345',
    title: 'FlashAttention-3: Fast and Accurate Attention with Asynchrony and Sparsity',
    abstract:
      'We extend FlashAttention to exploit asynchrony and sparsity, achieving 1.2-2.0x speedup over FlashAttention-2 on H100 GPUs. We propose three novel techniques: (1) warp-specialized attention that overlaps data movement with compute, (2) interleaved softmax that exploits sparsity in attention masks, and (3) FP8 quantization with block-wise scaling. Our methods enable training of long-context models (up to 1M tokens) with significantly reduced memory footprint.',
    authors: [
      { name: 'Tri Dao', affiliation: 'Princeton University' },
      { name: 'Daniel Haziza', affiliation: 'Meta AI' },
      { name: 'Luca Massaron', affiliation: 'Meta AI' },
    ],
    categories: ['cs.LG', 'cs.AI'],
    primaryCategory: 'cs.LG',
    publishedDate: '2024-12-15T10:00:00Z',
    updatedDate: '2024-12-17T08:30:00Z',
    pdfUrl: 'https://arxiv.org/pdf/2401.12345.pdf',
    htmlUrl: 'https://arxiv.org/html/2401.12345',
    citations: 342,
    comments: '25 pages, 12 figures',
  },
  {
    id: 'arxiv:2401.67890',
    arxivId: '2401.67890',
    title: 'Gemini 2.0: A Family of Highly Capable Multimodal Models',
    abstract:
      'This paper introduces Gemini 2.0, a new generation of multimodal AI models capable of reasoning across text, images, audio, video, and code. We present the architecture, training methodology, and comprehensive evaluations across 50+ benchmarks. Gemini 2.0 Ultra achieves state-of-the-art on 38 benchmarks including MMLU (92.5%), HumanEval (96.3%), and AudioBench (88.7%).',
    authors: [{ name: 'Gemini Team', affiliation: 'Google DeepMind' }],
    categories: ['cs.AI', 'cs.CL', 'cs.CV'],
    primaryCategory: 'cs.AI',
    publishedDate: '2024-12-10T16:00:00Z',
    pdfUrl: 'https://arxiv.org/pdf/2401.67890.pdf',
    htmlUrl: 'https://arxiv.org/html/2401.67890',
    citations: 1248,
    comments: '48 pages, technical report',
  },
  {
    id: 'arxiv:2410.01234',
    arxivId: '2410.01234',
    title: 'Direct Preference Optimization: Your Language Model is Secretly a Reward Model',
    abstract:
      'We introduce Direct Preference Optimization (DPO), a novel training algorithm that aligns language models with human preferences without reinforcement learning. DPO leverages the same objective as RLHF but is simpler to implement, more stable to train, and computationally lighter. Experiments on Anthropic HH and Mistral benchmarks show DPO matches or exceeds PPO-based RLHF while using only 1/3 of the compute.',
    authors: [
      { name: 'Rafael Rafailov', affiliation: 'Stanford University' },
      { name: 'Archit Sharma', affiliation: 'Stanford University' },
      { name: 'Eric Mitchell', affiliation: 'Stanford University' },
    ],
    categories: ['cs.LG', 'cs.CL'],
    primaryCategory: 'cs.LG',
    publishedDate: '2024-10-01T12:00:00Z',
    pdfUrl: 'https://arxiv.org/pdf/2410.01234.pdf',
    citations: 2156,
  },
  {
    id: 'arxiv:2406.01567',
    arxivId: '2406.01567',
    title: 'Segment Anything 2: Promptable Video Segmentation',
    abstract:
      'We present SAM 2, a foundation model for promptable visual segmentation in images and videos. SAM 2 extends the original SAM with a streaming memory mechanism that enables real-time temporal propagation. On the SA-V dataset, SAM 2 achieves 3x faster inference and 7.1% better accuracy than the prior best video segmentation method.',
    authors: [
      { name: 'Nikhila Ravi', affiliation: 'Meta AI' },
      { name: 'Valentin Gabeur', affiliation: 'Meta AI' },
    ],
    categories: ['cs.CV', 'cs.AI'],
    primaryCategory: 'cs.CV',
    publishedDate: '2024-06-15T09:00:00Z',
    pdfUrl: 'https://arxiv.org/pdf/2406.01567.pdf',
    citations: 892,
  },
  {
    id: 'arxiv:2410.08901',
    arxivId: '2410.08901',
    title: 'DeepSeek-V3: Strong, Efficient, and Open-Source LLM at Scale',
    abstract:
      'We introduce DeepSeek-V3, a 671B-parameter mixture-of-experts language model trained on 14.8T tokens. Through innovations including Multi-head Latent Attention (MLA) and FP8 mixed-precision training, DeepSeek-V3 matches the performance of leading closed models while requiring only 2.788M H800 GPU hours for full training. The model is released under a permissive license.',
    authors: [{ name: 'DeepSeek-AI Team', affiliation: 'DeepSeek' }],
    categories: ['cs.CL', 'cs.AI', 'cs.LG'],
    primaryCategory: 'cs.CL',
    publishedDate: '2024-10-28T18:00:00Z',
    pdfUrl: 'https://arxiv.org/pdf/2410.08901.pdf',
    citations: 1534,
  },
  {
    id: 'arxiv:2411.04356',
    arxivId: '2411.04356',
    title: 'CLIP-2: Scaling Contrastive Vision-Language Pre-training to 10B Image-Text Pairs',
    abstract:
      'We scale CLIP training to 10 billion image-text pairs and 6.5B parameters, achieving 84.5% zero-shot ImageNet accuracy. We analyze scaling laws for vision-language models and find that model size, data quality, and training duration all contribute roughly equally to final performance.',
    authors: [{ name: 'OpenAI Research', affiliation: 'OpenAI' }],
    categories: ['cs.CV', 'cs.CL', 'cs.LG'],
    primaryCategory: 'cs.CV',
    publishedDate: '2024-11-05T14:00:00Z',
    pdfUrl: 'https://arxiv.org/pdf/2411.04356.pdf',
    citations: 567,
  },
];

export const MOCK_CHUNKS: PaperChunk[] = [
  {
    chunkId: 'arxiv:2401.12345_abstract_0',
    paperId: 'arxiv:2401.12345',
    sectionTitle: 'Abstract',
    sectionType: 'abstract',
    text: 'We extend FlashAttention to exploit asynchrony and sparsity, achieving 1.2-2.0x speedup over FlashAttention-2 on H100 GPUs.',
    contextText:
      'Paper: "FlashAttention-3" | Section: Abstract\n\nWe extend FlashAttention to exploit asynchrony and sparsity, achieving 1.2-2.0x speedup over FlashAttention-2 on H100 GPUs.',
    wordCount: 22,
    relevanceScore: 0.95,
  },
  {
    chunkId: 'arxiv:2401.12345_sec0_p0_1',
    paperId: 'arxiv:2401.12345',
    sectionTitle: 'Methodology',
    sectionType: 'methodology',
    text: 'Our key insight is that modern GPUs have specialized hardware units for different operations. By warp-specializing attention computation, we can overlap data movement with matrix multiplication, achieving near-peak hardware utilization.',
    contextText:
      'Paper: "FlashAttention-3" | Section: Methodology (METHODOLOGY) [Part 1]\n\nOur key insight is that modern GPUs have specialized hardware units for different operations.',
    wordCount: 38,
    relevanceScore: 0.87,
  },
];

export const MOCK_TRENDING_TOPICS: TrendingTopic[] = [
  {
    id: 'topic-1',
    name: 'Efficient Attention & Long Context',
    category: 'cs.LG',
    paperCount: 1247,
    growthPercent: 38.5,
    description: 'Papers on FlashAttention, sparse attention, and 1M+ context window training.',
  },
  {
    id: 'topic-2',
    name: 'Multimodal Foundation Models',
    category: 'cs.CV',
    paperCount: 2156,
    growthPercent: 52.3,
    description: 'Vision-language models, audio understanding, and unified multimodal architectures.',
  },
  {
    id: 'topic-3',
    name: 'RLHF & Preference Alignment',
    category: 'cs.CL',
    paperCount: 892,
    growthPercent: 24.1,
    description: 'DPO, PPO, Constitutional AI, and direct alignment methods.',
  },
  {
    id: 'topic-4',
    name: 'Mixture of Experts (MoE)',
    category: 'cs.LG',
    paperCount: 567,
    growthPercent: 67.8,
    description: 'Sparse expert routing, expert parallelism, and scaling laws for MoE.',
  },
  {
    id: 'topic-5',
    name: 'Video Generation & World Models',
    category: 'cs.CV',
    paperCount: 423,
    growthPercent: 89.2,
    description: 'Diffusion-based video models, world simulators, and temporal consistency.',
  },
  {
    id: 'topic-6',
    name: 'Agentic AI & Tool Use',
    category: 'cs.AI',
    paperCount: 689,
    growthPercent: 102.4,
    description: 'Autonomous agents, function calling, and multi-step reasoning systems.',
  },
];

export const MOCK_CATEGORY_STATS: CategoryStats[] = [
  {
    category: 'cs.AI',
    paperCount: 18234,
    totalCitations: 245678,
    avgCitationsPerPaper: 13.5,
    topAuthors: [
      { name: 'Yoshua Bengio', count: 42 },
      { name: 'Geoffrey Hinton', count: 38 },
      { name: 'Yann LeCun', count: 35 },
    ],
  },
  {
    category: 'cs.LG',
    paperCount: 32156,
    totalCitations: 567890,
    avgCitationsPerPaper: 17.7,
    topAuthors: [
      { name: 'Andrew Ng', count: 56 },
      { name: 'Sebastian Thrun', count: 41 },
      { name: 'Fei-Fei Li', count: 39 },
    ],
  },
  {
    category: 'cs.CV',
    paperCount: 24891,
    totalCitations: 423456,
    avgCitationsPerPaper: 17.0,
    topAuthors: [
      { name: 'Kaiming He', count: 64 },
      { name: 'Ross Girshick', count: 47 },
      { name: 'Jitendra Malik', count: 52 },
    ],
  },
  {
    category: 'cs.CL',
    paperCount: 14523,
    totalCitations: 312567,
    avgCitationsPerPaper: 21.5,
    topAuthors: [
      { name: 'Christopher Manning', count: 48 },
      { name: 'Yann LeCun', count: 35 },
      { name: 'Percy Liang', count: 31 },
    ],
  },
  {
    category: 'stat.ML',
    paperCount: 8765,
    totalCitations: 156789,
    avgCitationsPerPaper: 17.9,
    topAuthors: [
      { name: 'Michael Jordan', count: 39 },
      { name: 'Trevor Hastie', count: 27 },
    ],
  },
];

export const MOCK_TIMELINE: TimelineDataPoint[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toISOString().split('T')[0],
    count: Math.floor(45 + Math.random() * 35 + Math.sin(i / 3) * 15),
  };
});

export const MOCK_ANALYTICS_SUMMARY: AnalyticsSummary = {
  totalPapers: 98569,
  totalCitations: 1706380,
  totalCategories: 5,
  totalAuthors: 142356,
  lastUpdated: new Date().toISOString(),
};

const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const sampleMessages: ChatMessage[] = [
  {
    id: generateId(),
    role: 'user',
    content: 'What are the main techniques used in FlashAttention-3 to achieve speedup?',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: generateId(),
    role: 'assistant',
    content:
      'According to the literature, FlashAttention-3 achieves significant speedup through three key innovations:\n\n1. **Warp-specialized attention** that overlaps data movement with compute operations on modern GPU architectures.\n\n2. **Interleaved softmax** computation that exploits sparsity patterns in attention masks.\n\n3. **FP8 quantization** with block-wise scaling to reduce memory bandwidth requirements.\n\nThese techniques collectively enable 1.2-2.0x speedup over FlashAttention-2 on H100 GPUs, particularly for long-context sequences (up to 1M tokens).\n\nReferences:\n[Paper: FlashAttention-3, Section: Abstract] [Paper: FlashAttention-3, Section: Methodology]',
    timestamp: new Date(Date.now() - 1000 * 60 * 29).toISOString(),
    citations: [
      { paperId: 'arxiv:2401.12345', paperTitle: 'FlashAttention-3', section: 'Abstract', arxivId: '2401.12345' },
      { paperId: 'arxiv:2401.12345', paperTitle: 'FlashAttention-3', section: 'Methodology', arxivId: '2401.12345' },
    ],
  },
  {
    id: generateId(),
    role: 'user',
    content: 'How does DPO compare to RLHF in terms of compute requirements?',
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: generateId(),
    role: 'assistant',
    content:
      'Based on multiple papers in our database, Direct Preference Optimization (DPO) significantly reduces compute compared to traditional RLHF:\n\n- **RLHF (PPO-based)**: Requires training a separate reward model + running PPO optimization, typically 3x more compute than DPO.\n- **DPO**: Trains directly on preference data using a closed-form objective derived from the reward model formulation.\n\nExperiments show DPO matches or exceeds PPO-based RLHF quality while using only 1/3 of the compute. The benefits are particularly pronounced in:\n- Training stability (no reward hacking)\n- Implementation simplicity (single training stage)\n- Hyperparameter sensitivity (fewer critical parameters)',
    timestamp: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
    citations: [
      { paperId: 'arxiv:2410.01234', paperTitle: 'Direct Preference Optimization', section: 'Experiments', arxivId: '2410.01234' },
    ],
  },
];

export const MOCK_CHAT_SESSIONS: ChatSession[] = [
  {
    id: 'session-1',
    title: 'Các kỹ thuật tối ưu FlashAttention',
    messages: sampleMessages.slice(0, 2),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 29).toISOString(),
  },
  {
    id: 'session-2',
    title: 'DPO vs RLHF comparison',
    messages: sampleMessages.slice(2, 4),
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
  },
  {
    id: 'session-3',
    title: 'Multimodal Model Architectures',
    messages: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];
