# Phase 8: ドキュメント更新

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 8 / 13 |
| Phase 名称 | ドキュメント更新 |
| 前 Phase | 7 (テスト計画) |
| 次 Phase | 9 (受入確認) |
| 状態 | completed |

## 目的

本変更を正本ドキュメントに反映する。

## 更新対象ドキュメント

| Path | 更新内容 |
| --- | --- |
| docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-08-shared-foundation/spec.md | DoD line 172 のチェックを「実装済」状態にできるよう、本タスク完了後の追記方針を outputs に記す |
| docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i01-toastprovider-root-mount/spec.md | DoD checkbox の更新（Phase 12 で実施） |
| docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/index.md | i01 行を「完了」状態に更新（Phase 12 で実施） |

本 Phase ではドキュメント編集は**実施せず**、Phase 12 の正本同期で一括更新する方針を確定する。

## システム正本仕様への反映

- `docs/00-getting-started-manual/specs/09a-prototype-map.md` は `ToastProvider` を app shell boundary として既に正本化している
- 本変更はその既存正本を `apps/web/app/layout.tsx` の wiring で満たすため、specs/ レベルの追記は不要

→ Phase 12 で `outputs/phase-12/system-spec-update-summary.md` に「specs/ 更新なし」を明記。

## CLAUDE.md への反映

- 本変更は `apps/web` 不変条件と直交。CLAUDE.md 更新は不要。

## 成果物

| パス | 内容 |
| --- | --- |
| outputs/phase-08/docs-updates.md | 更新方針（Phase 12 で一括反映の旨）と更新対象一覧 |

## 完了条件

- [x] 更新対象一覧が明示
- [x] Phase 12 で一括反映する方針が記載
- [x] specs/ / CLAUDE.md への影響評価が記載

## 次 Phase

Phase 9: 受入確認
