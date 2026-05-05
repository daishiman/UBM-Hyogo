# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04b-followup-004-admin-queue-resolve-workflow |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-05-01 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | completed |

## 目的

Phase 1-2 の要件と設計をレビューし、Phase 4 以降へ進めるかを判定する。特に D1 transaction の atomic 性、楽観ロックによる冪等性、admin gate 二段防御、不変条件 #4 / #5 との整合を 4 条件レビューで確認する。

## 実行タスク

1. 正本仕様（API / DB / Admin / 編集削除仕様）との矛盾を確認する
2. simpler alternative（transaction を使わずアプリ層補正など）を検討する
3. MAJOR / MINOR / PASS を判定する
4. Phase 4 開始条件と Phase 13 blocked 条件を記録する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 1 | phase-01.md | 要件 |
| Phase 2 | phase-02.md | 設計 |
| 正本 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | admin API 整合 |
| 正本 | .claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md | admin UI 整合 |
| 正本 | docs/00-getting-started-manual/specs/07-edit-delete.md | 論理削除方針 |

## 実行手順

### ステップ 1: 4 条件レビュー

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | 不変条件 #4 (admin-managed 分離) / #5 (D1 access apps/api 内) と整合。admin gate 二段防御を維持 |
| 漏れなし | PASS | 一覧 / 確定 / transaction / 楽観ロック / UI / visual evidence / docs を Phase 化 |
| 整合性 | PASS | 04b-followup-001 で追加された `request_status` 列と `markResolved`/`markRejected` helper を再利用 |
| 依存関係整合 | PASS | 04b / 04b-followup-001 / 05a / 06c / 07a / 08a / 08b に依存 |

### ステップ 2: simpler alternative

transaction を使わず、`member_status` 更新後にアプリ層で `admin_member_notes` を更新する案は、途中失敗時に部分更新が残り audit metadata と実状態が乖離するため不採用。D1 の実環境で rollback を実測できる transaction strategy と楽観ロック（`WHERE request_status='pending'`）を採用する。

resolve API を PUT idempotent にする案も検討したが、resolution（approve / reject）の選択が初回送信時点で確定する性質のため、二度目以降は 409 で拒否する設計（noteId 単位の一回性）の方が監査・運用に整合する。

### ステップ 3: GO / NO-GO

判定: GO。Phase 4 以降へ進行可能。Phase 13 は user approval なし PR 作成禁止。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | MAJOR なしのため test strategy 作成へ |
| Phase 10 | GO 判定の再確認 |
| Phase 13 | user approval なし PR 作成禁止 |

## 多角的チェック観点（AIが判断）

- atomic 性は機能要件ではなく不変条件として扱う。Phase 4 negative test で「途中失敗時の rollback」を必ず置く
- delete_request 承認は不可逆な操作（公開ディレクトリから消える）なので、UI で必ず confirm dialog を挟むことを Phase 6 に伝達
- closed issue なので Issue 操作は不要。仕様書作成だけで止める
- Phase 13 は PR 作成準備まで書くが、実 PR はユーザー承認まで blocked

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | 正本整合レビュー | spec_created | PASS |
| 2 | alternative 検討 | spec_created | transaction + 楽観ロック採用 |
| 3 | GO/NO-GO | spec_created | GO |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 設計レビュー |
| メタ | artifacts.json | Phase 3 spec_created |

## 完了条件

- [ ] 4 条件レビュー完了
- [ ] GO/NO-GO 記録済み
- [ ] Phase 13 blocked 条件明記済み
- [ ] simpler alternative の不採用理由が記録されている

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] main.md 配置済み
- [ ] artifacts.json の Phase 3 が completed

## 次Phase

次: 4 (テスト戦略)。Phase 4 以降は実装者が順次実行する。
