# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | magic-link-provider-and-auth-gate-state |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-26 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | pending |

## 目的

Magic Link 補助導線と AuthGateState 5 状態判定の責務範囲・受入条件を、specs（02-auth.md / 06-member-auth.md / 13-mvp-auth.md）と D1 schema（08-free-database.md）から抽出して固定する。`/no-access` 画面に依存しない設計を確定し、Wave 6 の login / profile 実装に渡す前提を縛る。

## 実行タスク

1. specs から `AuthGateState` 5 状態の遷移条件と判定キーを抽出（completion: outputs/phase-01/main.md に状態表記載）
2. `magic_tokens` テーブル schema を 08-free-database.md から確認し token lifecycle を確定（completion: token TTL / use_at の挙動を決定）
3. `POST /auth/magic-link` と `GET /auth/gate-state` の I/O 草案を AC として固定（completion: AC-1〜AC-10 を outputs/phase-01/main.md に記述）
4. 4 条件（価値性 / 実現性 / 整合性 / 運用性）を判定（completion: PASS / TBD を表で）
5. 上流（04b / 04c / 02c / 03b）からの引き渡しを列挙（completion: handoff 表に記載）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/02-auth.md | `/login` 状態 5 種、`/no-access` 不採用 |
| 必須 | doc/00-getting-started-manual/specs/06-member-auth.md | ログイン許可条件と AuthGateState |
| 必須 | doc/00-getting-started-manual/specs/13-mvp-auth.md | MVP 認証条件、ログインと公開の分離 |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | `magic_tokens` テーブル schema |
| 参考 | doc/00-getting-started-manual/specs/01-api-schema.md | `responseEmail` を system field として扱う前提 |
| 参考 | CLAUDE.md | 不変条件 #2, #3, #5, #9 |

## 実行手順

### ステップ 1: input と前提の確認
- 上流 04b（`GET /me`）と 04c（admin gate）の API 契約を読み、session payload の形を仮置きする
- 02c の `magic_tokens` repository の interface を確認

### ステップ 2: Phase 成果物の作成
- `outputs/phase-01/main.md` に
  - `AuthGateState` 5 状態の判定条件
  - `magic_tokens` の TTL / 一回限り使用ルール
  - AC-1 〜 AC-10
  - 含まないこと（Google OAuth / 画面 UI / admin gate）
  を記述

### ステップ 3: 4条件と handoff の確認
- 価値性: `/no-access` 不要化により無料運用と UX 単純化の両立
- 実現性: Cloudflare Workers + D1 + Resend / SendGrid で成立
- 整合性: consent キーが publicConsent / rulesConsent に統一（不変条件 #2）
- 運用性: token TTL を 15 分にすることで sweep 不要 / 無料枠で完結

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | AC を入力として API 契約を確定 |
| Phase 4 | AC ごとの test 設計に展開 |
| Phase 7 | AC マトリクスの源 |
| Phase 10 | gate 判定の根拠 |
| Phase 12 | implementation-guide の引数 |

## 多角的チェック観点

| # | 不変条件 | 確認内容 | 反映場所 |
| --- | --- | --- | --- |
| #2 | publicConsent / rulesConsent 統一 | gate state 判定で `rulesConsent` キー名を直接使う | AC-2 |
| #3 | `responseEmail` は system field | gate state lookup の引数は `email` だが system field 扱い | AC-1 |
| #5 | apps/web から D1 直接禁止 | magic_tokens 操作は apps/api のみ | architecture |
| #7 | responseId と memberId 混同しない | session callback で `memberId` を返す | AC-10 |
| #9 | `/no-access` 不採用 | apps/web 配下に `/no-access` route 不在を fs check | AC-7 |
| #10 | 無料枠 | token 発行回数 / D1 writes 見積もり | Phase 9 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | spec 抽出 | 1 | pending | 02-auth / 06-member-auth / 13-mvp-auth |
| 2 | magic_tokens schema 確認 | 1 | pending | 08-free-database.md |
| 3 | AC 草案 | 1 | pending | AC-1〜AC-10 |
| 4 | 4条件判定 | 1 | pending | PASS / TBD |
| 5 | handoff 整理 | 1 | pending | 04b/04c/02c/03b |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | Phase 1 の主成果物（AC、状態表、4 条件） |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- [ ] AC-1〜AC-10 が outputs/phase-01/main.md に記述されている
- [ ] AuthGateState 5 状態の判定条件が表で示されている
- [ ] 4 条件評価が PASS ないし理由付き TBD
- [ ] 不変条件 #2, #3, #5, #7, #9, #10 への対応が明記

## タスク100%実行確認【必須】

- 全実行タスク 5 件が completed
- outputs/phase-01/main.md が配置済み
- 全完了条件にチェック
- 異常系（無料枠超過 / drift）も観点として記載
- 次 Phase への引継ぎ事項を末尾に記述
- artifacts.json の phase 1 を completed に更新

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ事項: AC を API 契約の入力として渡す。AuthGateState の 5 状態を Mermaid 状態機械に展開する
- ブロック条件: AC が未確定の場合は Phase 2 へ進まない

## 真の論点

- `unregistered` / `rules_declined` / `deleted` を `/login` 内で吸収できるか（不変条件 #9 の堅持）
- Magic Link の verification を Auth.js 標準の email provider で完結できるか、それとも自前実装か
- token TTL を短く（15 分）すると UX が悪化しないか

## 依存境界

| 種別 | 境界 | 担当 | 越境禁止 |
| --- | --- | --- | --- |
| 上流 | `/me/*` `/admin/*` API | 04b / 04c | session 確立後しか呼べない |
| 上流 | `magic_tokens` repository | 02c | apps/web から直接呼ばない |
| 上流 | `member_status` の rules_consent / is_deleted | 03b | snapshot は sync 済み前提 |
| 並列 | Google OAuth provider | 05a | session callback で memberId 解決を共有 |
| 下流 | `/login` 画面 | 06b | 本タスクは画面実装しない |

## 価値とコスト

| 軸 | 内容 |
| --- | --- |
| 価値 | `/no-access` 画面不要化、Magic Link で Google アカウント不保有者も救える |
| コスト | mail provider の secret 管理、token TTL 設計、コールバック実装 |
| 払わないコスト | 物理削除の復元 UI、admin による token 強制無効化 UI（MVP 範囲外） |

## 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | `/no-access` 専用画面の保守コストを下げるか | PASS | AuthGateState で吸収すれば 1 ルート減 |
| 実現性 | 無料枠で magic link を運用できるか | PASS | Resend 無料枠 100 通/日で十分 |
| 整合性 | consent / responseEmail が specs と一致するか | PASS | 02-auth / 13-mvp-auth と完全一致 |
| 運用性 | token sweep / rotation が運用可能か | PASS | TTL 15 分で sweep 不要 |
