# Phase 9: テスト戦略

[実装区分: 実装仕様書]

> **実装区分判定根拠**: 本 Phase は (a) `pnpm test --run` の `numTotalTests` 不変検証、(b) CI gate（`block-test-suffix.sh` / `verify-test-suffix.yml`）の動作確認テスト、(c) `block-test-suffix.sh` の bash unit test の 3 種類の「実テスト」を設計する。設計成果物は Phase 11 で evidence として再利用される。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | vitest.config の test/spec 二段階対応を spec 単一に収斂 (issue-623) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | テスト戦略 |
| 作成日 | 2026-05-12 |
| 担当 | delivery |
| 前 Phase | 8（パフォーマンス — 該当なし／空 Phase） |
| 次 Phase | 10（品質ゲート） |
| 状態 | spec_created |
| タスク種別 | implementation / NON_VISUAL |
| GitHub Issue | #623（CLOSED — Refs として参照） |

---

## 目的

本タスクは「rename + config 編集 + CI gate 追加」しかコードに触れないが、それでも以下 3 種類のテストを通さねば AC-1〜AC-8 を満たしたとは言えない。Phase 9 でこれらを設計確定する。

1. **vitest discovery 不変テスト**: rename 前後で `numTotalTests` が完全一致することの検証手順（AC-7）
2. **CI gate 動作テスト**: lefthook `block-test-suffix` と GitHub Actions `verify-test-suffix` が `*.test.ts(x)` を実際に reject／fail することの再現手順（AC-4 / AC-6）
3. **`block-test-suffix.sh` bash unit test**: shell script 単体の入出力／exit code テスト

---

## 9-1. vitest discovery 不変テスト（AC-7）

### 目的

include glob を `*.{test,spec}` から `*.spec` 単一に絞った瞬間に rename 漏れがあると、ファイルは存在するが vitest が discovery しない silent skip が発生する。これを `numTotalTests` の before/after 比較で検出する。

### 手順

```bash
# rename 着手前（main / dev 起点で feature ブランチ作成直後）
mise exec -- pnpm test --run --reporter=json > outputs/phase-09/test-discovery-before.json
jq '.numTotalTests, .numTotalTestSuites' outputs/phase-09/test-discovery-before.json

# T-02〜T-10 完了直後
mise exec -- pnpm test --run --reporter=json > outputs/phase-09/test-discovery-after.json
jq '.numTotalTests, .numTotalTestSuites' outputs/phase-09/test-discovery-after.json

# 不変確認
diff <(jq '.numTotalTests' outputs/phase-09/test-discovery-before.json) \
     <(jq '.numTotalTests' outputs/phase-09/test-discovery-after.json)
# 期待: 差分なし（exit 0）
diff <(jq '.numTotalTestSuites' outputs/phase-09/test-discovery-before.json) \
     <(jq '.numTotalTestSuites' outputs/phase-09/test-discovery-after.json)
# 期待: 差分なし（exit 0）
```

### 判定基準

| 観点 | 期待 | 異常時の対処 |
| --- | --- | --- |
| `numTotalTests` 差分 | 0 | rename 漏れを `find` で再検出し、漏れたファイルを `git mv` |
| `numTotalTestSuites` 差分 | 0 | include glob の path セグメント漏れを再確認 |
| `numFailedTests` | before/after ともに同値 | rename によって import path が壊れていないか確認 |

### 取得物

- `outputs/phase-09/test-discovery-before.json`
- `outputs/phase-09/test-discovery-after.json`
- `outputs/phase-09/test-discovery-diff.md`（diff コマンド結果と判定）

---

## 9-2. CI gate 動作テスト（AC-4 / AC-5 / AC-6）

### 9-2-A. lefthook `block-test-suffix` の reject 動作

```bash
# 検証ブランチを切る（main / dev からの分岐禁止条件回避のため feature 配下を使う）
git checkout -b test/verify-block-test-suffix

# dummy *.test.ts を作って staged にする
mkdir -p apps/api/src/__tests__
cat > apps/api/src/__tests__/dummy-block-gate.test.ts <<'EOF'
import { describe, it } from 'vitest';
describe('dummy', () => it('noop', () => {}));
EOF
git add apps/api/src/__tests__/dummy-block-gate.test.ts

# commit を試みる
git commit -m "verify(test): exercise block-test-suffix" 2>&1 | tee outputs/phase-09/gate-pre-commit-log.txt
# 期待: exit code != 0、stderr に "🚫 新規テストファイルは *.spec.{ts,tsx} のみ" が出る

echo "exit_code=$?" >> outputs/phase-09/gate-pre-commit-log.txt

# 後片付け
git restore --staged apps/api/src/__tests__/dummy-block-gate.test.ts
rm -f apps/api/src/__tests__/dummy-block-gate.test.ts
```

### 9-2-B. `verify-test-suffix.yml` の fail 動作

```bash
# 1. dummy *.test.ts を含む branch を push し PR を作る
git checkout -b test/verify-workflow-fail
mkdir -p apps/api/src/__tests__
cat > apps/api/src/__tests__/dummy-ci-gate.test.ts <<'EOF'
import { describe, it } from 'vitest';
describe('dummy', () => it('noop', () => {}));
EOF
git add apps/api/src/__tests__/dummy-ci-gate.test.ts
git commit -m "verify(ci): trigger verify-test-suffix" --no-verify  # local gate を一時的に bypass して push 検証
git push -u origin test/verify-workflow-fail

# 2. GitHub Actions の verify-test-suffix job が fail することを確認
gh run list --workflow=verify-test-suffix.yml --branch=test/verify-workflow-fail --limit=1
gh run view --log-failed | tee outputs/phase-09/gate-ci-log.txt
# 期待: 'Legacy *.test.ts(x) files detected:' が含まれ exit 1

# 3. 後片付け
git push origin --delete test/verify-workflow-fail
git checkout -
git branch -D test/verify-workflow-fail
```

> **注**: 9-2-B は GitHub Actions trigger に副作用を伴うため、Phase 11 evidence 収集時のみ実施する。Phase 9 では「手順を設計する」のみで実行はしない。
> `--no-verify` は本検証 1 回のみ容認する例外。CLAUDE.md は通常運用での `--no-verify` を禁止しているが、ここでは「local gate と CI gate の独立性を確認する」唯一の目的に限定する。検証完了後の branch は force-delete する。

### 9-2-C. 既存 hook との並列動作確認

```bash
# lefthook の他 command が壊れていないことの確認
git checkout -b test/verify-lefthook-coexist
echo "noop" >> CLAUDE.md
git add CLAUDE.md
git commit -m "verify(hooks): ensure block-test-suffix coexists with siblings"
# 期待: main-branch-guard / staged-task-dir-guard / block-test-suffix が全て PASS で commit 成立
git reset --hard HEAD~1
git checkout -
git branch -D test/verify-lefthook-coexist
```

### 取得物

- `outputs/phase-09/gate-pre-commit-log.txt`
- `outputs/phase-09/gate-ci-log.txt`
- `outputs/phase-09/gate-coexist-log.txt`

---

## 9-3. `block-test-suffix.sh` bash unit test 設計

### 目的

shell script は型システムがないため、入出力／exit code を fixture ベースで検査する。Phase 4 で実装し、Phase 9 で実行する。

### 配置

`scripts/hooks/__tests__/block-test-suffix.bats`（bats-core 形式）を **作らない**。理由: 本リポジトリには bats 系の既存 setup がなく、本タスクのために bats を追加すると scope 外の依存追加になる。代替として **`scripts/hooks/__tests__/block-test-suffix.spec.sh`** を bash の `set -e` + `[[ ]]` ベースで自作する。

> 注: 本 spec ファイルは shell script なので vitest の include 対象外。AC-1 の `*.test.ts(x)` 0 件 condition には影響しない。

### テストケース

| # | 入力（staged ファイル） | 期待 exit code | 期待 stderr |
| --- | --- | --- | --- |
| 1 | 空（staged なし） | 0 | 空 |
| 2 | `apps/api/src/foo.spec.ts` のみ | 0 | 空 |
| 3 | `apps/api/src/foo.test.ts` 1 件 | 1 | `apps/api/src/foo.test.ts` を含む |
| 4 | `apps/web/src/bar.test.tsx` 1 件 | 1 | 同上 |
| 5 | `.spec.ts` と `.test.ts` 混在 | 1 | `.test.ts` のパスのみ列挙 |
| 6 | `node_modules/foo/bar.test.ts` 配下 | 0 | 空（除外対象） |
| 7 | `foo.test.ts.bak` 拡張子末尾不一致 | 0 | 空（誤検知しないこと） |

### 実行コマンド

```bash
bash scripts/hooks/__tests__/block-test-suffix.spec.sh
# 期待: 全 7 ケース PASS、最後の行に "all cases passed" が出力される
```

### 取得物

- `outputs/phase-09/block-test-suffix-unit-result.txt`

---

## 9-4. テスト実行順序

| # | テスト | 実施 Phase | 前提 |
| --- | --- | --- | --- |
| 1 | `numTotalTests` before 計測 | Phase 4 着手前 | feature branch 作成済み、rename 未着手 |
| 2 | `block-test-suffix.sh` unit test | Phase 4 (T-11 後) | script 実装済み |
| 3 | `numTotalTests` after 計測 | Phase 4 (T-10 後) | rename + config 編集完了 |
| 4 | lefthook 動作テスト（9-2-A） | Phase 4 (T-12 後) | lefthook command 配線済み |
| 5 | lefthook 並列動作テスト（9-2-C） | Phase 4 (T-12 後) | 同上 |
| 6 | GitHub Actions 動作テスト（9-2-B） | Phase 11 evidence 収集時 | T-13 merge 前のテスト branch で実施 |

---

## 9-5. テスト合否の集約

Phase 11 evidence で以下を 1 表に集約する:

| テスト | 期待 | 実測 | 判定 |
| --- | --- | --- | --- |
| numTotalTests before/after diff | 0 | (実測) | PASS / FAIL |
| numTotalTestSuites before/after diff | 0 | (実測) | PASS / FAIL |
| block-test-suffix unit test 7 ケース | 7 PASS | (実測) | PASS / FAIL |
| lefthook reject 動作 | exit 非 0 | (実測) | PASS / FAIL |
| lefthook 並列動作 | 既存 command PASS | (実測) | PASS / FAIL |
| GitHub Actions verify-test-suffix fail 動作 | job fail | (実測) | PASS / FAIL |
| GitHub Actions verify-test-suffix green 動作 | job green（clean branch） | (実測) | PASS / FAIL |

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| Phase 10 品質ゲート | 本 Phase の全テストを「必須ゲート」として呼び出す | 9-5 の集約表を gate 入力にする |
| Phase 11 evidence | 9-1 / 9-2 / 9-3 の出力ファイルを `outputs/phase-11/` 配下に再配置 | パス変換ルールを Phase 11 で明示 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/issue-623-vitest-spec-suffix-convergence/phase-02.md | テスト方針セクションの正本 |
| 必須 | docs/30-workflows/issue-623-vitest-spec-suffix-convergence/phase-03.md | T-01〜T-19 依存関係 |
| 必須 | vitest.config.ts | reporter / coverage の挙動確認 |
| 必須 | scripts/hooks/staged-task-dir-guard.sh | 並列 hook の参照実装 |
| 参考 | .github/workflows/verify-indexes.yml | verify-* workflow の検証パターン参考 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/test-strategy.md | 9-1〜9-5 を統合したテスト戦略書 |
| エビデンス（Phase 11 に転写） | outputs/phase-09/test-discovery-before.json | rename 前の vitest JSON |
| エビデンス（Phase 11 に転写） | outputs/phase-09/test-discovery-after.json | rename 後の vitest JSON |
| エビデンス（Phase 11 に転写） | outputs/phase-09/test-discovery-diff.md | diff 結果と判定 |
| エビデンス（Phase 11 に転写） | outputs/phase-09/gate-pre-commit-log.txt | lefthook reject ログ |
| エビデンス（Phase 11 に転写） | outputs/phase-09/gate-ci-log.txt | GitHub Actions fail ログ |
| エビデンス（Phase 11 に転写） | outputs/phase-09/gate-coexist-log.txt | lefthook 並列確認ログ |
| エビデンス（Phase 11 に転写） | outputs/phase-09/block-test-suffix-unit-result.txt | bash unit テスト結果 |

---

## 完了条件

- [ ] 9-1（discovery 不変）の手順と判定基準が確定
- [ ] 9-2（CI gate 動作）の 3 シナリオが確定
- [ ] 9-3（bash unit test 7 ケース）が確定
- [ ] 9-4（テスト実行順序）が確定
- [ ] 9-5（集約表）が Phase 11 に渡せる形で確定
- [ ] `outputs/phase-09/test-strategy.md` が作成されている

---

## aiworkflow-requirements 参照セクション

| 参照対象 | 用途 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/testing.md` | テスト命名規約（存在する場合） |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | rename 後の re-index 対象 |
| `.claude/skills/task-specification-creator/references/phase-12-spec.md` | strict 7 outputs ルール（Phase 12 で参照） |

---

## タスク 100% 実行確認【必須】

- [ ] 全仕様化タスクが `spec_created` として整合し、実装後に再実行する evidence gate が明記されている
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-09 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 10（品質ゲート）
- 引き継ぎ事項: 9-5 集約表を gate チェックリストに転写、9-1〜9-3 の出力ファイルパスを Phase 11 evidence パスに mapping
- ブロック条件: 9-1 / 9-2 / 9-3 のいずれか手順が未確定の場合は Phase 10 に進まない

## 実行タスク

- discovery 不変テスト、hook reject テスト、workflow fail/green テストを実行する。
