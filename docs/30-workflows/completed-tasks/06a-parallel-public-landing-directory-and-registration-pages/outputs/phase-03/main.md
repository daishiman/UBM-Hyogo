# Phase 3 成果物 — 設計レビュー

## 代替案

| 案 | 概要 | 判定 | 理由 |
| --- | --- | --- | --- |
| A: density も URL query 正本 | 全状態 URL で表現、SSR で初期 HTML 確定 | PASS | 不変条件 #8 完全準拠、reload 後復元、URL 共有可 |
| B: density は Cookie | reload 時に個人設定が残る | MINOR | URL 共有時に密度が変わる、SSR 整合は維持可能だが #8 緩和 |
| C: density は localStorage | prototype 流 | MAJOR | 不変条件 #8 違反、SSR 初期描画ブレ |
| D: `/members` を完全 Client (CSR) | URL parsing も Client 内 | MINOR | 初期表示遅延、SEO 弱化、不変条件 #6 (`window.UBM`) リスク |
| E: 全 query 組合せに ISR 永続キャッシュ | per-query Cache | MINOR | キャッシュキー爆発、無料枠リスク |
| F: `/register` form-preview を build-time 固定 | revalidate なし | MINOR | schema 変更が画面に反映しない |

## 集計

| 判定 | 件数 | 該当 |
| --- | --- | --- |
| PASS | 1 | A |
| MINOR | 4 | B, D, E, F |
| MAJOR | 1 | C |

## 採用案

A 案。理由:
- 不変条件 #8 の唯一の準拠案
- URL 共有時に density も復元（共有 UX 良好）
- SSR と整合（cookie 不要で初期 HTML 確定）

## 未解決事項

| # | 論点 | 仮決定 | 確定 Phase |
| --- | --- | --- | --- |
| Q1 | density 切替時の history 汚染 | `router.replace` で 1 件にまとめる | 5 (実装) |
| Q2 | tag query が長い場合の URL 長制限 | apps/web 側で 5 件 truncate | 5 (実装) |
| Q3 | `/register` form-preview cron sync 直後 invalidate | revalidate 600s + 04a の Cache-Control で許容 | 5 / 9b |
| Q4 | 検索結果 0 件時の suggested filter | 「絞り込みをクリア」ボタン (`/members` への replace) | 確定済 |

## 不変条件

- #8: A 採用、C を MAJOR で除外
- #6: D 案は `window.UBM` 復活リスクで MINOR
- #5: 全案で `apps/web → 04a` 経由維持

## サブタスク

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 代替案 6 件 | completed |
| 2 | PASS-MINOR-MAJOR | completed |
| 3 | 採用理由 | completed |
| 4 | 未解決 Q1〜Q4 | completed |

## 完了条件チェック

- [x] 代替案 3 件以上
- [x] 全案に判定
- [x] 採用案の理由明記
- [x] 未解決事項に確定 Phase
