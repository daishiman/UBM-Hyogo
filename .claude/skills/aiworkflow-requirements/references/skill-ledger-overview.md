# Skill Ledger Overview — 4 施策の正本ガイド

> 最終更新日: 2026-04-28
> 出典: `docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-12/`
> 目的: `.claude/skills/<skill>/` 配下の append-only ledger / 自動生成 indexes / SKILL.md 入口について、4 worktree 並列開発時の merge conflict を構造的に防ぐ 4 施策（A-1 / A-2 / A-3 / B-1）の正本ルールと適用順序を集約する。

## 1. なぜこの設計が必要か

複数 worktree が同じ `LOGS.md` / `SKILL-changelog.md` / `lessons-learned-*.md` / `indexes/keywords.json` を末尾追記すると、append-only 規約のもとでも 3-way merge で同位置が衝突する。skill loader の入口である `SKILL.md` も 200 行を超えると、worktree 間で同じ行帯を編集して conflict が発生しやすい。

本設計は以下を満たすために 4 施策を組み合わせる:

- 派生物（自動再生成可能な ledger）は git tree から外す
- append-only 記録は 1 entry = 1 file の fragment に分割
- entry ファイル（SKILL.md）は 200 行未満に縮約し責務を `references/` へ
- fragment 化できない・移行猶予中の行独立 ledger には Git ビルトイン `merge=union` を保険として適用

## 2. 4 施策一覧

| ID | 施策 | 対象 | 衝突解消メカニズム |
| --- | --- | --- | --- |
| A-1 | 自動生成 ledger の `.gitignore` 化 | `indexes/keywords.json` / `index-meta.json` / `*.cache.json` / `LOGS.rendered.md` | git tree から外れるため衝突対象外 |
| A-2 | Changesets パターン fragment 化 | `LOGS.md` / `SKILL-changelog.md` / `lessons-learned-*.md` | 各 worktree が一意 path に新規作成 |
| A-3 | SKILL.md の Progressive Disclosure | 肥大化した skill 本体 entrypoint | 200 行未満の entry + `references/` 分割 |
| B-1 | `.gitattributes merge=union` | 行独立な append-only ledger（`_legacy.md` 含む） | 両 worktree の追記行を機械保存 |

## 3. 実装順序（必須遵守）

A-2 → A-1 → A-3 → B-1 の順序を厳守する。

| 順 | 施策 | 順序根拠 |
| --- | --- | --- |
| 1 | A-2 fragment 化 | render script と fragment 規約が他施策の前提。既存 `LOGS.md` を `_legacy.md` 退避してから、新規 fragment 受け入れ可能な状態を作る |
| 2 | A-1 gitignore 化 | A-2 で fragment 受け皿が出来た後に自動生成 ledger を ignore 化。先に ignore 化すると render script が参照できず破綻、`LOGS.md` を ignore に入れた瞬間に履歴が事実上失われる |
| 3 | A-3 SKILL.md 分割 | 単独で並列衝突しないため、A-2 / A-1 後に余裕を持って実施 |
| 4 | B-1 `.gitattributes` | fragment 化できない / 移行猶予中の legacy ledger に対する保険。最後に適用 |

## 4. 責務分離の入口（references の役割分担）

| reference | 責務 |
| --- | --- |
| `skill-ledger-overview.md`（本書） | 4 施策の概要・適用順・責務分離の入口。最初に読む |
| `skill-ledger-fragment-spec.md` | A-2 の命名規則 / front matter schema / `pnpm skill:logs:render` API |
| `skill-ledger-gitignore-policy.md` | A-1 の対象 glob / hook 冪等化 / 既 tracked 派生物の untrack 手順 |
| `skill-ledger-progressive-disclosure.md` | A-3 の SKILL.md 200 行ガード / 入口残置要素 / 既存 `spec-splitting-guidelines.md` との関係 |
| `skill-ledger-gitattributes-policy.md` | B-1 の `merge=union` 適用許可リスト / 禁止リスト |
| `lessons-learned-skill-ledger-redesign-2026-04.md` | 設計時に予見された苦戦箇所と教訓集約 |

## 5. 後方互換方針

- 既存 `LOGS.md` は `_legacy.md` として退避し**削除しない**
- A-2 移行後 30 日間（legacy include window）は `--include-legacy` 指定時のみ render に含める
- skill 利用者は外部 API の変更を受けない（render CLI のみ追加）
- A-3 分割後の SKILL.md には末尾に `references/` リンク表を必ず置き、外部から旧アンカー名で来た参照を誘導する

## 6. 集約 view の取得手段

```bash
# fragment + legacy をマージした集約 Markdown を生成
mise exec -- pnpm skill:logs:render --skill aiworkflow-requirements
mise exec -- pnpm skill:logs:render --skill aiworkflow-requirements --since 2026-04-01T00:00:00Z
mise exec -- pnpm skill:logs:render --skill aiworkflow-requirements --include-legacy
```

詳細仕様は `skill-ledger-fragment-spec.md` の §render API を参照。

## 7. 検証 / smoke の集約参照

| 検証 | 参照 |
| --- | --- |
| 単一 worktree 再生成で `git status` clean | A-1 / A-2 各 runbook の検証コマンド |
| 4 worktree 並列 merge で conflict 0 件 | `outputs/phase-4/parallel-commit-sim.md` |
| 手動 smoke | `outputs/phase-11/manual-smoke-log.md` |
| リンク健全性 | `outputs/phase-11/link-checklist.md` |
| evidence 保存先 | `outputs/phase-11/evidence/<run-id>/{a1,a2,a3,b1}/` |

## 8. ロールバック粒度

各施策は **1 PR = 1 施策** を原則とし、独立 revert を可能にする。

| 施策 | ロールバック手順 |
| --- | --- |
| A-1 | `.gitignore` の該当行を revert → `git add -f` で再追跡 |
| A-2 | `LOGS/` ディレクトリを削除し `_legacy.md` を `LOGS.md` に rename |
| A-3 | `references/` 分割を revert（git revert で 1 コミット粒度で戻す） |
| B-1 | `.gitattributes` の該当行を revert |

## 9. 関連タスクと canonical set

| 種別 | パス |
| --- | --- |
| 上流仕様 | `docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/` |
| Phase 12 サマリ | `outputs/phase-12/system-spec-update-summary.md` |
| Phase 12 実装ガイド | `outputs/phase-12/implementation-guide.md` |
| Phase 12 changelog | `outputs/phase-12/documentation-changelog.md` |
| Phase 12 skill feedback | `outputs/phase-12/skill-feedback-report.md` |
| 実装タスク A-1 | `docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a1-gitignore.md` |
| 実装タスク A-2 | `docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a2-fragment.md` |
| 実装タスク A-3 | `docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a3-progressive-disclosure.md` |
| 実装タスク B-1（原典スペック） | `docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-b1-gitattributes.md` |
| B-1 design workflow（Phase 1〜13） | `docs/30-workflows/skill-ledger-b1-gitattributes/` |
| B-1 実装未タスク | `docs/30-workflows/unassigned-task/task-skill-ledger-b1-gitattributes-implementation.md` |
| B-1 A-2 完了レビュー未タスク | `docs/30-workflows/unassigned-task/task-skill-ledger-b1-a2-completion-review.md` |
| B-1 skill feedback（Phase 11 NON_VISUAL テンプレ改善） | `docs/30-workflows/unassigned-task/task-phase11-nonvisual-evidence-template-sync.md` |

## 10. 不変条件（Phase 12 で凍結）

1. specs 配下に追記する場合は新規ファイル `docs/00-getting-started-manual/specs/skill-ledger.md` を使い、既存 specs 00〜13 は破壊的変更なし
2. `_legacy.md` は物理削除禁止（Phase 3 backward-compat 方針）
3. `merge=union` は **行独立 Markdown のみ** に限定。JSON / YAML / `SKILL.md` / lockfile への適用は禁止
4. fragment は **同一秒・同一 branch でも nonce で一意性を担保**
5. writer 経路で `LOGS.md` 直接追記は 0 件（CI で grep ガード）
