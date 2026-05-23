# Discovered Issues

No blocking issues remain in local implementation.

- `@repo/api` was stale and was replaced with `@ubm-hyogo/api`.
- Default Vitest startup hit esbuild host/binary mismatch; `ESBUILD_BINARY_PATH` project-local binary made the test command pass.
- `.log` files are ignored by repository `.gitignore`; evidence is stored as `.txt`.
