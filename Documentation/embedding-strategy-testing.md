# MAGIS RAG Strategy Testing Framework

## Overview

This document outlines a comprehensive testing framework to optimize MAGIS's retrieval-augmented generation (RAG) system. We'll evaluate different embedding models, search strategies, and architectural decisions to find the optimal configuration for conversational AI memory retrieval.

## Current Architecture Analysis

MAGIS currently uses a sophisticated hybrid memory system with rich metadata:

### Existing Memory Schema
```typescript
memories: {
  // Content
  content: string,           // Main text for semantic search
  summary: string,           // AI-generated summary
  
  // Metadata for filtering
  context: string,           // 'work', 'personal', 'family'
  memoryType: string,        // 'fact', 'preference', 'experience', 'skill', 'relationship'
  importance: number,        // 1-10 importance scoring
  sentiment: number,         // -1 to 1 emotional tone
  
  // Structured entities
  entities: string[],        // People, places, things
  keywords: string[],        // Extracted keywords
  
  // Vector search
  embedding: number[],       // Currently 1536 dims (OpenAI ada-002)
  
  // Lifecycle
  isActive: boolean,
  accessCount: number,
  createdAt: number
}
```

### Current Issues
- **Mock embeddings**: Using `new Array(1536).fill(0.1)` placeholder data
- **No semantic search**: Pure metadata filtering only
- **Storage inefficiency**: 1536-dimensional embeddings

## Testing Matrix

### Configuration Variables

#### 1. Embedding Models (2 options)
- **Voyage-3.5-lite (int8)**: 1024 dimensions, int8 quantization
- **Voyage-3.5-lite (binary)**: 1024 dimensions, binary quantization

#### 2. Search Strategies (2 options)
- **Pure Metadata**: Keywords + entities + context filtering only
- **Metadata + Semantic**: Hybrid approach with vector similarity

#### 3. Chunking Strategies (2 options)
- **No Chunking**: Current message-level granularity
- **With Chunking**: Experience-level semantic chunking

#### 4. Reranking (Optional)
- **Voyage Reranker**: For top-performing configurations

### Test Configurations

| Config | Embedding | Search Strategy | Chunking | Description |
|--------|-----------|----------------|----------|-------------|
| A1 | Voyage int8 | Pure Metadata | No Chunk | Baseline metadata-only |
| A2 | Voyage int8 | Metadata + Semantic | No Chunk | Current architecture enhanced |
| A3 | Voyage int8 | Pure Metadata | Chunked | Metadata with experience chunks |
| A4 | Voyage int8 | Metadata + Semantic | Chunked | Full hybrid with chunking |
| B1 | Voyage binary | Pure Metadata | No Chunk | Ultra-fast binary search |
| B2 | Voyage binary | Metadata + Semantic | No Chunk | Binary semantic hybrid |
| B3 | Voyage binary | Pure Metadata | Chunked | Binary with chunking |
| B4 | Voyage binary | Metadata + Semantic | Chunked | Full binary hybrid |

**Total: 8 configurations to evaluate**

## Test Suite Design

### 20-Question MAGIS Memory Test

#### Context Switching (Questions 1-5)
1. "What did I mention about my dentist appointment?" (Personal context)
2. "Who was in the meeting yesterday?" (Work context)
3. "What time does my daughter's soccer practice start?" (Family context)
4. "Did I prefer the Italian or Mexican restaurant?" (Preference memory)
5. "What health issues have I mentioned?" (Cross-context medical)

#### Temporal Queries (Questions 6-10)
6. "What happened after my doctor visit last month?"
7. "What tasks did I complete this week?"
8. "What meetings do I have coming up?"
9. "When did I last talk about my vacation plans?"
10. "What was my mood like during the project deadline?"

#### Entity-Based Retrieval (Questions 11-15)
11. "Everything about John from accounting"
12. "All mentions of my car maintenance"
13. "What restaurants have I tried recently?"
14. "Any conversations about my mother"
15. "All work-related stress discussions"

#### Complex Semantic Queries (Questions 16-20)
16. "Times when I felt overwhelmed at work"
17. "Positive experiences with healthcare providers"
18. "Decisions I'm still thinking about"
19. "Things I want to remember for next year"
20. "Patterns in my evening routine"

### Evaluation Metrics

#### Accuracy Metrics
- **Precision**: Relevant results / Total returned results
- **Recall**: Relevant results / Total relevant in database
- **F1-Score**: Harmonic mean of precision and recall
- **Mean Reciprocal Rank (MRR)**: Quality of top result ranking

#### Performance Metrics
- **Query Latency**: Time to retrieve and rank results
- **Storage Efficiency**: Memory footprint per embedding
- **Index Build Time**: Time to process and store new memories
- **Throughput**: Queries per second under load

#### Cost Metrics
- **Embedding Generation Cost**: Per 1M tokens
- **Storage Cost**: Per GB of vector data
- **Query Cost**: Computational cost per search
- **Total Cost of Ownership**: Monthly operational cost

## Implementation Strategy

### Phase 1: Infrastructure Setup
1. Install Voyage AI SDK
2. Configure environment variables
3. Update schema for 1024-dimensional embeddings
4. Implement configuration switching system

### Phase 2: Baseline Implementation
1. Replace mock embeddings with Voyage-3.5-lite int8
2. Implement pure metadata search
3. Add hybrid metadata + semantic search
4. Create chunking pipeline

### Phase 3: Testing Framework
1. Build automated test harness
2. Implement 20-question test suite
3. Add performance monitoring
4. Create comparison dashboard

### Phase 4: Optimization
1. Test all 8 configurations
2. Analyze results and identify winners
3. A/B test top 2-3 configurations with real users
4. Deploy optimal configuration

## Expected Outcomes

### Hypothesis 1: Metadata + Semantic Wins
- **Prediction**: Hybrid search will outperform pure metadata
- **Reasoning**: Semantic understanding captures nuanced queries
- **Risk**: Higher latency and cost

### Hypothesis 2: int8 vs Binary Trade-off
- **Prediction**: int8 higher quality, binary faster
- **Reasoning**: Quantization reduces precision but improves speed
- **Decision**: Choose based on quality threshold

### Hypothesis 3: Chunking Benefits
- **Prediction**: Experience-level chunks improve context relevance
- **Reasoning**: Better granularity for temporal and thematic queries
- **Risk**: Increased complexity and storage

## Success Criteria

### Must Have (P0)
- ✅ F1-Score > 0.85 on 20-question test
- ✅ Query latency < 200ms for 95th percentile
- ✅ 50%+ improvement over pure metadata baseline

### Should Have (P1)
- ✅ 33% storage reduction (1024 vs 1536 dims)
- ✅ Cost < $0.20 per 1000 queries
- ✅ Real-time memory updates

### Nice to Have (P2)
- ✅ Sub-100ms latency for metadata-only queries
- ✅ Automatic model switching based on query type
- ✅ User satisfaction > 90% in blind testing

## Implementation Timeline

- **Week 1**: Infrastructure and Voyage integration
- **Week 2**: Core search implementations
- **Week 3**: Testing framework and evaluation
- **Week 4**: Optimization and deployment

## Risk Mitigation

### Technical Risks
- **Embedding migration**: Plan backward compatibility
- **Performance regression**: Implement circuit breakers
- **Cost overrun**: Set usage monitoring and limits

### Product Risks
- **User experience degradation**: A/B test carefully
- **Data loss**: Implement rollback procedures
- **Latency spikes**: Have metadata-only fallback

## Conclusion

This testing framework will provide data-driven insights to optimize MAGIS's RAG architecture. By systematically evaluating embedding models, search strategies, and chunking approaches, we'll identify the configuration that best balances quality, speed, and cost for conversational AI memory retrieval.

The framework is designed to answer the key question: **What combination brings the best quality on record and retrieve info with the highest accuracy, speed with the lowest cost possible?**

By systematically testing across the quality-speed-cost optimization space, we'll identify the Pareto-optimal configuration that maximizes memory retrieval effectiveness while minimizing operational overhead for production deployment.