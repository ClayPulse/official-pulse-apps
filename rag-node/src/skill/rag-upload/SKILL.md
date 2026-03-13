---
name: RAG Upload
description: Upload a document file to a Pinecone vector index. Parses the file, chunks the text, and upserts vectors with metadata.
---

## Overview
This skill uploads a document file to a Pinecone vector index. It accepts a file (as base64-encoded content), parses it into text, splits it into chunks, and upserts each chunk as a vector record into the specified Pinecone index.

## What this skill does
Takes a base64-encoded file with its filename, an index name, and an optional namespace. The backend parses the file content into plain text, splits it into manageable chunks, and upserts each chunk into the specified Pinecone index using Pinecone's integrated embedding model.
