# Phase 7 outputs / main — AC マトリクス

## 位置付け

| 項目 | 値 |
| --- | --- |
| Phase | 7 / 13 |
| 状態 | pending（仕様化のみ完了） |
| 目的 | AC-1〜AC-15 を Phase / テスト観点 / 成果物へ空セルなしで対応付ける |

## AC × Phase × T × 成果物

| AC | 主 Phase | 補助 Phase | T / 構造証跡 | 主成果物 |
| --- | --- | --- | --- | --- |
| AC-1 | Phase 2 | Phase 5 / 6 / 13 | T1 / T8 | outputs/phase-02/main.md, outputs/phase-13/apply-runbook.md |
| AC-2 | Phase 2 | Phase 5 / 13 | T1 / T6 | outputs/phase-02/main.md, outputs/phase-13/apply-runbook.md |
| AC-3 | Phase 2 | Phase 4 / 6 / 11 | T4 / T7 | outputs/phase-11/manual-smoke-log.md |
| AC-4 | Phase 2 | Phase 6 / 8 | T2 / T9 | outputs/phase-02/main.md |
| AC-5 | Phase 2 | Phase 5 / 13 | T1 | outputs/phase-13/apply-runbook.md |
| AC-6 | Phase 2 | Phase 8 / 10 | T2 / T6 | outputs/phase-02/main.md |
| AC-7 | Phase 4 | Phase 11 / 13 | T3 | outputs/phase-11/manual-smoke-log.md, outputs/phase-13/verification-log.md |
| AC-8 | Phase 4 | Phase 11 / 13 | T3 | outputs/phase-11/manual-smoke-log.md, outputs/phase-13/verification-log.md |
| AC-9 | Phase 4 | Phase 6 / 11 / 13 | T4 / T7 | outputs/phase-11/manual-smoke-log.md, outputs/phase-13/verification-log.md |
| AC-10 | Phase 2 | Phase 12 / 13 | T5 / T10 | outputs/phase-12/system-spec-update-summary.md, outputs/phase-13/op-sync-runbook.md |
| AC-11 | Phase 1 | Phase 3 / 10 | 構造証跡 | phase-01.md, phase-03.md |
| AC-12 | Phase 1 | Phase 2 / 3 / 11 / 12 | 構造証跡 | phase-01.md, phase-02.md, phase-03.md |
| AC-13 | Phase 1 | Phase 2 / 5 / 11 / 13 | 全 T 共通不変条件 | outputs/phase-13/apply-runbook.md |
| AC-14 | Phase 2 | Phase 4 / 6 / 11 / 12 | T4 / T7 | outputs/phase-11/manual-smoke-log.md, outputs/phase-12/unassigned-task-detection.md |
| AC-15 | index / artifacts | Phase 1〜13 | 構造証跡 | artifacts.json, index.md, outputs/phase-07/main.md |

## 空セル確認

- AC-1〜AC-15 はすべて主 Phase / 補助 Phase / T または構造証跡 / 主成果物を持つ。
- AC-12 と AC-15 は実行テストではなく構造証跡で被覆する。
- secret 値は本ファイルに記録しない。`op://...` 参照または環境変数名のみを許可する。

## 完了判定

- [x] AC-1〜AC-15 を写経済み
- [x] AC × Phase の空セル 0
- [x] AC × T または構造証跡の空セル 0
- [x] AC × 成果物の空セル 0
- [x] AC-12 / AC-15 は構造証跡として明示
