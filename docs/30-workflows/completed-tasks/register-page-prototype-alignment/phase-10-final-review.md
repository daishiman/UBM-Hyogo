---
phase: 10
title: 最終レビュー
workflow_id: register-page-prototype-alignment
status: draft
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
---

# Phase 10 — 最終レビュー

[実装区分: 実装仕様書]

## 1. レビュー軸と判定表

| # | 観点 | 判定基準 | severity（NG時）|
|---|------|----------|-----------------|
| R1 | 不変条件 #2 (consent キー) | `publicConsent` / `rulesConsent` 文字列が DOM に維持 | MAJOR |
| R2 | 不変条件 #7 (外部リンク) | 全 CTA に `target="_blank"` + `rel="noopener noreferrer"` | MAJOR |
| R3 | UI-PA 不変条件 #2 (OKLch token only) | HEX 直書き grep が 0 件 | MAJOR |
| R4 | UI-PA 不変条件 #3 (プロトタイプ正本) | Hero / StepGrid / collapsible / FAQ / Bottom CTA の 5 セクション構成が `pages-member.jsx:68-217` と整合 | MAJOR |
| R5 | UI-PA 不変条件 #4 (D1 直アクセス禁止) | `apps/web` から D1 binding 追加なし | MAJOR |
| R6 | API surface 不変 | `apps/api/src/routes/` 配下に変更なし | MAJOR |
| R7 | 既存 fallback (`FORM_RESPONDER_URL`) 維持 | preview 失敗時にも CTA href が生きる | MAJOR |
| R8 | preview error a11y | `role="alert"` 維持 | MAJOR |
| R9 | a11y (axe) | 全 component spec で 0 violations | MAJOR |
| R10 | テスト網羅 (Phase 4-6) | 新規 3 spec + 既存 2 spec 更新が all green | MAJOR |
| R11 | coverage しきい値 | 既存値を下回らない | MAJOR |
| R12 | typecheck / lint | 0 error / 0 warning | MAJOR |
| R13 | build (next build --webpack) | 成功 | MAJOR |
| R14 | snapshot diff | 意図的更新として diff 要約済 | MINOR |
| R15 | CONST_005 §1-§6 充足 | 変更ファイル一覧 / シグネチャ / 組立順 / primitive / コマンド / DoD が Phase 5 に全記載 | MAJOR |
| R16 | 命名規約 | `data-component` / `data-role` 命名が Phase 4 §6 と一致 | MINOR |
| R17 | docs sync (Phase 12) | strict 7 + canonical 9 headings 用意 | MAJOR |
| R18 | indexes drift | `pnpm indexes:rebuild` 後 drift 0 | MAJOR |
| R19 | scripts/verify-pr-ready.sh | success | MAJOR |

## 2. 判定運用

- 1 つでも MAJOR が NG の場合、Phase 13 に進まず該当 Phase へ戻る。
- MINOR は PR description で明記し、後続 followup タスク（unassigned-task）に登録する。

## 3. 最終チェックリスト

- [ ] Phase 4 のテストケースが Phase 6 spec 実装と 1:1 対応
- [ ] Phase 5 の DoD 全項目が満たされている
- [ ] Phase 8 のリファクタ完了
- [ ] Phase 9 の手動 QA evidence が Phase 11 outputs/phase-11/ に格納される（or 適用不可と記録）
- [ ] Phase 12 strict 7 が `outputs/phase-12/` に揃っている
- [ ] PR 本文に変更サマリ・スクショ・テスト結果が含まれる
