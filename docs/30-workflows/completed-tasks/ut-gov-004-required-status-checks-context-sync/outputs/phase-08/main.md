# Phase 8: DRY 化 / リファクタリング

> 入力: Phase 2 / Phase 5 / Phase 7
> 目的: 重複文書を機械可読の単一正本に集約し、UT-GOV-001 が直接消費する形に確定する

## 1. 重複と統合

| 重複対象 | Phase 2 | Phase 5 | Phase 8 単一正本 |
| --- | --- | --- | --- |
| 確定 contexts | context-name-mapping.md §3 | required-contexts-final.md | **confirmed-contexts.yml**（機械可読） |
| lefthook ↔ CI 対応表 | lefthook-ci-correspondence.md §1 | lefthook-ci-mapping.md | **lefthook-ci-mapping.md**（Phase 8 確定） |
| 段階適用案 | staged-rollout-plan.md | staged-rollout-plan.md | Phase 5 の同名ファイルを正本扱い（差分なし） |
| strict 採否 | lefthook-ci-correspondence.md §3 | strict-mode-decision.md | Phase 9 strict-decision.md（最終） |

## 2. 単一正本確定

### 2-a. confirmed-contexts.yml（UT-GOV-001 唯一の機械可読入力）

→ `outputs/phase-08/confirmed-contexts.yml`

### 2-b. lefthook-ci-mapping.md（Phase 8 確定版）

→ `outputs/phase-08/lefthook-ci-mapping.md`（Phase 5 同名ファイルから再掲、フォーマット統一）

## 3. 依存関係

- Phase 2 設計成果物 → Phase 5 ランブック → Phase 8 単一正本 への流れを文書ヘッダに明記
- Phase 8 confirmed-contexts.yml を変更するときは、必ず Phase 5 required-contexts-final.md を先に更新

## 4. AC 充足

- AC-6: confirmed-contexts.yml が UT-GOV-001 入力契約として参照可能 ✅
- AC-8: フルパス記載が confirmed-contexts.yml に保持 ✅

## 5. Phase 2 / Phase 7 成果物の参照

- Phase 2 context-name-mapping.md → confirmed-contexts.yml の 3 件と完全一致確認済み
- Phase 7 ac-matrix.md → AC 充足が confirmed-contexts.yml で連鎖維持
- `outputs/phase-02/context-name-mapping.md`
- `outputs/phase-02/staged-rollout-plan.md`
- `outputs/phase-02/lefthook-ci-correspondence.md`
- `outputs/phase-07/ac-matrix.md`

## 6. 完了基準

- [x] confirmed-contexts.yml 作成
- [x] lefthook-ci-mapping.md (Phase 8 版) 作成
- [x] 重複文書を単一正本に集約
- [x] Phase 2 / Phase 7 成果物との整合確認
