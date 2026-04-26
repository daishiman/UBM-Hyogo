# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-login-and-profile-pages |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| 作成日 | 2026-04-26 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | pending |

## 目的

AC-1〜AC-12 と Phase 4 test ID（U / C / E / S）、Phase 5 ランブック step、Phase 6 failure case（F）を一対多で紐付け、未トレース 0 を確認する。不変条件 #2 / #4 / #5 / #6 / #7 / #8 / #9 / #10 と各 AC のマッピングを明示する。

## 実行タスク

1. AC × test ID × runbook step × failure case の対応表を作成
2. 未トレース AC 検出（0 件目標）
3. 重複 / 漏れ排除
4. 不変条件 → AC マッピング
5. 合格しきい値の quantitative 化

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC-1〜AC-12 |
| 必須 | outputs/phase-04/test-matrix.md | test ID 21 件 |
| 必須 | outputs/phase-05/runbook.md | runbook step |
| 必須 | outputs/phase-06/main.md | failure case F-01〜F-17 |

## 実行手順

### ステップ 1: AC matrix

| AC | 内容 | test ID | runbook step | failure | 不変条件 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | `/login` 5 状態の UI 出し分け | U-01, U-02, E-01〜E-06 | 2 (LoginPanel switch) | F-01, F-02, F-14 | #8, #9 |
| AC-2 | Magic Link 送信 → `state="sent"` 遷移 + 60s cooldown | U-03, C-01, E-02 | 2 (MagicLinkForm) | F-03, F-17 | - |
| AC-3 | Google OAuth ボタン → callback redirect | C-02, E-03 | 2 (GoogleOAuthButton) | F-05 | - |
| AC-4 | `unregistered` で `/register` CTA、`/no-access` 不遷移 | E-04 | 2 (case unregistered) | - | #9 |
| AC-5 | `rules_declined` で responderUrl CTA | E-05 | 2 (case rules_declined) | - | #2, #4 |
| AC-6 | `deleted` で 管理者連絡 + ログイン form 非表示 | E-06 | 2 (case deleted) | F-14 | #9 |
| AC-7 | 未ログイン `/profile` → `/login?redirect=/profile` | E-07 | 1 (middleware) | F-06, F-07 | #5, #9 |
| AC-8 | `/profile` に編集 form / button 不在 | S-04, E-08 | 3 (Server only render) | F-13, F-15 | #4, #11 |
| AC-9 | `/profile` editResponseUrl ボタン + responderUrl リンク | E-09 | 3 (EditCta) | F-10 | #4 |
| AC-10 | `/profile` 状態サマリ（rulesConsent / publicConsent / publishState / 参加履歴） | E-10 | 3 (StatusSummary) | F-16 | #2 |
| AC-11 | profile field は stableKey 経由参照のみ、questionId 直書き 0 | S-01 | 3 (ProfileFields) | - | #1 |
| AC-12 | `localStorage` を session / route の正本にしない | S-02 | 4 (ESLint rule) | F-15 | #6, #8 |

### ステップ 2: 未トレース 検出

| AC | 状態 | 備考 |
| --- | --- | --- |
| AC-1〜AC-12 | 全て trace 済 | test ID と runbook step の両方に対応あり |

### ステップ 3: 重複 / 漏れ排除

- AC-4 / AC-5 / AC-6 は AC-1（5 状態 UI 出し分け）の個別 case として整理。AC-1 は「全体出し分け」、4/5/6 は「個別 case の CTA 内容」
- AC-7 / AC-8 は `/profile` の認可と read-only。前者は middleware、後者は component 構造で担保
- AC-11 / AC-12 は static check 由来。lint と grep の二重で担保

### ステップ 4: 不変条件 → AC マッピング

| 不変条件 | 対応 AC | 担保 |
| --- | --- | --- |
| #1 (schema 固定しない) | AC-11 | stableKey 参照のみ |
| #2 (consent キー統一) | AC-5, AC-10 | publicConsent / rulesConsent 表記固定 |
| #4 (本人本文編集は Google Form 経由) | AC-8, AC-9 | 編集 form 不在 + responderUrl / editResponseUrl 提供 |
| #5 (apps/web から D1 直接禁止) | AC-7, AC-8 | RSC fetch は 04b / 05b 経由のみ |
| #6 (GAS prototype 非昇格) | AC-12 | window.UBM / localStorage 不採用 |
| #7 (responseId と memberId 混同なし) | AC-7, AC-8 | session.memberId のみ参照 |
| #8 (localStorage 非正本) | AC-1, AC-12 | URL query 正本 |
| #9 (`/no-access` 不採用) | AC-4, AC-6, AC-7 | `/login` で 5 状態を吸収 |
| #10 (Cloudflare 無料枠) | - | Phase 9 で定量検証 |
| #11 (他人本文編集禁止) | AC-8 | 本タスクで本人含め編集 UI なし |

### ステップ 5: 合格しきい値

| AC | 合格しきい値 |
| --- | --- |
| AC-1 | 5 状態すべての E2E が green、URL fallback 100% |
| AC-2 | cooldown 60 秒経過まで button disabled、再送 0 件 |
| AC-7 | 未ログイン `/profile` の HTTP status 302 = 100% |
| AC-8 | `apps/web/app/profile` 配下の `<form>` 出現数 = 0 |
| AC-11 | `git grep "questionId" apps/web/app/profile` = 0 件 |
| AC-12 | `grep -r "localStorage" apps/web/app/login apps/web/app/profile` = 0 件 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | 同一 component に集中する AC を DRY 化候補として抽出 |
| Phase 10 | GO/NO-GO 判定の根拠 |
| 08a | C-01〜C-04 結果と本表を突合 |
| 08b | E-01〜E-10 結果と本表を突合 |

## 多角的チェック観点

- 不変条件 #1: AC-11 で stableKey 直書き禁止が test 化
- 不変条件 #2: AC-5 / AC-10 で consent キー表記が固定
- 不変条件 #4: AC-8 / AC-9 の二重防御（編集 form 不在 + Google Form 編集導線）
- 不変条件 #5: AC-7 / AC-8 で apps/web → apps/api の fetch のみ
- 不変条件 #6: AC-12 の lint / grep 二重チェック
- 不変条件 #7: AC-7 / AC-8 で session.memberId のみ参照
- 不変条件 #8: AC-1 / AC-12 で URL query 正本
- 不変条件 #9: AC-4 / AC-6 / AC-7 すべてで `/no-access` 不遷移
- 不変条件 #10: Phase 9 の無料枠検証へ引継ぎ

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC matrix | 7 | pending | 12 行 × 6 列 |
| 2 | 未トレース検出 | 7 | pending | 0 件 |
| 3 | 重複 / 漏れ排除 | 7 | pending | 集約方針記載 |
| 4 | 不変条件マッピング | 7 | pending | 10 不変条件 |
| 5 | 合格しきい値 | 7 | pending | quantitative |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | サマリ |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC × test × runbook × failure × 不変条件 |
| メタ | artifacts.json | phase 7 status |

## 完了条件

- [ ] AC-1〜AC-12 すべて trace 済
- [ ] 未トレース 0 件
- [ ] 不変条件 → AC マッピング完成
- [ ] 合格しきい値が quantitative

## タスク100%実行確認【必須】

- 全 5 サブタスクが completed
- 2 種ドキュメント配置
- 不変条件 #1, #2, #4, #5, #6, #7, #8, #9, #10, #11 への対応が明記
- 次 Phase で DRY 化候補を引継ぎ

## 次 Phase

- 次: 8 (DRY 化)
- 引き継ぎ事項: 同一 component に集中する AC（特に LoginPanel と StatusSummary）を DRY 化候補に
- ブロック条件: 未トレース AC が 1 件でも残れば進まない
