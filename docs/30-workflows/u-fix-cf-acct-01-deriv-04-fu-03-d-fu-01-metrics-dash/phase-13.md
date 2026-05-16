# Phase 13: - PR 作成

[実装区分: 実装仕様書 / Phase 13]

## 目的

PR を `dev` ブランチ宛に作成する。**ユーザー明示承認後にのみ実行**する。Issue #656 は CLOSED のままとし、`Refs #549, Refs #586, Refs #656` で連携する。

## 前提条件

- [ ] Phase 09 品質保証 4 logs が green
- [ ] Phase 10 DoD チェックリスト全項目クリア
- [ ] Phase 11 screenshot 4 点 commit 済み
- [ ] Phase 12 strict 7 outputs 物理配置済み
- [ ] commit 順序が AC-18 仕様（先頭 commit が `cf-audit-log-7day-summary.yml` の `week_starting` 追加 mini-PR 相当）に従っている

## PR 作成コマンド

```bash
# branch sync
git fetch origin dev
git rebase origin/dev   # or merge --no-ff（CLAUDE.md 既定方針に従う）

# push（ユーザー明示承認後のみ）
git push origin HEAD

# PR 作成（ユーザー明示承認後のみ）
gh pr create --base dev --title "feat(observability): 7day summary trend dashboard (Refs #549, #586, #656)" \
  --body "$(cat docs/30-workflows/u-fix-cf-acct-01-deriv-04-fu-03-d-fu-01-metrics-dash/outputs/phase-13/pr-body.md)"
```

## PR 本文テンプレ

`outputs/phase-13/pr-body.md` に以下を含める:

```markdown
## 概要

Issue #656 の 7day summary 可視化ダッシュボードを実装。親 #586 が生成する `hourly-run-7day-summary.json` を週次集約し、4 指標（fallback rate / p95 latency / Issue 起票数 / leakage 件数）を時系列プロット。threshold 期 baseline と ML 期の比較線を同一プロット内に描画する。

## 変更内容

- `.github/workflows/cf-audit-log-7day-summary.yml`: 出力 JSON に `week_starting` (`YYYY-Www`) と `schema_version: "1.0.0"` を追加（先頭 commit / 独立リリース可能）
- `scripts/cf-audit-log/dashboard/aggregate-weekly.ts`: 週次集約 script 新規追加（line/branch coverage ≥ 90%）
- `scripts/cf-audit-log/dashboard/__tests__/aggregate-weekly.spec.ts`: unit test 10 ケース
- dashboard 描画レイヤ: <admin UI 組込 | 静的 HTML>（Phase 03 で確定 / `outputs/phase-03/decision.md` 参照）
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`: dashboard URL/path 追記

## 不変条件

- 新規 D1 列追加 0 件（forward-safe）
- FU-03-D-FOLLOWUP-03 Slack scope と重複なし（過去閲覧のみ・push 通知 0 件）
- 外部 SaaS 依存 0 件
- OKLch トークン正本適用（HEX 直書き 0 件 / `verify-design-tokens` pass）

## evidence

- screenshots: `docs/30-workflows/u-fix-cf-acct-01-deriv-04-fu-03-d-fu-01-metrics-dash/outputs/phase-11/evidence/screenshots/`
- typecheck/lint/build/test logs: `outputs/phase-09/`
- coverage: `outputs/phase-07/coverage.json`
- DoD: `outputs/phase-10/dod-check.md`
- 3 層評価: `outputs/phase-11/evidence/three-layer-evaluation.md`

## refs

Refs #549, Refs #586, Refs #656

Issue #656 は CLOSED のまま（reopen / close 操作なし）。
```

## 出力

- `outputs/phase-13/main.md` — PR 作成記録
- `outputs/phase-13/pr-body.md` — PR 本文

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 |
| 状態 | spec_created |

## 実行タスク

- 本文の目的・手順・出力に従う。

## 参照資料

- `index.md`
- `artifacts.json`

## 成果物

- `outputs/phase-*` に定義された成果物。

## 完了条件

- [ ] 本 Phase の出力仕様が `artifacts.json` と一致している。
