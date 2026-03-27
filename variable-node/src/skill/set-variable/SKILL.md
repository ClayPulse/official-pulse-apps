---
name: Set Variable
description: Stores a value of any type and passes it through to downstream nodes in the workflow. Use this to save a variable at a specific point in the workflow.
---

## Overview
This skill saves a variable in the Pulse Editor workflow by accepting any value and passing it through unchanged. It acts as a named checkpoint for a value, making it accessible to downstream nodes.

## What this skill does
This skill defines an App Action called `set-variable` that takes a single `value` input of any type (string, number, object, array, boolean, etc.) and returns it unchanged as `value`. This allows workflows to explicitly capture and forward a value through the workflow graph.
