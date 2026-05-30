# Phase 12 — ドキュメント更新（設計メモ）

> 正本の Phase 12 close-out は `outputs/phase-12/main.md` と strict 7 ファイル群。
> 本ファイルは初期設計メモとして残す。

## 1. 更新対象

| ファイル | 更新内容 |
|---------|---------|
| `docs/30-workflows/task-c-privacy-terms-public-shell-spec/index.md` | `implemented_local_evidence_captured / VISUAL_ON_EXECUTION` と Phase status を同期 |
| `docs/30-workflows/public-header-logged-in-nav-cleanup/phase-5-implementation.md` | Task C の実装完了を反映（親ワークフロー側で記録済の場合は no-op） |
| `docs/30-workflows/LOGS.md` | Task C 完了ヘッドラインを 1 行追加（親ワークフロー集約に従う場合は親側にのみ記載） |

## 2. システム仕様書 (aiworkflow-requirements) への反映

本 Task は `/privacy`, `/terms` の shell mount に限定され、公開 contract（API surface / D1 schema / Google Form 仕様）への影響が無いため、`docs/00-getting-started-manual/specs/` 配下への更新は不要。

## 3. skill 同期判定

- `aiworkflow-requirements`: 子 workflow の discoverability と artifact inventory を同一 wave で同期。contract / 不変条件追加はなし。
- `task-specification-creator`: 影響なし（パターン汎化候補が出れば親ワークフロー集約時に追記）

## 4. Phase 11 evidence インベントリ

| 種別 | 件数 | 場所 |
|------|------|------|
| screenshot | 6 | `outputs/phase-11/evidence/*.png`（captured） |
| manual test ledger | 1 | `outputs/phase-11/manual-test-result.md` |
| manual test result | 1 | `outputs/phase-11/manual-test-result.md` |

## 5. unassigned-task-detection

- 候補: なし（本 Task のスコープで完結、CONST_007 準拠）
- `PublicShell` primitive 抽出は親ワークフロー Task A/D/E/F 完了後の followup として親側で評価（本 Task ではエスカレートしない）

## 6. ゲート

- [ ] index.md workflow_state 更新
- [ ] evidence インベントリ件数一致
- [ ] unassigned-task-detection 結果記録
