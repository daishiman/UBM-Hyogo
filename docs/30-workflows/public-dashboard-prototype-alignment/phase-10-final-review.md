---
実装区分: 実装仕様書
状態: spec_created
Phase: 10
作成日: 2026-05-26
task_id: public-dashboard-prototype-alignment
親: [index.md](./index.md)
前: [phase-9-qa.md](./phase-9-qa.md)
次: [phase-11-manual-test.md](./phase-11-manual-test.md)
---

# Phase 10: 最終レビュー

## 1. 目的

Phase 1〜9 の成果を統合レビューし、Phase 11 (手動テスト / VISUAL evidence) 着手可否を判定する。

## 2. レビュー観点 (4 条件再評価)

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | HIGH | 公開トップ第一印象の prototype 整合 |
| 実現性 | HIGH | 1 component 新規 / 4 component 改修 / 1 CSS 追加 / 0 dep 追加 |
| 整合性 | HIGH | 不変条件 18 項 PASS、API contract 完全不変 |
| 運用性 | HIGH | server component のみ、cache 戦略不変 |

## 3. 不変条件最終確認

Phase 3 §2 と同じ 18 項目を再確認:

| 区分 | 結果 |
| --- | --- |
| CLAUDE.md #1〜#10 | PASS |
| 本 workflow 固有 W1〜W8 | PASS |

## 4. GAP 解消マトリクス

| GAP | 解消手段 | 担当 phase | 確認 |
| --- | --- | --- | --- |
| GAP-1 (Hero card 化) | `Hero.tsx` `variant="card"` + radial accent | P5 L-B / P9 verify-design-tokens | PASS |
| GAP-2 (Stats sub/badge) | `Stats.tsx` `data-role="sub"` + `badge-sync` | P5 L-C / P6 TC-STATS-005..006 | PASS |
| GAP-3 (About 2-card) | `AboutUbm.tsx` 新規 | P5 L-A / P6 TC-ABOUT-* | PASS |
| GAP-4 (Featured heading 維持) | `app/page.tsx` wrapper inline + EmptyState | P5 L-F / P6 TC-PAGE-002 | PASS |
| GAP-5 (Timeline tl-row) | `Timeline.tsx` 改修 + fallback | P5 L-D / P6 TC-TL-* | PASS |
| GAP-6 (CSS 追加) | `legacy-public.css` append | P5 L-E / P9 verify-design-tokens | PASS |

## 5. MINOR follow-up (本 PR で対応しない)

| # | 内容 | 管理 |
| --- | --- | --- |
| FU-1 | `Last sync` を「数分前」等の relative time にする | Phase 12 unassigned-task-detection.md に却下理由を明示 |
| FU-2 | `Meetings/yr` を API から取得 | 同上 |
| FU-3 | Hero serif を web font で配信 | 同上 |
| FU-4 | `ZoneIntro.tsx` を将来削除 | Phase 8 RF-2 で保持決定。次サイクル要再評価 |

## 6. 残リスク

| 区分 | 内容 | 軽減 |
| --- | --- | --- |
| 視覚 | Phase 11 で prototype 比較し font / spacing 差異が出る可能性 | Phase 11 で差を最小化 (許容差 spacing ±4px、size ±2px) |
| データ | `recentMeetings` が 0 件のとき EmptyState のみ render | EmptyState の文言は Phase 5 §5 で確定済 |
| 互換 | 旧 `data-stat="total"` / `data-stat="public"` 参照が他に無いか | grep で確認 (Phase 9) |

## 7. レビュー判定

**判定: PASS**

Phase 11 (手動テスト / VISUAL evidence) へ進行可。

## 8. DoD (Phase 10)

- [ ] §4 の GAP 解消マトリクス全 PASS
- [ ] §5 の MINOR follow-up が Phase 12 へ持ち越し記載済
- [ ] §6 の残リスクが軽減策と紐付け済

## メタ情報

- task_id: `public-dashboard-prototype-alignment`
- Phase: 10
- workflow_state: `spec_created`

## 目的

Phase 1〜9 の総合レビューと Phase 11 着手可否判定を行う。

## 完了条件

- [ ] 4 条件 / 18 不変条件 / 6 GAP すべて PASS
