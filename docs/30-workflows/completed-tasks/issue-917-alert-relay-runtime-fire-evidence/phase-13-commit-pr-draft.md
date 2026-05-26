---
phase: 13
title: Commit / PR Draft
workflow_id: issue-917-alert-relay-runtime-fire-evidence
status: draft
---

# Phase 13: Commit / PR Draft — alert relay runtime fire evidence

[実装区分: 実装 + ドキュメント]

判定根拠: 本サイクルは実装 + ドキュメント。commit は仕様書一式と relay POST responseStatus logging の最小実装を含む。PR base は `dev`。runtime evidence MD / issue-857 update は後続サイクルで別 commit。

## 1. ブランチ命名

- `docs/issue-917-alert-relay-runtime-fire-evidence`

## 2. コミット分割案

CONST_007（1 サイクル完了前提）に基づき、本サイクルは 1 commit に集約:

1. `fix(api): log alert relay response status for runtime evidence (Refs #917)` — Phase 1-13 + outputs/phase-{11,12} + artifacts.json (root/output) + responseStatus logging

各コミットの末尾に:

```
Refs: #917
Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

> issue #917 は **クローズドのまま**運用する。`Closes` ではなく `Refs: #917`（参照のみ）を用い、再オープンや自動クローズを誘発しない。

## 3. PR 草案

### 3.1 base / head

- base: `dev`
- head: `docs/issue-917-alert-relay-runtime-fire-evidence`

### 3.2 タイトル

```
fix(api): log alert relay response status for runtime evidence
```

### 3.3 本文テンプレ

```md
## Summary

- issue #917（`UT-25-DERIV-02-FU-02-alert-relay-runtime-fire-evidence`）の Phase 1-13 タスク仕様書を `docs/30-workflows/completed-tasks/issue-917-alert-relay-runtime-fire-evidence/` に新規 draft
- `postAlertRelay()` 成功/401 応答を `event: "sheets.auth.alert_relay_post"` / `responseStatus` としてログ化し、runtime tail evidence を取得可能にする
- 残作業（staging deploy 後 tail / SA 資格情報失効 dry-run / evidence MD 作成 / issue-857 implementation-guide 更新）はすべて user-gated runtime として後続サイクルで実施

Refs: #917
Workflow: `docs/30-workflows/completed-tasks/issue-917-alert-relay-runtime-fire-evidence/`
Upstream: `docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/`
Parent: `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/`
Related (受信側 smoke・重複回避): `docs/30-workflows/unassigned-task/ut-17-followup-001-alert-relay-runtime-smoke-evidence.md`

## 実装区分

[実装区分: 実装 + ドキュメント] — CONST_009 再判定。判定根拠:
1. wiring 系コードは issue-857 で投入済み
2. 受信側 / 送信側 token 解決は不変
3. responseStatus logging がなければ AC-4 の tail evidence が実行不能だったため、最小コード変更を含める
4. 残る Cloudflare runtime 観測 + evidence MD + 逆参照更新は user-gated

## Scope

| 含む | 含まない |
| --- | --- |
| Phase 1-13 仕様書 + outputs/phase-{11,12} + artifacts.json (root/output) / SCOPE.md / index.md / relay POST responseStatus logging | `apps/api/wrangler.toml` 編集 / 新規 secret 投入 / 受信 middleware 変更 / 実 runtime 取得（後続サイクル） |

## 不変条件

- [x] `wrangler` 直接実行コマンドが仕様書本文に存在しない（必ず `bash scripts/cf.sh` 経由）
- [x] 実 secret 値・token 値が仕様書本文に存在しない
- [x] 元 unassigned-task spec を本サイクルで削除・移動しない（runtime 完了サイクルで consumed 化）
- [x] issue #917 を `Refs #917` で扱う（`Closes` ではない）
- [x] PR base = `dev`
- [x] taskType: implementation / visualEvidence: NON_VISUAL / implementation_mode: runtime_observation

## Test plan

- [ ] `mise exec -- pnpm gate-metadata:validate`（OK 件数増・ERROR 0）
- [ ] `mise exec -- pnpm verify:phase12-compliance`（PASS）
- [x] `pnpm exec vitest run apps/api/src/scheduled/sheets-auth-healthcheck.contract.spec.ts --root=. --config=vitest.config.ts`（8 tests PASS）
- [ ] `mise exec -- pnpm indexes:rebuild` × 2（1 回目で diff・2 回目で diff なし＝冪等）
- [ ] `bash scripts/verify-pr-ready.sh`（runtime observability gate 一括）

> NON_VISUAL タスクのためスクリーンショットは作成しない。typecheck / lint / vitest は最小コード変更ありのため本 PR の必須 gate ではないが、CI lane で既存テストは継続実行される。

## Evidence

`docs/30-workflows/completed-tasks/issue-917-alert-relay-runtime-fire-evidence/phase-11-evidence-inventory.md` を参照。本 PR 時点では runtime evidence は pending（user-gated）。

## Rollback

`docs/30-workflows/completed-tasks/issue-917-alert-relay-runtime-fire-evidence/` ディレクトリを削除して revert すれば即時復元（破壊的変更なし）。

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 4. PR 作成コマンド（user 承認後のみ）

```bash
gh pr create --base dev --head docs/issue-917-alert-relay-runtime-fire-evidence \
  --title "fix(api): log alert relay response status for runtime evidence" \
  --body-file docs/30-workflows/completed-tasks/issue-917-alert-relay-runtime-fire-evidence/outputs/phase-13/pr-body.md
```

> `outputs/phase-13/` 配下の `pr-body.md` 作成は PR を実際に出すタイミングで行う（本サイクルの仕様書ファイル一覧には含めない）。

## 5. ガード

- 本ワークフロー仕様作成段階では **commit / push / PR 作成は実行しない**
- 実 commit / push / PR はユーザー明示承認後のみ
- runtime evidence 取得（staging deploy / tail / SA dry-run）は別 user-gated サイクル
- issue #917 は **クローズドのまま**。`Closes #917` ではなく `Refs: #917` を用いる
