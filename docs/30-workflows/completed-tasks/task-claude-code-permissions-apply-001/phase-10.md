# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-claude-code-permissions-apply-001 |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 作成日 | 2026-04-28 |
| 上流 | Phase 9 (品質保証) |
| 下流 | Phase 11 (手動テスト) |
| 状態 | blocked（Phase 9 完了まで着手禁止） |
| user_approval_required | **true** |
| Issue | [#140](https://github.com/daishiman/UBM-Hyogo/issues/140) |

## 目的

Phase 9 まで完了した状態に対し、受入条件 AC-1〜AC-9（`index.md`）の達成を最終評価し、**Phase 11（手動 smoke test）着手の Go/No-Go を user 承認込みで判定** する。

本タスクは host 環境変更タスクのため、docs 整備のみで PASS としない。**backup 取得 + smoke 結果（Phase 11）を提出して初めて完全 PASS** であり、Phase 10 では「Phase 11 へ進む準備が整っているか」を判定する（[Phase 12 漏れ防止 UBM-009] 反映）。

## 入力

| 種別 | パス | 用途 |
| --- | --- | --- |
| index.md AC 一覧 | `index.md` | AC-1〜AC-9 の正本 |
| Phase 9 quality-gate-result | `outputs/phase-09/quality-gate-result.md` | Q-1〜Q-10 の PASS/FAIL |
| Phase 5 backup-manifest | `outputs/phase-05/backup-manifest.md` | AC-4 の評価入力 |
| Phase 5 runbook-execution-log | `outputs/phase-05/runbook-execution-log.md` | AC-1〜AC-3, AC-6 の評価入力 |
| Phase 7 coverage-matrix | `outputs/phase-07/coverage-matrix.md` | AC-5 の評価入力 |
| Phase 8 before-after | `outputs/phase-08/before-after.md` | refactor 後の最終形 |

## レビュー観点

### 受入条件 (AC) 評価表

| AC | 内容 | 評価入力 | 判定 (PASS/FAIL/MINOR) |
| --- | --- | --- | --- |
| AC-1 | 3 ファイルの `defaultMode` が `bypassPermissions` で統一 | runbook-execution-log + Q-1 | - |
| AC-2 | project `permissions.allow`/`deny` が whitelist-design.md と完全一致 | runbook-execution-log + Q-9 | - |
| AC-3 | `cc` alias が `CC_ALIAS_EXPECTED` に正準化、`type cc` と grep が一致 | Q-2 + runbook-execution-log | - |
| AC-4 | backup 4 ファイル（settings ×3 + zshrc ×1）が取得済み、サイズが元と一致 | Q-3 + backup-manifest | - |
| AC-5 | TC-01〜TC-04 / TC-F-01〜TC-F-02 / TC-R-01 PASS、TC-05 が前提タスク結論と整合 | Phase 11 で実施（本 Phase では「準備完了」評価のみ） | - |
| AC-6 | `runbook-execution-log.md` に rollback 手順が記録 | runbook-execution-log を直接確認 | - |
| AC-7 | NON_VISUAL のため screenshot 不要、manual-smoke-log を主証跡 | Phase 11 で確認（本 Phase では宣言整合のみ） | - |
| AC-8 | Phase 12 で 7 成果物が揃う | Phase 12 で確認（本 Phase では未判定 / N/A） | N/A |
| AC-9 | 元タスクの skill-feedback-report.md に「U1 反映完了」追記 | Phase 12 で確認（本 Phase では未判定 / N/A） | N/A |

### 判定区分（[FB-UI-02 / quality-standards.md] 準拠）

- **CRITICAL / MAJOR**: Phase 11 着手不可。AC-1〜AC-7 のいずれかが FAIL → ループバック先 Phase を明示
- **MINOR**: 機能影響なくても **必ず未タスク化** し Phase 12 の `unassigned-task-detection.md` に記録（formalize は Phase 12 で実施）
- **PASS**: Phase 11 着手 Go

### 想定 MINOR 候補（未タスク化対象）

| 候補 | 想定タスク名 |
| --- | --- |
| `Edit` / `Write` の whitelist 化 | 元タスクの Phase 10 MINOR 保留分。本タスクスコープ外につき Phase 12 で未タスク化 |
| `permissions.deny` 実効性の追跡検証 | `task-claude-code-permissions-deny-bypass-verification-001` の継続運用化 |
| MCP server / hook の permission 挙動検証 | 本タスクスコープ外、未タスクとして登録 |

## 手順

1. **AC 評価表の作成**:
   - AC-1〜AC-9 を `final-review-result.md` の評価表に列挙
   - AC-1〜AC-7 は本 Phase で判定、AC-8 / AC-9 は **N/A（Phase 12 で判定）** と明示
2. **Phase 9 結果の取り込み**:
   - Q-1〜Q-10 の PASS/FAIL を AC 評価に紐付け（AC-1↔Q-1, AC-3↔Q-2, AC-4↔Q-3 等）
3. **MINOR 候補の洗い出し**:
   - Phase 8 before-after.md / Phase 9 quality-gate-result.md / index.md「含まない」セクションから MINOR を抽出
   - 各 MINOR を Phase 12 `unassigned-task-detection.md` 登録対象として記録（formalize は Phase 12）
4. **Phase 11 進行 Go/No-Go 判定**:
   - AC-1〜AC-7 すべて PASS、かつ MINOR がすべて未タスク化候補として記録されている → **Go**
   - AC-1〜AC-7 のいずれか FAIL → **No-Go**、ループバック先 Phase（Phase 5 または Phase 8）を明示
5. **host 環境変更タスクとしての PASS 条件確認** ([Phase 12 漏れ防止 UBM-009] 反映):
   - 本タスクは host 環境変更タスクのため、Phase 10 PASS は「Phase 11 着手準備完了」を意味する
   - **完全 PASS は backup 取得 + smoke 結果（Phase 11 manual-smoke-log）の提出で初めて成立**
   - docs 整備のみで PASS としない旨を `final-review-result.md` 末尾に明示
6. **user 承認の取得**:
   - `final-review-result.md` の最終判定を user に提示し、明示承認を得る（artifacts.json の `user_approval_required: true` と整合）
   - 承認欄に承認日付・判定区分（PASS / MAJOR / MINOR）を記録

## 成果物

`artifacts.json` の Phase 10 outputs と 1:1 一致:

| ファイル | 内容要件 |
| --- | --- |
| `outputs/phase-10/main.md` | 最終レビュー結論サマリ。AC-1〜AC-9 の総合判定、MINOR 件数、Phase 11 着手 Go/No-Go、user 承認状態 |
| `outputs/phase-10/final-review-result.md` | AC 評価表（AC-1〜AC-9 × PASS/FAIL/N/A）、MINOR 候補一覧（Phase 12 で未タスク化）、ループバック先 Phase（FAIL 時）、host 環境変更タスクとしての PASS 条件明示（[UBM-009]）、user 承認欄 |

## 完了条件

- [ ] `outputs/phase-10/main.md` / `final-review-result.md` の 2 ファイルが存在
- [ ] AC-1〜AC-9 すべてに PASS / FAIL / MINOR / N/A の判定が記録
- [ ] AC-8 / AC-9 が N/A（Phase 12 で判定）として明示
- [ ] MINOR 候補がすべて未タスク化対象として記録（Phase 12 で formalize）
- [ ] Phase 11 着手 Go/No-Go 判定が `final-review-result.md` に明示
- [ ] **host 環境変更タスクの PASS 条件（backup + smoke 提出）が明示**（[UBM-009]）
- [ ] **user 承認**が取得され、承認欄に記録（`user_approval_required: true`）
- [ ] artifacts.json の `phases[9].outputs` および `user_approval_required: true` と本 Phase 成果物が完全一致

## 検証コマンド

```bash
# 成果物存在確認
test -f outputs/phase-10/main.md && test -f outputs/phase-10/final-review-result.md && echo "outputs OK"

# AC 評価表の必須行数確認（AC-1〜AC-9 の 9 行が含まれていること）
grep -cE '^\| AC-[1-9]' outputs/phase-10/final-review-result.md  # 期待値: 9

# user 承認欄の存在確認
grep -E 'user 承認|approved by|承認日' outputs/phase-10/final-review-result.md

# host 環境変更タスク PASS 条件の明示確認（[UBM-009]）
grep -E 'backup.*smoke|UBM-009|host 環境変更' outputs/phase-10/final-review-result.md
```

## 依存 Phase

- 上流: Phase 9（Q-1〜Q-10 PASS）
- 上流（参照）: Phase 5 / Phase 7 / Phase 8 の outputs
- 下流: Phase 11（PASS かつ user 承認時のみ）

## 想定 SubAgent / 並列性

- 単一 agent で直列実行（user 承認 gate のため並列化不可）
- AC-1〜AC-7 評価のための入力ファイル読み込みのみ並列化可

## ゲート判定基準

- AC-1〜AC-7 すべて PASS、MINOR が未タスク化候補として記録、user 承認取得 → **Phase 11 着手 Go**
- いずれか欠ける場合は **No-Go**:
  - AC FAIL → ループバック先 Phase（Phase 5 または Phase 8）に差し戻し
  - MINOR 未タスク化漏れ → Phase 12 unassigned-task-detection.md に登録するまで block
  - user 承認なし → 提示 + 待機
- **MINOR 判定は必ず未タスク化**（Phase 12 で formalize）

## リスクと対策

| リスク | 対策 |
| --- | --- |
| AC-8 / AC-9 を本 Phase で誤判定 | AC-8 / AC-9 は Phase 12 で初めて判定可能なため、本 Phase では **N/A** と明示し評価対象外とする |
| MINOR を黙って通過させる | MINOR 候補一覧を `final-review-result.md` の必須セクションとし、未記入なら完了条件 FAIL |
| docs 整備のみで PASS と誤認 ([UBM-009]) | 「host 環境変更タスクは backup + smoke 提出で初めて完全 PASS」を `final-review-result.md` 末尾に必須明記 |
| user 承認の取り漏れ | `final-review-result.md` 末尾に承認欄を必須化、未承認なら Phase 11 着手を block |
| ループバック先 Phase の特定誤り | AC-Q マッピング表（AC-1↔Q-1 等）を `final-review-result.md` に記載し、FAIL 時の差し戻し先を機械的に特定 |

## 実行タスク

本 Phase の実行タスクは上記「手順」セクションを正本とする。blocked 状態の Phase は、上流 gate が Go になるまで実行しない。

## 参照資料

- `docs/30-workflows/task-claude-code-permissions-apply-001/index.md`
- `docs/30-workflows/task-claude-code-permissions-apply-001/artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md`

## 統合テスト連携

NON_VISUAL / host 環境設定タスクのため、UI 統合テストは対象外。検証は各 Phase の CLI 証跡、JSON validity、artifact 同期、Phase 11 manual smoke log で担保する。
