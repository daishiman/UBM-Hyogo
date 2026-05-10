# Phase 7: 整合性検証 / 08a 規約 / vitest / lefthook / CI / coverage 閾値

## 目的

08a で導入した suffix 規約と本タスクの rename 結果が完全一致することを確認し、vitest / lefthook / CI / coverage 設定が新 suffix に追従しているかを grep / diff ベースで検証する。secret leakage / hook bypass / coverage 閾値の不変条件もここで再点検する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 |
| taskType | implementation |
| implementation_mode | refactor-rename-only |
| visualEvidence | NON_VISUAL |
| state | implementation_completed |

## 1. 08a 規約との整合性確認

08a タスク（`docs/30-workflows/completed-tasks/08a-parallel-api-contract-repository-and-authorization-tests/`）で導入された suffix 規約の根拠文書を grep で発掘する。

```bash
# 08a 配下に suffix 規約の正本表記があるか
rg -n "contract\\.spec\\.ts|authz\\.spec\\.ts|repository\\.spec\\.ts" \
  docs/30-workflows/completed-tasks/08a-parallel-api-contract-repository-and-authorization-tests/ \
  > outputs/phase-11/08a-suffix-policy-grep.log || true

# 08a 内に「混在許容」 / 「後追い rename」言及があるか
rg -n "混在許容|後追い rename|rename migration|UT-08A-06" \
  docs/30-workflows/completed-tasks/08a-parallel-api-contract-repository-and-authorization-tests/ \
  > outputs/phase-11/08a-mixed-policy-grep.log || true
```

整合性条件:

- 08a Phase 10 §5 リスク表 / Phase 12 unassigned-task-detection §6 で「後追い rename」が記載されていること
- 08a で導入された 4 分類（contract / authz / repository / unit）が本タスクの分類と一致すること
- 命名衝突なし（`stripTrailing` 適用後の new path に重複ゼロ）

## 2. vitest config 整合

### 2.1 root `vitest.config.ts`

| 項目 | rename 前 | rename 後 | 整合判定 |
| --- | --- | --- | --- |
| `test.include` の `apps/api` 該当行 | `apps/**/src/**/*.test.{ts,tsx}` 等で間接マッチ | `apps/api/**/src/**/*.spec.{ts,tsx}` 専用行 | apps/api の test 132 件すべてが新 include で拾えること |
| `coverage.exclude` | `**/*.test.{ts,tsx}` + `**/*.spec.{ts,tsx}` | 同上（両許容維持） | rename 後も exclude が機能 |
| `coverage.include` | `apps/**/src/**/*.{ts,tsx}` | 同上 | 変更なし |
| `testTimeout` / `hookTimeout` | 30000 | 30000 | 変更なし |

### 2.2 `apps/api/vitest.config.ts` の有無

```bash
test -f apps/api/vitest.config.ts && echo "EXISTS" || echo "MISSING"
```

存在する場合: 同様に `*.spec.ts` 単独へ移行。存在しない場合（root 委譲）: 変更不要。

### 2.3 vitest workspace

```bash
rg -n "vitest\\.workspace|defineWorkspace" --type ts > outputs/phase-11/vitest-workspace-grep.log || true
```

workspace 設定が存在すれば本タスクで同期、なければ「変更不要」を evidence に記録。

## 3. lefthook 整合

```bash
rg -n "test\\.ts|spec\\.ts" lefthook.yml scripts/hooks/ scripts/coverage-guard.sh \
  > outputs/phase-11/lefthook-grep.log || true
```

- `lefthook.yml` 自体には test path filter なし（CLAUDE.md / 既存実装で確認済）
- `scripts/coverage-guard.sh` 内の changed-file フィルタが `*.test.ts` を含む場合は `*.{test,spec}.ts` に追従
- `scripts/hooks/staged-task-dir-guard.sh` が test path を含むかも grep し、必要なら追従

## 4. CI workflow 整合

```bash
# .test.ts のリテラル使用
rg -n "\\.test\\.ts" .github/workflows/ > outputs/phase-11/workflow-grep.log || true

# vitest 直呼び出し / pnpm test 実行 step を全列挙
rg -n "vitest|pnpm.*test|--filter @ubm-hyogo/api test" .github/workflows/ \
  > outputs/phase-11/workflow-test-step-grep.log || true
```

検査観点:

- `pr-build-test.yml` / `backend-ci.yml` / `ci.yml` 等で apps/api test を回す step がある
- これらは `pnpm --filter @ubm-hyogo/api test` を呼ぶだけのため、glob 直書きはなく rename 影響を受けない見込み
- workflow yaml 内に `*.test.ts` リテラルが残存する場合は本 PR 内で追従。残存ゼロが理想

検査の必須条件:

- rename 後に test 系 job が **静かに skip しない**こと（job log で `Test Files X` / `Tests Y` の数値を取得し、Phase 11 §1 の rename 前と一致）

## 5. coverage 閾値整合

| 項目 | 値 | 変化 |
| --- | --- | --- |
| 閾値（lines / branches / functions / statements） | 既存値 | 変更なし |
| coverage.exclude | `*.test.{ts,tsx}` + `*.spec.{ts,tsx}` | 変更なし（両許容） |
| coverage.include | apps/**/src/**/*.{ts,tsx} 等 | 変更なし |
| reporter | text / json-summary / json / lcov / html | 変更なし |

検証:

- rename 前後で `pnpm --filter @ubm-hyogo/api test:coverage` の summary をテキストで diff し、line/branch/func/stmt の delta = 0% であること
- delta != 0 の場合、include/exclude 漏れを疑い §2 / §3 / §4 を再点検

## 6. secret leakage / hardcoded credential 整合

rename で内容を変更しないため、既存のクリーン状態が維持される前提。Phase 11 で念のため再 grep:

```bash
rg -n "(apikey|secret|token|password)\\s*=" apps/api/src --glob '*.spec.ts' \
  > outputs/phase-11/secret-grep-after-rename.log || true
# 期待: 0 件、または既知の test fixture 上の dummy 値のみ
```

不変条件:

- production secret が test 内に存在しないこと
- dummy 値しか残っていないこと（test fixture として明示）

## 7. hook bypass 不変条件

- rename commit / config commit / ADR commit すべてで `--no-verify` 不使用
- 万一 pre-commit hook が 132 件 rename を block した場合、`MERGE_HEAD` 相当の例外条件を hook に追加するか、`scripts/hooks/staged-task-dir-guard.sh` 側で「rename-only changes」を検出してスキップする方針を Phase 8 のエラーハンドリングで定義する
- pre-push `coverage-guard` は coverage delta=0 で pass する想定

## 8. coverage 比較（rename 前 vs 後）

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage 2>&1 \
  | tee outputs/phase-11/coverage-after.txt
diff outputs/phase-11/coverage-before.txt outputs/phase-11/coverage-after.txt \
  > outputs/phase-11/coverage-delta.diff || true
```

合格条件:

- coverage summary の数値部分（lines / branches / funcs / stmts）が rename 前と一致
- delta != 0 の場合は §5 不変条件違反として fail

## 9. 整合性検証チェックリスト

| # | 項目 | コマンド |
| --- | --- | --- |
| C-1 | 08a 規約との分類一致 | §1 grep |
| C-2 | vitest include で apps/api 132 件すべて拾える | `pnpm --filter @ubm-hyogo/api test --reporter=verbose` で 132 件 |
| C-3 | vitest exclude が両 suffix を維持 | `vitest.config.ts` grep |
| C-4 | lefthook / coverage-guard glob 追従 | §3 grep |
| C-5 | CI workflow に `.test.ts` リテラル残存ゼロ | §4 rg |
| C-6 | coverage delta = 0% | §8 diff |
| C-7 | secret leakage 0 件 | §6 rg |
| C-8 | hook bypass 不使用 | git log で `--no-verify` 痕跡なし（git log には残らないため、開発者注意 + PR 説明で担保） |

## 完了条件チェック

- [ ] 08a 規約との分類一致を grep で確認
- [ ] vitest config の整合性を §2 で評価
- [ ] lefthook / coverage-guard の整合性を §3 で評価
- [ ] CI workflow の整合性を §4 で評価
- [ ] coverage 閾値整合（delta=0）を §5 / §8 で評価
- [ ] secret leakage 再 grep を §6 で実施
- [ ] hook bypass 不変条件を §7 で明記
- [ ] §9 チェックリストで C-1〜C-8 すべて pass

## 出力

- `phase-07.md`

## 参照資料

- `index.md`
- `phase-05.md`（AST 表現 / 擬似 diff）
- `phase-06.md`（rename 実行手順）
- `docs/30-workflows/completed-tasks/08a-parallel-api-contract-repository-and-authorization-tests/`
- `vitest.config.ts` / `lefthook.yml` / `.github/workflows/*.yml`

## 統合テスト連携

- Phase 9 で C-1〜C-8 を CI 必須 step に組み込む
- Phase 11 で grep / diff 出力を evidence として保存

## 依存Phase参照

Phase 1 / Phase 2 / Phase 3 / Phase 4 / Phase 5 / Phase 6 の成果物を上流契約として参照する。
