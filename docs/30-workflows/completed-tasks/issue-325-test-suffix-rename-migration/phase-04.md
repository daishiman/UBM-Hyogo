# Phase 4: I/O 契約 / rename mapping CSV / test count snapshot / glob coverage grep / typecheck・lint exit

## 目的

Phase 2 fixed list と Phase 3 設計を実装に橋渡しするための **I/O 契約** を確定する。具体的には (1) `rename-mapping.csv` の schema、(2) test count snapshot ファイル形式、(3) vitest reporter 比較ロジック、(4) glob coverage grep ログ形式、(5) typecheck / lint の exit code 契約 を定義する。すべて Phase 11 evidence 生成スクリプトの仕様根拠となる。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implementation_completed |

## 実行タスク

| Task | 内容 |
| --- | --- |
| 4-1 | rename mapping CSV の schema を確定する |
| 4-2 | test count snapshot ファイルの形式と比較規則を確定する |
| 4-3 | vitest reporter 出力の比較対象行を確定する |
| 4-4 | glob coverage grep ログの形式と判定ルールを確定する |
| 4-5 | typecheck / lint の exit code 契約を確定する |

## 1. rename mapping CSV

### 1-1. ファイル

| 項目 | 値 |
| --- | --- |
| パス | `docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-11/rename-mapping.csv` |
| 文字コード | UTF-8（BOM なし） |
| 改行 | LF |
| 行数 | ヘッダ 1 + データ 132 = **133 行** |
| 区切り文字 | `,`（カンマ） |

### 1-2. schema

```csv
old_path,new_path,suffix_class,justification
```

| 列 | 型 | 制約 |
| --- | --- | --- |
| `old_path` | string | リポジトリ root 相対 path。`apps/api/src/...test.ts` 形式。must exist before rename |
| `new_path` | string | リポジトリ root 相対 path。`apps/api/src/...{contract\|authz\|repository}.spec.ts` または `...spec.ts`。must NOT exist before rename |
| `suffix_class` | enum | `contract` / `authz` / `repository` / `unit` のいずれか |
| `justification` | string | 分類根拠の短評。カンマ・改行を含めない |

### 1-3. 不変条件

| ID | 条件 |
| --- | --- |
| C-1 | データ行数 = 132 |
| C-2 | `awk -F, 'NR>1 {print $3}' | sort | uniq -c` の集計が `41 contract / 4 authz / 38 repository / 49 unit` |
| C-3 | `awk -F, 'NR>1 {print $1}' | sort | uniq -d` 出力ゼロ（old_path 重複なし） |
| C-4 | `awk -F, 'NR>1 {print $2}' | sort | uniq -d` 出力ゼロ（new_path 重複なし） |
| C-5 | すべての `old_path` が `apps/api/src/` で始まり `.test.ts` で終わる |
| C-6 | suffix_class=contract のすべての new_path が `.contract.spec.ts` で終わる |
| C-7 | suffix_class=authz のすべての new_path が `.authz.spec.ts` で終わる |
| C-8 | suffix_class=repository のすべての new_path が `.repository.spec.ts` で終わる |
| C-9 | suffix_class=unit のすべての new_path が `.spec.ts` で終わり、`.contract.spec.ts` / `.authz.spec.ts` / `.repository.spec.ts` のいずれにも該当しない |

### 1-4. 生成元

Phase 2 fixed list（132 行 markdown 表）を CSV にエクスポート。Phase 6 でスクリプト化する。

## 2. test count snapshot

### 2-1. ファイル

| 項目 | 値 |
| --- | --- |
| before | `outputs/phase-11/test-count-before.txt` |
| after | `outputs/phase-11/test-count-after.txt` |

### 2-2. 取得コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test --reporter=verbose 2>&1 | tail -50 \
  | grep -E '^(Test Files|Tests|Duration)' \
  | sort \
  > outputs/phase-11/test-count-{before,after}.txt
```

### 2-3. ファイル内容形式

```
Duration  XX.XXs (...)
Test Files  N passed (N)
Tests  M passed (M)
```

順序を `sort` で正規化することで、reporter の出力順序揺れを吸収する。

### 2-4. 比較規則

| 比較対象 | 判定 |
| --- | --- |
| `Test Files N passed (N)` の `N` 値 | before == after（厳密一致） |
| `Tests M passed (M)` の `M` 値 | before == after（厳密一致） |
| `Duration` 行 | 比較対象外（実行時間揺れを許容） |

### 2-5. assert スクリプト

```bash
# Test Files / Tests の値が完全一致するか判定
diff <(grep -E '^(Test Files|Tests)' outputs/phase-11/test-count-before.txt) \
     <(grep -E '^(Test Files|Tests)' outputs/phase-11/test-count-after.txt) \
  && echo "OK: test count identical" \
  || { echo "FAIL: test count diverged"; exit 1; }
```

exit 0 = PASS / exit 1 = FAIL。Phase 11 evidence で本コマンドの実行結果を記録する。

### 2-6. 補助 assert（ファイル数）

```bash
# rename 後 *.test.ts 残存ゼロ
test "$(find apps/api/src -name '*.test.ts' | wc -l | tr -d ' ')" -eq 0

# rename 後 *.spec.ts が 132 件
test "$(find apps/api/src -name '*.spec.ts' | wc -l | tr -d ' ')" -eq 132

# suffix 内訳
test "$(find apps/api/src -name '*.contract.spec.ts'   | wc -l | tr -d ' ')" -eq 41
test "$(find apps/api/src -name '*.authz.spec.ts'      | wc -l | tr -d ' ')" -eq 4
test "$(find apps/api/src -name '*.repository.spec.ts' | wc -l | tr -d ' ')" -eq 38
# unit は repository / contract / authz を除外したカウント
test "$(find apps/api/src -name '*.spec.ts' \
        ! -name '*.contract.spec.ts' \
        ! -name '*.authz.spec.ts' \
        ! -name '*.repository.spec.ts' | wc -l | tr -d ' ')" -eq 49
```

すべて exit 0 を要件とする。

## 3. vitest reporter 比較契約

### 3-1. 比較対象行

`Test Files` 集計行 / `Tests` 集計行のみ。理由:

- 個別 test 名の出力順は parallel 実行で揺れる
- duration は実行毎に変わる
- 集計行のみが「件数が変わっていない」という意味的不変条件を表す

### 3-2. reporter 選定

| reporter | 採否 | 理由 |
| --- | --- | --- |
| `verbose` | ○ | `Test Files` / `Tests` 集計行が末尾に出る |
| `default` | △ | 同集計行は出るが、個別 file 出力が省略され差異が見えづらい |
| `json` | × | parsing 工数が増えるが、本タスクの目的（件数のみ確認）には verbose で十分 |

採用: `--reporter=verbose`。

### 3-3. 順序差の許容

`sort` で行を正規化済みのため、reporter 内部での出力順揺れは比較に影響しない。

## 4. glob coverage grep ログ

### 4-1. ファイル

| 項目 | 値 |
| --- | --- |
| パス | `outputs/phase-11/glob-coverage-grep.log` |
| 文字コード | UTF-8 |

### 4-2. 取得コマンド（rename 後実行）

```bash
{
  echo "=== vitest.config.ts (root) ==="
  rg -n "test\.ts|spec\.ts" vitest.config.ts || true
  echo
  echo "=== apps/api/vitest.config.ts ==="
  rg -n "test\.ts|spec\.ts" apps/api/vitest.config.ts 2>/dev/null || echo "(file not present)"
  echo
  echo "=== apps/api/package.json ==="
  rg -n "test\.ts|spec\.ts" apps/api/package.json || true
  echo
  echo "=== package.json (root) ==="
  rg -n "test\.ts|spec\.ts" package.json || true
  echo
  echo "=== lefthook.yml ==="
  rg -n "test\.ts|spec\.ts" lefthook.yml || true
  echo
  echo "=== .github/workflows/ ==="
  rg -n "test\.ts|spec\.ts" .github/workflows/ || true
} > outputs/phase-11/glob-coverage-grep.log
```

### 4-3. 判定ルール

rename 後の `glob-coverage-grep.log` に対して以下を満たす:

| ID | 条件 |
| --- | --- |
| G-1 | `\.test\.ts` 単独参照（`*.{test,spec}.ts` の合成記法を除く）が CI / vitest / lefthook 系設定に **残っていない** |
| G-2 | `*.spec.ts` 参照が vitest config / lefthook / CI workflow に最低 1 箇所ずつ存在 |
| G-3 | `*.test.ts` 文字列が単独で出てくる箇所は、ドキュメント / コメント / ADR 等の「規約遷移を記述している箇所」のみで、glob としての参照は無い |

### 4-4. assert スクリプト

```bash
# G-1 の判定: glob 用の "*.test.ts" 単独参照が残っていないこと
if rg -n '"\*\*/\*\.test\.ts"|"\*\.test\.ts"' \
     vitest.config.ts apps/api/vitest.config.ts apps/api/package.json \
     package.json lefthook.yml .github/workflows/ 2>/dev/null \
     | rg -v 'spec\.ts'; then
  echo "FAIL: legacy *.test.ts glob still referenced"
  exit 1
fi
```

exit 0 = PASS。

## 5. typecheck / lint exit code 契約

### 5-1. コマンド

```bash
mise exec -- pnpm typecheck   # exit 0 を要求
mise exec -- pnpm lint        # exit 0 を要求
```

### 5-2. 不変条件

| ID | 条件 |
| --- | --- |
| L-1 | rename 後 `pnpm typecheck` exit code = 0 |
| L-2 | rename 後 `pnpm lint` exit code = 0 |
| L-3 | warning は許容、error は不許容（exit 0 が PASS の唯一条件） |
| L-4 | rename によって import path が壊れないこと（test 内容を変更しないため、`from '...'` のパス文字列は影響なし。test ファイル名変更だけが対象） |

### 5-3. evidence 形式

```bash
{
  echo "=== typecheck ==="
  mise exec -- pnpm typecheck 2>&1 | tail -20
  echo "exit=$?"
  echo
  echo "=== lint ==="
  mise exec -- pnpm lint 2>&1 | tail -20
  echo "exit=$?"
} > outputs/phase-11/typecheck-lint.log
```

`exit=0` 行が typecheck / lint の両方で記録されることが PASS 条件。

## 6. I/O 契約サマリー

| Output | 形式 | 不変条件 ID | PASS 判定 |
| --- | --- | --- | --- |
| `outputs/phase-11/rename-mapping.csv` | UTF-8 CSV / 133 行 | C-1..C-9 | 9 条件すべて満たす |
| `outputs/phase-11/test-count-before.txt` | プレーンテキスト | — | 取得時点の vitest 集計行を保持 |
| `outputs/phase-11/test-count-after.txt` | プレーンテキスト | 2-4 比較規則 | before との `Test Files` / `Tests` 値完全一致 |
| `outputs/phase-11/glob-coverage-grep.log` | プレーンテキスト | G-1, G-2, G-3 | legacy `*.test.ts` glob 残存ゼロ |
| `outputs/phase-11/typecheck-lint.log` | プレーンテキスト | L-1, L-2 | typecheck / lint の `exit=0` 記録 |

## 完了条件チェック

- [ ] rename-mapping.csv の schema（列・型・制約）と不変条件 C-1..C-9 が記述されている
- [ ] test count snapshot の取得コマンド・形式・比較規則が記述されている
- [ ] vitest reporter は `--reporter=verbose` 採用と根拠が記述されている
- [ ] glob coverage grep の取得コマンドと判定ルール G-1..G-3 が記述されている
- [ ] typecheck / lint の exit code 契約 L-1..L-4 が記述されている
- [ ] I/O 契約サマリー表が出力ファイル別に整理されている
