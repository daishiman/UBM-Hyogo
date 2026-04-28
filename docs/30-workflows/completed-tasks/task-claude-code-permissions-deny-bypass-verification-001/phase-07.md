# Phase 7: カバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 7 / 13 |
| Phase 名称 | カバレッジ確認 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 6 |
| 下流 | Phase 8 (リファクタリング) |
| 状態 | pending |

## 目的

Phase 1〜6 の成果物が **AC × TC × Risk のすべてを網羅しているか** を機械的に確認する。
不足が見つかった場合は Phase 4 / Phase 6 へ差し戻す。

## カバレッジ確認項目

### C-1: AC × TC マトリクス

| AC | 紐づく TC / 成果物 | 設計カバレッジ |
| --- | --- | --- |
| AC-1 | TC-DOC-01〜03 | covered（実調査は別承認後） |
| AC-2 | TC-VERIFY-01〜05、Phase 5 runbook | covered（検証ログは空テンプレート） |
| AC-3 | TC-FOLLOWUP-01 | queued（docs 明示時のみ判定、該当なし時は `docs_inconclusive_requires_execution`） |
| AC-4 | TC-FOLLOWUP-02 | queued（apply-001 未作成時は作成時参照方針を記録） |
| AC-5 | Phase 2 alias-fallback-diff.md | covered |
| AC-6 | TC-VERIFY-05 / Phase 5 runbook 安全チェックリスト | covered |
| AC-7 | NON_VISUAL 判定（screenshots/ 不要） | covered |
| AC-8 | Phase 12 サマリ + 6 canonical 詳細成果物 | covered |

### C-2: Risk × 対策マトリクス

| Risk ID | 対策成果物 |
| --- | --- |
| R-1（判定不能） | Phase 2 alias-fallback-diff.md |
| R-2（バージョン差） | Phase 5 runbook Section 6 / Phase 6 EX-1 |
| R-3（dummy ref 誤指定） | Phase 5 runbook 安全チェック / TC-VERIFY-05 |
| R-4（pattern 種別差） | Phase 6 EX-2 / Phase 4 P-01〜04 |
| R-5（cwd 漏れ） | Phase 5 runbook Section 2 |

### C-3: pattern × TC マトリクス

| pattern | TC |
| --- | --- |
| P-01 `Bash(git push --force:*)` | TC-VERIFY-01 |
| P-02 `Bash(rm -rf /:*)` | TC-VERIFY-03 |
| P-03 `Write(/etc/**)` | TC-VERIFY-04 |
| P-04 `Bash(git push --force-with-lease:*)` | TC-VERIFY-EX-03 派生 |

### C-4: 成果物 × Phase マトリクス

| 成果物 | Phase | 確認 |
| --- | --- | --- |
| `outputs/phase-1/main.md` | 1 | artifacts.json と一致 |
| `outputs/phase-2/main.md` | 2 | 同上 |
| `outputs/phase-2/verification-protocol.md` | 2 | 同上 |
| `outputs/phase-2/alias-fallback-diff.md` | 2 | 同上 |
| ...（Phase 3〜13 同様） | | |

## 不足検知ルール

- いずれかのマトリクスで欠落セルが見つかった場合 → Phase 4 / Phase 6 へ差戻
- AC が TC に紐づかない場合 → Phase 4 で TC を追加
- Risk が成果物に紐づかない場合 → Phase 2 / Phase 5 へ差戻

## 主成果物

- `outputs/phase-7/main.md`（カバレッジマトリクス + 不足検知結果）

## スコープ外

- 検証実施
- 上流タスク R-2 の更新（Phase 12）

## Skill準拠補遺

## 実行タスク

- 本文に記載のタスクを実行単位とする
- docs-only / spec_created の境界を維持する

## 参照資料

- Phase 1〜6 全成果物
- `artifacts.json`

## 成果物

- `artifacts.json` の該当 Phase outputs を正本とする

## 完了条件

- [ ] C-1〜C-4 のマトリクスが揃う
- [ ] 欠落 0 件、または差戻指示が記録されている

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは検証実施タスクで実行する。
ここでは手順、証跡名、リンク整合のみを固定する。
