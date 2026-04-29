# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | public-landing-directory-and-registration-pages |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-26 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | pending |

## 目的

Phase 2 設計に対し代替案 3 件以上を比較。density 正本の選択（URL query / Cookie / localStorage）、`/members` の検索 SSR 戦略、`/register` の form-preview cache 期間を扱う。

## 実行タスク

1. 代替案列挙
2. PASS-MINOR-MAJOR 判定
3. 採用案の理由
4. 未解決事項

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC |
| 必須 | outputs/phase-02/page-tree.md, url-query-contract.md, data-fetching.md | 採用案 |
| 参考 | docs/00-getting-started-manual/specs/12-search-tags.md | URL contract |

## 実行手順

### ステップ 1: 代替案

| 案 | 概要 | 判定 | 理由 |
| --- | --- | --- | --- |
| A: 採用案（density も URL query 正本） | 全状態 URL で表現 | PASS | 不変条件 #8 完全準拠、reload 後復元 |
| B: density は Cookie | UX 上 reload で個人設定が残る | MINOR | URL 共有時に密度が変わる、個人設定優先で別画面と一貫性が取れる利点も |
| C: density は localStorage | prototype 流 | MAJOR | 不変条件 #8 違反、SSR で初期描画ブレ |
| D: `/members` 検索を完全 Client（CSR） | URL query parsing も Client 内 | MINOR | 初期表示遅延、SEO 弱化 |
| E: `/members` 検索 SSR + ISR per query 永続キャッシュ | 完全静的化 | MINOR | 検索組合せが多くキャッシュキー爆発 |
| F: `/register` の form-preview を build 時固定 | revalidate なし | MINOR | schema 変更 sync が画面に出ない |

### ステップ 2: 集計

| 判定 | 件数 | 該当 |
| --- | --- | --- |
| PASS | 1 | A |
| MINOR | 4 | B, D, E, F |
| MAJOR | 1 | C |

### ステップ 3: 採用理由

A 案を採用。理由:
- 不変条件 #8 の唯一の準拠案
- URL 共有時に density も復元（共有 UX 良好）
- SSR と整合（cookie 不要で初期 HTML 確定）

### ステップ 4: 未解決事項

| # | 論点 | 仮決定 | 確定 Phase |
| --- | --- | --- | --- |
| Q1 | density 切替時に URL push の history 汚染 | replace で 1 件にまとめる | 5 |
| Q2 | tag query が長くなる場合の URL 長制限 | 5 件まで（spec で固定） | 5 |
| Q3 | `/register` form-preview は cron sync 直後に invalidate | revalidate 600s + ETag で許容 | 5 / 9b |
| Q4 | 検索結果 0 件時の suggested filter | 「絞り込みをクリア」ボタンのみ | 2 で確定済 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | A 案の test 設計 |
| Phase 6 | C 案的「localStorage 漏出」を異常系で検出 |
| Phase 7 | AC 整合再確認 |

## 多角的チェック観点

- 不変条件 #8: A 採用、C 不採用が妥当
- 不変条件 #6: D 案（CSR）は `window.UBM` 復活リスクがあり MINOR
- 認可境界: 公開層は session 不要だが、A 案は SSR 整合のため問題なし

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 代替案 6 件 | 3 | pending | A〜F |
| 2 | PASS-MINOR-MAJOR | 3 | pending | 集計 |
| 3 | 採用理由 | 3 | pending | A |
| 4 | 未解決 | 3 | pending | Q1〜Q4 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 代替案 + 判定 + 採用 + 未解決 |
| メタ | artifacts.json | phase 3 status |

## 完了条件

- [ ] 代替案 3 件以上（6 件）
- [ ] 全案に判定
- [ ] 採用案の理由明記
- [ ] 未解決事項が確定 Phase 付き

## タスク100%実行確認【必須】

- 全 4 サブタスクが completed
- outputs/phase-03/main.md 配置
- 不変条件 #8 違反案（C）が MAJOR と判定
- 次 Phase へ Q1〜Q4 を引継ぎ

## 次 Phase

- 次: 4 (テスト戦略)
- 引き継ぎ事項: 採用案 A の URL contract と data fetching を test 設計の入力に
- ブロック条件: 採用案未確定なら進まない
