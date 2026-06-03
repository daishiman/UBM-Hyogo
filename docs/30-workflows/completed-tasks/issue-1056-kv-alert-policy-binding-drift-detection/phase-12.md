# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | KV/R2 binding 活性状態 ↔ Cloudflare alert policy `enabled` 状態のドリフト検知（issue-1056 / issue-57-followup-003） |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-06-02 |
| 前 Phase | 11 (手動 smoke test / CLI 回帰検証) |
| 次 Phase | 13 (PR 作成) |
| 状態 | completed |
| 実装区分 | 実装仕様書（CONST_004 デフォルト・コード変更を伴う） |
| タスク種別 | implementation / implementation_mode: new / visualEvidence: NON_VISUAL / scope: tooling |

## 目的

task-specification-creator の Phase 12 必須タスク + 準拠チェックを実行し、binding↔policy 整合ドリフト検知（検知モジュール + CLI + 回帰 spec + CI gate + 棚卸し表追記）を理解・検証できるドキュメント群を整備する。本ワークフローは **implemented_local_evidence_captured**。UI/UX 変更がない NON_VISUAL tooling タスクのため、Phase 11 スクリーンショットは不要で、代替証跡（CLI 回帰検証 + 回帰 spec）に置き換える。`deployment-cloudflare.md` への binding↔policy 対応表追記（AC-8）+ 責務境界（UT-17-followup-006 / #85 / #75 / #77）も今回サイクルで反映済み。

## 実行タスク

1. 実装ガイドを作成する（Part 1 中学生レベル + Part 2 技術者レベル / `## 視覚証跡` で screenshot 不要を明記）。完了条件: implementation-guide.md に Part 1〜11 が各 3 行以上 + 検証コマンドを含む。
2. システム仕様書更新サマリーを作成し、新規インターフェース有無を判定する（`BindingPolicyDrift` 型 / `parseActiveBindings` / `buildBindingPolicyDrift` / `loadActiveBindings` / `BINDING_POLICY_MAP` / `cf.sh alerts binding-drift` サブコマンドを新規公開 surface として記録）。完了条件: system-spec-update-summary.md に新規 surface が列挙される。
3. ドキュメント更新履歴を作成する（`deployment-cloudflare.md` の binding↔policy 対応表追記（AC-8）+ 責務境界記述を Step 1-A/1-B/1-C / Step 2 へ個別記録。skill 反映本体も今回サイクルで反映済み）。完了条件: documentation-changelog.md に記録。
4. 未タスク検出レポートを作成する（必須未タスク 0 想定 / 任意候補は follow-up として記録）。完了条件: unassigned-task-detection.md に current/baseline 分離。
5. スキルフィードバックレポートを作成する（改善点なしでも必須出力）。完了条件: skill-feedback-report.md。
6. Phase 12 タスク仕様準拠チェックを root evidence として作成する（canonical 9 見出し逐語一致）。完了条件: phase12-task-spec-compliance-check.md が CI gate に PASS する見出し構造。
7. Phase 12 summary `outputs/phase-12/main.md` を作成し、strict 7 の入口として成果物一覧・実装状態・user-gated 境界を要約する。完了条件: artifacts.json の Phase 12 outputs と成果物表が一致する。

## 更新対象ドキュメント

| 対象 | 更新内容 | AC | 実施タイミング |
| --- | --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | "Cloudflare Alert Policy IaC" 節 / binding 棚卸し表（:308）に binding↔policy 対応表追記 + UT-17-followup-006 / #85 / #75 / #77 責務境界 | AC-8 | 完了 |
| `.claude/skills/aiworkflow-requirements` indexes / artifact inventory | quick-reference / resource-map / task-workflow-active / workflow artifact inventory | AC-8 | 完了 |

## 未タスク検出（current / baseline 分離）

| 区分 | 候補 | 判定 |
| --- | --- | --- |
| 必須未タスク | （なし） | 0 件想定。AC-1〜AC-9 が本タスクのスコープで完結 |
| 任意候補（follow-up） | `SESSION_KV` を KV policy 対応に含めるか再検討 | scope 外（UT-17-followup-006 射程・本タスクは kind 単位集約で既に被覆）。formalize しない |
| 任意候補（follow-up） | CI gate を schedule job にも併設するか | scope 外（local-only 検知は PR `validate` job で全 PR 強制済み。schedule 併設は重複コスト）。formalize しない |
| 任意候補（follow-up） | binding↔policy mapping を JSON 外出しして data-driven 化 | over-engineering 回避（現状 2 kind のみ）。formalize しない |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-spec.md | Phase 12 必須タスク |
| 必須 | .claude/skills/task-specification-creator/references/phase12-compliance-check-template.md | canonical 9 見出し SSOT |
| 必須 | （本ワークフロー）phase-02.md | 検知モジュール設計（型 / parser / drift 純関数 / CLI 配線） |
| 必須 | （本ワークフロー）phase-11.md / outputs/phase-11/manual-smoke-log.md / outputs/phase-11/manual-test-result.md | CLI 回帰 smoke の代替証跡基準 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | binding 棚卸し表（:308）+ 対応表追記先 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | CLI 回帰 smoke 計画 / 回帰 spec 計画を実装ガイドの検証コマンドへ反映 |
| Phase 13 | Phase 12 成果物一式 + 変更ファイル 7 件サマリーを PR 本文へ渡す |

## 多角的チェック観点（AIが判断）

- Phase 12 必須成果物のうち 0 件レポート系（未タスク検出 / skill feedback）を省略していないか。
- 正本仕様（aiworkflow-requirements deployment-cloudflare.md）と workflow outputs に情報が二重化していないか。
- 実装完了済み範囲と user-gated 操作（commit / push / PR / Issue mutation / alert policy apply）を混同していないか。
- NON_VISUAL の Phase 11 代替証跡（CLI 回帰 + 回帰 spec）が各成果物で整合しているか。
- 既存 `alerts diff`（宣言 vs デプロイ）と本 `binding-drift`（活性 vs enabled）の責務境界がドキュメントで混線していないか。

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | 実装ガイド | completed | Part 1 / 2 + 視覚証跡節 |
| 2 | システム仕様書更新サマリー | completed | 新規 surface（型 / 関数 / CLI サブコマンド）列挙 |
| 3 | ドキュメント更新履歴 | completed | deployment-cloudflare.md 対応表追記方針 |
| 4 | 未タスク検出 | completed | 必須 0 / 任意 follow-up 3 |
| 5 | skill feedback | completed | 改善点なしでも出力 |
| 6 | 準拠チェック | completed | canonical 9 見出し逐語 |
| 7 | Phase 12 summary | completed | strict 7 入口 / artifacts outputs と一致 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| サマリー | outputs/phase-12/main.md | Phase 12 全体まとめ |
| 実装ガイド | outputs/phase-12/implementation-guide.md | Part 1 / Part 2 + 視覚証跡 |
| 仕様更新 | outputs/phase-12/system-spec-update-summary.md | 新規 surface 判定 |
| 更新履歴 | outputs/phase-12/documentation-changelog.md | deployment-cloudflare.md 対応表追記方針 |
| 未タスク | outputs/phase-12/unassigned-task-detection.md | current/baseline 分離・必須 0 |
| skill feedback | outputs/phase-12/skill-feedback-report.md | 改善点なしでも出力 |
| 準拠チェック | outputs/phase-12/phase12-task-spec-compliance-check.md | canonical 9 見出し root evidence |

## 完了条件 (Acceptance Criteria for this Phase)

- [x] Phase 12 必須タスクがすべて定義されている
- [x] 新規インターフェース有無（`BindingPolicyDrift` 型 / 関数 4 件 / CLI サブコマンド）が列挙されている
- [x] `deployment-cloudflare.md` への binding↔policy 対応表追記（AC-8）+ 責務境界記述の方針が確定している
- [x] 必須未タスク 0 件 / 任意 follow-up が scope 判定付きで記録されている
- [x] NON_VISUAL の Phase 11 代替証跡が implementation-guide.md `## 視覚証跡` に明記される計画である
- [x] 実装完了済み範囲と user-gated 操作の境界が明記されている

## タスク100%実行確認【必須】

- [x] 全実行タスク（7 件）が completed
- [x] 成果物計画が `artifacts.json` の outputs（phase=12）と一致する
- [x] canonical 9 見出しが逐語で配置され、各判定が implemented_local_evidence_captured を反映している

## 次 Phase への引き渡し

- 次 Phase: 13 (PR 作成 / pending_user_approval)
- 引き継ぎ事項: Phase 12 成果物一式 / 変更ファイル 7 件 / commit・push・PR・Issue mutation はユーザー承認待ち
- ブロック条件: canonical 9 見出しの drift / 実装完了を主張する誤記
