# Phase 8: ドキュメント追従（CLAUDE.md / ADR / skill changelog）

[実装区分: 実装仕様書]

> **実装区分判定根拠**: `CLAUDE.md` への 1 行追記、親 issue-325 の ADR `test-file-suffix-adr.md` への履歴 append、skill changelog の追記を行う。仕様文書だけでなく実体ファイルへの書き込みを伴うため実装仕様書。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | vitest.config の test/spec 二段階対応を spec 単一に収斂 (issue-623) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | ドキュメント追従 |
| 作成日 | 2026-05-12 |
| 担当 | delivery |
| 前 Phase | 7 (GitHub Actions verify-test-suffix) |
| 次 Phase | 9 (セキュリティ確認) |
| 状態 | spec_created |

## 目的

Phase 4-7 で導入した「`*.spec.{ts,tsx}` 単一収斂」と「再混入 block CI gate 二層」を、人間 / AI agent 双方が参照する正本ドキュメント群へ反映する。具体的な追記対象:

1. `CLAUDE.md`: 「重要な不変条件」セクションへの 1 行追加
2. 親 #325 の ADR `test-file-suffix-adr.md`: 「2026-05-12 update (issue-623)」セクション追記
3. skill changelog（`task-specification-creator` / `aiworkflow-requirements`）: 追記
4. （必要時）`.claude/skills/aiworkflow-requirements/references/testing.md`: 命名規約の更新

> 本 Phase はドキュメント追記のみで、`vitest.config.ts` / `lefthook.yml` / GitHub Actions workflow / rename 済みファイル群は変更しない（Phase 4-7 の責務）。

## 変更対象ファイル一覧（CONST_005）

| 変更種別 | パス | 内容 |
| --- | --- | --- |
| 編集 | `CLAUDE.md` | 「重要な不変条件」セクションに 1 行追記 |
| 編集 | `docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md` | 履歴セクション末尾に「2026-05-12 update (issue-623)」を append |
| 編集（存在時） | `.claude/skills/task-specification-creator/SKILL-changelog.md` | 1 行追記 |
| 編集（存在時） | `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` | 1 行追記 |
| 編集（任意） | `.claude/skills/aiworkflow-requirements/references/testing.md` | 命名規約セクション存在時のみ更新 |

## CLAUDE.md 1 行追記の具体案

### 追記先

`CLAUDE.md` の「## 重要な不変条件」セクション。現状 7 番まで番号が振られている前提で、末尾に 8 番を追加する。

### 追記内容（before / after）

#### before（該当末尾）

```markdown
7. MVP では Google Form 再回答を本人更新の正式な経路とする
```

#### after

```markdown
7. MVP では Google Form 再回答を本人更新の正式な経路とする
8. 新規テストファイルは `*.spec.{ts,tsx}` のみ許可。`*.test.ts(x)` は `block-test-suffix` (lefthook pre-commit) と `verify-test-suffix` (GitHub Actions) で reject される
```

### 追記ルール

- 既存番号の振り直しは行わない（最終番号 + 1 で append）
- 1 行で完結（行内 `<br>` 等は使わない）
- バッククォートで suffix とコマンド名を装飾
- 既存 1〜7 の改行スタイル（行末改行のみ、空行なし）を踏襲

## ADR 追記の具体案

### 追記先

`docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md` の末尾に append。既存に `## 履歴` セクションがあればその配下、なければ新規セクション。

### 追記内容

```markdown

## 2026-05-12 update (issue-623)

issue-325 で確立した「`*.spec.{ts,tsx}` 統一」を、リポジトリ全体で完全収斂させた。

### 完了事項

- 二段階対応（`*.{test,spec}` 並存）を終了
- `vitest.config.ts` の `test.include` を `*.spec.{ts,tsx}` 単一に収斂
- `vitest.config.ts` の `coverage.exclude` から `**/*.test.{ts,tsx}` 行を削除
- 159 件の `*.test.ts(x)` を `git mv` で `*.spec.ts(x)` に rename（履歴保持）
  - apps/web 83 / apps/api 6 / packages/shared 17 / packages/integrations 11 / scripts 35 / .claude/skills 7

### 再混入防止 CI gate

- lefthook `pre-commit` command: `block-test-suffix`（`scripts/hooks/block-test-suffix.sh`）
- GitHub Actions: `.github/workflows/verify-test-suffix.yml`（push: main, dev / pull_request: main, dev）

### 関連

- 作業仕様: `docs/30-workflows/issue-623-vitest-spec-suffix-convergence/`
- 原典: `docs/30-workflows/completed-tasks/task-issue-325-followup-003-vitest-spec-suffix-convergence.md`（Phase 12 で consumed）
```

### 追記ルール

- 既存 ADR 本体は変更しない（履歴 append のみ）
- 末尾の `\n` を 1 行確保
- 章番号を再採番しない

## skill changelog 追記の具体案

### `.claude/skills/task-specification-creator/SKILL-changelog.md`

存在する場合のみ、末尾に 1 行（または 1 段落）追記:

```markdown

## 2026-05-12 (issue-623)

- test 命名規約を `*.spec.{ts,tsx}` 単一に収斂（issue-325 二段階対応の終結）
- 新規 `*.test.ts(x)` 追加は `block-test-suffix` pre-commit と `verify-test-suffix` GitHub Actions で reject される
```

### `.claude/skills/aiworkflow-requirements/SKILL-changelog.md`

存在する場合のみ、同等の内容で追記。indexes 再生成が Phase 4 (T-08) で実施済みのため、本 Phase では changelog のみ更新。

### 存在しない場合の挙動

- 該当 `SKILL-changelog.md` が存在しない skill には新規作成しない（過剰な documentation を避ける）
- Phase 12 evidence に「該当ファイルなしのため skip」を記録

## references/testing.md 更新（任意）

`.claude/skills/aiworkflow-requirements/references/testing.md` が存在し、test suffix に関する記述がある場合のみ:

- `*.test.ts(x)` / `*.{test,spec}` を含む箇所を `*.spec.{ts,tsx}` 単一表記へ書き換え
- 「新規 `*.test.ts(x)` は CI gate で reject」の 1 行を追加

存在しない場合は本作業はスキップ。

## 副作用

- ドキュメントのみの追記で、ビルド成果物・テスト挙動・CI gate 動作には影響なし
- ADR 追記により親 #325 の Phase 12 outputs に最新版が記録される
- skill changelog 追記は indexes drift を発生させない（changelog は indexes 対象外想定）が、念のため Phase 12 で `pnpm indexes:rebuild` を再実行し drift 0 を確認する

## エラーハンドリング

- ADR ファイルが存在しない場合: Phase 4-7 で得られた事実関係を `outputs/phase-08/adr-snapshot.md` に保存し、Phase 12 evidence で警告として記録（本 Phase は失敗扱いとせず警告止め）
- CLAUDE.md の現行不変条件番号が 7 でない場合: 末尾番号 + 1 を採番し直す
- skill CHANGELOG が見つからない場合: skip 記録

## テスト方針

| 観点 | コマンド | 期待 |
| --- | --- | --- |
| CLAUDE.md 追記反映 | `grep -nE 'spec\.\{ts,tsx\}.*block-test-suffix' CLAUDE.md` | 1 hit |
| ADR 追記反映 | `grep -n 'issue-623' docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md` | 1 件以上 |
| skill changelog 反映 | `grep -rn '2026-05-12.*issue-623' .claude/skills/*/SKILL-changelog.md \|\| true` | 0 or N hit（存在時のみ） |
| 不変条件番号連番 | `grep -nE '^[0-9]+\.' CLAUDE.md \| sed -n '/重要な不変条件/,/##/p'` | 番号が連続 |
| markdown lint | `mise exec -- pnpm exec markdownlint <changed files> \|\| true` | エラーなし |

## ローカル実行・検証コマンド

```bash
# 1. CLAUDE.md 編集（Edit ツールで該当箇所に 1 行追記）
grep -nE '^[0-9]+\.' CLAUDE.md | head -10  # 現行番号確認

# 2. ADR 追記
grep -c 'issue-623' docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md

# 3. skill CHANGELOG（存在チェック → 追記）
for f in .claude/skills/task-specification-creator/SKILL-changelog.md \
         .claude/skills/aiworkflow-requirements/SKILL-changelog.md; do
  if [[ -f "$f" ]]; then
    echo "found: $f"
  else
    echo "skip: $f"
  fi
done

# 4. references/testing.md（任意）
if [[ -f .claude/skills/aiworkflow-requirements/references/testing.md ]]; then
  grep -n '\.test\.' .claude/skills/aiworkflow-requirements/references/testing.md || echo "no test mention"
fi

# 5. indexes drift 再確認
mise exec -- pnpm indexes:rebuild
git diff --exit-code .claude/skills/aiworkflow-requirements/indexes

# 6. commit（粒度: ADR / CLAUDE.md / skill を分けるか単一かは Phase 12 方針で確定）
git add CLAUDE.md
git commit -m "docs: forbid *.test suffix in CLAUDE.md"

git add docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md
git commit -m "docs(adr): record test suffix convergence (issue-623)"

git add .claude/skills/*/SKILL-changelog.md
git commit -m "docs(skills): record suffix convergence in changelog"
```

## DoD（Phase 8 完了基準）

- [ ] `CLAUDE.md` に「`*.spec.{ts,tsx}` のみ許可」1 行が追加されている（AC-8）
- [ ] ADR `test-file-suffix-adr.md` に「2026-05-12 update (issue-623)」が append されている（AC-8）
- [ ] `.claude/skills/*/SKILL-changelog.md` が存在する場合は追記済み、なければ skip 記録
- [ ] `references/testing.md` が存在し test suffix に言及している場合は更新済み
- [ ] indexes drift が 0
- [ ] 3 コミット（CLAUDE.md / ADR / skill）またはまとめた粒度で完了
- [ ] Phase 4-7 で導入したコード成果物には触れていない

## aiworkflow-requirements 参照セクション

| 参照対象 | 用途 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/testing.md` | 命名規約更新の対象（存在時） |
| `.claude/skills/aiworkflow-requirements/indexes/` | changelog 編集後の drift 再確認対象 |
| `.claude/skills/task-specification-creator/references/spec-update-workflow.md` | Phase 12 同期手順との整合 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | CLAUDE.md | 追記対象 |
| 必須 | docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md | ADR 追記対象 |
| 必須 | docs/30-workflows/issue-623-vitest-spec-suffix-convergence/phase-02.md | D-5 追記方針 |
| 参考 | .claude/skills/task-specification-creator/SKILL-changelog.md | skill changelog 形式 |
| 参考 | .claude/skills/aiworkflow-requirements/SKILL-changelog.md | skill changelog 形式 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | CLAUDE.md | 不変条件 8 番を追加した状態 |
| ドキュメント | docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md | issue-623 update セクション追記版 |
| ドキュメント（存在時） | .claude/skills/task-specification-creator/SKILL-changelog.md | 1 段落追記版 |
| ドキュメント（存在時） | .claude/skills/aiworkflow-requirements/SKILL-changelog.md | 1 段落追記版 |
| ドキュメント | outputs/phase-08/doc-update-log.md | 各ファイルへの追記 diff サマリ |

## 次 Phase

- 次: 9 (セキュリティ確認)
- 引き継ぎ事項: ドキュメント追記完了状態、skill changelog 存在/非存在の確定、references/testing.md 編集有無
- ブロック条件: AC-8 関連の追記が未完了、または indexes drift が残った状態では Phase 9 に進まない

## 実行タスク

- T-14〜T-16 を実行し、CLAUDE.md / ADR / skill changelog を更新する。

## 完了条件

- AC-8 の追記先が実在ファイルへ反映されている。

## 統合テスト連携

- Phase 11 AC-8 evidence と Phase 12 documentation changelog に接続する。
