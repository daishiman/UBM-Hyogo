# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-login-and-profile-pages |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 作成日 | 2026-04-26 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke) |
| 状態 | pending |

## 目的

上流 Wave (00, 04b, 05a, 05b) と下流 (08a, 08b) の AC が満たされた前提で、本タスク AC-1〜AC-12 と不変条件 #1 / #2 / #4 / #5 / #6 / #7 / #8 / #9 / #10 / #11 の整合性を集計し GO/NO-GO を判定する。MVP 認証方針（不変条件 #7 = MVP では Google Form 再回答を本人更新の正式な経路）が UI に正しく反映されていることを最終確認する。

## 実行タスク

1. 上流 wave AC 確認
2. 自タスク AC 集計
3. blocker / minor 一覧
4. 4 条件最終評価
5. GO/NO-GO 判定
6. 残課題引き継ぎ

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-07/ac-matrix.md | AC マトリクス |
| 必須 | outputs/phase-09/main.md | 品質チェック結果 |
| 必須 | doc/02-application-implementation/README.md | 不変条件と Wave 依存 |
| 必須 | doc/02-application-implementation/04b-parallel-member-self-service-api-endpoints/index.md | 上流 04b AC |
| 必須 | doc/02-application-implementation/05a-parallel-authjs-google-oauth-provider-and-admin-gate/index.md | 上流 05a AC |
| 必須 | doc/02-application-implementation/05b-parallel-magic-link-provider-and-auth-gate-state/index.md | 上流 05b AC |
| 必須 | doc/02-application-implementation/00-serial-monorepo-shared-types-and-ui-primitives-foundation/index.md | 上流 00 AC |

## 実行手順

### ステップ 1: 上流 wave AC 確認

| 上流タスク | 必須出力 | 確認方法 | 状態 |
| --- | --- | --- | --- |
| 04b | `GET /me` `GET /me/profile` `POST /me/visibility-request` `POST /me/delete-request` | OpenAPI + 08a contract test | upstream の phase-13 完了時に確定 |
| 05a | Google OAuth provider が `/api/auth/callback/google` で session 確立 | session API | 上流確定後 GO |
| 05b | `POST /auth/magic-link` `GET /auth/gate-state` で AuthGateState 5 状態を返却 | gate-state API | 上流確定後 GO |
| 00 | UI primitives（Banner, Button, FormField, Toast, EmptyState, KVList）+ view model 型（`MeView`, `MemberProfile`, `AuthGateState`） | `@ubm/ui` / `@ubm/shared` import 可能 | 上流確定後 GO |

### ステップ 2: 自タスク AC 集計

| AC | 内容 | 状態 | 根拠 |
| --- | --- | --- | --- |
| AC-1 | `/login` 5 状態の UI 出し分け | green 見込み | U-01, U-02, E-01〜E-06 |
| AC-2 | Magic Link 送信 → `state="sent"` + 60s cooldown | green 見込み | U-03, C-01, E-02 |
| AC-3 | Google OAuth ボタン → callback redirect | green 見込み | C-02, E-03 |
| AC-4 | `unregistered` で `/register` CTA、`/no-access` 不遷移 | green 見込み | E-04 |
| AC-5 | `rules_declined` で responderUrl CTA | green 見込み | E-05 |
| AC-6 | `deleted` で 管理者連絡 + ログイン form 非表示 | green 見込み | E-06, F-14 |
| AC-7 | 未ログイン `/profile` → `/login?redirect=/profile` | green 見込み | E-07, F-06 |
| AC-8 | `/profile` に編集 form / button 不在 | green | S-04, E-08, grep 0 件 |
| AC-9 | `/profile` editResponseUrl ボタン + responderUrl リンク | green 見込み | E-09, F-10 |
| AC-10 | `/profile` 状態サマリ（rulesConsent / publicConsent / publishState / 参加履歴） | green 見込み | E-10 |
| AC-11 | profile field は stableKey 経由のみ、questionId 直書き 0 | green | S-01, lint pass |
| AC-12 | localStorage を session / route の正本にしない | green | S-02, lint pass |

### ステップ 3: blocker / minor 一覧

| 種別 | ID | 内容 | 影響 | 解消条件 |
| --- | --- | --- | --- | --- |
| blocker | B-01 | 04b が pending | `/me`, `/me/profile` 取得不能 | 04b phase-13 完了 |
| blocker | B-02 | 05a が pending | Google OAuth ボタンが動作しない | 05a phase-13 完了 |
| blocker | B-03 | 05b が pending | Magic Link 送信 / gate-state 取得不能 | 05b phase-13 完了 |
| blocker | B-04 | 00 が pending | UI primitives / view model 型不足 | 00 phase-13 完了 |
| minor | M-01 | `editResponseUrl` が null のときの tooltip 文言 | UX 軽微 | 12-search-tags / 文言運用ガイド |
| minor | M-02 | mobile での MagicLinkForm cooldown 表示折り返し | UX 軽微 | 09-ui-ux で対応 |
| minor | M-03 | 参加履歴の空状態文言（過去参加なし） | UX 軽微 | EmptyState 文言定数化 |

### ステップ 4: 4 条件最終評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | TBD | 会員が 1 画面でログイン → /profile で状態確認 → 条件を明記して Google Form 再回答可能 |
| 実現性 | TBD | 04b API + 05a/b auth + 00 UI primitives で成立 |
| 整合性 | TBD | 不変条件 #1, #2, #4, #5, #6, #7, #8, #9, #10, #11 全担保 |
| 運用性 | TBD | 06a / 06c と並列稼働、08a/b に handoff、無料枠 0.43% 使用 |

### ステップ 5: GO/NO-GO 判定

| 判定軸 | 状態 | 結論 |
| --- | --- | --- |
| AC-1〜AC-12 | conditional green（上流前提） | OK |
| 不変条件 #1, #2, #4, #5, #6, #7, #8, #9, #10, #11 | OK | OK |
| 無料枠 | 0.43% 使用 | OK |
| secret hygiene | H-01〜H-06 pass | OK |
| `/profile` 編集 UI 不在 | grep 0 件 | OK |
| `/no-access` 不採用 | grep 0 件 | OK |
| blocker | B-01〜B-04 | 上流確定で解消 |

総合: 上流 (00, 04b, 05a, 05b) 完了を条件とした GO

### ステップ 6: 残課題引き継ぎ

- M-01, M-02, M-03 は phase-12 の `unassigned-task-detection.md` に記録
- 04b の `editResponseUrl` 仕様変更があれば再 review
- 05b の AuthGateState 値が拡張された場合は switch case 追加と loginQuerySchema 更新が必要

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | manual smoke の前提承認 |
| Phase 12 | 残課題ログを反映 |
| Phase 13 | PR description の根拠 |

## 多角的チェック観点

- 不変条件 #1: AC-11 の lint pass を再確認
- 不変条件 #2: AC-5 / AC-10 の `publicConsent` / `rulesConsent` 表記を再確認
- 不変条件 #4: AC-8 の grep 0 件を再確認（profile 編集 UI 不在）
- 不変条件 #5: AC-7 / AC-8 の apps/api 経由のみを再確認
- 不変条件 #6: AC-12 の lint pass を再確認
- 不変条件 #7: session.memberId のみ参照、MVP 認証方針 = Google Form 再回答が本人更新の正式経路であることを `EditCta` で再確認
- 不変条件 #8: AC-1 / AC-12 の URL query 正本を再確認
- 不変条件 #9: AC-4 / AC-6 / AC-7 の `/no-access` 不遷移を再確認
- 不変条件 #10: 無料枠 0.43% の余裕を再確認
- 不変条件 #11: profile に他人本文編集の経路がないことを再確認

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 上流 AC 確認 | 10 | pending | 4 上流 |
| 2 | 自タスク AC 集計 | 10 | pending | 12 行 |
| 3 | blocker / minor | 10 | pending | B-01〜B-04 / M-01〜M-03 |
| 4 | 4 条件評価 | 10 | pending | 価値 / 実現 / 整合 / 運用 |
| 5 | GO/NO-GO | 10 | pending | conditional GO |
| 6 | 残課題引き継ぎ | 10 | pending | phase-12 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | 上流 AC + 集計 + 4 条件 + 判定 |
| メタ | artifacts.json | phase 10 status |

## 完了条件

- [ ] 自タスク AC 12 件すべて status 確定
- [ ] blocker 一覧と解消条件あり
- [ ] 4 条件すべて評価
- [ ] GO/NO-GO 結論明記

## タスク100%実行確認【必須】

- 全 6 サブタスクが completed
- outputs/phase-10/main.md 配置
- 不変条件 #1, #2, #4, #5, #6, #7, #8, #9, #10, #11 すべて OK
- 次 Phase へ blocker 解消条件と smoke シナリオを渡す

## 次 Phase

- 次: 11 (手動 smoke)
- 引き継ぎ事項: GO 条件下で 5 状態 × 2 page の smoke を実施
- ブロック条件: blocker B-01〜B-04 のいずれか未解消なら進まない
