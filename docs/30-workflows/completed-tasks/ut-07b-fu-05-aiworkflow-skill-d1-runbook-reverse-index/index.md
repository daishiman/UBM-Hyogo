# ut-07b-fu-05-aiworkflow-skill-d1-runbook-reverse-index - タスク実行仕様書

## メタ情報

| 項目 | 内容 |
| ---- | ---- |
| 機能名 | ut-07b-fu-05-aiworkflow-skill-d1-runbook-reverse-index |
| タスク区分 | [実装区分: 実装仕様書] |
| 作成日 | 2026-05-04 |
| ステータス | completed_pending_pr / Phase 1-12 完了 / Phase 13 blocked_until_user_approval |
| 総 Phase 数 | 13 |
| Source Issue | #438（CLOSED 状態のままタスク仕様書を作成） |
| 依存タスク | UT-07B-FU-03 (production-migration-apply-runbook) — main merge 済み |
| visualEvidence | NON_VISUAL |
| scale | small |

---

## Phase 一覧

| Phase | 名称 | 仕様書 | ステータス |
| ----- | ---- | ------ | ---------- |
| 1 | 要件定義 | [phase-01.md](phase-01.md) | 完了 |
| 2 | 設計 | [phase-02.md](phase-02.md) | 完了 |
| 3 | 設計レビューゲート | [phase-03.md](phase-03.md) | 完了 |
| 4 | テスト作成 | phase-04.md | 完了 |
| 5 | 実装 | phase-05.md | 完了 |
| 6 | テスト拡充 | phase-06.md | 完了 |
| 7 | テストカバレッジ確認 | phase-07.md | 完了 |
| 8 | リファクタリング | phase-08.md | 完了 |
| 9 | 品質保証 | phase-09.md | 完了 |
| 10 | 最終レビューゲート | phase-10.md | 完了 |
| 11 | 手動テスト検証 | phase-11.md | 完了 |
| 12 | ドキュメント更新 | phase-12.md | 完了 |
| 13 | PR 作成 | phase-13.md | blocked_until_user_approval |

---

## 実行フロー

```
Phase 1 → Phase 2 → Phase 3 (Gate) → Phase 4 → Phase 5 → Phase 6 → Phase 7
                         ↓                                      ↓
                    (MAJOR→戻り)                           (未達→戻り)
                         ↓                                      ↓
Phase 8 → Phase 9 → Phase 10 (Gate) → Phase 11 → Phase 12 → Phase 13 → 完了
                         ↓
                    (MAJOR→戻り)
```

---

## 目的（要約）

`aiworkflow-requirements` skill の `indexes/resource-map.md` / `indexes/quick-reference.md` に
UT-07B-FU-03 で導入された D1 migration runbook + `scripts/d1/*.sh` + CI gate
`.github/workflows/d1-migration-verify.yml` への逆引き経路を追加し、
`pnpm indexes:rebuild` で `topic-map.md` を再生成して
`verify-indexes-up-to-date` gate を維持する最小差分タスク。

2026-05-04 の改善実行で、resource-map / quick-reference 追記、aiworkflow-requirements / task-specification-creator LOGS 同期、aiworkflow-requirements SKILL changelog、Phase 1-12 outputs を実体化した。production D1 apply、commit、push、PR は実行していない。

---

## スコープ

### 含む

- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` に D1 migration runbook + `scripts/d1/*.sh` + CI gate `.github/workflows/d1-migration-verify.yml` の所在を 1〜2 行で追記
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` に `bash scripts/cf.sh d1:apply-prod` 1 行追記
- dead path claim 補正に限る `.claude/skills/aiworkflow-requirements/references/` の本文更新
- `mise exec -- pnpm indexes:rebuild` による `topic-map.md` 再生成
- ローカルでの `verify-indexes-up-to-date` 相当検証通過

### 含まない

- dead path claim 補正を超える `references/` 本文書き換え
- skill 全体構造（resource-map / quick-reference / topic-map / keywords）の改修
- 他 workflow 用の reverse index 整備
- D1 migration 仕様の変更

---

## Phase 完了時の必須アクション

1. **タスク 100% 実行**: Phase 内で指定された全タスクを完全に実行
2. **成果物確認**: 全ての必須成果物が生成されていることを検証
3. **artifacts.json 更新**: `complete-phase.js` で Phase 完了ステータスを更新
4. **完了条件チェック**: 各タスクを完遂した旨を必ず明記

```bash
node .claude/skills/task-specification-creator/scripts/complete-phase.js \
  --workflow docs/30-workflows/completed-tasks/ut-07b-fu-05-aiworkflow-skill-d1-runbook-reverse-index --phase {{N}} \
  --artifacts "outputs/phase-{{N}}/{{FILE}}.md:{{DESCRIPTION}}"
```

---

## 主要参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 上流 | `.claude/skills/aiworkflow-requirements/references/workflow-ut-07b-fu-03-production-migration-apply-runbook-artifact-inventory.md` | 実在する上流 artifact inventory 正本 |
| 上流 | `docs/30-workflows/unassigned-task/task-ut-07b-fu-05-aiworkflow-skill-d1-runbook-reverse-index.md` | 本タスク発見元スタブ |
| skill | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 逆引き表（追記対象） |
| skill | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | クイック参照（追記対象） |
| skill | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | 自動再生成対象 |
| skill | `.claude/skills/aiworkflow-requirements/references/workflow-ut-07b-fu-03-production-migration-apply-runbook-artifact-inventory.md` | references 側の正本 |
| CI | `.github/workflows/verify-indexes.yml` | drift gate（`verify-indexes-up-to-date`）|
| 旧スタブ | `docs/30-workflows/unassigned-task/task-ut-07b-fu-05-aiworkflow-skill-d1-runbook-reverse-index.md` | 本仕様書作成後にクローズアウト対象 |

---

*このファイルはタスク仕様書テンプレートに従って手動生成されました（CLOSED issue #438 の formalize 用）。*
