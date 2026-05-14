# Phase 12: ドキュメント更新

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | TASK-10-FOLLOWUP-001 |
| Phase | 12 |
| 状態 | spec_created |

## 目的

実装結果を恒久ドキュメント（troubleshooting note、aiworkflow lesson、skill log）へ反映し、再発時の最短復旧経路を残す。Phase 12 close-out として **7 ファイル**を `outputs/phase-12/` に揃える（AC-9）。

## 7 ファイル構成（必須）

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-12/main.md` | Phase 12 サマリ |
| `outputs/phase-12/implementation-guide.md` | 後続実装者向け：何をどのファイルにどう書いたかの最終ガイド（PR 本文の原型） |
| `outputs/phase-12/documentation-changelog.md` | 反映したドキュメント変更の一覧 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | task-specification-creator skill フォーマット適合チェック |
| `outputs/phase-12/skill-feedback-report.md` | skill / aiworkflow への feedback サマリ |
| `outputs/phase-12/system-spec-update-summary.md` | aiworkflow-requirements 正本仕様の更新箇所サマリ |
| `outputs/phase-12/unassigned-task-detection.md` | 派生未タスク検出結果（本タスクで発生した派生があれば記録） |

## 更新対象ドキュメント

### 1. `scripts/cf.sh` ヘッダコメント

既存ヘッダの「esbuild とのバージョン不整合を ESBUILD_BINARY_PATH で自動解決」セクションに次を追記:

> ## esbuild 単一化（pnpm.overrides）
>
> workspace 全体の esbuild を単一バージョン（現在 0.25.4）に pin することで host / binary mismatch を予防する。再発時の手順:
>
> 1. `pnpm why esbuild` で複数 version の併存を確認
> 2. `package.json` の `pnpm.overrides.esbuild` を `@opennextjs/aws` 同梱版に合わせる
> 3. `pnpm install` で lockfile 再生成
> 4. それでも mismatch が残る場合は `set_opennext_esbuild_binary_path` を経由した `bash scripts/cf.sh build:web` を使う

### 2. `docs/00-getting-started-manual/cloudflare-cli-troubleshooting.md`

既存ファイル有無を `ls docs/00-getting-started-manual/cloudflare-cli-troubleshooting.md` で確認。

**ファイルがある場合**: 末尾に「OpenNext esbuild host/binary mismatch」セクションを追加。
**ファイルがない場合**: 新規作成し、以下を含める:

- 症状（host version "X" does not match binary version "Y"）
- 根本原因の構造（pnpm hoisting + esbuild の strict version match）
- 標準復旧手順（pnpm.overrides 適用 → pnpm install → build:cloudflare 確認）
- フォールバック（cf.sh の `set_opennext_esbuild_binary_path` 経由）
- 関連: GitHub Issue #609（CLOSED）、`docs/30-workflows/task-10-followup-001-opennext-esbuild-mismatch/`

### 3. `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-task-10-followup-001-opennext-esbuild-mismatch-2026-05.md`

新規 lesson fragment を作成する。既存 `lessons-learned-task-10-ui-primitives-2026-05.md` の L-T10-001 は「未解決 blocker」の記録として残し、本タスクの lesson は「解消手順」として分離する:

```markdown
## OpenNext esbuild host/binary mismatch (task-10-followup-001, 2026-05-11)

- 症状: `pnpm --filter @ubm-hyogo/web build:cloudflare` が `Host version "0.25.4" does not match binary version "0.21.5"` で fail
- 根本原因: workspace に esbuild が複数 version 共存（vite=0.21.5 / @opennextjs/aws=0.25.4 / wrangler=0.27.3）し、pnpm hoisting で host と binary が別 version に解決される
- 解決: `package.json` の `pnpm.overrides.esbuild` で単一化（@opennextjs/aws 同梱版に合わせる）
- 再発検知: `pnpm why esbuild` と platform binary scan で OpenNext host/binary mismatch pair が 0 件であることを確認
- 参考: `docs/30-workflows/task-10-followup-001-opennext-esbuild-mismatch/`
```

### 4. aiworkflow-requirements same-wave sync

次を同一 wave で更新する:

| パス | 更新内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/changelog/20260511-task-10-followup-001-opennext-esbuild-mismatch.md` | 実装・検証・状態遷移の changelog fragment |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | 2026-05-11 log 1 行 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | task-10 blocker 行を「解消済み / follow-up 002 解放」へ更新 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 本 workflow / lesson / changelog を canonical set に登録 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow と下流 task の状態を同期 |
| `.claude/skills/aiworkflow-requirements/references/workflow-task-10-followup-001-opennext-esbuild-mismatch-artifact-inventory.md` | workflow root / Phase 11 evidence / Phase 12 strict 7 / aiworkflow sync files の成果物台帳 |

### 5. `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md`

新規 log エントリを追記（既存運用に従う形式で）:

- 日付: 2026-05-11
- タスク: task-10-followup-001
- 影響: build:cloudflare 回復、task-10 visual evidence のブロック解除
- 不変条件 touched: なし（toolchain only）

### 6. `index.md` / `artifacts.json`（本タスク）

Phase 11 local evidence と Phase 12 strict 7 files が揃った後に、root `artifacts.json` と `outputs/artifacts.json` を同値に保ったまま次へ更新する:

- `metadata.workflow_state`: `implemented_local_evidence_captured`
- `metadata.implementation_status`: `implementation_complete_pending_pr`
- `index.md` の `状態`: `implemented_local_evidence_captured`
- Phase 1〜12: `completed`
- Phase 13: `pending_user_approval` のまま維持（PR 作成後まで `completed` にしない）

### 7. supersede 関係の明記

`docs/30-workflows/unassigned-task/task-10-followup-001-opennext-esbuild-mismatch.md`（短縮版指示書）を本ディレクトリで supersede 済みであることを冒頭に追記。
具体的には次の 1 行を冒頭に挿入:

```markdown
> **SUPERSEDED**: 本ファイルは `docs/30-workflows/task-10-followup-001-opennext-esbuild-mismatch/` (Phase 1-13 構成) に展開されました。最新の仕様はそちらを参照してください。
```

## 各ファイルの記載要件

### `implementation-guide.md`

- Part 1: 中学生レベル説明。日常生活の例え、専門用語 5 件以上の言い換え、「なぜ必要か」先行を必須とする
- Part 2: 技術者向け説明。変更対象ファイル diff、設定値、コマンド、エラー時の復旧、ロールバックを含める
- 変更対象ファイル diff の要約
- 動作確認手順（`mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare`）
- ロールバック手順
- PR 本文に転記される内容

### `documentation-changelog.md`

- 上記 1-6 のドキュメント変更を一覧化

### `phase12-task-spec-compliance-check.md`

- task-specification-creator skill のフォーマット適合チェック
- Phase 1-13 全揃い、各 Phase の必須セクション網羅、index.md と Phase 整合

### `skill-feedback-report.md`

- 本タスクで気づいた skill 改善点（例: build toolchain 系タスクのテンプレート不足等）

### `system-spec-update-summary.md`

- aiworkflow-requirements への反映箇所（lessons-learned fragment、changelog、LOGS、indexes、task-workflow-active、artifact inventory）

### `unassigned-task-detection.md`

- 本タスク実行中に発見した派生未タスクの一覧
- 既知候補: task-10-followup-002（visual evidence、本タスク完了後に着手可）

## 完了条件 (Phase 12 close-out gate)

- [ ] `outputs/phase-12/` に 7 ファイルが揃っている
- [ ] `scripts/cf.sh` ヘッダに esbuild 単一化方針が追記されている
- [ ] `docs/00-getting-started-manual/cloudflare-cli-troubleshooting.md` に該当 section が存在する
- [ ] aiworkflow-requirements の lesson fragment / changelog / LOGS / indexes / task-workflow-active / artifact inventory が同一 wave で更新されている
- [ ] root `artifacts.json` と `outputs/artifacts.json` が `cmp -s` で一致している
- [ ] index.md と artifacts の状態が `implemented_local_evidence_captured` / `implementation_complete_pending_pr` に更新され、Phase 13 は `pending_user_approval` のまま維持されている
- [ ] supersede 関係が短縮版指示書に明記されている

## 成果物

- `outputs/phase-12/{main,implementation-guide,documentation-changelog,phase12-task-spec-compliance-check,skill-feedback-report,system-spec-update-summary,unassigned-task-detection}.md`

## 実行タスク

- strict 7 files を canonical filenames で生成する
- aiworkflow-requirements の lesson / changelog / LOGS / indexes / task-workflow-active / artifact inventory を同一 wave で同期する
- root `artifacts.json` と `outputs/artifacts.json` の同値を確認する
- supersede 元 unassigned task へ canonical root を明記する

## 参照資料

- 既存 Phase 12 構成例: `docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/outputs/phase-12/`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
