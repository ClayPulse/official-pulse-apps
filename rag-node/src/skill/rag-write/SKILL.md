---
name: RAG Write
description: Write documents to a Pinecone vector index. Embeds text via Pinecone Inference and upserts vectors with metadata.
---

## Overview
This skill connects to Pinecone, embeds document text using Pinecone Inference, and upserts the resulting vectors into a specified index.

## What this skill does
Takes an array of documents (each with an id, text, and optional metadata), an index name, and an optional namespace. Embeds the text using Pinecone Inference and upserts the vectors into the specified Pinecone index.
