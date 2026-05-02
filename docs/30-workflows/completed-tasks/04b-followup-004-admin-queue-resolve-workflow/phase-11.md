# Phase 11: 手動 smoke / visual evidence

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04b-followup-004-admin-queue-resolve-workflow |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke / visual evidence |
| 作成日 | 2026-05-01 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | completed |
| 関連 Issue | #319 (closed) |

## 目的

VISUAL タスクとして admin の `/admin/requests` 画面（pending list / resolve modal / approve 反映 / reject 反映 / empty / error / 二重 resolve 409）の実画面証跡を取得する。UI 崩れ、admin gate（非 admin の 403/redirect）、resolve 後の状態反映、二重 resolve エラー時の UI 動作、empty state を視覚と DOM の双方で確認する。

## 完了時の実測境界

Phase 11 は local static render screenshot と API/Web automated tests で completed とする。authenticated local/staging admin session + D1 fixture を要する E2E screenshot は staging smoke 実行時の delegated evidence として扱う。

## 実行タスク

1. `outputs/phase-11/screenshot-plan.json` を作る（target 名、viewport、確認観点、撮影手順を JSON で）
2. 7 target を撮影する: requests-pending-list / resolve-modal-visibility / resolve-modal-delete / approve-applied / reject-applied / requests-empty / resolve-conflict-409
3. `outputs/phase-11/manual-test-result.md` と `outputs/phase-11/manual-test-report.md` を作る
4. `outputs/phase-11/discovered-issues.md` に発見事項を記録する
5. `outputs/phase-11/ui-sanity-visual-review.md` と `outputs/phase-11/phase11-capture-metadata.json` を作る
6. `outputs/phase-11/main.md` に summary を残す

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 10 | outputs/phase-10/go-no-go.md | capture 判定 |
| Playwright | apps/web/playwright | screenshot ハーネス |
| UI | apps/web/app/(admin)/admin/requests/page.tsx | 撮影対象（実装後に確定） |
| API | apps/api/src/routes/admin/requests.ts | resolve API（実装後に確定） |

## 実行手順

### screenshot targets

| target | viewport | 確認観点 |
| --- | --- | --- |
| requests-pending-list | desktop | pending 一覧、note_type バッジ、依頼日時、依頼者表示 |
| resolve-modal-visibility | desktop | visibility_request の resolve modal（approve / reject 切替、resolutionNote 入力） |
| resolve-modal-delete | desktop | delete_request の resolve modal（approve で論理削除実行の確認 UI） |
| approve-applied | desktop | approve 後に list から消え `member_status.publish_state` / `is_deleted` が反映された状態 |
| reject-applied | desktop | reject 後 list から消え `member_status` 不変、`admin_member_notes.request_status='rejected'` のみ更新 |
| requests-empty | desktop | pending 0 件時の empty state |
| resolve-conflict-409 | desktop | 二重 resolve 試行時のエラー UI（409 toast / 冪等メッセージ） |

### admin gate と invariant

- 非 admin で `/admin/requests` にアクセスした場合 redirect / 403 になることを別ケースで確認する
- DOM に raw PII が露出していないことを確認する（依頼者表示は member_id / display_name のみ）

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | implementation-guide / system-spec-update に visual evidence パス参照 |
| Phase 13 | PR body の evidence link |

## 多角的チェック観点（AIが判断）

- screenshot は実測 PASS のみ PASS とする
- approve / reject 後の DB 状態を API レスポンスでも確認する（UI だけで PASS にしない）
- 二重 resolve は同一 noteId への 2 回目 POST が 409 になることを実測する
- admin-managed data（`admin_member_notes`）と member-owned data（`member_status`）の更新が transaction 内で同期していることを擬似失敗テスト（D1 mock）でも確認する

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | screenshot-plan | pending | json |
| 2 | visual capture | pending | 7 target |
| 3 | manual test report | pending | result / report |
| 4 | sanity review | pending | a11y / overflow / mobile |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | サマリ |
| 証跡 | outputs/phase-11/screenshot-plan.json | capture plan |
| 証跡 | outputs/phase-11/manual-test-result.md | 結果 |
| 証跡 | outputs/phase-11/manual-test-report.md | 詳細 |
| 証跡 | outputs/phase-11/discovered-issues.md | 発見事項 |
| 証跡 | outputs/phase-11/ui-sanity-visual-review.md | UI sanity |
| 証跡 | outputs/phase-11/phase11-capture-metadata.json | metadata |

## 完了条件

- [ ] 7 target の visual evidence がある
- [ ] approve / reject の DB 反映が API レスポンスで確認済み
- [ ] 二重 resolve 409 の動作が実測済み
- [ ] discovered issues の blocker が 0

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] Phase 11 固定成果物が配置済み
- [ ] artifacts.json の Phase 11 を completed に更新

## 次Phase

次: 12 (ドキュメント更新)。
