# 03a-stablekey-literal-lint-enforcement — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03a-stablekey-literal-lint-enforcement |
| ディレクトリ | docs/30-workflows/03a-stablekey-literal-lint-enforcement |
| Issue | #192 |
| Issue 状態 | CLOSED（enforced_dry_run 実装ドラフト — strict enforcement / PR は後続 wave） |
| 親タスク | 03a-parallel-forms-schema-sync-and-stablekey-alias-queue |
| Wave | 8b (lint config follow-up) |
| 実行種別 | sequential (lint enforcement close-out) |
| 作成日 | 2026-05-01 |
| 担当 | wave 8b lint config |
| 状態 | enforced_dry_run |
| ゲート状態 | warning_mode |
| タスク種別 | implementation / NON_VISUAL |
| visualEvidence | NON_VISUAL |

## purpose

03a AC-7「stableKey リテラル直書き禁止」を、これまでの「規約 + ユニットテストによる暫定担保」から「lint / 静的検査レベルで CI が必ず fail する fully enforced」状態へ昇格させる。
許可された stableKey 供給モジュール（`packages/shared/src/zod/field.ts`、`packages/integrations/google/src/forms/mapper.ts` 等）を allow-list として明示し、それ以外のアプリケーションコードに stableKey 文字列リテラルが追加された瞬間、CI が必ず fail する状態を恒久化する。
不変条件 #1（実フォーム schema をコードに固定しすぎない / stableKey 二重定義禁止）を静的に保護することが本タスクの最終目的である。

## scope in / out

### scope in

- 許可された stableKey 供給モジュールの allow-list 化（filepath glob / package export 単位）
- ESLint custom rule もしくは ts-morph ベース静的検査スクリプトの仕様策定
- 故意違反 fixture（dry-run）による fail 動作確認の仕様化
- 例外ポリシー（tests / fixtures / migration seed / docs）の文書化
- 03a workflow の AC-7 ステータスを「convention-only」→「fully enforced」へ昇格
- false positive ゼロ運用のための allow-list メンテナンス手順

### scope out

- ランタイム guard（実行時に stableKey 値を検証する仕組みは別タスク）
- 03b 側の同等ルール展開（lint 基盤共通化が完了した時点で自動波及するため別タスクで管理）
- stableKey 値そのものの仕様変更（schema 改定は 03a 本体の責務）
- 既存 lint 設定基盤の刷新（wave 8b lint config の責務）
- strict enforcement への昇格（既存 147 violations 解消後の後続 wave）

## dependencies

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 03a 本体 | AC-7 を引き取り、enforce 化する対象が 03a 完了済みであることが前提 |
| 上流 | wave 8b lint config | monorepo 共通 ESLint custom rule 基盤の owner |
| 上流 | `packages/shared/src/zod/field.ts` | stableKey 正本の 1 つ |
| 上流 | `packages/integrations/google/src/forms/mapper.ts` | stableKey 正本の 1 つ |
| external gate | CI（`.github/workflows/`） | lint 実行の最終 gate |
| 関連 | 03b workflow | 同等ルールが共通基盤化された時点で自動適用範囲に含まれる |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/task-03a-stablekey-literal-lint-001.md | 元 unassigned-task spec（正本ソース） |
| 必須 | docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/outputs/phase-12/implementation-guide.md | AC-7 / Part 2 禁止事項 |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件 #1 |
| 必須 | docs/00-getting-started-manual/specs/01-api-schema.md | stableKey 仕様 |
| 必須 | packages/shared/src/zod/field.ts | allow-list 対象（正本 #1） |
| 必須 | packages/integrations/google/src/forms/mapper.ts | allow-list 対象（正本 #2） |
| 参考 | apps/api/eslint.config.* | lint 設定統合先候補 |
| 参考 | apps/web/eslint.config.* | lint 設定統合先候補 |

## AC（Acceptance Criteria）

- AC-1: stableKey 文字列リテラル禁止の ESLint custom rule（または ts-morph 静的検査スクリプト）の仕様が確定し、許可外モジュールに hard-coded literal が存在すると lint がエラー終了する設計が phase-02 / phase-03 で記述されている。
- AC-2: allow-list 設定ファイル（少なくとも `packages/shared/src/zod/field.ts` と `packages/integrations/google/src/forms/mapper.ts` を含む）の仕様が phase-02 で明示され、追加の正本モジュール候補が列挙されている。
- AC-3: 既存 03a 実装が suppression（eslint-disable / ignore コメント等）なしで PASS することを確認する手順が phase-04 / phase-05 / phase-07 で定義されている。
- AC-4: 故意違反 fixture（dry-run PR を含む）で CI が必ず fail することを確認する手順が phase-06 で定義されている。
- AC-5: 例外ポリシー（tests / fixtures / migration seed / docs）が phase-02 設計で明文化され、override 境界（filepath glob）が一意に決定可能。
- AC-6: 03a workflow の AC-7 ステータスを「convention-only」→「fully enforced」に更新する diff が phase-12 で計画され、親 workflow 側の implementation-guide.md と整合する。
- AC-7: false positive がレビュー時 0 件（既存コードベース全 lint 走行で 0 violation）であることを phase-09 / phase-11 で gate 化する。

## 13 phases

| Phase | 名称 | ファイル | 概要 |
| --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | 真の論点（custom rule vs ts-morph script）と AC-1〜7 確定 |
| 2 | 設計 | phase-02.md | allow-list 表現、判定方式、例外境界、CI 統合点の確定 |
| 3 | 設計レビュー | phase-03.md | alternative 3 案（custom rule / ts-morph / runtime guard）を PASS / MINOR / MAJOR で判定 |
| 4 | テスト戦略 | phase-04.md | 既存コード PASS / 違反 fixture FAIL のテスト matrix |
| 5 | 実装ランブック | phase-05.md | rule 実装〜CI 統合〜allow-list 配置の手順 |
| 6 | 異常系検証 | phase-06.md | dry-run PR fail 確認、override 漏れ、false positive、bypass 試行 |
| 7 | 統合検証 | phase-07.md | apps/web / apps/api / packages/* 全域での lint 走行結果 |
| 8 | パフォーマンス・運用 | phase-08.md | lint 走行時間、CI gate 時間、開発者 DX 影響 |
| 9 | セキュリティ・品質ゲート | phase-09.md | suppression 監査、bypass 経路の閉塞、不変条件 #1 静的保護 |
| 10 | リリース準備 | phase-10.md | 03a workflow AC-7 更新計画、merge 順序、rollback 戦略 |
| 11 | 実測 evidence | phase-11.md | NON_VISUAL: lint log / fixture fail log / pass log を artefact として保存 |
| 12 | ドキュメント・未タスク検出・スキルフィードバック | phase-12.md | implementation-guide / changelog / 未タスク / skill feedback / compliance |
| 13 | PR 作成 | phase-13.md | approval gate / local-check-result / change-summary / PR template |

## outputs

```
outputs/phase-01/main.md
outputs/phase-02/main.md
outputs/phase-02/allow-list-spec.md
outputs/phase-02/rule-detection-spec.md
outputs/phase-03/main.md
outputs/phase-04/main.md
outputs/phase-04/test-matrix.md
outputs/phase-05/main.md
outputs/phase-05/runbook.md
outputs/phase-06/main.md
outputs/phase-06/violation-fixture-spec.md
outputs/phase-07/main.md
outputs/phase-07/integration-check.md
outputs/phase-08/main.md
outputs/phase-09/main.md
outputs/phase-10/main.md
outputs/phase-11/main.md
outputs/phase-11/manual-smoke-log.md
outputs/phase-11/link-checklist.md
outputs/phase-11/evidence/lint-violation-fail.txt
outputs/phase-11/evidence/lint-clean-pass.txt
outputs/phase-11/evidence/allow-list-snapshot.json
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
| 静的検査 | ESLint / ts-morph | apps/* と packages/* | rule は monorepo 共通箇所に配置 |
| CI | GitHub Actions lint job | `.github/workflows/` | 既存 lint job への統合（新規 job 追加は phase-08 で評価） |
| Secrets | （新規導入なし） | — | lint は public artefact のみ扱う |

## invariants touched

- **#1** 実フォーム schema をコードに固定しすぎない（stableKey は正本モジュール経由のみで参照）
- **#2** consent キーは `publicConsent` / `rulesConsent` 統一（リテラル直書き禁止の射程に含まれうる）
- **#4** D1 への直接アクセスは `apps/api` に閉じる（schema 関連リテラル境界の保護）

## completion definition

- Phase 1〜10 が completed、Phase 11 で `lint-clean-pass.txt` と `lint-violation-fail.txt` の両方が保存済み
- AC-1〜7 が Phase 7 で完全トレース
- 4 条件評価（価値 / 実現 / 整合 / 運用）が Phase 1 / Phase 12 で整合
- 不変条件 #1 が静的検査で観測可能であることが evidence 化
- Phase 13 で user 承認後に PR 作成完了

## lifecycle states

| state | 意味 | completed 判定 |
| --- | --- | --- |
| spec_created | 本 workflow の 13 phase ドキュメントと outputs skeleton が整備済み、rule 未実装、runtime evidence は NOT_EXECUTED | 不可 |
| ready | allow-list / rule 仕様確定、CI 統合準備完了 | 不可 |
| enforced_dry_run | rule 実装済みだが warn レベル / dry-run mode | 不可 |
| enforced | error レベルで CI 統合済み、03a AC-7「fully enforced」更新済み | Phase 11 完了可 |
| completed | enforce + Phase 12 same-wave sync + Phase 13 user approval gate 完了 | 可 |

## 実行モード

sequential。本タスクは lint enforcement の単一スコープ close-out であり、phase は順序依存（特に phase-02 設計が確定するまで phase-04 以降の検証 matrix は組めない）。
