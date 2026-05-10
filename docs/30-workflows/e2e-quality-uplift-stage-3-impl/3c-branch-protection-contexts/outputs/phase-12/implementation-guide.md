# Implementation Guide

3c applies the required status check context set after 3a and 3b have registered their checks.

Expected runtime evidence:

- `outputs/phase-11/branch-protection-dev-pre.json`
- `outputs/phase-11/branch-protection-dev-post.json`
- `outputs/phase-11/branch-protection-main-pre.json`
- `outputs/phase-11/branch-protection-main-post.json`
- `outputs/phase-11/check-runs.txt`

Until those files are fresh runtime evidence, the workflow remains `spec_created / runtime_pending`.
