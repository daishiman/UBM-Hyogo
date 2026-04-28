# Phase 2 設計成果物: File Layout (AC-1)

A-1 / A-2 / A-3 / B-1 の対象パスと変更後形式を網羅。Phase 5–7 の実装ランブックが直接参照する。

## A-1: gitignore 化対象

| Before（追跡） | After（untrack） | 変更種別 | 根拠 |
| --- | --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | `.gitignore` 追加 + `git rm --cached` | 削除（追跡解除） | hook 自動再生成、構造体カウンタ |
| `.claude/skills/aiworkflow-requirements/indexes/index-meta.json` | `.gitignore` 追加 + `git rm --cached` | 削除 | 統計値、人手意味なし |
| `.claude/skills/*/EVALS.json` | `.gitignore` 追加 | 削除 | 評価結果スナップショット |
| `.claude/skills/*/LOGS.rendered.md`（A-2 派生物） | `.gitignore` 追加 | 新規無視 | render script の出力 |

`.gitignore` 追記イメージ:

```gitignore
# skill 派生物（hook / script で再生成）
.claude/skills/*/indexes/keywords.json
.claude/skills/*/indexes/index-meta.json
.claude/skills/*/EVALS.json
.claude/skills/*/LOGS.rendered.md
```

hook ガード方針: `[[ -f <path> ]] || regenerate` 形式で、untracked でも初回起動時に必ず生成する。

## A-2: fragment 化対象

| Before | After | 変更種別 |
| --- | --- | --- |
| `.claude/skills/<skill>/LOGS.md`（単一 append-only） | `.claude/skills/<skill>/LOGS/<YYYYMMDD-HHMMSS>-<escaped-branch>-<nonce>.md` | 移動 + 分割 |
| `.claude/skills/task-specification-creator/SKILL-changelog.md` | `.claude/skills/task-specification-creator/changelog/<semver>.md` | 移動 + 分割 |
| `.claude/skills/<skill>/lessons-learned-*.md`（将来） | `.claude/skills/<skill>/lessons-learned/<YYYYMMDD>-<topic>.md` | 新規ディレクトリ |
| 既存 `LOGS.md` history | `.claude/skills/<skill>/LOGS/_legacy.md` | 退避（Phase 3 backward-compat 推奨案） |

## A-3: SKILL.md Progressive Disclosure

対象: `.claude/skills/task-specification-creator/SKILL.md`（511 行）, `.claude/skills/aiworkflow-requirements/SKILL.md`（190 行）。

```
SKILL.md（≤ 200 行、index のみ）
└── references/
    ├── usage.md          # 使用方法・典型フロー
    ├── triggers.md       # 起動条件
    ├── integration.md    # 他 skill / hook 連携
    ├── glossary.md       # 用語集
    └── <topic>.md        # 必要に応じ追加
```

511 行版（task-specification-creator）の分割案（概算）:

| section | 抽出先 | 推定行数 |
| --- | --- | --- |
| Anchors / 概要 | SKILL.md（残置） | ~30 |
| 使用方法 | references/usage.md | ~120 |
| Phase テンプレ説明 | references/phase-templates.md | ~150 |
| 統合連携 | references/integration.md | ~80 |
| トラブルシューティング | references/troubleshooting.md | ~80 |
| index / TOC | SKILL.md | ~50 |

→ 残置 SKILL.md は約 80 行（200 行未満を満たす）。

## B-1: `.gitattributes` 配置

リポジトリルート `.gitattributes` に追記（`apps/` 以下の既存設定とは独立セクション）:

```gitattributes
# skill ledger - 行独立 Markdown のみ merge=union（A-2 移行までの暫定）
.claude/skills/**/LOGS.md             merge=union
.claude/skills/**/lessons-learned-*.md merge=union
```

## 変更種別サマリー

| 種別 | 件数 | 例 |
| --- | --- | --- |
| 追加 | 多数 | fragment ファイル群、`references/*.md` |
| 更新 | 3 | `.gitignore` / `.gitattributes` / `SKILL.md`（slim 化） |
| 削除（追跡解除） | 4+ | `keywords.json` / `index-meta.json` 等 |
| 移動 | 3 系統 | `LOGS.md` / `SKILL-changelog.md` / `lessons-learned-*.md` |

## AC-1 充足根拠

- すべての施策に対し対象 path と after 形式が表で明記されている
- glob パターン（`.claude/skills/*/indexes/*.json` 等）で曖昧性なし
- 変更種別（追加/更新/削除/移動）が cell ごとに識別可能
