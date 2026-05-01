# Phase 11: 手動 smoke / visual evidence

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07c-followup-003-audit-log-browsing-ui |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke / visual evidence |
| 作成日 | 2026-05-01 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | completed_with_limitation |

## 目的

VISUAL タスクとして `/admin/audit` の実画面証跡を取得し、UI 崩れ、PII 漏洩、admin gate、read-only を確認する。

## 完了時の実測境界

Phase 11 は 7 target の local static render screenshot と API/Web automated tests で completed とする。authenticated local/staging admin session + D1 fixture による E2E screenshot は未取得であり、`task-09a-exec-staging-smoke-001.md` の staging smoke 実行時に取得する delegated evidence として扱う。

## 実行タスク

1. `outputs/phase-11/screenshot-plan.json` を作る
2. admin 一覧、filter 適用、JSON collapsed、JSON expanded masked、empty、403/redirect、mobile を撮る
3. `outputs/phase-11/manual-test-result.md` と `manual-test-report.md` を作る
4. `outputs/phase-11/discovered-issues.md` に発見事項を記録する
5. `outputs/phase-11/ui-sanity-visual-review.md` と `phase11-capture-metadata.json` を作る

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 10 | outputs/phase-10/go-no-go.md | capture 判定 |
| Playwright | apps/web/playwright | screenshot |
| UI | apps/web/app/(admin)/admin/audit/page.tsx | 対象 |

## 実行手順

### screenshot targets

| target | viewport | 確認 |
| --- | --- | --- |
| audit-initial | desktop | table / filters |
| audit-action-filter | desktop | action filter |
| audit-json-collapsed | desktop | raw PII 非表示 |
| audit-json-expanded-masked | desktop | masked PII |
| audit-empty | desktop | empty state |
| audit-forbidden | desktop | non-admin |
| audit-mobile | mobile | overlap なし |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | implementation-guide / system spec update |
| Phase 13 | PR body evidence link |

## 多角的チェック観点（AIが判断）

- screenshots は実測 PASS のみ PASS とする
- raw email / phone が画像にも DOM にも出ていないことを確認する
- mobile で filter と table が重ならないことを確認する

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | screenshot-plan | completed | json |
| 2 | visual capture | completed_with_limitation | 7 local static render targets |
| 3 | a11y / sanity review | completed | manual report |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | サマリ |
| 証跡 | outputs/phase-11/screenshot-plan.json | capture plan |
| 証跡 | outputs/phase-11/manual-test-result.md | 結果 |
| 証跡 | outputs/phase-11/manual-test-report.md | 詳細 |
| 証跡 | outputs/phase-11/discovered-issues.md | 発見事項 |
| 証跡 | outputs/phase-11/ui-sanity-visual-review.md | UI sanity |
| 証跡 | outputs/phase-11/phase11-capture-metadata.json | metadata |

## 完了条件

- [x] 7 target の visual evidence がある
- [x] PII mask と read-only が視覚・DOM で確認済み
- [x] discovered issues の blocker が 0

## タスク100%実行確認【必須】

- [x] 全実行タスクが completed
- [x] Phase 11 固定成果物が配置済み
- [x] artifacts.json の Phase 11 を completed に更新

## 次Phase

次: 12 (ドキュメント更新)。
