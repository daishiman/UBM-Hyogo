# Phase 05: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-skill-ledger-a2-fragment |
| Phase | 5 |
| タスク種別 | implementation（refactoring） |
| visualEvidence | NON_VISUAL |
| workflow | implementation |

## 目的

Phase 4 で固定した TDD Red を Green に変える実装手順を、**順序を厳守**して `outputs/phase-5/runbook.md` に書き起こす。実装順序を間違えると render できない期間が生じるため、ガード条件を Step ごとに明記する。

## 実行タスク

- 以下の順序を `outputs/phase-5/runbook.md` に転記し、各 step のガード条件を満たした場合のみ次 step へ進む。
- Phase 4 `outputs/phase-4/test-matrix.md` の C-1 〜 C-16 と照合し、各 step で Green 化するテスト範囲を明記する。
- Phase 13 まで実コミットを保留する前提で、commit message は参考形式としてのみ記録する。

## 実装順序（厳守）

### Step 1: fragment 受け皿作成

- 新規作成ファイル
  - `.claude/skills/aiworkflow-requirements/LOGS/.gitkeep`
  - `.claude/skills/task-specification-creator/LOGS/.gitkeep`
  - `.claude/skills/task-specification-creator/changelog/.gitkeep`
  - `.claude/skills/<skill>/lessons-learned/.gitkeep`（対象 skill 別）
- `git status` で `.gitkeep` が tracked であることを確認。
- 命名 regex 定数を `scripts/skill-logs-render.ts` に**先置き**（実装は Step 3）。
- ガード: `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` が緑であること。

### Step 2: legacy 退避（1 commit に集約）

- 新規作成ファイル: なし
- 修正ファイル（`git mv`）
  - `.claude/skills/aiworkflow-requirements/LOGS.md` → `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md`
  - task-specification-creator の SKILL changelog → changelog legacy fragment
  - `.claude/skills/<skill>/lessons-learned-<base>.md` → `.claude/skills/<skill>/lessons-learned/_legacy-<base>.md`
- 1 commit メッセージ（実コミットは Phase 13 まで保留・参考形式）: `refactor(skill): move ledgers to fragment dir as _legacy (A-2)`
- ガード: `git log --follow .claude/skills/aiworkflow-requirements/LOGS/_legacy.md` で旧履歴連続性を確認。

### Step 3: render script 実装

- 新規作成ファイル
  - `scripts/skill-logs-render.ts`
  - `scripts/skill-logs-render.test.ts`
- 修正ファイル
  - `package.json`：`"skill:logs:render": "tsx scripts/skill-logs-render.ts"`
- 実装内容
  1. `RenderSkillLogsOptions` 型定義
  2. `renderSkillLogs(options)` の本体（readdir → front matter parse → timestamp 降順 sort → since filter → 出力）
  3. front matter 必須項目欠損 → 対象 path を stderr 出力 + `process.exit(1)`
  4. `--out` が tracked canonical ledger（`LOGS.md` 等）を指す → `process.exit(2)`
  5. `--include-legacy` 指定時のみ window 内 `_legacy*.md` を末尾連結
  6. legacy 擬似 timestamp 抽出層（mtime fallback + 本文末尾 entry 日付 heuristic）
- ガード: Phase 4 C-4 〜 C-12 が Green。

### Step 4: append helper 切替（最終 step）

- 新規作成ファイル
  - `scripts/skill-logs-append.ts`（共通 helper）
  - `scripts/skill-logs-append.test.ts`
- 修正ファイル
  - 既存 writer / hook / shell の append 箇所すべて（`git grep -n 'LOGS\.md\|SKILL-changelog\.md' .claude/skills/` で全列挙したもの）
  - `package.json`：`"skill:logs:append": "tsx scripts/skill-logs-append.ts"`
- 実装内容
  1. `ts=$(date -u +%Y%m%d-%H%M%S)` / `branch_esc=...` / `nonce=$(openssl rand -hex 4)` で path 生成
  2. 事前存在チェック → 衝突時 nonce 再生成（最大 3 回）
  3. front matter（`timestamp` / `branch` / `author` / `type`）を YAML として書き込み
  4. CI guard 用に `git grep -n 'LOGS\.md\|SKILL-changelog\.md' .claude/skills/` の writer ヒット 0 件を expected fail テスト化
- ガード: Phase 4 C-1 〜 C-3 / C-13 / C-14 が Green。

## 実装計画ファイルパス一覧（FB-RT-03 対応）

| 種別 | パス |
| ---- | ---- |
| 新規作成 | `scripts/skill-logs-render.ts` |
| 新規作成 | `scripts/skill-logs-render.test.ts` |
| 新規作成 | `scripts/skill-logs-append.ts` |
| 新規作成 | `scripts/skill-logs-append.test.ts` |
| 新規作成 | `.claude/skills/aiworkflow-requirements/LOGS/.gitkeep` |
| 新規作成 | `.claude/skills/task-specification-creator/LOGS/.gitkeep` |
| 新規作成 | `.claude/skills/task-specification-creator/changelog/.gitkeep` |
| rename | `LOGS.md` → `LOGS/_legacy.md`（対象 skill 全件） |
| rename | `SKILL-changelog.md` → `changelog/_legacy.md`（対象 skill 全件） |
| 修正 | `package.json`（scripts 追加） |
| 修正 | 既存 writer / hook / shell の `LOGS.md` 直接追記箇所 |

## 参照資料

- Phase 2 `outputs/phase-2/fragment-schema.md` / `render-api.md`
- Phase 4 `outputs/phase-4/test-matrix.md`
- 既存仕様書 §3.4 推奨アプローチ（実装順序の根拠）

## 成果物

- `outputs/phase-5/main.md`（実装サマリー・新規 / 修正 ファイル一覧）
- `outputs/phase-5/runbook.md`（Step 1〜4 の手順とガード条件）

## 統合テスト連携

Step 3 完了後に Phase 4 C-4 〜 C-12 を Green 化、Step 4 完了後に C-1 〜 C-3 / C-13 / C-14 を Green 化。

## 完了条件

- [ ] Step 1〜4 の順序とガード条件が runbook.md に記載されている。
- [ ] 新規 / 修正 / rename ファイルの全パスが列挙されている（FB-RT-03）。
- [ ] writer 切替を Step 4（最終）に置く理由が明記されている。
- [ ] append helper の nonce retry 上限 3 回が明記されている。
- [ ] artifacts.json の Phase 5 status と整合。
- [ ] 実コミットは Phase 13 まで保留する旨が明記されている。
