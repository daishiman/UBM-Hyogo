# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-login-and-profile-pages |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| 作成日 | 2026-04-26 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | pending |

## 目的

AC-1〜AC-12 を test ID 化し、unit / contract / E2E / static の 4 layer に振り分ける。

## 実行タスク

1. test 行列
2. layer 振り分け
3. fixture 設計
4. 8a / 8b への入力定義

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | 設計 |
| 必須 | outputs/phase-02/auth-gate-state-ui.md | 5 状態 |
| 参考 | doc/00-getting-started-manual/specs/09-ui-ux.md | 検証マトリクス |

## 実行手順

### ステップ 1: test 行列

| ID | layer | AC | 内容 | 期待 |
| --- | --- | --- | --- | --- |
| U-01 | unit | AC-1 | loginQuerySchema parse 5 state | green |
| U-02 | unit | AC-1 | loginQuerySchema 不正 state は input fallback | green |
| U-03 | unit | AC-2 | MagicLinkForm cooldown 60s カウント | green |
| C-01 | contract | AC-2, AC-9 | `POST /auth/magic-link` 200 + state="sent" | 05b の契約と一致 |
| C-02 | contract | AC-3 | `GET /api/auth/callback/google` redirect | 05a の契約 |
| C-03 | contract | AC-7 | `GET /me` 401 unauth | 04b の契約 |
| C-04 | contract | AC-8 | `GET /me/profile` の field は MemberProfile schema | 04b の契約 |
| E-01 | e2e | AC-1 | `/login?state=input` で MagicLinkForm + GoogleOAuth ボタン表示 | desktop / mobile |
| E-02 | e2e | AC-2 | Magic Link 送信 → `?state=sent` に遷移、cooldown 表示 | - |
| E-03 | e2e | AC-3 | Google OAuth ボタン click → callback redirect | - |
| E-04 | e2e | AC-4 | `/login?state=unregistered` で `/register` CTA | - |
| E-05 | e2e | AC-5 | `/login?state=rules_declined` で responderUrl CTA | - |
| E-06 | e2e | AC-6 | `/login?state=deleted` で 管理者連絡 CTA + ログイン不可 | - |
| E-07 | e2e | AC-7 | 未ログインで `/profile` → `/login?redirect=/profile` redirect | - |
| E-08 | e2e | AC-8 | `/profile` に編集 form / button 不在 | - |
| E-09 | e2e | AC-9 | `/profile` editResponseUrl ボタン click → Google Form 編集 URL を別タブで開く | - |
| E-10 | e2e | AC-10 | `/profile` に状態サマリ表示 | - |
| S-01 | static | AC-11 | `git grep "questionId"` で stableKey 直書き 0 | - |
| S-02 | static | AC-12 | `grep -r "localStorage" apps/web/app/login apps/web/app/profile` で 0 | - |
| S-03 | static | AC-4 | `grep -r "/no-access" apps/web` で 0 | - |
| S-04 | static | AC-8 | `grep -r "form" apps/web/app/profile` で profile field 編集 form なし | - |

### ステップ 2: layer 振り分け

| layer | 件数 | 実行 Phase |
| --- | --- | --- |
| unit | U-01〜U-03（3 件） | 9 |
| contract | C-01〜C-04（4 件） | 9 / 8a |
| e2e | E-01〜E-10（10 件） | 8b |
| static | S-01〜S-04（4 件） | 9 |

### ステップ 3: fixture

| 種類 | path | 用途 |
| --- | --- | --- |
| MeView | tests/fixtures/me/registered.json | 通常会員 |
| MemberProfile | tests/fixtures/me/profile.json | 11 stableKey |
| Magic Link 送信成功 | tests/fixtures/auth/magic-link-sent.json | C-01 |
| AuthGateState 5 種 | tests/fixtures/auth/gate-state/*.json | E-01〜E-06 |

### ステップ 4: 8a / 8b 入力

| 出力先 | 内容 |
| --- | --- |
| 8a | C-01〜C-04 を契約 test として実装 |
| 8b | E-01〜E-10 を Playwright で 09-ui-ux 準拠 desktop / mobile |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | runbook の sanity check に S-XX を組み込む |
| Phase 9 | 全 layer 一括実行 |
| 8a / 8b | 自動 test の入力 |

## 多角的チェック観点

- 不変条件 #4: S-04 で profile に編集 form 不在を確認
- 不変条件 #5: C-03, C-04 で apps/web → apps/api のみの fetch
- 不変条件 #6: S-02 で localStorage 不在
- 不変条件 #7: C-03, C-04 の session.memberId のみ参照
- 不変条件 #8: U-01, U-02 で URL query 正本確認
- 不変条件 #9: S-03 で `/no-access` 不在

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | test 行列 | 4 | pending | 21 件 |
| 2 | layer 振り分け | 4 | pending | 4 layer |
| 3 | fixture | 4 | pending | 4 種 |
| 4 | 8a/8b 入力 | 4 | pending | 引継ぎ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | サマリ |
| ドキュメント | outputs/phase-04/test-matrix.md | 21 件行列 |
| メタ | artifacts.json | phase 4 status |

## 完了条件

- [ ] AC-1〜AC-12 が test ID と紐付け
- [ ] 4 layer 振り分け済み
- [ ] fixture 4 種定義
- [ ] 8a / 8b 入力定義

## タスク100%実行確認【必須】

- 全 4 サブタスクが completed
- 2 種ドキュメント配置
- 不変条件 #4, #5, #6, #7, #8, #9 への対応が明示
- 次 Phase で runbook 入力可能

## 次 Phase

- 次: 5 (実装ランブック)
- 引き継ぎ事項: test ID 21 件 + fixture 4 種
- ブロック条件: AC が trace 不可なら進まない
