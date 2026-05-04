# issue-393-stablekey-literal-legacy-cleanup — タスク仕様書 index

> **Issue #393 は CLOSED 状態のまま再仕様化される。**
> 本 workflow は、親 03a-stablekey-literal-lint-enforcement で構築済みの静的検査スクリプト
> `scripts/lint-stablekey-literal.mjs` を warning モードから strict (error) モードへ昇格できるよう、
> 既存 application コード中に残存する stableKey 文字列リテラル 148 件 (14 ファイル) を、
> 正本 supply module 経由の参照に置換することを目的とする。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-393-stablekey-literal-legacy-cleanup |
| ディレクトリ | docs/30-workflows/issue-393-stablekey-literal-legacy-cleanup |
| Issue | #393 |
| Issue 状態 | CLOSED（再仕様化のみ・実装は未着手） |
| 親タスク | 03a-stablekey-literal-lint-enforcement |
| 元 spec | docs/30-workflows/completed-tasks/task-03a-stablekey-literal-legacy-cleanup-001.md |
| 作成日 | 2026-05-03 |
| 担当 | apps/api + apps/web implementation owner |
| 状態 | strict_ready |
| ゲート状態 | strict_lint_ready（strict CI 昇格は後続） |
| タスク種別 | implementation / NON_VISUAL |
| visualEvidence | NON_VISUAL |
| workflow_state | strict_ready |
| 実行モード | sequential |

## purpose

親 workflow `03a-stablekey-literal-lint-enforcement` で配置された静的検査スクリプト
`scripts/lint-stablekey-literal.mjs` は現在 warning モードでのみ稼働している。
strict (`--strict`) 実行では現状 **148 violation / 14 ファイル** が検出され、
このまま CI required check に昇格させると常時 fail する。

本タスクは、それら 148 violation を「正本 supply module からの import 参照」に
置換することにより、`--strict` 実行を violation 0 にし、親 workflow の AC-7
（strict CI gate 昇格）を可能 state に持ち込むことを目的とする。

不変条件 #1（stableKey 二重定義禁止 / 正本一元管理）の静的保護を完成させる
最終ステップに位置付けられる。

## scope in / out

### scope in

- 14 ファイル（family A〜G）の stableKey 文字列リテラルを正本 module 由来の named import に置換
- 正本 module: `packages/shared/src/zod/field.ts`（`FieldByStableKeyZ` の 31 stableKey）と
  `packages/integrations/google/src/forms/mapper.ts`
- `node scripts/lint-stablekey-literal.mjs --strict` の violation count を 0 にする
- `scripts/lint-stablekey-literal.test.ts` の strict 期待値を 0 へ更新
- 各 family の focused tests / typecheck / lint PASS の維持
- 既存挙動（mapper output / public member view / admin route response / consent ロジック）の同一性

### scope out

- `scripts/lint-stablekey-literal.mjs` の rule 拡張・検出ロジック改修（親 03a 完了スコープ）
- GitHub Actions の required check 昇格そのもの（後続タスク）
- runtime dynamic stableKey guard
- stableKey 値や schema そのものの変更
- 新規 stableKey 追加（フォーム側仕様変更）
- ESLint custom rule への移植

## dependencies

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 03a-stablekey-literal-lint-enforcement | strict 検査スクリプト本体 / allow-list 仕様の完成が前提 |
| 上流 | `packages/shared/src/zod/field.ts` | 正本 #1（`FieldByStableKeyZ` の 31 stableKey enum） |
| 上流 | `packages/integrations/google/src/forms/mapper.ts` | 正本 #2（Forms API mapping 側の正本） |
| 上流 | `scripts/lint-stablekey-literal.mjs` | strict mode の violation 計測機 |
| external gate | CI lint job | 置換完了後 strict 昇格判定の最終 gate（昇格自体は後続） |
| 関連 | 03b workflow | 同等問題が共通基盤化された際の波及対象（本タスク out of scope） |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/task-03a-stablekey-literal-legacy-cleanup-001.md | 元 unassigned-task spec（正本ソース） |
| 必須 | docs/30-workflows/completed-tasks/03a-stablekey-literal-lint-enforcement/outputs/phase-12/implementation-guide.md | 親 workflow の AC-7 enforce 仕様 |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件 #1 |
| 必須 | docs/00-getting-started-manual/specs/01-api-schema.md | stableKey 仕様 |
| 必須 | scripts/lint-stablekey-literal.mjs | strict 検査スクリプト |
| 必須 | scripts/lint-stablekey-literal.test.ts | strict 期待値 update 対象 |
| 必須 | packages/shared/src/zod/field.ts | 正本 module #1 |
| 必須 | packages/integrations/google/src/forms/mapper.ts | 正本 module #2 |
| 違反 family A | apps/api/src/jobs/mappers/sheets-to-members.ts | 置換対象 |
| 違反 family A | apps/api/src/jobs/sync-sheets-to-d1.ts | 置換対象 |
| 違反 family B | apps/api/src/repository/_shared/builder.ts | 置換対象 |
| 違反 family B | apps/api/src/repository/publicMembers.ts | 置換対象 |
| 違反 family C | apps/api/src/routes/admin/members.ts | 置換対象 |
| 違反 family C | apps/api/src/routes/admin/requests.ts | 置換対象 |
| 違反 family D | apps/api/src/use-cases/public/list-public-members.ts | 置換対象 |
| 違反 family D | apps/api/src/view-models/public/public-member-list-view.ts | 置換対象 |
| 違反 family D | apps/api/src/view-models/public/public-member-profile-view.ts | 置換対象 |
| 違反 family E | apps/web/app/profile/_components/RequestActionPanel.tsx | 置換対象 |
| 違反 family E | apps/web/app/profile/_components/StatusSummary.tsx | 置換対象 |
| 違反 family F | apps/web/src/components/public/MemberCard.tsx | 置換対象 |
| 違反 family F | apps/web/src/components/public/ProfileHero.tsx | 置換対象 |
| 違反 family G | packages/shared/src/utils/consent.ts | 置換対象（不変条件 #2 整合確認要） |
| 参考 | docs/30-workflows/completed-tasks/03a-stablekey-literal-lint-enforcement/index.md | 親タスク全体像 |

## AC（Acceptance Criteria）

- **AC-1**: 14 ファイル（family A〜G）すべての stableKey リテラルが正本 module 経由 import 参照に置換され、`node scripts/lint-stablekey-literal.mjs --strict` の violation 件数が **0** であること（before: 148 件）。
- **AC-2**: warning モード / strict モード両方で `stableKeyCount=31` が維持されること（正本 enum 件数の保全）。
- **AC-3**: 既存 unit / integration test がすべて PASS すること。最低限以下を focused 実行する：mapper (`sheets-to-members`) / public member view / consent / admin members / admin requests / repository builder。
- **AC-4**: `mise exec -- pnpm typecheck` が PASS。
- **AC-5**: `mise exec -- pnpm lint`（既存 ESLint ruleset）と `node scripts/lint-stablekey-literal.mjs --strict`（exit 0）の両方が PASS。
- **AC-6**: `eslint-disable` / `// @ts-ignore` 等の suppression を新規に **1 件も追加しない**。
- **AC-7**: 親 workflow `03a-stablekey-literal-lint-enforcement` の AC-7（strict CI gate 昇格）を可能とする state に到達したことを Phase 12 で明示し、親 workflow 側 implementation-guide の更新計画を記述する（実 PR 化は後続タスク）。

## 13 phases

| Phase | 名称 | ファイル | 概要 |
| --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | 真の論点 5 件 / AC-1〜7 quantitative 化 |
| 2 | 設計 | phase-02.md | 各 family の置換設計、import 名、正本 export 選定、関数シグネチャ不変方針 |
| 3 | 設計レビュー | phase-03.md | 単一 PR / family 分割 PR / 単一コミット の alternative 3 案を PASS/MINOR/MAJOR で判定 |
| 4 | テスト戦略 | phase-04.md | family 別 focused test 一覧、strict count 期待値更新、DoD |
| 5 | 実装ランブック | phase-05.md | family 単位の差分手順、import 追加、literal 置換、focused test 確認、最終 strict 検査 |
| 6 | 異常系検証 | phase-06.md | 違反 fixture 1 行追加で strict fail / suppression 試行が gate を通らない確認 |
| 7 | 統合検証 | phase-07.md | apps/web / apps/api / packages/* 全域の lint / typecheck / vitest サマリー / AC trace |
| 8 | パフォーマンス・運用 | phase-08.md | （別エージェント担当） |
| 9 | セキュリティ・品質ゲート | phase-09.md | （別エージェント担当） |
| 10 | リリース準備 | phase-10.md | （別エージェント担当） |
| 11 | 実測 evidence | phase-11.md | （別エージェント担当） |
| 12 | ドキュメント・未タスク検出・スキルフィードバック | phase-12.md | （別エージェント担当） |
| 13 | PR 作成 | phase-13.md | （別エージェント担当） |

## outputs

```
outputs/phase-01/main.md
outputs/phase-02/main.md
outputs/phase-02/replacement-design.md
outputs/phase-02/per-family-plan.md
outputs/phase-03/main.md
outputs/phase-04/main.md
outputs/phase-04/test-matrix.md
outputs/phase-05/main.md
outputs/phase-05/runbook.md
outputs/phase-06/main.md
outputs/phase-06/violation-fixture-spec.md
outputs/phase-07/main.md
outputs/phase-07/integration-check.md
outputs/phase-07/evidence/lint-strict-before.txt
outputs/phase-07/evidence/lint-strict-after.txt
outputs/phase-07/evidence/typecheck.txt
outputs/phase-07/evidence/vitest-focused.txt
outputs/phase-07/evidence/per-family-diff.txt
outputs/phase-08/main.md
outputs/phase-09/main.md
outputs/phase-10/main.md
outputs/phase-11/main.md
outputs/phase-11/manual-smoke-log.md
outputs/phase-11/link-checklist.md
outputs/phase-11/evidence/lint-strict-before.txt
outputs/phase-11/evidence/lint-strict-after.txt
outputs/phase-11/evidence/typecheck.txt
outputs/phase-11/evidence/vitest-focused.txt
outputs/phase-11/evidence/stable-key-count.txt
outputs/phase-12/main.md
outputs/phase-12/implementation-guide.md
outputs/phase-12/system-spec-update-summary.md
outputs/phase-12/documentation-changelog.md
outputs/phase-12/unassigned-task-detection.md
outputs/phase-12/skill-feedback-report.md
outputs/phase-12/phase12-task-spec-compliance-check.md
outputs/phase-13/main.md
outputs/phase-13/local-check-result.md
outputs/phase-13/change-summary.md
outputs/phase-13/pr-template.md
outputs/phase-13/pr-info.md
outputs/phase-13/pr-creation-result.md
```

## services / secrets

| 区分 | 値 | 配置 | 備考 |
| --- | --- | --- | --- |
| 静的検査 | `scripts/lint-stablekey-literal.mjs` | repo root | 親 03a 配備済み・本タスクは利用のみ |
| Secrets | （新規導入なし） | — | コード置換のみ |

## invariants touched

- **#1** 実フォーム schema をコードに固定しすぎない（stableKey は正本モジュール経由のみ参照）
- **#2** consent キーは `publicConsent` / `rulesConsent` 統一（family G `consent.ts` 置換が射程内）
- **#4** D1 への直接アクセスは `apps/api` に閉じる（family B repository 層の置換境界保護）

## completion definition

- Phase 1〜7（本エージェント担当範囲）が completed
- AC-1〜7 が Phase 7 で完全トレース
- `node scripts/lint-stablekey-literal.mjs --strict` violation 0 / `stableKeyCount=31`
- 既存 typecheck / lint / focused vitest が PASS
- suppression 0 件追加
- 親 workflow `03a-stablekey-literal-lint-enforcement` AC-7 を strict 昇格可能 state に持ち込み、Phase 12 で更新計画を提出（後続エージェント）
- Phase 13 で user 承認後に PR 作成（後続エージェント）

## lifecycle states

| state | 意味 | completed 判定 |
| --- | --- | --- |
| spec_created | 13 phase のドキュメント・outputs skeleton 整備済み、置換未実装 | 不可 |
| implementing | family ごとに置換中、strict count 段階的に減少 | 不可 |
| cleaned | 全 14 ファイル置換完了、strict violation 0、focused test PASS | 不可 |
| strict_ready | typecheck / lint / strict / 全 focused test PASS、親 AC-7 昇格可能 | Phase 7 完了可 |
| completed | Phase 12 same-wave sync + Phase 13 user approval gate 完了 | 可 |

## 実行モード

sequential。各 family 内のファイル置換は局所的に並列可能だが、family 間（特に repository → use-case → view-model → route のレイヤー依存）と最終 strict / typecheck 検証は順序依存のため、本 workflow は family 単位の小分け sequential を正とする。
