# Phase 11: Evidence canonical paths

## 11.1 NON_VISUAL evidence set

| 種別 | path | 取得コマンド |
| --- | --- | --- |
| baseline arch | `outputs/phase-11/evidence/baseline-arch.txt` | `node -e "console.log(process.platform, process.arch, os.cpus()[0].model)"` |
| baseline spawn trace | `outputs/phase-11/evidence/baseline-spawn-trace.txt` | Phase 1 で記録した `child_process.spawn` フック出力 |
| baseline esbuild versions | `outputs/phase-11/evidence/baseline-esbuild-versions.txt` | `host`, `bin --version`, `pnpm-lock.yaml` grep の 3 値 |
| post-fix arch | `outputs/phase-11/evidence/post-arch.txt` | `pnpm verify:node-arch` stdout + exit code。現在のローカル Node は x64 のため blocker evidence として保存 |
| post-fix isolation | `outputs/phase-11/evidence/post-isolation.txt` | `pnpm verify:worktree-isolation` exit 0 + stdout |
| post-fix version | `outputs/phase-11/evidence/post-esbuild.txt` | `pnpm verify:esbuild` exit 0 + stdout |
| focused vitest A | `outputs/phase-11/evidence/vitest-parallel09-primitives.txt` | `pnpm test:parallel09-primitives` の全出力 |
| focused vitest B | `outputs/phase-11/evidence/vitest-useAdminMutation.txt` | `pnpm test:parallel09-use-admin-mutation` の全出力 |
| typecheck | `outputs/phase-11/evidence/typecheck.txt` | `pnpm typecheck` |
| lint | `outputs/phase-11/evidence/lint.txt` | `pnpm lint` |
| lefthook smoke | `outputs/phase-11/evidence/lefthook-pre-push.txt` | `lefthook run pre-push` |
| CI run url | `outputs/phase-11/evidence/ci-run-urls.txt` | PR の `verify-esbuild` workflow URL（ubuntu / macos-14 各 1） |

## 11.2 PASS 境界

- `verified_current_no_code_change` ではなく **`implemented_local_runtime_blocked_node_arch`**（実装あり + focused Vitest / esbuild parity / worktree isolation はローカル evidence あり、Node arch は x64 blocker）として扱う
- CI runtime evidence は Phase 13 でユーザー承認後に push して取得

## 11.3 完了条件（Phase 11）

- 12 種 evidence ファイルが canonical path に揃っている
- `post-arch.txt` は x64 Node blocker を明示し、PASS 根拠にしない
- いずれも `it.skip` / placeholder token を含まない
