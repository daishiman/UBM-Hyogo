# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-self-service-api-endpoints |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| Wave | 4 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | pending |

## 目的

`/me/*` 4 endpoints の責務・入出力・認可境界・依存先 wave からの引き渡しを Phase 1 で確定し、本人プロフィール本文の直接編集禁止（不変条件 #4）と他人 memberId 露出禁止（不変条件 #11 の前段）を要件として固定する。

## 真の論点 (true issue)

- `/me` の SessionUser に admin flag を含めるか、admin gate（05a）に閉じるか。本タスクは `isAdmin` を含めるが「authz 判定の正本は admin gate middleware」という二重正本にしない明確化。
- `editResponseUrl` が forms.responses.list で取得不可な場合の fall-back（responderUrl + 既存メールでの再回答誘導）。
- visibility/delete request を `admin_member_notes` の type 列で表現するか、別テーブルにするか → 02c の `admin_member_notes` 範囲内に閉じる方針を取る。

## 依存境界

| 種別 | 対象 | 引き渡し内容 |
| --- | --- | --- |
| 上流 | 02a member repository | `findMemberByEmail` / `findMemberStatus` / `loadMemberProfile(memberId)` を提供 |
| 上流 | 02c admin notes / audit | `appendAdminMemberNote(type, body, sourceMemberId)` を提供 |
| 上流 | 03b response sync | `current_response_id` 切替後の最新 response を `editResponseUrl` 付きで提供 |
| 上流 | 01b view models | SessionUser / MemberProfile / FieldVisibility 型 |
| 下流 | 05a Google OAuth + admin gate | `/me` を session callback の SSR で叩く |
| 下流 | 05b Magic Link + AuthGateState | login 後に `/me` を叩いて authGateState を確定 |
| 下流 | 06b member pages | `/me/profile` を SSR / CSR で消費 |
| 下流 | 08a contract / authz tests | 4 endpoint の verify suite を網羅 |

## 価値とコスト

- 初回価値: 会員が「自分の登録内容と公開状態を確認」「Google Form 編集導線を踏む」「公開停止/退会を申請」の 3 動作を 1 系統 API で完結できる。
- 初回で払わないコスト: 会員プロフィール本文の D1 上書き機構 / `/me/profile` の差分 PATCH / アプリ内編集 UI（不変条件 #4）。
- 撤退コスト: visibility/delete request を別テーブル化したくなった場合は `admin_member_notes.type` migration で済む（02c 改修一回）。

## 4 条件

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | 会員 self-service の核（自分情報確認 + 申請）を最小数で提供できているか | PASS | 4 endpoint で 06b 全責務を満たす |
| 実現性 | 02a / 02c / 03b の repository 揃った状態で 1 wave 内に書けるか | PASS | 同 Wave 4 の他タスクと依存被りなし、API 層のみ |
| 整合性 | session 正本は Auth.js、本文正本は Google Form、申請正本は admin queue で分離できているか | PASS | 不変条件 #4 / #11 / #12 と矛盾なし |
| 運用性 | request の rate limit と二重申請防止を notes 側に閉じて運用できるか | PASS | admin_member_notes の type 列でユニーク判定可能 |

## スコープ

### 含む

- `GET /me` / `GET /me/profile` / `POST /me/visibility-request` / `POST /me/delete-request`
- session 必須 middleware（Auth.js cookie / JWT 検証は 05a 担当、本タスクは consumer 側）
- 自分の memberId 解決と他人 memberId 露出禁止 guard
- editResponseUrl 取得 + fallback 戦略
- visibility/delete request の二重投入防止判定

### 含まない

- profile 本文の PATCH（不変条件 #4）
- Auth.js provider 設定（05a）
- Magic Link 発行（05b）
- admin queue 処理（07a/c）
- UI 実装（06b）

## 実行タスク

1. 4 endpoint の入出力 contract を箇条書きで確定
2. session 必須・自身判定 middleware の責務境界を index.md と整合
3. visibility/delete request の `admin_member_notes.type` を `visibility_request` / `delete_request` に固定
4. editResponseUrl の取得経路（forms.responses.list で `respondentEmail.editUrl` をキャプチャ）を 03b と整合
5. AC × 不変条件 mapping の下書き

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/06-member-auth.md | SessionUser 型・ログイン許可条件 |
| 必須 | docs/00-getting-started-manual/specs/07-edit-delete.md | editResponseUrl 誘導・visibility/delete 申請 API |
| 必須 | docs/00-getting-started-manual/specs/13-mvp-auth.md | MVP ログイン条件 |
| 必須 | docs/00-getting-started-manual/specs/02-auth.md | session 内容・admin 判定切り出し |
| 必須 | docs/00-getting-started-manual/specs/04-types.md | SessionUser / MemberProfile / FieldVisibility 型 |
| 参考 | docs/00-getting-started-manual/specs/01-api-schema.md | system field（responseEmail / editResponseUrl） |
| 参考 | docs/00-getting-started-manual/specs/08-free-database.md | admin_member_notes / member_status |

## 実行手順

### ステップ 1: input 確認

- index.md の AC-1〜AC-8 を読み込み、各 AC が「endpoint × 不変条件」で説明されているか確認する
- 上流 02a / 02c / 03b の AC を読み、`loadMemberProfile` / `appendAdminMemberNote` / `current_response_id` の引き渡しシグネチャを下書き

### ステップ 2: 主成果物作成

- `outputs/phase-01/main.md` に「4 endpoint 仕様 + 引き渡し + AC マッピング」を記述
- 4 endpoint について次を記録: method / path / 認可 / request schema / response schema / 触れる D1 / 触れる不変条件

### ステップ 3: 4 条件 + handoff

- 価値性 / 実現性 / 整合性 / 運用性 を再確認し、Phase 2 で「Mermaid + module 設計 + dependency matrix + env」に展開する点を明示

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | endpoint contract と handler module 配置 |
| Phase 4 | unit / contract / authz テストへ AC を引き渡し |
| Phase 7 | AC matrix の row として全 4 endpoint × 8 AC を保持 |
| Phase 10 | GO/NO-GO 判定の根拠 |
| Phase 12 | implementation-guide と spec sync 判断 |

## 多角的チェック観点（不変条件マッピング）

- #4 本人プロフィール本文 D1 編集禁止: PATCH 系 endpoint を作らないことを Phase 1 で明文化（理由: 本文正本は Google Form）
- #5 apps/web → D1 直接禁止: 本タスクは apps/api 側、apps/web から `/me/*` 経由でのみ aces（理由: 境界遵守）
- #7 responseId と memberId 混同禁止: SessionUser 型に両方を別フィールドで持つ（理由: 同名混入回避）
- #8 localStorage を session 正本にしない: cookie / JWT のみ（理由: 認証正本一意化）
- #9 /no-access 専用画面非依存: AuthGateState を `/me` レスポンスに含めて UI 出し分け（理由: 06b の 5 状態出し分け基盤）
- #11 他人 memberId 露出禁止: path の memberId 受領を撤廃し、session の memberId のみ参照（理由: 認可境界）
- #12 admin_member_notes は public/member view model に混ざらない: visibility/delete request 投入時も MemberProfile に notes を返さない（理由: 公開境界）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 4 endpoint contract 下書き | 1 | pending | outputs/phase-01/main.md |
| 2 | 上流 repository 引き渡し定義 | 1 | pending | 02a / 02c / 03b と整合 |
| 3 | 不変条件 → AC mapping | 1 | pending | Phase 7 への伏線 |
| 4 | editResponseUrl fall-back 方針 | 1 | pending | 03b と整合 |
| 5 | 4 条件評価 | 1 | pending | 全 PASS 想定 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | Phase 1 主成果物 |
| メタ | artifacts.json | phase 1 を completed に更新 |

## 完了条件

- [ ] 4 endpoint の input / output と認可境界が確定している
- [ ] 上流 02a / 02c / 03b への要求が記述されている
- [ ] AC-1〜AC-8 と不変条件 #4 / #11 の対応が下書きされている
- [ ] 4 条件が全 PASS で記録されている

## タスク100%実行確認【必須】

- 全実行タスク completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- editResponseUrl の取得不能ケースの fall-back を記録
- artifacts.json の Phase 1 を completed に更新

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ事項: 4 endpoint contract、上流引き渡し、AC × 不変条件 mapping を Phase 2 の Mermaid / module 設計 / env / dependency matrix に展開
- ブロック条件: 上流 02a / 02c / 03b の AC が未記述なら次 Phase 開始しない
