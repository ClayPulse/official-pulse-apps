---
name: Agentic Web Search
description: Searches the web for a given query and returns a comprehensive, well-structured summary synthesized from multiple sources.
---

## Overview
This skill performs an agentic web search using Claude's built-in web search tool. It searches multiple relevant sources and synthesizes the information into a clear, comprehensive summary.

## What this skill does
This skill defines an App Action called `webSearch` that takes a `query` string as input. It calls the `/server-function/web-search` endpoint, which uses Claude with the web search tool to find and summarize information. The action returns the summary text and the list of URLs that were searched.
