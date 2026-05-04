# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| task | issue-399-admin-queue-resolve-staging-visual-evidence |
| phase | 08 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implementation-prepared |

## 共通化候補

| 候補 | 重複源 | DRY 化方針 |
| --- | --- | --- |
| env guard (`CLOUDFLARE_ENV != staging` で exit 1) | seed-issue-399.sh / cleanup-issue-399.sh | 今回は 2 script のため重複を許容。3 本目が出た時点で helper 化する |
| seed identifier prefix (`ISSUE399-`) | seed.sql / cleanup.sql / verify command | `apps/api/migrations/seed/_lib/seed-tags.md`（docs）に固定値を集約し、SQL コメントで参照 |
| capture metadata JSON 生成 | runbook 手動 vs Playwright script | `scripts/staging/_lib/build-capture-metadata.mjs` で共通生成（任意） |

## 既存資産の再利用

| 既存 | 再利用方針 |
| --- | --- |
| `scripts/cf.sh` | wrangler 直叩きせず必ず経由（CLAUDE.md 準拠） |
| `apps/api/migrations/seed/` ディレクトリ | 既存 seed 配下に追加するだけで CI / lint pipeline の対象に自動編入 |
| 親 workflow の `outputs/phase-11/` 構造 | 同じファイル名規約（`main.md` / `manual-test-result.md` / `discovered-issues.md`）を踏襲 |

## 非 DRY 化の判断

| 候補 | 非 DRY 化理由 |
| --- | --- |
| Playwright capture script を他 workflow と共通化 | 本タスク特有の admin queue UI 操作が大半で抽象化コスト > 重複コスト。本 workflow ローカルに留める |

## 完了条件

- [ ] env guard helper は今回不採用であることを記録し、重複許容の理由を明記していること
- [ ] 残り 2 候補は判断結果を記録（採否どちらでも可、根拠を残す）

## 目的

Phase 08 の判断と成果物境界を明確にする。

## 実行タスク

- Phase 08 の入力、実装状態、runtime pending 境界を確認する。

## 参照資料

- [index.md](index.md)
- [artifacts.json](artifacts.json)
- [runbook.md](runbook.md)

## 成果物

- `outputs/phase-08/main.md`

## 統合テスト連携

- Focused Vitest は Phase 09 の品質 gate に集約する。
