# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-login-and-profile-pages |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-26 |
| 前 Phase | 11 (手動 smoke) |
| 次 Phase | 13 (PR 作成) |
| 状態 | pending |

## 目的

実装ガイド / 仕様差分 / 変更履歴 / 未割当課題 / スキル feedback / 仕様準拠の 6 種を生成し、後続タスクと運用に渡す。中学生レベルの概念説明（Part 1）と技術者レベル詳細（Part 2）を `implementation-guide.md` に含める。

## 実装ガイド Part 1 / Part 2 要件

### Part 1: 初学者・中学生レベル

- [ ] なぜこのタスクが必要かを、日常生活の例え話から説明する
- [ ] 専門用語を使う場合は、その場で短く説明する
- [ ] 何を作るかより先に、困りごとと解決後の状態を書く

### Part 2: 開発者・技術者レベル

- [ ] TypeScript の interface / type 定義を記載する
- [ ] API シグネチャ、使用例、エラーハンドリング、エッジケースを記載する
- [ ] 設定可能なパラメータ、定数、実行コマンド、検証コマンドを一覧化する

## 実行タスク

1. `outputs/phase-12/implementation-guide.md` を生成（Part 1 中学生 + Part 2 技術者）
2. `outputs/phase-12/system-spec-update-summary.md` を生成
3. `outputs/phase-12/documentation-changelog.md` を生成
4. `outputs/phase-12/unassigned-task-detection.md` を生成
5. `outputs/phase-12/skill-feedback-report.md` を生成
6. `outputs/phase-12/phase12-task-spec-compliance-check.md` を生成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01〜11/ | 全成果物 |
| 必須 | doc/00-getting-started-manual/specs/02-auth.md | `/no-access` 不採用 |
| 必須 | doc/00-getting-started-manual/specs/05-pages.md | URL contract |
| 必須 | doc/00-getting-started-manual/specs/06-member-auth.md | AuthGateState |
| 必須 | doc/00-getting-started-manual/specs/07-edit-delete.md | 編集 UI 禁止 |
| 必須 | doc/00-getting-started-manual/specs/13-mvp-auth.md | MVP 認証 |
| 必須 | doc/00-getting-started-manual/specs/16-component-library.md | UI primitives |

## Phase 12 必須成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| 実装ガイド | outputs/phase-12/implementation-guide.md | Part 1 中学生説明 + Part 2 技術者詳細 |
| system spec update | outputs/phase-12/system-spec-update-summary.md | specs/ への反映が必要な命名・契約変更 |
| changelog | outputs/phase-12/documentation-changelog.md | 本タスクで生まれた path / endpoint / type の変更履歴 |
| unassigned | outputs/phase-12/unassigned-task-detection.md | 本タスクで処理しなかった項目（visibility-request UI 等）の登録先候補 |
| skill feedback | outputs/phase-12/skill-feedback-report.md | task-specification-creator skill への改善提案 |
| compliance check | outputs/phase-12/phase12-task-spec-compliance-check.md | 不変条件 #1〜#15 の遵守状況、AC trace |

## Part 1 中学生レベル概念説明（implementation-guide.md 抜粋）

`/login` と `/profile` は学校の保健室に貼ってある掲示板にあたる。
- `/login` は「保健室に入るためのドア」。生徒証（メールアドレス）で開けるか、職員証（Google アカウント）で開ける
- ドアには 5 種類の貼り紙が出る場合がある：「入力待ち」「リンク送信済み」「未登録です」「規約同意が必要です」「退会済みです」
- `/profile` は「あなたのロッカー」。中身は見られるが、書き換えはできない。書き換えたいときは Google フォームで再回答する（先生が許可したやり方）
- 「ロッカーを開けて中身を編集する」ような button は一切置かない。これが不変条件 #4 / #11 のルール

## Part 2 技術者レベル詳細（implementation-guide.md 抜粋）

| 章 | 内容 |
| --- | --- |
| 概要 | apps/web の 2 会員ルート（`/login`, `/profile`）責務 |
| ディレクトリ | `apps/web/app/login/` / `apps/web/app/profile/` 構成 + middleware.ts |
| URL contract | `/login?state=...&email=...&redirect=...` の zod schema、`/profile` は query なし |
| AuthGateState | 5 状態（input / sent / unregistered / rules_declined / deleted）× UI 対応 |
| fetcher | `apps/web/lib/fetch/authed.ts` の使い方（Auth.js session cookie 転送） |
| auth client | `sendMagicLink` / `signInWithGoogle` / `replaceLoginState` |
| ESLint rule | `/no-access` リテラル禁止 / localStorage 禁止 / window.UBM 禁止 / profile 配下 form 禁止 |
| revalidate | `/login`: dynamic（gate state 依存）, `/profile`: 0（session 依存） |
| 拡張ガイド | AuthGateState 追加時の手順、`editResponseUrl` null 時の文言更新 |

## system spec update 概要

| spec | 差分 | 反映 |
| --- | --- | --- |
| specs/02-auth.md | `/no-access` 不採用が UI で実現されたことを追記 | 必要時に PR |
| specs/05-pages.md | `/login` URL contract（state / email / redirect）を fix | 必要時に PR |
| specs/06-member-auth.md | AuthGateState 5 状態の UI 表現を追記 | 必要時に PR |
| specs/07-edit-delete.md | `/profile` が read-only であることを再強調 | 反映済み |
| specs/13-mvp-auth.md | MVP では Google Form 再回答が本人更新の正式経路（不変条件 #7）を再宣言 | 反映済み |
| specs/16-component-library.md | `LoginPanel` / `MagicLinkForm` / `EditCta` / `StatusSummary` の props を追記 | 必要時に PR |

## documentation-changelog

| 日付 | 変更 | 影響範囲 |
| --- | --- | --- |
| 2026-04-26 | 06b 仕様書 13 phase 完成 | application-implementation Wave 6 |
| 2026-04-26 | `/login` URL contract（state / email / redirect）を確定 | apps/web |
| 2026-04-26 | `/profile` を read-only として確定（編集 UI なし） | apps/web、不変条件 #4 / #11 |
| 2026-04-26 | `/no-access` 不採用を再宣言（不変条件 #9） | apps/web |
| 2026-04-26 | URL query 正本（不変条件 #8）を Magic Link 状態管理にも適用 | apps/web |

## unassigned-task-detection

| 未割当項目 | 理由 | 登録先候補 |
| --- | --- | --- |
| `POST /me/visibility-request` 用 confirm dialog | 本タスクは login + profile read-only に集中 | 後続 wave（公開状態切替 UI 専用 task） |
| `POST /me/delete-request` 用 confirm dialog | 同上 | 後続 wave |
| 退会復元 UI（admin 経由） | 本タスクは会員視点のみ | 06c admin |
| profile fields のラベル日本語化（stableKey → 表示名 mapping） | 12-search-tags の表示名辞書次第 | 12-search-tags 関連 task |
| `/profile` の i18n（ja のみ） | MVP は ja のみ | 将来 wave |
| Magic Link 再送 cooldown の永続化（reload 後も継続） | URL query で代替、優先度低 | 後続 wave |

## skill feedback

| skill | feedback |
| --- | --- |
| task-specification-creator | AuthGateState のような state machine UI は phase-2 の設計表に「state ↔ UI ブロック ↔ CTA」3 列フォーマットを標準化すると良い |
| aiworkflow-requirements | `/no-access` 不採用や profile read-only のような「やらない」ルールが reference に index 化されていると参照効率が上がる |

## phase12-task-spec-compliance-check

| 不変条件 | 遵守 | 根拠 |
| --- | --- | --- |
| #1 schema 固定しない | OK | profile field は stableKey 経由参照のみ（AC-11） |
| #2 consent キー統一 | OK | `publicConsent` / `rulesConsent` のみ使用（AC-5, AC-10） |
| #3 responseEmail = system field | OK | UI で system 扱い、ログイン用 email は別管理 |
| #4 本人本文編集禁止（Google Form 経由） | OK | `/profile` は read-only、`EditCta` で responderUrl / editResponseUrl のみ提供（AC-8, AC-9） |
| #5 D1 直接アクセス禁止 | OK | 全 fetch は 04b / 05b 経由（AC-7, AC-8） |
| #6 GAS prototype 非昇格 | OK | `window.UBM` / `localStorage` 不採用（AC-12） |
| #7 responseId と memberId 混同なし | OK | session.memberId のみ参照、MVP では Google Form 再回答が本人更新の正式経路 |
| #8 localStorage 非正本 | OK | URL query 正本（AC-1, AC-12） |
| #9 `/no-access` 不依存 | OK | `/login` で 5 状態を吸収、`/no-access` ルート不存在（AC-4, AC-6, AC-7） |
| #10 無料枠内 | OK | Workers req 0.43% 使用 |
| #11 他人本文編集禁止 | OK | profile に編集 UI 不在（AC-8） |
| #12 admin_member_notes 漏れなし | N/A | 本タスクは admin scope 外 |
| #13 tag は queue 経由 | N/A | 本タスクは tag 操作なし |
| #14 schema 集約 | N/A | 本タスクは schema 操作なし |
| #15 attendance 重複防止 | N/A | 本タスクは attendance 操作なし |

## LOGS.md 記録

- 変更要約: 06b `/login` `/profile` 仕様書 13 phase 完成
- 判定根拠: AC-1〜AC-12 trace、不変条件 #1〜#11（適用範囲）すべて担保
- 未解決事項: 上流 04b, 05a, 05b, 00 の AC が完了次第 Phase 10 を再評価

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 13 | PR 説明文に compliance check を埋め込み |
| 後続 wave 08a/b | AC マトリクスと test 計画を入力 |

## 多角的チェック観点

| 不変条件 | 確認 | 結果 |
| --- | --- | --- |
| #1〜#11（適用範囲） | compliance check の表 | 全 OK |
| spec sync | specs/02, 05, 06, 07, 13, 16 と齟齬なし | OK |
| handoff | 08a/b に渡せる成果物がある | OK |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide.md | 12 | pending | Part 1 + Part 2 |
| 2 | system-spec-update-summary.md | 12 | pending | 6 spec |
| 3 | documentation-changelog.md | 12 | pending | 5 行 |
| 4 | unassigned-task-detection.md | 12 | pending | 6 件 |
| 5 | skill-feedback-report.md | 12 | pending | 2 skill |
| 6 | phase12-task-spec-compliance-check.md | 12 | pending | 不変条件 trace |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | サマリ |
| ガイド | outputs/phase-12/implementation-guide.md | Part 1 + Part 2 |
| 差分 | outputs/phase-12/system-spec-update-summary.md | spec 差分 |
| 履歴 | outputs/phase-12/documentation-changelog.md | 変更履歴 |
| 課題 | outputs/phase-12/unassigned-task-detection.md | 未割当 |
| feedback | outputs/phase-12/skill-feedback-report.md | feedback |
| 自己点検 | outputs/phase-12/phase12-task-spec-compliance-check.md | compliance |
| メタ | artifacts.json | phase 12 status |

## 完了条件

- [ ] 6 種すべて生成
- [ ] 不変条件 #1, #2, #4, #5, #6, #7, #8, #9, #10, #11 への記述あり
- [ ] AC-1〜AC-12 がガイドに反映
- [ ] spec sync 漏れなし

## タスク100%実行確認【必須】

- 全 6 サブタスクが completed
- 6 種ドキュメント配置
- 不変条件への明示
- 次 Phase で承認 gate を通す準備完了

## 次 Phase

- 次: 13 (PR 作成)
- 引き継ぎ事項: 6 種ドキュメントを PR description に貼付
- ブロック条件: ドキュメント不足 / compliance check で violation あれば進まない
