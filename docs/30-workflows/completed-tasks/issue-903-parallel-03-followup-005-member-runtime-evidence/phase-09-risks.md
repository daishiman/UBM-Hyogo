---
phase: 9
title: Risks
workflow_id: ui-prototype-design-system-foundation
sub_workflow: issue-903-parallel-03-followup-005-member-runtime-evidence
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL
implementation_mode: code_change_plus_evidence
---

# Phase 9 — Risks

[実装区分: 実装仕様書]

## 9.1 リスク台帳

| ID | リスク | 影響 | 確率 | 対策 |
|----|--------|------|------|------|
| R-01 | profile 移動で相対 import が壊れ build fail | 高 | 中 | Phase 5 Step 2 で `@/` alias 化を優先。typecheck で早期検出 |
| R-02 | `static-invariants.runtime.spec.ts` path 更新漏れで unit test fail | 中 | 中 | Phase 5 Step 3 で 4 か所明示。grep で確認 |
| R-03 | member 認証 fixture 不在で Playwright spec が空 scrape | 中 | 中 | followup-002 R-01 と同じ `waitForSelector` + `lines.length > 0` assert で空 evidence の `present` 化を防ぐ |
| R-04 | status 語彙 invalid で gate fail | 中 | 低 | Phase 5 §5.3 で固定 |
| R-05 | screenshot baseline が serial-07 の追加 baseline と重複/競合 | 低 | 中 | viewport / file path を明示分離（本タスク = 1280x800 1 枚 / serial-07 = full chrome multi-viewport） |
| R-06 | `(member)` 配下の他 child route が将来追加された際 scrape 対象が増える | 低 | 高 | 本 spec の構造を継承可能な template として残す（Phase 4 シグネチャを generic 化しやすい構造） |
| R-07 | profile を `(member)` 配下に移すことで member 認証ガードを通過しないユーザーへの fallback 挙動変化 | 中 | 低 | 既存 profile 動作が member 認証必須で設計されていることを Phase 6 TC-04 既存 spec で回帰確認 |
