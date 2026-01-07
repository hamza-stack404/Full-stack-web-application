
---
id: 012
title: Running Application Endpoints
stage: general
date_iso: 2026-01-05
surface: agent
model: gemini-1.5-pro
feature: none
branch: main
user: 
command: 
labels: ["application_status", "endpoints"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files_yaml:
  - 
tests_yaml:
  - 
prompt_text: |
  tell me where they are running
RESPONSE_TEXT: |
  The backend application is running on `http://localhost:8000`. You can access its API documentation at `http://localhost:8000/docs`.

  The frontend application is typically running on `http://localhost:3000`.
