# Phase 12: Implementation Guide / SSOT Sync / Documentation Changelog / Strict 7 Outputs

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| Source | `outputs/phase-12/main.md`（+ strict 7 outputs） |
| 区分 | ドキュメント / SSOT 同期 |
| Phase 12 contract | strict 7 outputs |
| 想定所要 | 0.5 人日 |

## 目的

Phase 5-11 の成果を、(a) implementation-guide.md として運用者向けに統合、(b) aiworkflow-requirements / task-specification-creator skill 各 reference に SSOT 同期、(c) strict 7 outputs を固定ファイル名で生成、を実施する。

## strict 7 outputs（固定ファイル名）

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-12/main.md` | Phase 12 全体サマリ + 残り 6 file への index |
| `outputs/phase-12/implementation-guide.md` | schema / validator / CI / backfill 運用 guide（PR 本文に Phase 13 で転記） |
| `outputs/phase-12/documentation-changelog.md` | 本タスクで触ったドキュメント差分一覧 |
| `outputs/phase-12/unassigned-task-detection.md` | 本タスク作業中に発見した未タスク（後述） |
| `outputs/phase-12/skill-feedback-report.md` | 本タスク中の skill 利用フィードバック |
| `outputs/phase-12/system-spec-update-summary.md` | システム仕様（aiworkflow-requirements）への追記サマリ |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 compliance（30 種思考法 compact + 検証 4 条件） |

## 実行タスク

### 12.1 implementation-guide.md

セクション構成:
1. **概要** — gate metadata structured ledger の目的・採用 schema・validator 振る舞い
2. **schema フィールド表** — Phase 1 §2 を転記
3. **新規 artifacts.json への gates[] 追加方法** — テンプレ JSON snippet
4. **既存 artifacts.json への backfill 手順** — Issue #549 を例に手順化
5. **validator 実行方法** — `pnpm gate-metadata:validate` ローカル / CI
6. **CI 必須化手順** — branch protection に `verify-gate-metadata / validate` 追加（user approval gate 後）
7. **トラブルシュート** — WARN/skip / ERROR 種別 / path traversal 検知
8. **後方互換ポリシー** — `gateConditions_legacy` 並存 / historical sweep は別 PR

### 12.2 SSOT 同期

#### 12.2.1 `.claude/skills/task-specification-creator/references/phase12-checklist-definition.md`（編集）

「Phase 12 compliance check 必須項目」セクションに以下を追記:

```md
- [ ] gate-metadata validator が green（`pnpm gate-metadata:validate` exit 0）
  - `metadata.gates[]` を持つ artifacts.json はすべて `GateEntrySchema` parse 成功
  - `status === passed` の `evidence_path` 実体が存在
  - 詳細仕様: `.claude/skills/aiworkflow-requirements/references/gate-metadata.md`
```

#### 12.2.2 `.claude/skills/aiworkflow-requirements/references/gate-metadata.md`（新規）

structured ledger の正本仕様 SSOT。Phase 1 §2 schema フィールド表 + Phase 5 schema.ts シグネチャ + validator 振る舞い + 運用ポリシーを集約。

#### 12.2.3 `.claude/skills/aiworkflow-requirements/indexes/{keywords.json,quick-reference.md,resource-map.md,topic-map.md}`（編集）

新キーワード追加: `gate-metadata`, `structured ledger`, `verify-gate-metadata`, `gates[]`, `gate ledger`, `Phase 12 compliance gate`。

`mise exec -- pnpm indexes:rebuild` で indexes 再生成 → `verify-indexes-up-to-date` CI gate 通過。

### 12.3 documentation-changelog.md

| ドキュメント | 種別 | 概要 |
| --- | --- | --- |
| `docs/30-workflows/issue-589-gate-metadata-structured-ledger/**` | 新規 | spec_created |
| `docs/30-workflows/completed-tasks/issue-549-.../artifacts.json` × 2 | 編集 | gates[] backfill |
| `.claude/skills/task-specification-creator/references/phase12-checklist-definition.md` | 編集 | gate-metadata 必須化 |
| `.claude/skills/aiworkflow-requirements/references/gate-metadata.md` | 新規 | SSOT |
| `.claude/skills/aiworkflow-requirements/indexes/*` | 編集 | keyword 追加 + rebuild |

### 12.4 unassigned-task-detection.md

本タスク作業中に発見した未タスク候補:

| 候補 | 概要 | 優先度 |
| --- | --- | --- |
| historical artifacts.json への `gates[]` 一括 backfill | 全 completed-tasks workflow を新 schema 化 | low |
| `gateConditions_legacy` 完全削除 sweep | 後方互換廃止 | low |
| gate ledger admin UI | gates 履歴閲覧 | 対象外 |
| branch protection required context 化 | `verify-gate-metadata / validate` を branch protection に追加 | user approval gate に統合済み（新規未タスクなし） |

### 12.5 skill-feedback-report.md

- task-specification-creator: greenfield 新規実装に対し phase-template-core.md の P50 チェックがそのまま適用できた。MINOR 追跡テーブルの owner / co-owner 仕様が役立った。
- aiworkflow-requirements: gate-metadata という新トピック追加経路（references + indexes rebuild）が明確だった。

### 12.6 system-spec-update-summary.md

- aiworkflow-requirements: `gate-metadata` SSOT 追加。
- task-specification-creator: `phase12-checklist-definition.md` に gate-metadata 必須項目追加。

### 12.7 phase12-task-spec-compliance-check.md

- 30 種思考法 compact evidence
- 検証 4 条件（spec 完全性 / AC 達成 / DoD 達成 / SSOT 同期）

## Part 2 必須 5 項目チェック対応表（phase-template-phase12.md §Part 2）

| 項目 | 対応 |
| --- | --- |
| visualEvidence 適用 | NON_VISUAL を index.md / artifacts.json に明記、Phase 11 縮約テンプレで evidence 取得 |
| Phase 12 strict 7 outputs | §strict 7 outputs 表通り 7 file 固定名で生成 |
| SSOT 同期 | §12.2 で aiworkflow-requirements / task-specification-creator skill 双方を更新 |
| documentation-changelog | §12.3 で全 file 一覧化 |
| unassigned-task-detection | §12.4 で 4 候補列挙 |

## 変更対象ファイル

| パス | 種別 |
| --- | --- |
| `outputs/phase-12/main.md` | 新規 |
| `outputs/phase-12/implementation-guide.md` | 新規 |
| `outputs/phase-12/documentation-changelog.md` | 新規 |
| `outputs/phase-12/unassigned-task-detection.md` | 新規 |
| `outputs/phase-12/skill-feedback-report.md` | 新規 |
| `outputs/phase-12/system-spec-update-summary.md` | 新規 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 新規 |
| `.claude/skills/task-specification-creator/references/phase12-checklist-definition.md` | 編集 |
| `.claude/skills/aiworkflow-requirements/references/gate-metadata.md` | 新規 |
| `.claude/skills/aiworkflow-requirements/indexes/*` | 編集 + rebuild |

## 入出力・副作用

- 入力: Phase 5-11 全成果物。
- 出力: strict 7 outputs + skill SSOT 更新。
- 副作用: skill indexes が rebuild される。

## テスト方針

新規テスト追加なし。`mise exec -- pnpm indexes:rebuild` 後に `verify-indexes` CI gate が通ることを Phase 13 push で確認。

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm indexes:rebuild
git status --short .claude/skills/aiworkflow-requirements/indexes/
```

## 統合テスト連携

- Phase 13 PR 本文は §12.1 implementation-guide.md を転記。
- CI `verify-indexes-up-to-date` で skill indexes drift がないことを確認。

## 多角的チェック観点（AIが判断）

- **strict 7 outputs 命名**: 固定ファイル名厳守。1 file でも欠けると Phase 12 contract 違反。
- **indexes rebuild 漏れ**: keyword 追加だけでなく `pnpm indexes:rebuild` を必ず実行。

## サブタスク管理

- ST-1: implementation-guide.md
- ST-2: documentation-changelog.md
- ST-3: unassigned-task-detection.md
- ST-4: skill-feedback-report.md
- ST-5: system-spec-update-summary.md
- ST-6: phase12-task-spec-compliance-check.md
- ST-7: main.md（index）
- ST-8: skill SSOT 更新 + indexes rebuild

## 成果物

- strict 7 outputs + skill SSOT 編集 + indexes rebuild。

## 完了条件（DoD）

- [ ] strict 7 outputs すべて固定ファイル名で生成済み。
- [ ] §12.2 SSOT 同期完了（gate-metadata.md 新規 + phase12-checklist-definition.md 編集 + indexes rebuild）。
- [ ] §12.3 documentation-changelog.md 全 file 列挙済み。
- [ ] §12.4 unassigned-task-detection.md 候補 4 件列挙済み。
- [ ] Part 2 必須 5 項目チェック表すべて対応済み。

## タスク100%実行確認【必須】

- [ ] ST-1 ... ST-8 すべて完了
- [ ] strict 7 outputs file すべて存在
- [ ] Phase 13 着手 GO 判定済み

## 次Phase

[Phase 13: PR 作成](phase-13.md)

## 参照資料

- `docs/30-workflows/issue-589-gate-metadata-structured-ledger/index.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/gate-metadata.md`
- Phase 1 / Phase 2 / Phase 5 / Phase 6 / Phase 7 / Phase 8 / Phase 9 / Phase 10 / Phase 11 outputs and decisions
