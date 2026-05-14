# Skill Feedback Report

## Template Improvement

`task-specification-creator` should make `outputs/phase-12/main.md` explicit in docs-only / NON_VISUAL examples. The current task initially listed 6 outputs while the skill now expects strict 7.

## Workflow Improvement

For `verify_existing` documentation tasks, Phase 5 should say "materialize the documentation artifact" instead of "no impl yet" when the main deliverable is a markdown file. Documentation artifacts are implementation for docs-only tasks.

## Documentation Improvement

When a parent workflow has moved under `completed-tasks/`, child task templates should require a root-existence gate before writing canonical paths. This prevents stale live-root references.
