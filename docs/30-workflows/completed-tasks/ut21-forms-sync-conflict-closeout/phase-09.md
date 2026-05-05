# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-21 Sheets sync 仕様を Forms sync 現行正本へ吸収する close-out |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-30 |
| 前 Phase | 8 (DRY 化 / リファクタリング) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | spec_created |
| タスク分類 | docs-only / specification-cleanup（QA・整合性監査） |

## 目的

Phase 8 で確定した SSOT 5 軸用語表と navigation drift 0 を前提に、本 docs-only close-out タスクの品質を 5 観点（rg 検証ログ・cross-link 死活・aiworkflow-requirements current facts 整合・不変条件 #1/#4/#5/#7 違反監査・4条件最終評価準備）で確認し、Phase 10 GO/NO-GO 判定に必要な客観的根拠を揃える。a11y は対象外（docs-only かつ UI を持たない close-out のため）。新規 Secret 導入はなく、無料枠影響も 0。本タスクは `apps/api/src/sync/*` 想定パスの再構成判断は含まず、後続 U02 / U04 / U05 へ委譲した整合確認に留める。

## 実行タスク

1. rg 検証ログを取得し、stale 表記の残留 0 を確認する（完了条件: AC-10 検証コマンドの実出力が `outputs/phase-09/rg-verification-log.md` に保存され、本タスク内残留 0、引用文脈以外での `POST /admin/sync\b` / `GET /admin/sync/audit` / `sync_audit_logs` / `sync_audit_outbox` ヒット件数 0）。
2. cross-link 死活確認を行う（完了条件: index.md / phase-XX.md / outputs / 後続 U02・U04・U05 / skill reference / GitHub Issue #234 のリンク切れ 0）。
3. aiworkflow-requirements skill `task-workflow.md` current facts と本タスク全成果物の整合性を監査する（完了条件: 同期元 / endpoint / audit ledger / 実装パスの 4 軸で skill 記述と矛盾 0、結果が `outputs/phase-09/skill-integrity-audit.md` に表化）。
4. 不変条件 #1 / #4 / #5 / #7 違反監査を実施する（完了条件: 4 条件すべて違反 0、根拠が `outputs/phase-09/main.md` に記述）。
5. 4条件（価値性 / 実現性 / 整合性 / 運用性）最終評価の前提整理（完了条件: Phase 10 で参照する判定材料が表化）。
6. line budget / mirror parity を確認する（完了条件: 各 phase-XX.md が 100-250 行、Phase 12/13 は 350 行以内、index.md が 250 行以内、mirror parity は本タスクが skill `references/` を編集しないため N/A 判定）。
7. a11y 対象外を明記する（完了条件: 「docs-only / legacy umbrella close-out のため a11y 対象外」と記述）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/phase-08.md | SSOT 集約結果 |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/index.md | AC-1〜AC-11 / 不変条件 / 主要参照資料 |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/artifacts.json | path 整合の起点 |
| 必須 | docs/30-workflows/unassigned-task/task-ut21-forms-sync-conflict-closeout-001.md | 原典 close-out spec |
| 必須 | docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md | UT-21 legacy（引用文脈の境界確認） |
| 必須 | docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md | 後続 U02 |
| 必須 | docs/30-workflows/unassigned-task/task-ut21-phase11-smoke-rerun-real-env-001.md | 後続 U04 |
| 必須 | docs/30-workflows/unassigned-task/task-ut21-impl-path-boundary-realignment-001.md | 後続 U05 |
| 必須 | .claude/skills/aiworkflow-requirements/references/task-workflow.md | current facts 監査の正本 |
| 必須 | apps/api/src/jobs/sync-forms-responses.ts | 同期元 / 実装パス current facts |
| 必須 | apps/api/src/sync/schema/ | schema 同期 current facts |

## rg 検証ログ（AC-10 一次根拠）

### コマンド 1: stale 表記残留確認

```bash
rg -n "POST /admin/sync\b|GET /admin/sync/audit|sync_audit_logs|sync_audit_outbox" \
  docs/30-workflows/ut21-forms-sync-conflict-closeout \
  docs/30-workflows/02-application-implementation \
  .claude/skills/aiworkflow-requirements/references
```

| 期待出力 | 内容 |
| --- | --- |
| 本タスク phase / outputs ヒット | 引用文脈（「新設しない方針」「U02 判定後まで保留」「Before 表」）のみで、推奨表記としてのヒットは 0 |
| `02-application-implementation` ヒット | 03a / 03b / 04c の split endpoint 表記のみ。単一 `POST /admin/sync` ヒット 0 |
| `aiworkflow-requirements/references` ヒット | `task-workflow.md` 内に stale 表記 0、引用なし |

### コマンド 2: Sheets / 旧 DTO 残留確認

```bash
rg -n "spreadsheets\.values\.get|SheetRow|apps/api/src/sync/(core|manual|scheduled|audit)\.ts" \
  docs/30-workflows/ut21-forms-sync-conflict-closeout
```

| 期待出力 | 内容 |
| --- | --- |
| 本タスク phase / outputs ヒット | 「Before 表」「U05 後続タスク委譲注記」のみ。推奨表記としてのヒット 0 |

### コマンド 3: 後続タスクファイル存在確認

```bash
ls docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md \
   docs/30-workflows/unassigned-task/task-ut21-phase11-smoke-rerun-real-env-001.md \
   docs/30-workflows/unassigned-task/task-ut21-impl-path-boundary-realignment-001.md
```

| 期待出力 | 3 ファイルすべて実在（exit 0） |

### コマンド 4: GitHub Issue 状態確認

```bash
gh issue view 234 --json state,title,url
```

| 期待出力 | `"state": "CLOSED"`、URL が index.md と一致 |

> 実出力は `outputs/phase-09/rg-verification-log.md` に貼付し、Phase 10 / Phase 11 で再利用する。

## cross-link 死活確認

| チェック | 方法 | 期待 |
| --- | --- | --- |
| artifacts.json `phases[*].primaryArtifact` × 実 path | `rg -n "outputs/phase-" docs/30-workflows/ut21-forms-sync-conflict-closeout/artifacts.json` と実 ls | 完全一致 |
| index.md `Phase 一覧` × 実ファイル | `ls docs/30-workflows/ut21-forms-sync-conflict-closeout/phase-*.md` | 13 ファイル一致 |
| index.md `主要な参照資料` 表のパス | 全件 ls | リンク切れ 0 |
| phase-XX.md 内 `../unassigned-task/*.md` 相対参照 | 全件 ls | リンク切れ 0 |
| 後続 U02 / U04 / U05 から本 index への back link | 後続 3 ファイル内 grep | 双方向リンク確認 |
| Skill reference path | `.claude/skills/aiworkflow-requirements/references/task-workflow.md` | 実在 |
| GitHub Issue link | `https://github.com/daishiman/UBM-Hyogo/issues/234` | 200 OK / CLOSED |
| 正本コードパス | `apps/api/src/jobs/sync-forms-responses.ts` / `apps/api/src/sync/schema/` | 実在 |

## aiworkflow-requirements skill 整合監査

| 軸 | skill `task-workflow.md` current facts | 本タスク記述 | 整合判定 |
| --- | --- | --- | --- |
| 同期元 | Forms API (`forms.get` / `forms.responses.list`) | 同 | PASS |
| admin endpoint | `POST /admin/sync/schema` + `POST /admin/sync/responses` の split | 同 | PASS |
| 監査 ledger | `sync_jobs` 単一 | 同（`sync_audit_logs/outbox` は U02 判定後まで保留） | PASS |
| 実装パス | `apps/api/src/jobs/sync-forms-responses.ts` + `apps/api/src/sync/schema/*` | 同 | PASS |
| Bearer guard | `SYNC_ADMIN_TOKEN` を `/admin/sync/*` に適用 | 同 | PASS |
| Cron | Workers Cron Triggers | 同（09b runbook 委譲） | PASS |

> 監査結果は `outputs/phase-09/skill-integrity-audit.md` に表化、矛盾 0 件で AC-7 達成根拠とする。

## 不変条件違反監査

| # | 不変条件 | 監査観点 | 期待 |
| --- | --- | --- | --- |
| #1 | 実フォームの schema をコードに固定しすぎない | UT-21 の Sheets 列インデックス前提を排除し、Forms `responseId` ベース DTO を正本に固定 | 違反 0 |
| #4 | Form schema 外データは admin-managed として分離 | `sync_jobs` ledger を admin-managed と再確認、ユーザー入力データへの混入なし | 違反 0 |
| #5 | D1 直接アクセスは `apps/api` に閉じる | `apps/web` から D1 直接アクセス示唆記述なし、新設 endpoint も `apps/api` 内のみ | 違反 0 |
| #7 | MVP では Google Form 再回答を本人更新の正式経路 | sync 経路が Forms→D1 一方向であることを再確認 | 違反 0 |

## 4条件最終評価の前提材料（Phase 10 引き渡し）

| 条件 | 前提材料 | 出典 |
| --- | --- | --- |
| 価値性 | UT-21 二重正本リスク除去、03a/03b/04c/09b への移植 patch 案完成 | Phase 5 implementation-runbook.md |
| 実現性 | docs-only スコープに閉じる、新規 Secret 導入 0、impl は U02 / U04 / U05 へ委譲 | Phase 1 / Phase 9 |
| 整合性 | 不変条件 #1/#4/#5/#7 違反 0、skill current facts と矛盾 0 | 本 Phase 監査表 |
| 運用性 | SSOT 5 軸用語表で次回同種 close-out の再現性確保、後続タスク 3 件が独立に進行可能 | Phase 8 SSOT 表 |

## a11y 対象外の明記

- 本タスクは docs-only / legacy umbrella close-out であり UI を持たない。
- ゆえに WCAG 2.1 / a11y 観点は本タスクで **対象外**。
- 関連の a11y 確認は UI を含むタスク（02b / 06 系）で別途行う。

## line budget / mirror parity

| ファイル | 想定行数 | budget | 判定 |
| --- | --- | --- | --- |
| index.md | 約 200 行 | 250 行以内 | PASS |
| phase-01.md 〜 phase-11.md | 各 100-250 行 | 100-250 行 | PASS 目標 |
| phase-12.md / phase-13.md | 各 250-350 行 | 350 行以内 | Phase 12 必須 7 成果物（main.md + 6 補助）・Phase 13 承認ゲートのため拡張許容 |
| outputs/phase-XX/*.md | main.md は 200-400 行を目安 | 個別 | 個別チェック |

### mirror parity

- 本タスクは `.claude/skills/aiworkflow-requirements/references/` を **編集しない**（既存 current facts と整合確認のみ）。
- ゆえに `.claude` / `.agents` mirror parity は **N/A**。
- 仮に Phase 12 で skill-feedback として SKILL 改修が必要と判明した場合は別タスク（skill 更新）として切り出し、本タスクでは扱わない。

## 実行手順

### ステップ 1: rg 検証 4 コマンド実行
- 出力を `outputs/phase-09/rg-verification-log.md` に貼付。

### ステップ 2: cross-link 死活確認
- 8 項目すべてリンク切れ 0 を確認。

### ステップ 3: skill 整合監査
- 6 軸で `task-workflow.md` と照合し、`outputs/phase-09/skill-integrity-audit.md` に表化。

### ステップ 4: 不変条件監査
- #1 / #4 / #5 / #7 を `outputs/phase-09/main.md` に記述。

### ステップ 5: 4条件最終評価材料整理
- Phase 10 引き渡しテーブルを `outputs/phase-09/main.md` に記述。

### ステップ 6: line budget / mirror parity 確認
- `wc -l docs/30-workflows/ut21-forms-sync-conflict-closeout/*.md` で計測、mirror parity は N/A 判定理由を記述。

### ステップ 7: a11y 対象外明記
- `outputs/phase-09/main.md` に固定文言を記述。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | rg 検証ログ / skill 整合監査 / 不変条件 0 違反 / 4条件評価材料を GO/NO-GO の根拠に使用 |
| Phase 11 | rg 検証コマンドを smoke で再実行（NON_VISUAL 証跡） |
| Phase 12 | skill-feedback の改修候補（共通化テンプレ等）に skill 整合監査結果を引き渡し |
| 後続 U02 | `sync_jobs` 不足分析の前提として skill 整合監査を参照 |

## 多角的チェック観点

- 価値性: rg 0 件 + skill 矛盾 0 件で UT-21 二重正本リスクが客観的に除去されたと示せる。
- 実現性: docs-only QA 範囲で完結、impl 判断は U02 / U04 / U05 に委譲。
- 整合性: 不変条件 #1 / #4 / #5 / #7 監査 0 違反、skill current facts と完全整合。
- 運用性: 検証コマンド・期待出力をログ化することで次回 close-out で再利用可能。
- 認可境界: 新規 Secret 導入 0、既存 `SYNC_ADMIN_TOKEN` / `GOOGLE_FORMS_API_KEY` は参照のみ。
- 無料枠: docs-only のため CI 実行コストへの影響なし。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | rg 検証 4 コマンド実行とログ保存 | 9 | spec_created | AC-10 一次根拠 |
| 2 | cross-link 死活確認 8 項目 | 9 | spec_created | リンク切れ 0 |
| 3 | skill `task-workflow.md` 整合監査 | 9 | spec_created | 6 軸 PASS |
| 4 | 不変条件 #1/#4/#5/#7 違反監査 | 9 | spec_created | 違反 0 |
| 5 | 4条件最終評価材料整理 | 9 | spec_created | Phase 10 引き渡し |
| 6 | line budget / mirror parity | 9 | spec_created | mirror parity N/A |
| 7 | a11y 対象外明記 | 9 | spec_created | docs-only |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | QA 結果サマリー（rg 検証 / cross-link / skill 整合 / 不変条件 / 4条件材料 / a11y N/A） |
| ドキュメント | outputs/phase-09/rg-verification-log.md | AC-10 一次根拠の rg 出力ログ |
| ドキュメント | outputs/phase-09/skill-integrity-audit.md | aiworkflow-requirements 整合監査表 |
| メタ | artifacts.json | Phase 9 状態の更新 |

## 完了条件

- [ ] rg 検証 4 コマンドの実出力が `rg-verification-log.md` に保存されている
- [ ] 本タスク内 stale 表記残留が 0（引用文脈除く）
- [ ] cross-link 死活 8 項目すべてリンク切れ 0
- [ ] skill `task-workflow.md` との整合監査で 6 軸すべて PASS
- [ ] 不変条件 #1 / #4 / #5 / #7 違反 0 が記述されている
- [ ] 4条件最終評価の前提材料が Phase 10 引き渡しテーブルとして整っている
- [ ] line budget が Phase 1〜11 は 100-250 行、Phase 12/13 は 350 行以内
- [ ] mirror parity の N/A 判定理由が明記
- [ ] a11y 対象外と明記
- [ ] outputs/phase-09/main.md が作成済み

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 成果物 3 ファイルが `outputs/phase-09/` 配下に配置予定
- rg 検証 4 コマンドの期待出力が定義されている
- skill 整合監査 6 軸網羅
- 不変条件 4 件監査済み
- a11y 対象外明記
- artifacts.json の `phases[8].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 10 (最終レビュー)
- 引き継ぎ事項:
  - rg 検証ログ（AC-10 達成根拠）
  - skill 整合監査結果（AC-7 達成根拠）
  - 不変条件 #1/#4/#5/#7 違反 0（AC-9 達成根拠）
  - 4条件最終評価材料（AC-8 確定の入力）
  - cross-link 死活 0（AC-5 達成根拠）
  - mirror parity N/A 判定（Phase 12 documentation 更新前提）
- ブロック条件:
  - rg 検証で stale 表記が引用文脈外でヒット
  - cross-link にリンク切れ
  - skill 整合監査で矛盾検出
  - 不変条件違反検出
