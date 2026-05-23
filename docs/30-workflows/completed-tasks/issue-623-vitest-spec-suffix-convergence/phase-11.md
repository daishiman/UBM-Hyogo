# Phase 11: Evidence 収集

[実装区分: 実装仕様書]

> **実装区分判定根拠**: 本タスクは NON_VISUAL（UI 視覚変更なし）であり、画面スクリーンショットは対象外。Phase 11 は Phase 9 / Phase 10 で生成したログ・JSON・diff を `outputs/phase-11/` 配下に集約し、AC-1〜AC-8 の最終 evidence として確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | vitest.config の test/spec 二段階対応を spec 単一に収斂 (issue-623) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | Evidence 収集（NON_VISUAL） |
| 作成日 | 2026-05-12 |
| 担当 | delivery |
| 前 Phase | 10（品質ゲート） |
| 次 Phase | 12（正本同期） |
| 状態 | spec_created |
| タスク種別 | implementation / NON_VISUAL |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #623（CLOSED — Refs として参照） |

---

## 目的

Phase 9 のテスト出力と Phase 10 の品質ゲート結果を 1 ヶ所（`outputs/phase-11/`）に集約し、AC-1〜AC-8 ごとに「どの evidence が PASS を支えているか」を 1 対 1 で紐付ける。Phase 12（正本同期）と Phase 13（PR 本文）が `outputs/phase-11/` のみを参照すれば evidence-bundle を再構成できる状態を作る。

---

## 11-1. NON_VISUAL skip 判定

| 項目 | 値 |
| --- | --- |
| screenshot を作らない理由 | 本タスクの実装差分は (a) ファイル rename、(b) `vitest.config.ts` の文字列編集、(c) bash script 追加、(d) GitHub Actions workflow 追加 のみで、UI に視覚変更がない |
| 代替 evidence | コマンド出力ログ・JSON・diff・grep 結果 |
| placeholder の禁止 | `outputs/phase-11/screenshots/.gitkeep` 等を作らない |

`outputs/phase-11/visual-verification-skip.md` を以下フォーマットで作成:

```markdown
# Phase 11 視覚的検証スキップ判定 — issue-623

## 判定
本タスクは NON_VISUAL（UI 視覚変更なし）。
画面スクリーンショットは作成しない。

## 根拠
- 変更ファイル: rename 159 件（拡張子のみ）、`vitest.config.ts` 文字列編集、`scripts/hooks/block-test-suffix.sh` 新規、`.github/workflows/verify-test-suffix.yml` 新規、CLAUDE.md / ADR / skill changelog 追記
- いずれも `apps/web` の DOM / styles / routes に影響を与えない
- visual regression test の対象外

## 代替 evidence
`outputs/phase-11/evidence-bundle/` 配下の text / json / diff 一式が UI 評価の代替となる。
```

---

## 11-2. AC ⇔ evidence マッピング

| AC | 内容 | evidence パス | 入力元 |
| --- | --- | --- | --- |
| AC-1 | `*.test.ts(x)` 残存 0 件 | `outputs/phase-11/evidence-bundle/ac-1-find-after.txt` | Phase 10 G-1 |
| AC-1（補強） | rename 前の残存件数（before） | `outputs/phase-11/evidence-bundle/ac-1-find-before.txt` | Phase 1〜4 の事前計測 |
| AC-2 | `test.include` 単一化 | `outputs/phase-11/evidence-bundle/ac-2-grep-include.txt` + `outputs/phase-11/evidence-bundle/ac-2-vitest-config-diff.txt` | Phase 10 G-2 + git diff |
| AC-3 | `coverage.exclude` から test 行削除 | `outputs/phase-11/evidence-bundle/ac-3-grep-exclude.txt` + 同 diff | Phase 10 G-3 |
| AC-4 | `block-test-suffix.sh` exit != 0 | `outputs/phase-11/evidence-bundle/ac-4-precommit-log.txt` + `outputs/phase-11/evidence-bundle/ac-4-unit-result.txt` | Phase 9 9-2-A / 9-3 |
| AC-5 | `lefthook.yml` 追記 + 並列動作 | `outputs/phase-11/evidence-bundle/ac-5-lefthook-coexist.txt` + git diff | Phase 9 9-2-C |
| AC-6 | `verify-test-suffix.yml` fail/green | `outputs/phase-11/evidence-bundle/ac-6-ci-fail.txt` + `outputs/phase-11/evidence-bundle/ac-6-ci-green.txt` | Phase 9 9-2-B + 本 branch の最終 run |
| AC-7 | `numTotalTests` 不変 + coverage delta | `outputs/phase-11/evidence-bundle/ac-7-numTotalTests-diff.txt` + `ac-7-coverage-delta.txt` + before/after JSON | Phase 9 9-1 + Phase 10 G-6 / G-7 |
| AC-8 | CLAUDE.md / ADR / skill changelog 追記 | `outputs/phase-11/evidence-bundle/ac-8-docs-diff.txt` | Phase 12 結果（Phase 11 では「予定」、Phase 12 完了後に最終 commit hash を埋め込む） |

---

## 11-3. evidence パスの統一規約

すべての evidence は `outputs/phase-11/evidence-bundle/` 配下に集約する。ファイル命名規則:

- `ac-<番号>-<内容>.<拡張子>` （例: `ac-1-find-after.txt`）
- 1 つの AC に複数 evidence がある場合は同じ prefix を共有
- ログは `.txt`、構造化データは `.json`、差分は `.txt`（unified diff）
- スクリーンショット系は配置しない（NON_VISUAL のため）

転写スクリプト雛形（Phase 4 で `scripts/migration/collect-phase-11-evidence.sh` として実装してもよい）:

```bash
mkdir -p outputs/phase-11/evidence-bundle

# AC-1
cp outputs/phase-10/g1-find-result.txt outputs/phase-11/evidence-bundle/ac-1-find-after.txt
# AC-2 / AC-3
cp outputs/phase-10/g2-grep.txt outputs/phase-11/evidence-bundle/ac-2-grep-include.txt
cp outputs/phase-10/g3-grep.txt outputs/phase-11/evidence-bundle/ac-3-grep-exclude.txt
git diff dev...HEAD -- vitest.config.ts > outputs/phase-11/evidence-bundle/ac-2-vitest-config-diff.txt
# AC-4
cp outputs/phase-09/gate-pre-commit-log.txt outputs/phase-11/evidence-bundle/ac-4-precommit-log.txt
cp outputs/phase-09/block-test-suffix-unit-result.txt outputs/phase-11/evidence-bundle/ac-4-unit-result.txt
# AC-5
cp outputs/phase-09/gate-coexist-log.txt outputs/phase-11/evidence-bundle/ac-5-lefthook-coexist.txt
git diff dev...HEAD -- lefthook.yml > outputs/phase-11/evidence-bundle/ac-5-lefthook-diff.txt
# AC-6
cp outputs/phase-09/gate-ci-log.txt outputs/phase-11/evidence-bundle/ac-6-ci-fail.txt
# AC-6 green は本 feature branch の最新 verify-test-suffix run を gh run view --log で取得
# AC-7
cp outputs/phase-09/test-discovery-before.json outputs/phase-11/evidence-bundle/ac-7-numTotalTests-before.json
cp outputs/phase-09/test-discovery-after.json outputs/phase-11/evidence-bundle/ac-7-numTotalTests-after.json
cp outputs/phase-10/g6-numTotalTests-diff.txt outputs/phase-11/evidence-bundle/ac-7-numTotalTests-diff.txt
cp outputs/phase-10/g7-coverage-delta.txt outputs/phase-11/evidence-bundle/ac-7-coverage-delta.txt
# AC-8 は Phase 12 完了後に追記
```

---

## 11-4. rename 件数の before/after スナップショット

```bash
# before（feature ブランチ作成直後、rename 着手前）
find . -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) \
  -not -path '*/node_modules/*' -not -path '*/.next/*' -not -path '*/.open-next/*' \
  | tee outputs/phase-11/evidence-bundle/ac-1-find-before.txt
wc -l outputs/phase-11/evidence-bundle/ac-1-find-before.txt
# 期待: 159 件（Phase 1 で計測した分布通り）

# after（Phase 10 完了後）
find . -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) \
  -not -path '*/node_modules/*' -not -path '*/.next/*' -not -path '*/.open-next/*' \
  | tee outputs/phase-11/evidence-bundle/ac-1-find-after.txt
wc -l outputs/phase-11/evidence-bundle/ac-1-find-after.txt
# 期待: 0
```

---

## 11-5. vitest.config.ts before/after diff

```bash
# git で before/after 差分を取得（feature branch 起点）
git log --oneline -- vitest.config.ts | head
git diff dev...HEAD -- vitest.config.ts > outputs/phase-11/evidence-bundle/ac-2-vitest-config-diff.txt

# 期待されるパターン（unified diff）:
# - include に `{test,spec}` を含む行 → `spec` 単一に置換
# - exclude から `**/*.test.{ts,tsx}` 行が削除
```

成果物 `outputs/phase-11/vitest-config-diff-summary.md` に要約:

```markdown
# vitest.config.ts before/after 要約

## include
- before: 5 行 / `{test,spec}` 5 hit
- after: 5 行 / `{test,spec}` 0 hit / `spec` 5 hit

## coverage.exclude
- before: `**/*.test.{ts,tsx}` 1 行 + `**/*.spec.{ts,tsx}` 1 行
- after: `**/*.spec.{ts,tsx}` 1 行のみ
```

---

## 11-6. CI gate trigger テスト結果

`outputs/phase-11/ci-gate-trigger-results.md` を作成:

```markdown
# CI gate trigger 結果 — issue-623

## lefthook pre-commit（local）
| シナリオ | 入力 | 期待 | 実測 | 判定 |
| --- | --- | --- | --- | --- |
| 9-2-A reject | dummy `*.test.ts` staged | exit != 0 | exit=N | PASS / FAIL |
| 9-2-C 並列 | CLAUDE.md staged | 既存 hook 全 PASS | 全 PASS | PASS / FAIL |

## GitHub Actions verify-test-suffix
| シナリオ | branch | 期待 | run URL | 判定 |
| --- | --- | --- | --- | --- |
| 9-2-B fail | test/verify-workflow-fail | job fail | (URL) | PASS / FAIL |
| green | feat/issue-623-... (本 branch) | job green | (URL) | PASS / FAIL |
```

---

## 11-7. coverage delta レポート

`outputs/phase-11/coverage-delta-report.md`:

```markdown
# Coverage delta — issue-623

| metric | before | after | delta | 許容 ±0.5pt | 判定 |
| --- | --- | --- | --- | --- | --- |
| lines | xx.xx | xx.xx | ±0.00 | YES | PASS |
| statements | xx.xx | xx.xx | ±0.00 | YES | PASS |
| branches | xx.xx | xx.xx | ±0.00 | YES | PASS |
| functions | xx.xx | xx.xx | ±0.00 | YES | PASS |

## 元データ
- before: outputs/phase-09/coverage-before.json
- after: outputs/phase-10/g7-coverage-after.json
```

---

## 11-8. evidence 保管先まとめ

| カテゴリ | パス |
| --- | --- |
| skip 判定 | `outputs/phase-11/visual-verification-skip.md` |
| AC 別 evidence | `outputs/phase-11/evidence-bundle/ac-<N>-*.{txt,json}` |
| vitest.config diff 要約 | `outputs/phase-11/vitest-config-diff-summary.md` |
| CI gate trigger 結果 | `outputs/phase-11/ci-gate-trigger-results.md` |
| coverage delta レポート | `outputs/phase-11/coverage-delta-report.md` |
| AC 集約レポート | `outputs/phase-11/test-report.md` |

`outputs/phase-11/test-report.md` を最終 AC 判定表として作成:

```markdown
# issue-623 AC 判定レポート

| AC | 内容 | 判定 | evidence |
| --- | --- | --- | --- |
| AC-1 | test 残存 0 件 | PASS / FAIL | evidence-bundle/ac-1-* |
| AC-2 | include 単一化 | PASS / FAIL | evidence-bundle/ac-2-* |
| ... | ... | ... | ... |
| AC-8 | docs 追記 | PASS / FAIL | evidence-bundle/ac-8-* |

総合: PASS / FAIL
```

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| Phase 9 / Phase 10 出力 | ログ・JSON・diff の入力 | 11-3 の転写スクリプトで再配置 |
| Phase 12 正本同期 | `test-report.md` を strict 7 outputs の implementation-guide.md から参照 | パス固定 |
| Phase 13 PR | PR 本文 Evidence セクションに `outputs/phase-11/` を引用 | パス固定 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/issue-623-vitest-spec-suffix-convergence/index.md | AC 定義 |
| 必須 | docs/30-workflows/issue-623-vitest-spec-suffix-convergence/phase-09.md | 入力 evidence 元 |
| 必須 | docs/30-workflows/issue-623-vitest-spec-suffix-convergence/phase-10.md | gate 結果 |
| 参考 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/phase-11.md | NON_VISUAL skip フォーマット参考 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/visual-verification-skip.md | NON_VISUAL skip 判定 |
| ドキュメント | outputs/phase-11/test-report.md | AC-1〜AC-8 最終判定 |
| ドキュメント | outputs/phase-11/vitest-config-diff-summary.md | config diff 要約 |
| ドキュメント | outputs/phase-11/ci-gate-trigger-results.md | gate 動作確認結果 |
| ドキュメント | outputs/phase-11/coverage-delta-report.md | coverage delta |
| エビデンス | outputs/phase-11/evidence-bundle/ac-1-find-before.txt | rename 前件数 |
| エビデンス | outputs/phase-11/evidence-bundle/ac-1-find-after.txt | rename 後件数 |
| エビデンス | outputs/phase-11/evidence-bundle/ac-2-grep-include.txt | include 検証 |
| エビデンス | outputs/phase-11/evidence-bundle/ac-2-vitest-config-diff.txt | config diff |
| エビデンス | outputs/phase-11/evidence-bundle/ac-3-grep-exclude.txt | exclude 検証 |
| エビデンス | outputs/phase-11/evidence-bundle/ac-4-precommit-log.txt | hook reject ログ |
| エビデンス | outputs/phase-11/evidence-bundle/ac-4-unit-result.txt | hook unit test |
| エビデンス | outputs/phase-11/evidence-bundle/ac-5-lefthook-coexist.txt | 並列動作 |
| エビデンス | outputs/phase-11/evidence-bundle/ac-5-lefthook-diff.txt | lefthook.yml diff |
| エビデンス | outputs/phase-11/evidence-bundle/ac-6-ci-fail.txt | workflow fail ログ |
| エビデンス | outputs/phase-11/evidence-bundle/ac-6-ci-green.txt | workflow green ログ |
| エビデンス | outputs/phase-11/evidence-bundle/ac-7-numTotalTests-before.json | discovery JSON |
| エビデンス | outputs/phase-11/evidence-bundle/ac-7-numTotalTests-after.json | discovery JSON |
| エビデンス | outputs/phase-11/evidence-bundle/ac-7-numTotalTests-diff.txt | diff 結果 |
| エビデンス | outputs/phase-11/evidence-bundle/ac-7-coverage-delta.txt | delta 計算 |
| エビデンス | outputs/phase-11/evidence-bundle/ac-8-docs-diff.txt | docs 追記 diff（Phase 12 後） |

---

## 完了条件

- [ ] `visual-verification-skip.md` が NON_VISUAL 判定として作成済み
- [ ] AC-1〜AC-8 の evidence ファイルが全て `evidence-bundle/` に存在
- [ ] `test-report.md` の AC 表が全 PASS
- [ ] `outputs/phase-11/screenshots/` ディレクトリと `.gitkeep` を作らない
- [ ] coverage delta が ±0.5pt 以内であることが `coverage-delta-report.md` に記録
- [ ] CI gate trigger 結果が 4 シナリオとも PASS

---

## aiworkflow-requirements 参照セクション

| 参照対象 | 用途 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/testing.md` | テスト規約参照 |
| `.claude/skills/task-specification-creator/references/phase-12-spec.md` | Phase 12 連携の strict outputs 規約 |

---

## タスク 100% 実行確認【必須】

- [ ] 全 evidence が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-11 を completed に更新（visualEvidence は NON_VISUAL のまま）

---

## 次 Phase 引き継ぎ事項

- 次: Phase 12（正本同期）
- 引き継ぎ事項: `test-report.md` を Phase 12 implementation-guide.md から参照、AC-8 の docs diff は Phase 12 で追記
- ブロック条件: AC-1〜AC-7 のいずれかが FAIL の場合は Phase 12 に進まない（AC-8 は Phase 12 完了で初めて埋まる）

## 実行タスク

- AC-1〜AC-8 の evidence bundle を `outputs/phase-11/` に集約する。
