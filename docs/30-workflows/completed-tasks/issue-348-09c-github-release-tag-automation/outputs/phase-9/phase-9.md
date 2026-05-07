# Phase 9 正本: SSOT 反映仕様

## メタ情報
| 項目 | 値 |
| --- | --- |
| Phase | 9 / 13 |
| 実装区分 | 実装仕様書 |
| 対象 | `.claude/skills/aiworkflow-requirements/references/release-runbook.md` / `.claude/skills/aiworkflow-requirements/indexes/keywords.json` |

## 目的
GitHub Release 作成導線を aiworkflow-requirements skill の SSOT に反映し、`indexes:rebuild` で keywords index に新規キーワードを登録する。CI の `verify-indexes-up-to-date` gate に drift がない状態を担保する。

## Step 0: P50 チェック（必須）
- [ ] `test -d .claude/skills/aiworkflow-requirements/references` 存在
- [ ] `test -f .claude/skills/aiworkflow-requirements/indexes/keywords.json` 存在
- [ ] `which jq` 成功（keywords.json 検証用）
- [ ] log: `ls -la .claude/skills/aiworkflow-requirements/{references,indexes} 2>&1 | tee outputs/phase-9/p50-precheck.log`

## 9-A. `release-runbook.md` 追記内容

既存ならば該当 section を編集、無ければ新規作成。以下の項目を含める:

| 見出し | 内容 |
| --- | --- |
| `## GitHub Release 自動作成導線` | 09c production deploy → tag push → `release-create.yml` 起動 → `gh release create` の流れを 1 段落で記述 |
| `### 入口` | tag push (`vYYYYMMDD-HHMM`) または `workflow_dispatch` |
| `### 実装` | `scripts/release/generate-release-notes.sh` / `scripts/release/create-github-release.sh` / `release-notes.template.md` |
| `### Manual fallback` | `docs/runbooks/release-create.md` への相対 link |
| `### Consumed trace` | `docs/30-workflows/unassigned-task/task-09c-github-release-tag-automation-001.md` を consumed として明記 |
| `### 親タスク` | `task-09c-github-release-tag-automation-001` |

## 9-B. `indexes/keywords.json` 追加キーワード

以下 3 件を `release-runbook` ref に紐付けて追加する:

```
"GitHub Release 作成"
"release-create.yml"
"release note template"
```

仕様（実コード未反映）:

| key | mapped reference |
| --- | --- |
| `GitHub Release 作成` | `references/release-runbook.md` |
| `release-create.yml` | `references/release-runbook.md` |
| `release note template` | `references/release-runbook.md` |

> 既存キーが衝突した場合は配列に追記し、上書きしない（progressive disclosure 原則を維持）。

## 9-C. indexes 再生成手順

```bash
mise exec -- pnpm indexes:rebuild \
  2>&1 | tee outputs/phase-9/indexes-rebuild.log
```

期待:
- `.claude/skills/aiworkflow-requirements/indexes/` 配下が更新される
- `git diff .claude/skills/aiworkflow-requirements/indexes` で keywords.json と派生 index に追加分のみ差分が出る
- 不要な行ソート差分・順序入替が出ないこと（決定論性）

## 9-D. CI gate 担保

`.github/workflows/verify-indexes.yml` の `verify-indexes-up-to-date` job が以下で fail しないこと:

```bash
mise exec -- pnpm indexes:rebuild
git diff --exit-code .claude/skills/aiworkflow-requirements/indexes
```

`diff` が空（exit 0）であれば drift なし。差分があれば本 Phase に戻り再 commit する。

## 9-E. 検証コマンド（spec 確認用）

```bash
jq '.["GitHub Release 作成"]' .claude/skills/aiworkflow-requirements/indexes/keywords.json \
  | tee outputs/phase-9/keyword-check.log
```

期待: `release-runbook` を含む参照配列が返る。

## 動作確認チェックリスト
- [ ] release-runbook.md の 6 見出し確定
- [ ] 追加キーワード 3 件確定
- [ ] `pnpm indexes:rebuild` 実行手順確定
- [ ] `verify-indexes-up-to-date` gate clean 条件確定
- [ ] consumed trace (`unassigned-task/...`) リンク確定

## 次 Phase の前提条件
Phase 10（単体テスト）で bats / actionlint が緑となること。SSOT 追記内容は本 Phase 確定値を Phase 12 implementation guide で再参照する。
