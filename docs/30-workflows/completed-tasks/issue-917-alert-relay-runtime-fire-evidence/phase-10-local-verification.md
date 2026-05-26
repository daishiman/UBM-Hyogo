---
phase: 10
title: Local Verification
workflow_id: issue-917-alert-relay-runtime-fire-evidence
status: completed
---

# Phase 10: Local Verification — alert relay runtime fire evidence

[実装区分: 実装 + ドキュメント]

判定根拠: runtime observability hardening サイクルのため、docs gate 3 種に加えて focused contract test で `responseStatus` logging を固定する。

## 1. ローカル検証コマンド列（本サイクル・runtime observability）

```bash
# 0. Node 24 環境確認（CLAUDE.md）
node -v   # v24.15.0 でなければ mise exec -- を前置

# 1. 仕様書 metadata 検証（artifacts.json zod schema）
mise exec -- pnpm gate-metadata:validate

# 2. Phase 12 canonical 9 headings / strict 7 outputs 検証
mise exec -- pnpm verify:phase12-compliance

# 3. skill indexes 再生成（1 回目で生成 / 2 回目で diff なしを期待）
mise exec -- pnpm indexes:rebuild
git diff --stat .claude/skills/aiworkflow-requirements/indexes/
mise exec -- pnpm indexes:rebuild
git diff --stat .claude/skills/aiworkflow-requirements/indexes/   # 2 回目: 期待は空（冪等）

# 4. focused contract test
pnpm exec vitest run apps/api/src/scheduled/sheets-auth-healthcheck.contract.spec.ts --root=. --config=vitest.config.ts

# 5. PR pre-flight（user-gated PR 直前のみ）
bash scripts/verify-pr-ready.sh
```

## 2. 期待結果

| # | 期待 |
| --- | --- |
| 1 | OK 件数増（本 workflow 追加分）、ERROR: 0 |
| 2 | PASS（canonical 9 headings / Phase 11 evidence 表 / workflow root scan 全て充足） |
| 3 | 1 回目で diff あり（新 workflow を index 化）、2 回目で diff なし（冪等） |
| 4 | 8 tests PASS（relay POST 200 / 401 responseStatus logging contract） |
| 5 | `verify:phase12-compliance` / `gate-metadata:validate` / `indexes:rebuild` drift いずれも green |

## 3. runtime 検証（後続 user-gated サイクル）

> 実 deploy / secret list / tail / SA 資格情報失効 dry-run は user 承認後のみ実行。CLI は `scripts/cf.sh` 経由限定（CLAUDE.md）。

```bash
# (A) Secret name presence（値は表示しない）
bash scripts/cf.sh secret list --env staging
bash scripts/cf.sh secret list --env production   # 実施範囲は deploy ポリシー次第

# (B) 不在時のみ投入（user-gated・1Password 正本値を op 参照で）
bash scripts/cf.sh secret put --env staging CF_WEBHOOK_AUTH_SECRET

# (C) staging 再 deploy
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging

# (D) deploy 後 tail（別シェル・15 分以上保持）
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging --format pretty
# → event: "sheets.auth.alert_relay_skipped" が出ないことを確認

# (E) SA 資格情報失効 dry-run（親 UT-25-DERIV-02 Phase 11 手順を参照）
#     dry-run 中 tail で event: "sheets.auth.alert_relay_post" / responseStatus: 200 を観測
#     終了後は速やかに SA 権限を復元する

# (F) evidence MD 内 secret 漏洩セルフチェック
grep -rEi "(eyJ|sk_|ghp_|AKIA|CF_WEBHOOK_AUTH_SECRET=)" \
  docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/outputs/phase-11/evidence/alert-relay-fire-staging.md
# 期待: 0 hits
```

## 4. NON_VISUAL 宣言

本タスクは API runtime observability と docs のみで UI/UX 変更を一切伴わないため、Phase 11 のスクリーンショットは不要。代替証跡は focused contract test、コマンド出力（gate-metadata / verify:phase12 / indexes:rebuild diff）と後続サイクルの staging tail ログ / secret list / relay POST 到達ステータスとする。

## 5. fail path

- `gate-metadata:validate` ERROR → `artifacts.json` / `outputs/artifacts.json` の `metadata.gates[].evidence_path` が repo 内に実在するか確認。実在しない path を指していると ERROR。
- `verify:phase12-compliance` FAIL → `phase-12-compliance-check.md` の 9 headings 表と `outputs/phase-12/` strict 7 ファイルの存在を再確認。
- `indexes:rebuild` 2 回目で diff → 自動生成 index 内の手動編集 / 別 workflow drift が混入している。`pnpm sync:check` 等で前提状態を点検。
- runtime evidence MD で grep が secret らしき文字列を hit → 直ちに該当行を `<redacted>` 置換しコミット前に修復。
