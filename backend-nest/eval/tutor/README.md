# Tutor RAG eval

Measures retrieval and answer quality separately for the Week 7 tutor.

## Run

```bash
# Requires Atlas (vector search) + the vector index provisioned:
npm run atlas:create-index
npm run eval:tutor
```

## What it does

1. Ingests every file in `corpus/` for a throwaway eval user.
2. For each question in `qa-pairs.json`:
   - **Retrieval recall** — was the expected source document among the top-K
     retrieved chunks?
   - **Answer quality** — did the generated answer contain the expected facts?
3. Prints a per-question RET/ANS line and a summary with both percentages.

`qa-pairs.json` holds 12 question / expected-source pairs across three topics
(photosynthesis, HTTP, MongoDB).
