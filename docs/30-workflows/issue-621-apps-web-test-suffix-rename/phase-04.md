# Phase 4: I/O 契約 / rename mapping CSV / test count snapshot / glob coverage grep / typecheck・lint exit

## 目的

Phase 2 fixed list と Phase 3 設計を実装に橋渡しするための **I/O 契約** を確定する。具体的には (1) `rename-mapping.csv` の schema、(2) test count snapshot ファイル形式、(3) vitest reporter 比較ロジック、(4) glob coverage grep ログ形式、(5) typecheck / lint / `verify-design-tokens` の exit code 契約 を定義する。すべて Phase 11 evidence 生成スクリプトの仕様根拠となる。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 |
| taskType | implementation |
| implementation_mode | refactor-rename-only |
| visualEvidence | NON_VISUAL |
| state | completed |

## 実行タスク

| Task | 内容 |
| --- | --- |
| 4-1 | rename mapping CSV の schema を確定する |
| 4-2 | test count snapshot ファイルの形式と比較規則を確定する |
| 4-3 | vitest reporter 出力の比較対象行を確定する |
| 4-4 | glob coverage grep ログの形式と判定ルールを確定する |
| 4-5 | typecheck / lint / verify-design-tokens の exit code 契約を確定する |

## 1. rename mapping CSV

### 1-1. ファイル

| 項目 | 値 |
| --- | --- |
| パス | `docs/30-workflows/issue-621-apps-web-test-suffix-rename/outputs/phase-11/rename-mapping.csv` |
| 文字コード | UTF-8（BOM なし） |
| 改行 | LF |
| 行数 | ヘッダ 1 + データ 70 = **71 行** |
| 区切り文字 | `,`（カンマ） |

### 1-2. schema

```csv
old_path,new_path,suffix_class,justification
```

| 列 | 型 | 制約 |
| --- | --- | --- |
| `old_path` | string | リポジトリ root 相対 path。`apps/web/src/...test.ts` または `...test.tsx`。must exist before rename |
| `new_path` | string | リポジトリ root 相対 path。`apps/web/src/...{component\|runtime}.spec.ts(x)` または `...spec.ts`。must NOT exist before rename |
| `suffix_class` | enum | `component` / `runtime` / `lib-unit` のいずれか |
| `justification` | string | 分類根拠の短評。カンマ・改行を含めない |

### 1-3. 不変条件

- 行数 = 71（ヘッダ含む）
- `dirname(oldPath) === dirname(newPath)` 全行
- `oldPath` 拡張子 と `newPath` 拡張子 の対応:
  - `.test.ts` → `.spec.ts`（runtime / lib-unit）または `.runtime.spec.ts`（runtime）
  - `.test.tsx` → `.component.spec.tsx`（component のみ）
- `Set(newPath).size === 70`（重複禁止）
- `suffix_class` 件数: component=36 / route=4 / page=1 / runtime=5 / lib-unit=24

## 2. test count snapshot

### 2-1. ファイル

| ファイル | 内容 | 取得タイミング |
| --- | --- | --- |
| `outputs/phase-11/test-count-before.txt` | rename 前 vitest reporter `Test Files` / `Tests` 行 | rename commit 1 着手前 |
| `outputs/phase-11/test-count-after.txt` | rename 後 vitest reporter `Test Files` / `Tests` 行 | rename commit 1 直後 |
| `outputs/phase-11/test-after-full.log` | rename 後 vitest 全出力 | rename 完了後 |

### 2-2. 比較規則

| 比較対象 | 取得方法 | 合格条件 |
| --- | --- | --- |
| `Test Files X passed` | `grep -E '^\s*Test Files' test-*-full.log` | `X` の値が rename 前後で一致 |
| `Tests Y passed` | `grep -E '^\s*Tests' test-*-full.log` | `Y` の値が rename 前後で一致 |
| `Test Suites` (vitest 別 reporter) | reporter 出力に応じて選択 | rename 前後で一致 |

差分が 1 でもあれば fail。`pending` / `skipped` 件数も含めて完全一致を要求する。

### 2-3. find ベースの physical 件数 snapshot

| ファイル | コマンド | 期待値 |
| --- | --- | --- |
| `outputs/phase-11/find-test-before.txt` | `find apps/web -path '*/node_modules' -prune -o -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) -print \| sort` | 70 行 |
| `outputs/phase-11/find-test-after.txt` | 同上 | 0 行 |
| `outputs/phase-11/find-spec-before.txt` | `find apps/web -path '*/node_modules' -prune -o -type f \( -name '*.spec.ts' -o -name '*.spec.tsx' \) -print \| sort` | 17 行 |
| `outputs/phase-11/find-spec-after.txt` | 同上 | 87 行 |
| `outputs/phase-11/find-count-before.txt` | `echo "test=$(find...test.ts*\|wc -l) spec=$(find...spec.ts*\|wc -l)"` | `test=70 spec=17` |
| `outputs/phase-11/find-count-after.txt` | 同上 | `test=0 spec=87` |

## 3. vitest reporter 比較ロジック

### 3-1. reporter 選択

`mise exec -- pnpm --filter @ubm-hyogo/web test --reporter=verbose` を使用。`--reporter=default` は `Tests` 行が省略されるため不可。

### 3-2. 比較対象行

vitest verbose reporter の標準出力から以下行を抽出:

```
 Test Files  XX passed (XX)
      Tests  YYY passed (YYY)
   Start at  HH:MM:SS
   Duration  N.NNs
```

`Test Files` 行と `Tests` 行のみ比較対象。`Duration` / `Start at` は比較しない。

### 3-3. 抽出コマンド

```bash
# rename 前 full log は本レビュー時点では再生成不可。
# 実装時に取得済みの test-count-before.txt / test-count-before.normalized.txt を before 正本にする。
test -s outputs/phase-11/test-count-before.txt
grep -E '^\s*(Test Files|Tests)\s' outputs/phase-11/test-after-full.log \
  > outputs/phase-11/test-count-after.txt
diff outputs/phase-11/test-count-before.txt outputs/phase-11/test-count-after.txt
# 期待: diff exit 0（差分なし）
```

## 4. glob coverage grep ログ

### 4-1. ファイル

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-11/glob-coverage-grep.log` | `apps/web` に関連する `.test.` 残存 grep 結果 |
| `outputs/phase-11/glob-coverage-config-grep.log` | config ファイル群の `.test.` / `.spec.` 出現箇所 |

### 4-2. 取得コマンド

```bash
# A. apps/web 関連 .test. 残存
rg -n "apps/web.*\.test\." \
  --glob '!**/node_modules/**' --glob '!docs/**' \
  > outputs/phase-11/glob-coverage-grep.log || true

# B. config ファイル群の test/spec 出現
rg -n "(test|spec)\.ts" \
  apps/web/package.json \
  vitest.config.ts \
  lefthook.yml \
  .github/workflows/ \
  > outputs/phase-11/glob-coverage-config-grep.log || true
```

### 4-3. 判定ルール

| ログ | 合格条件 |
| --- | --- |
| `glob-coverage-grep.log` | rename 後に **0 件**（apps/web 関連の `.test.` 直接参照ゼロ） |
| `glob-coverage-config-grep.log` | rename 後に `apps/web` 関連の `.test.` ヒットゼロ。`vitest.config.ts` の両許容 glob `*.{test,spec}.{ts,tsx}` 行は許容（followup-003 で別途処理） |

## 5. typecheck / lint / verify-design-tokens exit code 契約

| コマンド | 取得ファイル | 合格 exit code |
| --- | --- | --- |
| `mise exec -- pnpm typecheck` | `outputs/phase-11/typecheck.log` | 0 |
| `mise exec -- pnpm lint` | `outputs/phase-11/lint.log` | 0 |
| `mise exec -- pnpm --filter @ubm-hyogo/web test` | `outputs/phase-11/test-after-full.log` | 0 |
| `mise exec -- pnpm --filter @ubm-hyogo/web run verify-design-tokens` | `outputs/phase-11/verify-design-tokens.log` | 0 |

すべて exit code 0 が PASS。1 つでも非ゼロなら Phase 8 のエラーハンドリング手順に従う。

## 6. evidence ファイル一覧（最終形）

```
outputs/phase-11/
├── main.md                              # PASS/FAIL サマリ
├── rename-mapping.csv                   # 70 行 + ヘッダ
├── test-count-before.txt                # rename 前 reporter 抽出
├── test-count-after.txt                 # rename 後 reporter 抽出
├── test-after-full.log                  # rename 後 vitest 全出力
├── find-test-before.txt                 # find *.test.ts(x) 列挙（70 行）
├── find-test-after.txt                  # find *.test.ts(x) 列挙（0 行）
├── find-spec-before.txt                 # find *.spec.ts(x) 列挙（17 行）
├── find-spec-after.txt                  # find *.spec.ts(x) 列挙（70 行）
├── find-count-before.txt                # 集計（test=70 spec=17）
├── find-count-after.txt                 # 集計（test=0 spec=87）
├── glob-coverage-grep.log               # apps/web .test. 残存（0 行）
├── glob-coverage-config-grep.log        # config 内 test/spec 出現
├── typecheck.log                        # exit 0
├── lint.log                             # exit 0
├── verify-design-tokens.log             # exit 0
└── git-rename-summary.log               # git log -1 --diff-filter=R --summary（70 行）
```

## 完了条件チェック

- [ ] rename mapping CSV の schema（4 列・71 行・LF・UTF-8）が確定している
- [ ] test count snapshot の比較規則（`Test Files` / `Tests` 行完全一致）が確定している
- [ ] vitest verbose reporter を使用する根拠が記述されている
- [ ] glob coverage grep のコマンドと判定ルールが確定している
- [ ] 4 種コマンド（typecheck / lint / web test / verify-design-tokens）の exit code 契約が定義されている
- [ ] evidence ファイル一覧が網羅的に列挙されている
