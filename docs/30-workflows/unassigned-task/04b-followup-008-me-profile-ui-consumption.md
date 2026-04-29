# `/me/profile` UI 側消費（フロントエンド統合） - タスク指示書

## メタ情報

| 項目         | 内容                                                          |
| ------------ | ------------------------------------------------------------- |
| タスクID     | 04b-followup-003-me-profile-ui-consumption                    |
| タスク名     | `/me/profile` を会員マイページ UI から消費する                |
| 分類         | 統合 / フロントエンド                                         |
| 対象機能     | apps/web 側の会員マイページで `/me/profile` を SSR/CSR 表示   |
| 優先度       | 高                                                            |
| 見積もり規模 | 中規模                                                        |
| ステータス   | 未実施                                                        |
| 発見元       | 04b Phase 12 unassigned-task-detection #3                     |
| 発見日       | 2026-04-29                                                    |
| 委譲先 wave  | 06b                                                           |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

04b では `/me/profile` を `apps/api` 側に実装し、API 単体テストで仕様を fix した。Phase 12 時点で UI 側（`apps/web` の会員マイページ）からこの API を **消費する実装は未着手** であり、エンドユーザーから見たマイページは未稼働。06b（会員マイページ UI）で統合実装する必要がある。

### 1.2 問題点・課題

- API は実装済だが、UI が叩かない限り会員ジャーニー（ログイン→自分の登録情報確認）が成立しない
- `authGateState`（active / rules_declined / deleted）に応じた画面分岐ロジックが UI に未実装
- API レスポンスの consent キー（`publicConsent` / `rulesConsent`）が UI 側でも整合した名称で表示される必要がある（不変条件 #2）

### 1.3 放置した場合の影響

- メンバーが自分の登録情報を確認できないまま運用開始する
- 編集/削除依頼導線（`/me/visibility-request` `/me/delete-request`）が UI から到達不能で、04b の admin queue が空のまま機能検証できない
- UI 側で API 仕様の取り違えが起こると、04b の API 仕様変更が連鎖的に発生するリスク

---

## 2. 何を達成するか（What）

### 2.1 目的

会員マイページ画面で `/me/profile` を fetch し、`authGateState` に応じた表示分岐と編集/削除依頼導線を整える。

### 2.2 最終ゴール

- `apps/web` の会員マイページが `/me/profile` を SSR または CSR で取得し表示している
- `authGateState` ごとの分岐（active 表示 / rules_declined 警告 / deleted 表示なし）が UI に実装されている
- 編集依頼ボタン → `/me/visibility-request`、削除依頼ボタン → `/me/delete-request` の導線が UI に存在する
- 申請中（pending）の場合は重複申請ボタンを disable する

### 2.3 スコープ

#### 含むもの

- `apps/web` の会員マイページ Page / Component 実装
- `/me/profile` `/me/visibility-request` `/me/delete-request` を叩く client（SSR fetch + CSR 再取得）
- `authGateState` 分岐表示
- 申請中状態の disable 制御（API レスポンスの pending フラグ参照）
- claude-design-prototype の該当画面参照

#### 含まないもの

- API 仕様変更（04b で fix 済）
- Auth.js cookie session 設定（[04b-followup-001](04b-followup-001-authjs-cookie-session-resolver.md)）
- admin queue resolve workflow（[04b-followup-004](04b-followup-004-admin-queue-resolve-workflow.md)）

### 2.4 成果物

- マイページ Page / Component
- `/me/*` 用 client モジュール
- visual evidence（claude-design-prototype 準拠 screenshot）
- e2e テスト（Auth.js + cookie session 経由）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 04b の `/me/*` API が staging で稼働している
- [04b-followup-001](04b-followup-001-authjs-cookie-session-resolver.md) が完了し、cookie session 経由で 200 が返る
- claude-design-prototype の該当画面（マイページ）が確定している

### 3.2 実行手順

1. claude-design-prototype のマイページ仕様と `/me/profile` レスポンス schema をマッピング
2. `apps/web` 側 client（fetch wrapper）を実装し SSR fetch 経路を整備（cookie 同送）
3. Page Component を実装し `authGateState` 分岐を入れる
4. visibility-request / delete-request ボタン導線と pending 状態 disable を実装
5. 統合テスト（Auth.js mock cookie session）と visual evidence を取得

### 3.3 受入条件 (AC)

- AC-1: 会員ログイン後、自分の登録情報がマイページに表示される
- AC-2: `authGateState=rules_declined` で適切な警告 UI が出る
- AC-3: `authGateState=deleted` でマイページにアクセスできない（または削除済表示）
- AC-4: 編集/削除依頼ボタンが API を叩き、申請中は disable される
- AC-5: claude-design-prototype の該当画面と整合した visual evidence が記録されている

---

## 4. 苦戦箇所 / 学んだこと（04b で得た知見）

### 4.1 API 先行 / UI 後追いの分業

04b は API 単独で response schema を fix し、04b 内テストで完結させたため、UI 実装側 (06b) は **API 仕様を消費するだけ** の最小スコープに整理できる。本タスクは API 仕様変更を伴わない前提で進められる。

### 4.2 authGateState の表現差異への注意

04b では `MeSessionUserZ` の `authGateState` を `active / rules_declined / deleted` の 3 値に絞った。UI 側はこの 3 値前提で分岐を組むこと（spec 04-types の 5 値 enum と直結させない）。

---

## 5. 関連リソース

- `docs/30-workflows/04b-parallel-member-self-service-api-endpoints/outputs/phase-12/implementation-guide.md`
- `docs/00-getting-started-manual/specs/06-member-auth.md`
- `docs/00-getting-started-manual/specs/07-edit-delete.md`
- `docs/00-getting-started-manual/claude-design-prototype/`
- 04b 実装の `/me/profile` ハンドラ
- [04b-followup-001-authjs-cookie-session-resolver.md](04b-followup-001-authjs-cookie-session-resolver.md)
