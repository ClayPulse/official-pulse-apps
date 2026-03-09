---
name: RAG Query
description: Query a Pinecone vector index with a natural language query. Embeds the query via Pinecone Inference and returns the k most relevant documents.
---

## Overview
This skill connects to Pinecone, embeds a query string using Pinecone Inference, and retrieves the top-k most relevant documents from a specified index.

## What this skill does
Takes a query string, index name, and k value. Embeds the query using Pinecone Inference, queries the specified Pinecone index, and returns matching documents with their scores and metadata.
