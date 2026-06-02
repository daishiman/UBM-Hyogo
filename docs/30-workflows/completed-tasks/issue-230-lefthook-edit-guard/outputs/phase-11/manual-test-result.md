# Manual Test Result — issue-230-lefthook-edit-guard

状態: **PASS（implemented / 2026-05-31 実装サイクルで実測）**

NON_VISUAL タスク。証跡は focused vitest（12 ケース全 PASS）+ shell exit code + 実リポジトリでの guard / integrity 実行。

## 自動テスト（focused vitest）

```
mise exec -- pnpm vitest run scripts/hooks/__tests__/lefthook-edit-guard.spec.ts scripts/__tests__/verify-hook-integrity.spec.ts
→ Test Files 2 passed (2) / Tests 12 passed (12)
```

| spec | ケース | 結果 |
|------|--------|------|
| lefthook-edit-guard.spec.ts | LG-a clean repo → exit 0 | PASS |
| | LG-b lefthook.yml stage + ack無 → block（ack方法/CLAUDE.md/lefthook-operations.md を含む） | PASS |
| | LG-c lefthook.yml stage + `LEFTHOOK_EDIT_ACK=1` → exit 0 | PASS |
| | LG-d 手書き `.git/hooks/pre-commit`（署名なし）→ block | PASS |
| | LG-e `.git/hooks/pre-commit.sample` → exit 0（除外） | PASS |
| | LG-h `.old` / `.bak` バックアップ → exit 0（拡張子付きは git 非実行のため除外） | PASS |
| | LG-f lefthook 署名入り hook → exit 0（managed 除外） | PASS |
| | LG-g `MERGE_HEAD` 存在 → exit 0（sync-merge skip） | PASS |
| verify-hook-integrity.spec.ts | VI-a 参照先実在 + min_version + 引数付き run: → exit 0 | PASS |
| | VI-b 参照先 script 欠落 → exit 1（`::error::` + missing パス） | PASS |
| | VI-c min_version 行欠落 → exit 1 | PASS |
| | VI-d tracked stray hook（`hooks/pre-commit` commit済み）→ exit 1 | PASS |

## 実リポジトリでの shell 実行（受け入れ確認）

| 手順 | 期待 | 実施結果 |
|------|------|---------|
| `bash scripts/verify-hook-integrity.sh`（編集後 lefthook.yml） | exit 0 + `OK: lefthook.yml integrity verified` | **PASS**（exit 0） |
| `bash scripts/hooks/lefthook-edit-guard.sh`（clean） | exit 0 | **PASS**（exit 0） |
| 補正前に実環境 `.git/hooks/*.old` バックアップで false positive 発生 | — | 検知 → `*.*`（拡張子付き）除外へ補正し解消 |

## 補正記録（実装中に発見）

- Phase 2 設計は `.sample` のみ除外だったが、実リポジトリのメイン `.git/hooks/` に `post-merge.old` / `pre-commit.old` / `post-fetch.old` が存在し false positive が発生。
- git が実行する hook 名は拡張子を持たない（`pre-commit` 等）ため、**ドットを含むファイル名（`*.*`）は git が無視する＝offender にしない**へ一般化補正（AC-4「false positive 最小化」の趣旨に整合）。LG-h ケースを追加し回帰を防止。

## 品質ゲート

| ゲート | 結果 |
|--------|------|
| `bash -n`（guard / integrity） | PASS |
| `shellcheck`（guard / integrity） | PASS（警告なし） |
| YAML parse（workflow / lefthook.yml） | PASS |
| `pnpm typecheck`（6 pkg） | PASS |
| `pnpm lint`（6 pkg） | PASS |
