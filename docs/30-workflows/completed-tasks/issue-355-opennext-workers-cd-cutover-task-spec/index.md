# ISSUE-355-OPENNEXT-WORKERS-CD-CUTOVER

## Canonical Status

| 項目 | 値 |
| --- | --- |
| workflow_state | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #355（CLOSED） |
| issue_link_form | `Refs #355`（`Closes` 禁止） |
| タスク ID | task-impl-opennext-workers-migration-001 |
| 親タスク | UT-06 / ADR-0001（OpenNext on Workers 採用） |
| 関連 | UT-28（apps/web 配信形態決定） / UT-29（API CD パイプライン） |
| 実装 follow-up | 別 Issue で fork 予定（Issue #355 は再 open しない） |

この workflow は apps/web の Cloudflare 配信形態を Pages → OpenNext on Workers へ切替える CD cutover の **設計 close-out** であり、`.github/workflows/web-cd.yml` の実改修・実 deploy・custom domain 移譲・Pages dormant 化は **行わない**。成果は Phase 1-13 タスク仕様書、wrangler.toml 最終形、web-cd.yml 差分、cutover runbook 6 セクション設計、NON_VISUAL evidence 設計、Phase 12 strict 7 files で閉じる。

## 注意書き【重要】

> GitHub Issue #355 は既に **CLOSED** されているが、user 明示指示によりタスク仕様書は `spec_created` として保持する。実装着手時は **Issue を再オープンせず**、別 Issue で fork するか、PR description で `Refs #355` を参照のみとする（自動再 close を防ぐため `Closes #355` は使わない）。

## Phase Index

| Phase | ファイル | 状態 | 要点 |
| --- | --- | --- | --- |
| 1 | `phase-01.md` | spec_created | 要件定義 / AC-1〜AC-6 / RISK-1〜RISK-5 / scope / ownership 宣言 |
| 2 | `phase-02.md` | spec_created | wrangler.toml 最終形 / web-cd.yml 差分 / runbook 6 セクション骨子 / next.config.ts 互換性 |
| 3 | `phase-03.md` | spec_created | テスト戦略 4 層（L1 build / L2 統合 / L3 smoke / L4 rollback）/ NG-1〜NG-5 / evidence 計画 |
| 4 | `phase-04.md` | spec_created | タスク分解（workflow 改修 / runbook 執筆 / smoke 再実行 / next.config 確認） |
| 5 | `phase-05.md` | spec_created | implementation template / cutover runbook 本文 |
| 6 | `phase-06.md` | spec_created | テスト拡充 / abnormal cases |
| 7 | `phase-07.md` | spec_created | AC マトリクス / カバレッジ確認 |
| 8 | `phase-08.md` | spec_created | CI/CD 品質ゲート / production manual approval rule |
| 9 | `phase-09.md` | spec_created | staging / QA plan |
| 10 | `phase-10.md` | spec_created | セキュリティレビュー / Design GO 判定 |
| 11 | `phase-11.md` | spec_created | NON_VISUAL acceptance evidence 設計（E-1〜E-5）|
| 12 | `phase-12.md` | spec_created | documentation close-out / strict 7 files |
| 13 | `phase-13.md` | blocked | user approval / commit / PR gate |

## 依存関係

```text
ADR-0001 (OpenNext on Workers 採用)
  └─ UT-28 (apps/web 配信形態決定)
       └─ UT-29 (API CD パイプライン)
            └─ this CD cutover task spec (task-impl-opennext-workers-migration-001)
                 └─ implementation follow-up（別 Issue で起票）
                      ├─ .github/workflows/web-cd.yml 改修 + merge
                      ├─ staging cutover + smoke S-01〜S-10
                      ├─ production cutover + custom domain 移譲
                      └─ Pages project dormant 化（2 週間後 delete）
```

## 正本 Schema

| Schema | 所在 | 説明 |
| --- | --- | --- |
| `wrangler.toml` 最終形 | `phase-02.md` の表（および `outputs/phase-02/wrangler-final-form.md`） | `main = ".open-next/worker.js"` / `[assets]` / `[env.<stage>]` / `[[env.<stage>.services]]` |
| `web-cd.yml` 差分 | `phase-02.md` の差分表（および `outputs/phase-02/web-cd-diff.md`） | build step / deploy step before/after |
| cutover runbook 6 セクション | `phase-02.md` 設計骨子 → `outputs/phase-05/cutover-runbook.md` 本文 | S1 前提 / S2 staging / S3 production / S4 custom domain / S5 rollback / S6 dormant 期間 |
| AC ↔ evidence | `phase-11.md` 対応表 | AC-1〜AC-6 と E-1〜E-5 のマップ |

## 関連リソース

- ADR-0001: `docs/00-getting-started-manual/specs/`（OpenNext on Workers 採用）
- UT-06 Phase 11 smoke 仕様: `docs/30-workflows/ut-06-fu-a-route-inventory-script-001-cloudflare-route-inventory/phase-11.md` 等の S-01〜S-10
- Cloudflare CLI ラッパー: `scripts/cf.sh`
- aiworkflow-requirements: `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md`
- CLAUDE.md: スタック表 / Cloudflare CLI 実行ルール / シークレット管理

## 不変条件への影響

| 不変条件 | 影響 | 対策 |
| --- | --- | --- |
| #5 D1 直接アクセスは `apps/api` に閉じる | 影響なし（apps/web は service binding 経由で apps/api を呼ぶ構成を維持） | wrangler.toml に D1 binding を追加しない |
