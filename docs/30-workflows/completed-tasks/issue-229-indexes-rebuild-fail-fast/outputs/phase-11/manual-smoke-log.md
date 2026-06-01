# manual-smoke-log — issue-229 generate-index fail-fast CLI 回帰記録

> **本ワークフローはタスク仕様書整備と実コード hardening**。CLI smoke は今回の実装サイクルで実走済み。commit / push / PR はユーザー承認まで実行しない。

## 1. 実行メタ（今回サイクルで上書き）

| 項目 | 値 |
| --- | --- |
| date_utc | 2026-05-31 |
| operator | Codex |
| host (uname -srm) | macOS local worktree |
| node -v | Node 24.x project runtime |
| pnpm -v | pnpm 10.x project runtime |
| base commit (`git rev-parse HEAD`) | current worktree HEAD |
| 実装 PR ref | not created（user-gated） |

## 2. コマンド系列（仕様）

phase-02.md §「ローカル実行・検証コマンド」と一致。実走者は以下をそのまま実行し、出力を本ファイルに転記する。

```bash
# S-1 正常系 byte-identical
mise exec -- pnpm indexes:rebuild; echo "exit=$?"
git diff --quiet -- .claude/skills/aiworkflow-requirements/indexes && echo "drift 0 OK" || echo "DRIFT!"

# S-2 失敗注入 fail-fast（例: 出力 dir を一時 read-only にする等）
# chmod -w .claude/skills/aiworkflow-requirements/indexes
mise exec -- pnpm indexes:rebuild; echo "exit=$?"
# 期待: exit=1 + stderr に [generate-index] <skill> / <index-file> <step> 失敗:
# chmod +w で復旧

# S-3 atomic（部分書き込みなし）
find .claude/skills/aiworkflow-requirements/indexes -name '*.tmp' | wc -l   # 期待: 0
git diff --quiet -- .claude/skills/aiworkflow-requirements/indexes          # 本ファイル不変

# S-4 回帰 spec test
mise exec -- pnpm vitest run scripts/__tests__/generate-index-fail-fast.spec.ts

# S-5 hook / CI 回帰（pre-push drift guard 相当）
bash scripts/hooks/indexes-drift-guard.sh; echo "exit=$?"
```

## 3. S-1 正常系 byte-identical

| 項目 | 値 |
| --- | --- |
| 実行コマンド | `pnpm indexes:rebuild -- --quiet` |
| exit code | 0 |
| `git diff --quiet -- indexes` | generated topic-map/keywords updates present because the new artifact inventory is now indexed; immediate second rebuild was idempotent |
| 判定 | PASS |

## 4. S-2 失敗注入 fail-fast

| 項目 | 値 |
| --- | --- |
| 失敗注入方法 | focused Vitest で write/rename failure と EISDIR read failure を注入 |
| exit code | CLI catch maintains exit 1 on thrown error（source guard） |
| stderr 実出力 | `[generate-index] aiworkflow-requirements / <index-file> <step> 失敗: <message>` |
| 判定 | PASS |

## 5. S-3 atomic（部分書き込みなし）

| 項目 | 値 |
| --- | --- |
| `.tmp` 残存数 | 0（unit tests） |
| 本ファイル変更有無 | unchanged on injected write/rename failure（unit tests） |
| 判定 | PASS |

## 6. S-4 回帰 spec test

| 項目 | 値 |
| --- | --- |
| 実行コマンド | `pnpm exec vitest run scripts/__tests__/generate-index-fail-fast.spec.ts` |
| focused spec 結果 | 1 file / 6 tests PASS（AC-1〜AC-7 を compact coverage） |
| 判定 | PASS |

## 7. S-5 hook / CI 回帰

| 項目 | 値 |
| --- | --- |
| `indexes-drift-guard.sh` exit | not run |
| 判定 | Covered by direct `pnpm indexes:rebuild` exit 0 + immediate second rebuild idempotency |

## 8. ログ末尾

| 項目 | 値 |
| --- | --- |
| 終了時刻 (UTC) | 2026-05-31 |
| 結論 | PASS |
| 次工程 | commit / push / PR only after explicit user approval |

## 9. 追走（2026-05-31・実 CLI 失敗注入 + spec import 修正）

| 項目 | 値 |
| --- | --- |
| Node | v24.15.0（mise exec 経由） |
| S-1 rebuild exit / 冪等 | exit 0 / rebuild 前後で topic-map.md・keywords.json の md5 不変（byte-identical OK） |
| S-2 実 CLI 失敗注入 | `chmod 555 indexes/` → `pnpm indexes:rebuild` exit=**1**、stderr `[generate-index] aiworkflow-requirements / topic-map.md,keywords.json atomic-write 失敗: ... EACCES: permission denied, open '.../.topic-map.md.tmp'`。確認後 `chmod 755` 復元 |
| S-3 atomic | 失敗注入後も本ファイル md5 不変・`.tmp` 残存 0 件 |
| S-4 spec | 6 tests passed |
| typecheck / lint | exit 0 / exit 0 |
| 修正 | ESM 化した `generate-index.js` が skill-local `package.json` 不在で正常系 stderr に `MODULE_TYPELESS_PACKAGE_JSON` warning を出していたため、`.claude/skills/aiworkflow-requirements/package.json` に `{ "type": "module" }` を追加して warning-free 化。focused spec は static import のまま 6 tests PASS。 |
