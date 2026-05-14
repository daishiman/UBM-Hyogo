# Phase 2: 既存実装調査 / fixed list 凍結 / 命名衝突調査

## 目的

`apps/web/**/*.test.ts(x)` 70 ファイル全件を 5 種suffix 分類に振り分けた **fixed list を凍結** する。同時に既存 glob inventory（`apps/web/package.json:19` / `vitest.config.ts` / `lefthook.yml` / `.github/workflows/*.yml`）を全件抽出し、rename 後パスの命名衝突調査を行う。本 Phase の出力をもって Phase 3 設計の入力を確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | completed |

## 実行タスク

| Task | 内容 |
| --- | --- |
| 2-1 | 70 ファイル全件を 5 分類（component / route / page / runtime / lib-unit）に振り分け fixed list を確定する |
| 2-2 | 既存 glob inventory を `rg` / `grep` で全件抽出し列挙する |
| 2-3 | rename 後パスと既存ファイルの命名衝突を `find` で確認する |
| 2-4 | `.test.tsx` ファイルが拡張子保持で `.spec.tsx` に rename される運用を確定する |

## 分類ルール（Phase 3 で ADR 化される凍結ルール）

| 分類 | 対象 path pattern | suffix |
| --- | --- | --- |
| component | `apps/web/**/*.test.tsx` の React component / JSX suite | `*.component.spec.tsx` |
| route | `apps/web/app/api/**/route.test.ts` | `*.route.spec.ts` |
| page | `apps/web/**/page.test.ts(x)` | `*.page.spec.ts(x)` |
| runtime | `apps/web/src/__tests__/{build-output,instrumentation,instrumentation-client,static-invariants,tokens}.test.ts` | `*.runtime.spec.ts` |
| lib-unit | 上記以外（`apps/web/src/lib/**/*.test.ts`、`apps/web/src/test-utils/*.test.ts`、その他純粋 unit test） | `*.spec.ts` |

合計件数（凍結値）: component = **36** / route = **4** / page = **1** / runtime = **5** / lib-unit = **24** / 合計 = **70**。

### 既存 `*.tsx` 拡張子の扱い

`.test.tsx` は **拡張子 `.tsx` を保持** した上で suffix を `.component.spec.tsx` に変更する。理由:

- React JSX を含むファイルは TypeScript コンパイラが `.tsx` 拡張子を要求する
- vitest の `transformMode` も拡張子で判定するため、`.tsx` を `.ts` に変えると JSX parse が壊れる
- 親 #325 では apps/api 内に `.tsx` が存在しなかったため言及がないが、本タスクでは必須の不変条件

### `route` / `page` / `action` / `hook` の扱い

`apps/web/app/api/**/route.test.ts` 4 件は route handler suite として `*.route.spec.ts` に分類する。`apps/web/**/page.test.ts(x)` 1 件は page helper/render suite として `*.page.spec.ts(x)` に分類する。server action / hook 専用 suite は今回の 70 件には存在しないため、将来必要になった時点で apps/web ADR を改訂する。

## fixed list（70 行・全件・Phase 2 実装時に確定）

> **本 Phase 2 仕様書は fixed list の構造と件数枠を凍結する。実 70 行 enumerate は実装時に worktree ルートで以下コマンドを実行して生成し、`outputs/phase-11/rename-mapping.csv` に保存する**。スペックファイルが古いと実装時の物理状態と乖離するため、enumerate は実装時の `find` 出力を正本とする。

### Fixed list 生成コマンド（実装時に実行）

```bash
cd "$(git rev-parse --show-toplevel)"

# 1. 物理 70 ファイルを列挙
find apps/web -path '*/node_modules' -prune -o -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) -print | sort \
  > /tmp/apps-web-test-files.txt

# 2. 件数 assert
test "$(wc -l < /tmp/apps-web-test-files.txt)" = "70" || { echo "FAIL: count != 70"; exit 1; }

# 3. CSV 生成（分類ルール awk スクリプト）
{
  echo "old_path,new_path,suffix_class,justification"
  while IFS= read -r old; do
    case "$old" in
      apps/web/src/__tests__/build-output.test.ts \
      | apps/web/src/__tests__/instrumentation.test.ts \
      | apps/web/src/__tests__/instrumentation-client.test.ts \
      | apps/web/src/__tests__/static-invariants.test.ts \
      | apps/web/src/__tests__/tokens.test.ts )
        new="${old%.test.ts}.runtime.spec.ts"
        cls="runtime"
        just="apps/web runtime invariant test"
        ;;
      apps/web/app/api/**/route.test.ts )
        new="${old%.test.ts}.route.spec.ts"
        cls="route"
        just="Next route handler suite"
        ;;
      */page.test.ts | */page.test.tsx )
        new="${old%.test.ts}.page.spec.ts"
        new="${new%.test.tsx}.page.spec.tsx"
        cls="page"
        just="Next page helper/render suite"
        ;;
      *.test.tsx )
        new="${old%.test.tsx}.component.spec.tsx"
        cls="component"
        just="JSX-containing test (.tsx)"
        ;;
      * )
        new="${old%.test.ts}.spec.ts"
        cls="lib-unit"
        just="lib / utility unit test"
        ;;
    esac
    echo "$old,$new,$cls,$just"
  done < /tmp/apps-web-test-files.txt
} > docs/30-workflows/issue-621-apps-web-test-suffix-rename/outputs/phase-11/rename-mapping.csv

# 4. 件数集計 assert
awk -F, 'NR>1 {c[$3]++} END {for (k in c) print k": "c[k]}' \
  docs/30-workflows/issue-621-apps-web-test-suffix-rename/outputs/phase-11/rename-mapping.csv
# 期待: component: 36 / route: 4 / page: 1 / runtime: 5 / lib-unit: 24 (合計 70)
```

### 期待されるサンプル先頭・末尾行（参考）

| # | old_path | new_path | suffix_class |
| --- | --- | --- | --- |
| 1 | apps/web/src/__tests__/build-output.test.ts | apps/web/src/__tests__/build-output.runtime.spec.ts | runtime |
| 2 | apps/web/src/__tests__/instrumentation-client.test.ts | apps/web/src/__tests__/instrumentation-client.runtime.spec.ts | runtime |
| 3 | apps/web/src/__tests__/instrumentation.test.ts | apps/web/src/__tests__/instrumentation.runtime.spec.ts | runtime |
| 4 | apps/web/src/__tests__/static-invariants.test.ts | apps/web/src/__tests__/static-invariants.runtime.spec.ts | runtime |
| 5 | apps/web/src/__tests__/tokens.test.ts | apps/web/src/__tests__/tokens.runtime.spec.ts | runtime |
| 6 | apps/web/src/components/admin/__tests__/AuditLogPanel.test.tsx | apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx | component |
| ... | ... | ... | ... |
| 70 | apps/web/src/test-utils/render.test.ts | apps/web/src/test-utils/render.spec.ts | lib-unit |

> 実 70 行は **実装時に上記コマンドで CSV を確定** する。本仕様書では構造と分類ルールを凍結する。

### 件数集計（凍結枠）

| suffix_class | 件数（凍結値） | 拡張子 |
| --- | --- | --- |
| component | 36 | .tsx |
| route | 4 | .ts |
| page | 1 | .ts |
| runtime | 5 | .ts |
| lib-unit | 24 | .ts |
| **合計** | **70** | — |

不変条件 `36 + 4 + 1 + 5 + 24 = 70` を満たす。

> Phase 2 実行結果として 36+4+1+5+24=70 を凍結する。後続 Phase と PR 本文はこの内訳に揃える。

## 既存 glob inventory（rename 同期対象）

抽出コマンド:

```bash
rg -n "(test|spec)\.ts" \
  apps/web/package.json \
  vitest.config.ts \
  lefthook.yml \
  .github/workflows/

rg -n "apps/web.*\.test\." \
  --glob '!**/node_modules/**' --glob '!docs/**'
```

対象ファイル（同期必須）:

| ファイル | 想定キー / 同期内容 |
| --- | --- |
| `apps/web/package.json:19` | `verify-design-tokens` script: `apps/web/src/__tests__/tokens.test.ts` を `apps/web/src/__tests__/tokens.runtime.spec.ts` に差し替え |
| `vitest.config.ts`（root） | `test.include` が `apps/**/src/**/*.{test,spec}.{ts,tsx}` で両許容のため変更不要。`coverage.exclude` も `**/*.spec.{ts,tsx}` 既存。Phase 7 で grep 確認のみ |
| `lefthook.yml` | `.test.` 直接参照ゼロ（事前調査結果）。Phase 7 で再確認のみ |
| `.github/workflows/ci.yml:159` 付近 | `build-output.test.ts` 言及（コメント）を `build-output.runtime.spec.ts` に追従（軽微） |
| `.github/workflows/*.yml` 他 | 直接参照があれば追従。事前調査では ci.yml のコメント以外無し |

抽出結果は Phase 6 で実コマンド化し、Phase 11 evidence の `outputs/phase-11/glob-coverage-grep.log` に保存する。

## 命名衝突調査

### 衝突可能性の確認コマンド

```bash
# 1. rename 後パスが既に存在しないことを確認
while IFS=, read -r old_path new_path _; do
  [[ "$old_path" == "old_path" ]] && continue  # ヘッダ skip
  if [[ -f "$new_path" ]]; then
    echo "COLLISION: $new_path (renaming from $old_path)"
  fi
done < docs/30-workflows/issue-621-apps-web-test-suffix-rename/outputs/phase-11/rename-mapping.csv

# 2. rename 後の同名衝突（複数 old_path が同一 new_path に解決していないか）を確認
awk -F, 'NR>1 {print $2}' docs/30-workflows/issue-621-apps-web-test-suffix-rename/outputs/phase-11/rename-mapping.csv \
  | sort | uniq -d

# 3. 既存 *.spec.ts(x) ファイルの存在確認（rename 後と一致しないこと）
find apps/web -path '*/node_modules' -prune -o -type f \( -name '*.spec.ts' -o -name '*.spec.tsx' \) -print
```

### 期待結果

| 確認 | 期待 |
| --- | --- |
| 1. rename 先存在 | 該当なし（出力ゼロ行） |
| 2. new_path 重複 | 該当なし（uniq -d 出力ゼロ行） |
| 3. 既存 `*.spec.ts(x)` | rename 着手前は Playwright/E2E 由来の 17 件。CSV の `new_path` と衝突しないこと |

着手前に上記 3 コマンドを実行し、Phase 11 evidence に結果を記録する。衝突が 1 件でも検出された場合は Phase 8 のエラーハンドリング手順に従い、fixed list を再凍結する。

## 完了条件チェック

- [ ] fixed list 生成コマンドで 70 行ちょうどの CSV が得られる（省略・「他多数」表記なし）
- [ ] 件数集計が `component + route + page + runtime + lib-unit = 70` を満たす（36+4+1+5+24=70）
- [ ] `.test.tsx` の拡張子が `.spec.tsx` に保持されることが明記されている
- [ ] route / page の採用と action / hook を将来候補にする判断が明記されている
- [ ] 既存 glob inventory の抽出コマンドと同期対象ファイルが列挙されている
- [ ] 命名衝突調査の 3 コマンドと期待結果が定義されている
