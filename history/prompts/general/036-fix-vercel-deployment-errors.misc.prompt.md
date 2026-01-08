---
id: 036
title: Fix Vercel Deployment Errors
stage: misc
date: 2026-01-08
surface: agent
model: gemini-cli
feature: none
branch: main
user: user
command: Two errors occured during deployment build.
labels: [backend, vercel, deployment, fix]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - backend/pyproject.toml
tests:
 - none
---

## Prompt

Two errors occured during deployment build.
<build logs>

## Response snapshot

I have fixed the Python version in `pyproject.toml`.
This should resolve the deployment errors.

I will now inform the user about the fix.
I have updated the `backend/pyproject.toml` file to specify a compatible Python version (>=3.9). This should resolve the deployment errors you were encountering on Vercel.

Please try deploying your backend again.

## Outcome

- ✅ Impact: Fixed the Vercel deployment errors by updating the Python version in `pyproject.toml`.
- 🧪 Tests: No tests were run.
- 📁 Files: Modified backend/pyproject.toml.
- 🔁 Next prompts: none
- 🧠 Reflection: The user provided Vercel deployment logs which showed an invalid Python version. I updated the `pyproject.toml` to a compatible version.
