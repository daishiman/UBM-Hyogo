# Phase 9: 品質保証

**[実装区分: 実装仕様書]**（VISUAL UI task）

## メタ情報

| key | value |
|---|---|
| workflow_id | `admin-meetings-card-ux-clarity` |
| phase | 9 / 13 |
| created_at | 2026-06-10 |
| taskType | implementation |
| 対象 branch | `feat/admin-meetings-card-ux-clarity` |
| 関連 AC | AC-6 / AC-7 / AC-8 / AC-9 / AC-10 |
| 関連 Feedback | FB-UI-02-1（ファイル削除なし＝削除 PASS 基準は非該当） |
| SSOT | `../../shared-context.md` §9 / §10 |

## 目的

Phase 5 実装 + Phase 8 リファクタリング後のコードに対し、**line budget / link 健全性 / token parity** と既存品質ゲートの green を機械的に保証する。本タスクは表現層 CSS + wrapper のみで、API/D1/Form は不変であるため、品質保証も表現層と CI gate に閉じる。

## [FB-UI-02-1] ファイル削除に関する PASS 基準の扱い

本タスクは **CSS 追加主体（globals.css への規則追加 + TSX への className/wrapper 付与）であり、ファイル削除を一切伴わない**。

- 変更対象（shared-context §5）は F1 globals.css / F2 / F3 の **編集**、T1 / T2 の **編集** のみ。新規ファイル作成・既存ファイル削除なし。
- したがって「削除されたファイル/シンボルの参照残存が 0 であること」を確認する **削除 PASS 基準は本タスクでは非該当（n/a）** とする。
- dead CSS / dead code の削除を行う場合（Phase 8 R8-3 で重複宣言を排除した場合）も、対象はファイルではなく globals.css 内のセレクタ宣言であり、ファイル削除ではない。削除した CSS セレクタがマークアップから参照されていないことは「定義(.css)自身を grep ヒットに数えない」原則で確認する（CSS dead-code grep は `--include='*.tsx' --include='*.ts'` で参照側のみを数える）。

## 実行タスク

| ID | 内容 | 関連 AC |
|---|---|---|
| Q9-1 | typecheck / lint green | AC-9 |
| Q9-2 | 既存 4 spec + 追加ケース（DR-1〜DR-3, TL-1）全 PASS | AC-6 / AC-10 |
| Q9-3 | token parity（`verify:tokens` green / HEX 0 grep） | AC-7 |
| Q9-4 | apps/api diff 空（API 不変） | AC-8 |
| Q9-5 | line budget（変更ファイルの肥大化チェック） | — |
| Q9-6 | link 健全性（仕様書相互リンク・参照パスの dangling 0） | — |

## チェック項目（PASS 基準）

| # | 項目 | コマンド | PASS 基準 |
|---|---|---|---|
| C1 | typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| C2 | lint | `mise exec -- pnpm lint`（必要時 `--fix`） | exit 0 |
| C3 | 既存4+追加 spec | `mise exec -- pnpm exec vitest run apps/web/src/features/admin/components/_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx apps/web/src/features/admin/components/_meetings/__tests__/MeetingsClientShell.spec.tsx apps/web/src/features/admin/components/_meetings/__tests__/BulkAttendanceChecklist.spec.tsx` | 全 PASS（既存ケース維持 + DR-1〜DR-3 / TL-1 GREEN） |
| C4 | token parity | `mise exec -- pnpm verify:tokens` | green（CI gate `verify-design-tokens` 相当） |
| C5 | HEX 0 grep | `grep -rn "bg-\[#\|text-\[#" apps/web/src/features/admin/components/_meetings apps/web/src/styles/globals.css` | 新規 HEX / arbitrary 色 0 件 |
| C6 | apps/api diff 空 | `git diff dev -- apps/api` | 出力 0 行（API 不変・AC-8） |
| C7 | contract 保持 | `git diff -- apps/web/src/features/admin/components/_meetings \| grep '^[-+].*data-testid'` + focused tests | wrapper移動後も同一 testid が存在（AC-6） |
| C8 | line budget | `git diff dev --stat -- apps/web/src/features/admin/components/_meetings apps/web/src/styles/globals.css` | 表現層改修として妥当な増分（巨大化していない・新規ロジック混入なし） |
| C9 | 削除 PASS 基準 | — | **n/a（[FB-UI-02-1] ファイル削除なし）** |

## token parity 詳細（AC-7）

- 色 / spacing / radius / shadow は全て `var(--ubm-*)` 経由（shared-context §6）。
- 新設 CSS（`.admin-detail-section*` / `.admin-attendee-row*`）でも HEX 直書き・`bg-[#xxx]` / `text-[#xxx]` を一切使わない。
- `--ubm-space-3`（12px）/ `--ubm-color-surface-panel` / `--ubm-color-surface-panel-2` / `--ubm-color-surface-bg` / `--ubm-color-border-default` / `--ubm-color-border-default` / `--ubm-radius-sm` 等の既存 token のみを参照する。
- `pnpm verify:tokens`（CI gate `verify-design-tokens`）が green であることを正本判定とする。

## 参照資料

- `../../shared-context.md` §9（テスト方針）/ §10（DoD）
- `../phase-2/phase-2.md`（AC ↔ 検証コマンド対応表）
- `../phase-4/phase-4.md`（追加テストケース仕様 DR-1〜DR-3 / TL-1）
- `../phase-8/phase-8.md`（リファクタ後のコードを QA 対象とする）

## 実行手順

1. C1 → C2 を実行し型・lint を green 化（lint は `--fix` 後の残違反のみ手修正）。
2. C3 で既存 4 spec + 追加ケースを実行し全 PASS を確認。
3. C4 / C5 で token parity（verify:tokens green + HEX 0）を確認。
4. C6 / C7 で API 不変・contract 保持を確認。
5. C8 で line budget、C9 は n/a を記録（FB-UI-02-1）。

## 統合テスト連携

- 本 Phase の C3 は Phase 4 テスト設計・Phase 5 実装・Phase 8 リファクタの合流点。4 spec + 追加ケースが GREEN であることが Phase 10 最終レビューの前提となる。
- C4/C6/C7 は Phase 11 evidence（非視覚ログ）として `.txt` 保存し、Phase 12 compliance の Phase 11 inventory に転記する。

## 多角的チェック観点（AIが判断）

- **token 退化**: verify:tokens の green は必要だが、grep（C5）で _meetings + globals.css の双方をスキャンし二重で担保。
- **contract 退化**: testid 削除 grep（C7）が 0 であることを diff レベルで確認。
- **dead CSS 誤検知**: 削除した CSS セレクタの参照確認は定義(.css)を grep から除外（`--include='*.tsx'`）。
- **line budget**: 表現層改修にロジック（fetch / state / 計算）が紛れ込んでいないか stat で確認。
- **削除非該当の明示**: FB-UI-02-1 に従い削除 PASS 基準を n/a と明記し、誤って削除検査を強制 fail させない。

## サブタスク管理

| ID | 状態 | 完了条件 |
|---|---|---|
| Q9-1 | 仕様確定 | C1 / C2 exit 0 |
| Q9-2 | 仕様確定 | C3 全 PASS |
| Q9-3 | 仕様確定 | C4 green / C5 0 件 |
| Q9-4 | 仕様確定 | C6 出力 0 行 |
| Q9-5 | 仕様確定 | C8 妥当・C9 n/a 記録 |
| Q9-6 | 仕様確定 | 仕様書相互リンク dangling 0 |

## 成果物

- 品質保証チェック結果（typecheck / lint / vitest / verify:tokens / HEX grep / apps/api diff のログ）
- 本 Phase 9 仕様書（PASS 基準表 + FB-UI-02-1 削除非該当の明記）

## 完了条件

- [ ] C1〜C8 が全 PASS 基準を満たす
- [ ] C9（削除 PASS 基準）が **n/a（FB-UI-02-1）** として明記されている
- [ ] verify:tokens green かつ HEX / arbitrary 色 0 件（AC-7）
- [ ] `git diff dev -- apps/api` が空（AC-8）
- [ ] 既存 4 spec + 追加ケースが全 PASS（AC-6 / AC-10）
- [ ] typecheck / lint green（AC-9）

## タスク100%実行確認【必須】

- [ ] line budget / link / token parity がチェック項目化されている
- [ ] verify:tokens / HEX 0 grep / apps/api diff 空 / 既存 4 spec PASS が項目化
- [ ] [FB-UI-02-1] ファイル削除なし→削除 PASS 基準は非該当（n/a）と明記
- [ ] 各チェックに具体コマンドと PASS 基準が紐付いている
- [ ] API/D1/Form 不変の検証（C6）を含む

## 次Phase

- `../phase-10/phase-10.md`（最終レビュー — AC-1〜AC-10 充足判定 / MINOR → 未タスク化 / baseline OOS 記録）
