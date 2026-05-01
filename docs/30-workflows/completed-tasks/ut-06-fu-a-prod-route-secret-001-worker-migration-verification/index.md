# ut-06-fu-a-prod-route-secret-001-worker-migration-verification - タスク実行仕様書

## メタ情報

| 項目 | 内容 |
| ---- | ---- |
| 機能名 | ut-06-fu-a-prod-route-secret-001-worker-migration-verification |
| タスクID | UT-06-FU-A-PROD-ROUTE-SECRET-001 |
| 親タスク | UT-06-FU-A (`docs/30-workflows/ut-06-followup-A-opennext-workers-migration/`) / 上位 UT-06 |
| GitHub Issue | #246 |
| 作成日 | 2026-04-30 |
| ステータス | spec_created |
| workflow_state | spec_created |
| 優先度 | HIGH |
| 規模 | small |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| wave | 2-plus |
| 実行種別 | serial |
| 総Phase数 | 13 |

---

## Phase一覧

| Phase | 名称 | 仕様書 | ステータス |
| ----- | ---- | ------ | ---------- |
| 1 | 要件定義 | [phase-01.md](phase-01.md) | completed |
| 2 | 設計 | [phase-02.md](phase-02.md) | completed |
| 3 | 設計レビューゲート | [phase-03.md](phase-03.md) | completed |
| 4 | テスト作成 | [phase-04.md](phase-04.md) | completed |
| 5 | 実装 | [phase-05.md](phase-05.md) | completed |
| 6 | テスト拡充 | [phase-06.md](phase-06.md) | completed |
| 7 | テストカバレッジ確認 | [phase-07.md](phase-07.md) | completed |
| 8 | リファクタリング | [phase-08.md](phase-08.md) | completed |
| 9 | 品質保証 | [phase-09.md](phase-09.md) | completed |
| 10 | 最終レビューゲート | [phase-10.md](phase-10.md) | completed |
| 11 | 手動テスト検証 | [phase-11.md](phase-11.md) | completed |
| 12 | ドキュメント更新 | [phase-12.md](phase-12.md) | completed |
| 13 | PR作成 | [phase-13.md](phase-13.md) | pending_user_approval |

> **本タスクは docs-only / infrastructure-verification**: コード実装はなく、成果物は runbook / checklist / 設定スナップショット markdown のみ。Phase 4-7 のテスト系は薄く扱い、Phase 2/3 でテスト系の縮退方針（doc レビュー + checklist 整合確認に置換）を明記する。

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

## Phase完了時の必須アクション

1. **タスク100%実行**: Phase 内で指定された全タスクを完全に実行
2. **成果物確認**: 全ての必須成果物が生成されていることを検証
3. **artifacts.json更新**: `complete-phase.js` で Phase 完了ステータスを更新
4. **完了条件チェック**: 各タスクを完遂した旨を必ず明記

```bash
# Phase完了処理
node .claude/skills/task-specification-creator/scripts/complete-phase.js \
  --workflow docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification \
  --phase {{N}} \
  --artifacts "outputs/phase-{{N}}/{{FILE}}.md:{{DESCRIPTION}}"
```

---

## 成果物

| Phase | 主要成果物 |
| ----- | ---------- |
| 1 | `outputs/phase-01/main.md` |
| 2 | `outputs/phase-02/main.md`, `outputs/phase-02/worker-inventory-design.md`, `outputs/phase-02/route-secret-observability-design.md`, `outputs/phase-02/runbook-placement.md` |
| 3 | `outputs/phase-03/main.md` |
| 4 | `outputs/phase-04/main.md`（doc レビュー観点 + checklist 整合確認） |
| 5 | `outputs/phase-05/main.md`, `outputs/phase-05/runbook.md` |
| 6 | `outputs/phase-06/main.md`（異常系シナリオ列挙） |
| 7 | `outputs/phase-07/main.md`, `outputs/phase-07/ac-matrix.md`, `outputs/phase-07/secret-keys-snapshot.md` |
| 8 | `outputs/phase-08/main.md` |
| 9 | `outputs/phase-09/main.md` |
| 10 | `outputs/phase-10/main.md`, `outputs/phase-10/go-no-go.md`, `outputs/phase-10/approval-record.md` |
| 11 | `outputs/phase-11/main.md`, `outputs/phase-11/manual-verification-log.md`, `outputs/phase-11/route-snapshot.md`, `outputs/phase-11/secret-keys-snapshot.md`, `outputs/phase-11/tail-sample.md`, `outputs/phase-11/legacy-worker-disposition.md`, `outputs/phase-11/runbook-walkthrough.md`, `outputs/phase-11/grep-integrity.md` |
| 12 | `outputs/phase-12/main.md`, `outputs/phase-12/implementation-guide.md`, `outputs/phase-12/system-spec-update-summary.md`, `outputs/phase-12/documentation-changelog.md`, `outputs/phase-12/unassigned-task-detection.md`, `outputs/phase-12/skill-feedback-report.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md`, `outputs/artifacts.json` |
| 13 | `outputs/phase-13/main.md` |

---

## 参照ドキュメント

| ファイル | 内容 |
| --- | --- |
| `docs/30-workflows/unassigned-task/UT-06-FU-A-production-route-secret-observability.md` | 正本仕様（メタ・苦戦箇所・Why/What/How/AC/Phase 計画） |
| `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/` | 親タスク runbook（本タスクの追記先） |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | Cloudflare デプロイ規約 |
| `CLAUDE.md` (`Cloudflare 系 CLI 実行ルール`) | `wrangler` 直接実行禁止 / `bash scripts/cf.sh` 一本化 |
| `apps/web/wrangler.toml` (`[env.production]`) | Worker 名 `ubm-hyogo-web-production` の正本 |

---

*このファイルは task-specification-creator skill に準拠して作成されました。*
