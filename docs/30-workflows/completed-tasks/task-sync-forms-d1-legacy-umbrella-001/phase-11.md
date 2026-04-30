# Phase 11: 手動 smoke（docs-only / NON_VISUAL 縮約）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-sync-forms-d1-legacy-umbrella-001 |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke（docs-only / NON_VISUAL） |
| Wave | umbrella close-out |
| Mode | docs-only / NON_VISUAL |
| 作成日 | 2026-04-30 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | pending |

## 目的

`artifacts.json.metadata.visualEvidence == "NON_VISUAL"` の docs-only タスクとして、screenshot を作らず（false green 防止）、代替証跡 3 点（`main.md` / `manual-smoke-log.md` / `link-checklist.md`）＋ NON_VISUAL evidence bundle で Phase 11 を閉じる。本タスクの主証跡は `audit-unassigned-tasks.js` の current violations 0、`rg` による stale path / conflict marker 不在、責務移管表の rendering 確認、`git diff --stat` の影響範囲確認である。

## 実行タスク

1. `outputs/phase-11/main.md` 作成（テスト方式 / 発火条件 / 必須 outputs index）
2. `outputs/phase-11/manual-smoke-log.md` 作成（実行コマンド / 期待結果 / 実結果テーブル）
3. `outputs/phase-11/link-checklist.md` 作成（参照元 → 参照先 / 状態テーブル）
4. `outputs/phase-11/manual-evidence-bundle.md` 作成（NON_VISUAL evidence の章立て）
5. ウォークスルーシナリオ発見事項のリアルタイム分類

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` § docs-only / NON_VISUAL 縮約テンプレ | テンプレ準拠 |
| 必須 | `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` | NON_VISUAL 代替証跡定義 |
| 必須 | `docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/phase-09.md` | 品質ゲート結果（audit 出力の起点） |
| 必須 | `docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/phase-10.md` | GO 判定 |
| 必須 | `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` | 元仕様（責務移管表の rendering 対象） |

## 実行手順

### ステップ 1: テスト方式の発火判定

```bash
jq -r '.metadata.visualEvidence // empty' \
  docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/artifacts.json
# => NON_VISUAL を期待
```

`NON_VISUAL` を確認したら、screenshot 撮影フローには進まない。`docs-only / NON_VISUAL 縮約テンプレ` を適用する。

### ステップ 2: `main.md`（Phase 11 トップ index）

最小章立て:

- テスト方式: NON_VISUAL / docs walkthrough
- 発火条件: `artifacts.json.metadata.visualEvidence == "NON_VISUAL"`
- 必須 outputs 一覧（`manual-smoke-log.md` / `link-checklist.md` / `manual-evidence-bundle.md`）
- screenshot を作らない理由: docs-only / spec_created / NON_VISUAL（false green 防止）

### ステップ 3: `manual-smoke-log.md`（実行コマンド + 期待結果 + 実測テーブル）

| # | 実行コマンド | 期待結果 | 実測 | PASS/FAIL |
| --- | --- | --- | --- | --- |
| 1 | `node .claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js --target-file docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` | current violations 0 | （実行後記入） | （記入） |
| 2 | `rg -n "ut-09-sheets-to-d1-cron-sync-job" docs/30-workflows/unassigned-task .claude/skills/aiworkflow-requirements/references` | 新規導線参照 0 件（言及は stale 明記時のみ） | （実行後記入） | （記入） |
| 3 | `rg -n "^(<<<<<<<\|=======\|>>>>>>>)" .claude/skills/aiworkflow-requirements/references docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001` | 0 hit | （実行後記入） | （記入） |
| 4 | `git diff --stat origin/main...HEAD -- docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/ docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` | 影響範囲が docs/30-workflows/ 配下のみ | （実行後記入） | （記入） |
| 5 | 責務移管表の rendering 確認（元仕様 §3 Phase 2 表を `glow` / GitHub preview などで目視） | 7 行のテーブルが破綻なくレンダリングされる | （実行後記入） | （記入） |

メタ情報（必須）:

- 証跡の主ソース: `audit-unassigned-tasks.js` 出力 / `rg` 出力 / `git diff --stat` 出力
- screenshot を作らない理由: NON_VISUAL（docs-only / spec_created）
- 実行日時: （実行時記入）
- 実行者: branch `feat/wt-8`

### ステップ 4: `link-checklist.md`（参照リンク有効性）

| 参照元 | 参照先 | 状態（OK / Broken） |
| --- | --- | --- |
| 元仕様 §8 | `docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md` | （記入） |
| 元仕様 §8 | `docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver/index.md` | （記入） |
| 元仕様 §8 | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | （記入） |
| 元仕様 §8 | `docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md` | （記入） |
| 元仕様 §8 | `.claude/skills/aiworkflow-requirements/references/task-workflow.md` | （記入） |
| 元仕様 §8 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | （記入） |
| `phase-09.md` | `outputs/phase-09/main.md` | （記入） |
| `phase-10.md` | `outputs/phase-10/go-no-go.md` | （記入） |
| `phase-11.md` | `outputs/phase-11/manual-smoke-log.md` | （記入） |
| `phase-12.md` | `outputs/phase-12/implementation-guide.md` | （記入） |

### ステップ 5: `manual-evidence-bundle.md`（NON_VISUAL evidence 章立て placeholder）

最小章立て（各章は command + 期待結果 + 実結果欄を含む）:

#### 5.1 audit-unassigned-tasks.js 実行ログ

```text
$ node .claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js \
    --target-file docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md
[期待] current violations: 0
[実測] （実行後記入）
[判定] PASS / FAIL
```

#### 5.2 rg による stale path scan

```text
$ rg -n "UT-09-sheets-d1-sync-job-implementation|ut-09-sheets-to-d1-cron-sync-job" \
    docs/30-workflows/unassigned-task .claude/skills/aiworkflow-requirements/references
[期待] 新規導線として参照する hit が 0 件（stale 明記の文脈での言及のみ許容）
[実測] （実行後記入）
[判定] PASS / FAIL
```

#### 5.3 rg による conflict marker scan

```text
$ rg -n "^(<<<<<<<|=======|>>>>>>>)" .claude/skills/aiworkflow-requirements/references
[期待] 0 hit
[実測] （実行後記入）
[判定] PASS / FAIL
```

#### 5.4 git diff --stat 影響範囲

```text
$ git diff --stat origin/main...HEAD -- \
    docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/ \
    docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md
[期待] 影響範囲が docs/30-workflows/ 配下に限定される（実装コード 0 件）
[実測] （実行後記入）
[判定] PASS / FAIL
```

#### 5.5 specs と prototype の整合性 dry-read チェック（追加）

- 対象: `docs/00-getting-started-manual/specs/01-api-schema.md` / `specs/03-data-fetching.md` / `specs/08-free-database.md` / `claude-design-prototype/pages-admin.jsx` / `claude-design-prototype/data.jsx`
- 確認方法: dry-read（実行なし、目視 / `rg`）で本タスク仕様書との用語整合を確認
  - `responseId` / `publicConsent` / `rulesConsent` の表記が specs/01 と一致
  - sync_jobs / cursor / current response / consent snapshot の表記が specs/03 と一致
  - WAL 非対応 / PRAGMA 制約の表記が specs/08 と一致
  - admin sync UI 想定操作（schema 同期 / responses 同期）の表記が pages-admin.jsx と一致
  - sample データ構造が data.jsx と矛盾しない（schema 互換性確認）
- 期待: 5 つすべての観点で矛盾 0、独自読み替え 0
- 実測: （実行後記入）
- 判定: PASS / FAIL

#### 5.6 責務移管 table rendering 確認

- 対象: 元仕様 §3 Phase 2 成果物テーブル（7 行）
- 確認方法: GitHub preview で表示し、列ずれ・改行崩れがないこと
- 期待: 7 行 × 2 列が崩れなく表示される
- 実測: （実行後記入）
- 判定: PASS / FAIL

### ステップ 6: 発見事項リアルタイム分類

| # | シナリオ | 発見事項 | 分類 | 対応方針 |
| --- | --- | --- | --- | --- |
| - | （実行時に記入） | - | Blocker / Note / Info | - |

分類基準: Blocker = Phase 12 完了前に修正必須、Note = 改善推奨だが Phase 12 をブロックしない、Info = 記録のみ。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | manual-evidence-bundle / smoke-log を documentation-changelog の根拠に転用 |
| Phase 13 | smoke-log の audit 結果を PR body の検証セクションへコピー |

## 多角的チェック観点（不変条件）

- **#5**: smoke 検証で apps/web → D1 経路が一切現れないことを目視確認
- **#6**: smoke 検証で GAS apps script trigger 言及が現れないことを目視確認
- **#1**: 移管要件に Sheets 列固定アサーション持ち込みがないことを目視確認
- **#10**: 増分 req/day = 0 の Phase 9 結果が smoke で再確認される

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | `main.md` 作成 | 11 | pending | NON_VISUAL index |
| 2 | `manual-smoke-log.md` 作成 | 11 | pending | 5 行テーブル |
| 3 | `link-checklist.md` 作成 | 11 | pending | 10 行テーブル |
| 4 | `manual-evidence-bundle.md` 作成 | 11 | pending | 5 章 placeholder |
| 5 | 発見事項リアルタイム分類 | 11 | pending | Blocker/Note/Info |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-11/main.md` | NON_VISUAL Phase 11 トップ index |
| ドキュメント | `outputs/phase-11/manual-smoke-log.md` | 実行コマンド + 期待 + 実測テーブル |
| ドキュメント | `outputs/phase-11/link-checklist.md` | 参照リンク有効性 |
| ドキュメント | `outputs/phase-11/manual-evidence-bundle.md` | NON_VISUAL evidence の 5 章 placeholder |
| メタ | `artifacts.json` | Phase 11 を completed に更新 |

## 完了条件

- [ ] `main.md` / `manual-smoke-log.md` / `link-checklist.md` / `manual-evidence-bundle.md` の 4 ファイル配置
- [ ] smoke-log の 5 行が全て PASS
- [ ] link-checklist の 10 行すべて OK
- [ ] manual-evidence-bundle の 5 章すべて command/期待/実測/判定が埋まる
- [ ] screenshot を生成していない（false green 防止）

## タスク100%実行確認【必須】

- 全実行タスク（5 件）completed
- 4 ファイル配置済み
- `artifacts.json` の phase 11 を completed に更新
- ダミー PNG が生成されていないこと（NON_VISUAL タスクで禁止）

## 次 Phase への引き渡し

- 次: 12 (ドキュメント更新)
- 引き継ぎ事項: NON_VISUAL evidence bundle / link-checklist / smoke-log
- ブロック条件: 必須 4 ファイルのいずれかが欠落、または smoke-log で FAIL が 1 件以上ある場合は Phase 12 に進まない
