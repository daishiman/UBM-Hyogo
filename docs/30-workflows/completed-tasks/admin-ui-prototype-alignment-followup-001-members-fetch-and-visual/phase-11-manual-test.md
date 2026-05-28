---
spec_classification: implementation_spec
state: spec_created
phase: 11
phase_name: 手動テスト / runtime evidence
---

# Phase 11 — 手動テスト / runtime evidence

親 workflow trace: followup-001 of `docs/30-workflows/admin-ui-prototype-alignment/`。

## 目的

staging deploy 後に AC-1 / AC-8 / AC-9 を runtime で検証し、evidence を `outputs/phase-11/evidence/` に物理配置する。

## 前提と入力

- staging URL: `https://ubm-hyogo-web-staging.daishimanju.workers.dev`
- admin login: CLAUDE.md memory「UBM-Hyogo テストアカウント」(`manjumoto.daishi@senpai-lab.com`)
- staging deploy: `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`（user-gated）+ 404 root cause が apps/api 側起因なら `apps/api` も同様に deploy

## 作業手順

1. staging へ apps/web (+ 必要なら apps/api) を deploy
2. admin で staging `/admin/members` を開き、200 + 一覧描画を確認
3. browser DevTools で network tab を取り、`GET /api/admin/members` が 200 で返っていることを確認
4. 行 1 件クリック → drawer 展開 → VISIBILITY / TAGS / FORM RESPONSE / footer 3 button を確認
5. `playwright-smoke.yml` を `workflow_dispatch` で起動して `staging-visual` job の baseline PNG を生成
6. CI artifact から PNG 2 枚を download し、snapshot dir と `outputs/phase-11/evidence/` の両方に配置

## 成果物 — Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| manual test result | outputs/phase-11/evidence-inventory.md | pending |
| screenshot (members list aligned) | outputs/phase-11/evidence/admin-members-list-aligned-staging-visual-chromium-linux.png | pending |
| screenshot (members drawer aligned) | outputs/phase-11/evidence/admin-members-drawer-aligned-staging-visual-chromium-linux.png | pending |
| staging GET /admin/members trace | outputs/phase-11/evidence/admin-members-200.log | pending |
| typecheck log | outputs/phase-11/evidence/typecheck.log | pending |
| lint log | outputs/phase-11/evidence/lint.log | pending |
| verify-pr-ready log | outputs/phase-11/evidence/verify-pr-ready.log | pending |
| staging-visual run log | outputs/phase-11/evidence/staging-visual-run.log | pending |

## 完了条件 (DoD)

- AC-1 / AC-8 / AC-9 が runtime で PASS
- 上記 evidence のうち少なくとも `admin-members-200.log` と 2 screenshot が `present`

## 検証コマンド

```bash
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
curl -fsS -H "Cookie: $STAGING_SESSION" https://ubm-hyogo-web-staging.daishimanju.workers.dev/api/admin/members -o outputs/phase-11/evidence/admin-members-200.log
gh workflow run playwright-smoke.yml -f staging_visual_member_detail_id=<id>
```

## 想定リスク

| リスク | 緩和策 |
|--------|--------|
| staging seed に member 0 件 | seed 投入後に dispatch を再実行 |
| baseline PNG 差分が大きい | `--update-snapshots` で初回 commit。以降の差分は visual diff で監査 |

## ロールバック

- staging には previous bundle が残るため `bash scripts/cf.sh rollback <VERSION_ID> --config apps/web/wrangler.toml --env staging`

## 関連 spec

- `phase-10-final-review.md`
- `phase-12-documentation.md`
