# Phase 6: 関数シグネチャ・rename 実行スクリプト擬似コード

## 目的

132 ファイル rename と 4 種 config 同期を、**新規スクリプト追加なし**で `git mv` + 既存ツールだけで完遂するための手順擬似コードを確定する。Phase 5 の RenameMappingCSV と AST 差分をそのまま流すことで、レビュー時に「内容に手を入れていない」ことが diff で自明になることを優先する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 |
| taskType | implementation |
| implementation_mode | refactor-rename-only |
| visualEvidence | NON_VISUAL |
| state | implementation_completed |

## 1. 補助スクリプトを新規作成しない方針

本タスクでは **`scripts/` 配下に新規ファイルを追加しない**。理由:

1. rename は `git mv` 132 回（Phase 5 の CSV を機械的に実行するだけ）。スクリプト化しても 1 行ループで済むため、専用ツールを残す価値が薄い。
2. スクリプトを残すと「内容も触ったのではないか」というレビュー疑義を呼びやすく、本タスクの本質である「diff 0 を視覚的に保証」を弱める。
3. 1 PR 完結タスクなので、CSV (`outputs/phase-11/rename-mapping.csv`) を evidence として保存し、再現は Phase 11 のコマンドログで足りる。

正規経路は **bash one-liner + 既存 `git` / `find` / `rg` / `mise` / `pnpm` のみ**で構成する。

## 2. rename 実行 擬似コード（bash）

### 2.1 事前 evidence 取得（rename 前）

```bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

EV_DIR="docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-11"
mkdir -p "$EV_DIR"

# A. test 件数 snapshot (vitest reporter)
mise exec -- pnpm --filter @ubm-hyogo/api test --reporter=verbose 2>&1 \
  | tee "$EV_DIR/test-count-before.txt"

# B. find ベースの physical 件数
find apps/api/src -name '*.test.ts' | sort > "$EV_DIR/find-test-before.txt"
find apps/api/src -name '*.spec.ts' | sort > "$EV_DIR/find-spec-before.txt"
echo "test=$(wc -l < "$EV_DIR/find-test-before.txt") spec=$(wc -l < "$EV_DIR/find-spec-before.txt")" \
  > "$EV_DIR/find-count-before.txt"
# 期待: test=132 spec=0
```

### 2.2 rename mapping CSV を流す

`outputs/phase-11/rename-mapping.csv` は Phase 2 で凍結済みである前提。`git mv` を alphabetical に 132 回実行する。

```bash
# CSV: header = old_path,new_path,suffix_class,justification
while IFS=, read -r old new cls jus; do
  # ヘッダ行スキップ
  [ "$old" = "old_path" ] && continue
  # クォート対応（justification が " で囲まれている場合は trim）
  [ -z "$old" ] && continue
  git mv "$old" "$new"
done < "$EV_DIR/rename-mapping.csv"
```

### 2.3 件数 assert（rename 後）

```bash
test "$(find apps/api/src -name '*.test.ts' | wc -l | tr -d ' ')" = "0" \
  || { echo "FAIL: *.test.ts が残存"; exit 1; }
test "$(find apps/api/src \( -name '*.test.ts' -o -name '*.spec.ts' \) | wc -l | tr -d ' ')" = "132" \
  || { echo "FAIL: 合計件数 != 132"; exit 1; }

# 4 分類別件数
contract=$(find apps/api/src -name '*.contract.spec.ts' | wc -l | tr -d ' ')
authz=$(find apps/api/src -name '*.authz.spec.ts' | wc -l | tr -d ' ')
repo=$(find apps/api/src -name '*.repository.spec.ts' | wc -l | tr -d ' ')
# unit は spec.ts から上記 3 種を除いた残り
all_spec=$(find apps/api/src -name '*.spec.ts' | wc -l | tr -d ' ')
unit=$((all_spec - contract - authz - repo))
echo "contract=$contract authz=$authz repository=$repo unit=$unit"
test "$contract" = "41" || exit 1
test "$authz"    = "4"  || exit 1
test "$repo"     = "38" || exit 1
test "$unit"     = "49" || exit 1
```

### 2.4 内容 diff 0 検証

```bash
# rename だけ抽出して content diff が 0 行であること
git diff --diff-filter=R --stat HEAD | tee "$EV_DIR/rename-diff-stat.txt"
# ↑ 各行 "{old => new} | 0" になることを目視 + grep
git diff --diff-filter=R --numstat HEAD \
  | awk '{ if ($1 != "0" || $2 != "0") { print "MUTATED:" $0; exit 1 } }'
```

### 2.5 rename commit

```bash
git add -A
git commit -m "refactor(api): rename *.test.ts to suffix-classified *.spec.ts (Refs #325)

132 files renamed via git mv only. No content changes.
- contract: 41
- authz: 4
- repository: 38
- unit: 49

Refs #325"
```

## 3. config 同期手順（Phase 5 §5 擬似 diff の実適用）

### 3.1 vitest.config.ts (root)

Phase 5 §4.1 の AST 差分を適用する。`apps/api/**/src/**/*.spec.{ts,tsx}` を独立行として明示。`apps/web` / `packages` / `scripts` 行は **scope out** に従い `*.test.{ts,tsx}` のまま据え置く。

### 3.2 apps/api/package.json

`scripts.test` は glob 直書きなしのため変更なし（Phase 5 §4.2 で確定）。

### 3.3 lefthook.yml

`coverage-guard.sh --changed` 内部の test path フィルタを grep で確認し、`*.test.ts` リテラルがあれば `*.{test,spec}.ts` に編集する。**このスクリプトは既存ファイルのため新規作成ではない**ことに注意。

### 3.4 .github/workflows/*.yml

```bash
rg -n "\\.test\\.ts" .github/workflows/ > "$EV_DIR/workflow-grep-before.txt" || true
```

ヒットがあれば該当箇所を `*.{test,spec}.ts` に編集。なければ「変更不要」を evidence に記録。

### 3.5 config 同期 commit

```bash
git add vitest.config.ts lefthook.yml .github/workflows/ scripts/coverage-guard.sh 2>/dev/null || true
git commit -m "chore(test): sync test glob to *.spec.ts for apps/api (Refs #325)

Update vitest include for apps/api to *.spec.ts only.
Other workspaces (apps/web, packages, scripts) keep {test,spec} dual-glob
until their own rename PRs land.

Refs #325"
```

## 4. ADR commit

```bash
# outputs/phase-12/test-file-suffix-adr.md は Phase 12 工程で生成
git add docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md
git commit -m "docs(test): add test file suffix ADR for apps/api (Refs #325)

Document the 4-class suffix policy (contract/authz/repository/unit)
introduced in 08a and physically applied in this cycle.

Refs #325"
```

## 5. rename 後 検証手順

```bash
# typecheck / lint / test
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test --reporter=verbose 2>&1 \
  | tee "$EV_DIR/test-count-after.txt"

# reporter 出力の Test Files / Tests 行を before/after で diff
diff <(grep -E "^Test Files|^ *Tests" "$EV_DIR/test-count-before.txt") \
     <(grep -E "^Test Files|^ *Tests" "$EV_DIR/test-count-after.txt") \
  | tee "$EV_DIR/test-count-delta.txt"
# 期待: empty diff（テストファイル数・テスト件数とも一致）

# glob coverage grep
rg -n "\\.test\\.ts" vitest.config.ts apps/api/package.json package.json lefthook.yml .github/workflows/ \
  > "$EV_DIR/glob-coverage-grep.log" || true
# 期待: コメント / 他 workspace 行のみがマッチ。apps/api 行のヒットゼロ
```

## 6. commit 戦略まとめ（3 commit 固定）

| # | commit | 含むファイル | 検証 gate |
| --- | --- | --- | --- |
| 1 | `refactor(api): rename *.test.ts to suffix-classified *.spec.ts (Refs #325)` | `git mv` 132 件のみ | numstat 全行 `0\t0` |
| 2 | `chore(test): sync test glob to *.spec.ts for apps/api (Refs #325)` | vitest / workflow / coverage-guard 等 | rg `.test.ts` の apps/api 関連ヒットゼロ |
| 3 | `docs(test): add test file suffix ADR for apps/api (Refs #325)` | `outputs/phase-12/test-file-suffix-adr.md` + 他 phase-12 evidence | ファイル存在 |

> Phase 11 evidence (`outputs/phase-11/main.md` 等) は ADR commit 内に同梱する。第 4 commit は作らない。

## 7. hook bypass 不変条件

- 上記 3 commit すべてで **`--no-verify` を使わない**
- pre-commit `staged-task-dir-guard` が 132 ファイル rename を block する場合は **hook 側を改善**する（CLAUDE.md 「個人開発ポリシー」セクションに従い、必要なら `MERGE_HEAD` 相当の bypass 条件を hook に追加）
- pre-push `coverage-guard` は内容変更ゼロのため coverage delta=0 で pass する想定。fail する場合は coverage-guard の glob が新 suffix に追従していないバグ → §3.3 で同期済みであることを再確認

## 完了条件チェック

- [ ] 補助スクリプトを新規作成しない方針を明記
- [ ] rename 実行 bash 擬似コードを §2 に確定
- [ ] 件数 assert（132 / 41 / 4 / 38 / 49）を組み込み
- [ ] 内容 diff 0 検証（`--numstat` 全行 0 0）を組み込み
- [ ] config 同期手順を §3 に確定
- [ ] commit 戦略 3 commit を §6 に確定
- [ ] hook bypass 禁止を §7 に明記

## 出力

- `phase-06.md`

## 参照資料

- `index.md`
- `phase-05.md`（データモデル / 擬似 diff）
- `phase-04.md`（I/O 契約）
- CLAUDE.md「sync-merge 時の hook 挙動」セクション

## 統合テスト連携

- Phase 9 で §5 の検証手順を CI 必須 step として再定義する
- Phase 11 で §2.1 / §2.3 / §5 の出力を evidence として保存する

## 依存Phase参照

Phase 1 / Phase 2 / Phase 3 / Phase 4 / Phase 5 の成果物を上流契約として参照する。
