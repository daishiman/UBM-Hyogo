# Phase 6: テスト戦略

## 6.1 verify script 単体スモーク

verify script は副作用が exit code のみで、UI も I/O も持たないため Vitest spec を新規追加しない。代わりに **Step 5.1 のスモーク手順を CI step として記録** し、Phase 11 evidence とする。

## 6.2 focused Vitest 2 spec の復旧確認

既存 spec を変更しない:

- `apps/web/src/components/ui/__tests__/parallel09-primitives.component.spec.tsx`
- `apps/web/src/lib/__tests__/useAdminMutation.spec.tsx`

**判定**: 両 spec が `vitest run` 配下で exit 0。`it.skip` / `test.skip` を一切追加しない（CONST_007 と quality-gates §7 に整合）。

## 6.3 lefthook gate の動作確認

```bash
LEFTHOOK_VERBOSE=1 lefthook run pre-push
```

期待: `verify-esbuild` group が pass し、その後 lefthook が `pre-push` を継続する。

## 6.4 CI gate の動作確認

`.github/workflows/verify-esbuild.yml` を含む PR で:

- `verify-esbuild / verify (ubuntu-latest)` が pass
- `verify-esbuild / verify (macos-14)` が pass

両 job ともに focused Vitest 2 spec 実行 step が exit 0 で完了。

## 6.5 退行検知シナリオ

| 想定退行 | 検出 verify |
| --- | --- |
| 親リポジトリの esbuild が drift し worktree に漏れ込む | `verify-worktree-isolation` が fail |
| `pnpm-lock.yaml` の esbuild が更新されたが local `node_modules` 未更新 | `verify-esbuild` が fail |
| mise が Rosetta 2 経由 Node を install した | `verify-node-arch` が fail（arm64 host のみ） |
| focused Vitest が新たに skip / todo を追加した | quality-gates §7 `todo-count` step（既存 gate）で検出 |

## 6.6 完了条件（Phase 6）

- 6.1〜6.5 の検証が Phase 11 evidence にマップされている
- 新規 Vitest spec を追加しない理由が明文化されている
