# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04b-followup-004-admin-queue-resolve-workflow |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| 作成日 | 2026-05-01 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (API / repository 実装) |
| 状態 | completed |

## 目的

Issue #319 の AC を、API contract、repository transaction、楽観ロック、web UI、admin gate、visual evidence のテストへ分解する。`outputs/phase-04/test-strategy.md` を副成果物として TC 一覧と AC 紐付けを記述する。

## 実行タスク

1. `outputs/phase-04/test-strategy.md` に TC-01 以降のテスト一覧を作り AC-1〜AC-6 と補助不変条件に紐付ける
2. repository test に listPending 複合 filter / cursor / 楽観ロック / transaction rollback を追加する
3. API route test に admin gate、zod validation、404 / 409、empty response を追加する
4. Web test に queue 一覧、resolve modal、confirm dialog、disabled state（resolved 行）、エラー表示を追加する
5. Playwright smoke に desktop / mobile screenshot と axe 相当の a11y 確認を置く

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 既存 test | apps/api/src/repository/__tests__/adminNotes.test.ts | repository baseline |
| 既存 fixture | apps/api/src/repository/__fixtures__/admin.fixture.ts | admin_member_notes seed |
| 既存 admin tests | apps/api/src/routes/admin/* | admin gate / `requireAdmin` パターン |
| Playwright | apps/web/playwright/fixtures/auth.ts | admin auth smoke |

## 実行手順

### ステップ 1: API / repository test matrix

| TC | 観点 | 期待 | AC |
| --- | --- | --- | --- |
| TC-01 | non-admin が `GET /admin/requests` / `POST /admin/requests/:noteId/resolve` を叩く | 401 または 403 | AC-1 |
| TC-02 | `GET /admin/requests?status=pending&type=visibility_request` | 当該 type の pending のみ古い順 | AC-1 |
| TC-03 | `GET /admin/requests?status=pending&type=delete_request` | 同上 | AC-1 |
| TC-04 | visibility_request approve | member_status.publish_state 更新 + admin_member_notes resolved（同 transaction） | AC-2 |
| TC-05 | delete_request approve | member_status.is_deleted=1 + admin_member_notes resolved（物理削除しない） | AC-3 |
| TC-06 | resolution=reject | member_status 不変、admin_member_notes.request_status='rejected' | AC-4 |
| TC-07 | transaction 中で member_status 更新が失敗 | admin_member_notes も rollback、両者元の状態 | AC-6 |
| TC-08 | resolved 済 noteId へ再 approve | 409 Conflict、member_status も note も再変更されない | AC-5 |
| TC-09 | resolutionNote > 500 文字 | 400 zod validation | 補助不変条件 |
| TC-10 | invalid cursor / unknown noteId | 400 / 404 | AC-1, AC-5 |

### ステップ 2: Web / visual test matrix

| TC | 観点 | 期待 | AC |
| --- | --- | --- | --- |
| TC-21 | `/admin/requests` 初期表示 | pending 一覧 + tab（visibility / delete） | AC-1 |
| TC-22 | resolve modal 起動 | 依頼 payload プレビュー + approve / reject ボタン | 補助不変条件 |
| TC-23 | delete_request approve confirm dialog | 二段確認なしで実行できない | AC-3 |
| TC-24 | resolve 完了後の一覧 refresh | 当該 noteId が pending 一覧から消える | AC-1 |
| TC-25 | 409 Conflict 表示 | 「他の admin が処理済」エラー、UI 崩れなし | AC-5 |
| TC-26 | non-admin の `/admin/requests` 直接アクセス | layout gate でリダイレクト | AC-1 |
| TC-27 | desktop / mobile screenshot | layout 崩れなし、a11y violations 0 | 補助不変条件 |

### ステップ 3: テスト実装順

API route test と repository transaction test を先に red にし、Phase 5 で green 化する。Web component test と Playwright smoke は Phase 6 で red → green。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | API / repository test を先に red にする |
| Phase 6 | Web test / Playwright smoke を red にする |
| Phase 7 | AC matrix へ TC を紐付ける |
| Phase 11 | visual evidence の capture plan |

## 多角的チェック観点（AIが判断）

- transaction rollback テストは D1 のテスト環境で `member_status` 側の制約違反（例: invalid publish_state）を意図的に起こして検証する
- 楽観ロック（`WHERE request_status='pending'`）は parallel resolve の race condition test を fixture レベルで再現する
- delete_request approve は不可逆操作なので、UI confirm dialog の DOM テストを必ず置く
- `requestedPayload` の PII projection を component test レベルで検証する（生 email / phone が DOM に出ないこと）

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | test-strategy 作成 | spec_created | outputs/phase-04 |
| 2 | API / repository test | spec_created | apps/api |
| 3 | Web / visual test | spec_created | apps/web |
| 4 | transaction rollback test | spec_created | TC-07 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | Phase 4 サマリ |
| ドキュメント | outputs/phase-04/test-strategy.md | TC 一覧と AC 紐付け |

## 完了条件

- [ ] AC-1〜AC-6 と補助不変条件が TC に紐付く
- [ ] API / web / visual の失敗時戻り先が明確
- [ ] transaction rollback / 楽観ロック / 冪等性 / confirm dialog の negative test がある
- [ ] PII projection の component-level 検証が含まれている

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] main.md + test-strategy.md 配置
- [ ] artifacts.json の Phase 4 を completed に更新

## 次Phase

次: 5 (API / repository 実装)。
