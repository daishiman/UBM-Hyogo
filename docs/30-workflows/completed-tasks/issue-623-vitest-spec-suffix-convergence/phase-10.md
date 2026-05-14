# Phase 10: 品質ゲート

[実装区分: 実装仕様書]

> **実装区分判定根拠**: 本 Phase は Phase 9 のテスト戦略を「必須ゲート」として束ね、typecheck / lint / vitest / coverage delta / find 0 件 / CI gate 動作 の合格条件を確定する。実装着手後 (Phase 4) のループバック判定として機能する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | vitest.config の test/spec 二段階対応を spec 単一に収斂 (issue-623) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 品質ゲート |
| 作成日 | 2026-05-12 |
| 担当 | delivery |
| 前 Phase | 9（テスト戦略） |
| 次 Phase | 11（Evidence 収集） |
| 状態 | spec_created |
| タスク種別 | implementation / NON_VISUAL |
| GitHub Issue | #623（CLOSED — Refs として参照） |

---

## 目的

Phase 4 で T-01〜T-13 を実装した後、PR 作成（Phase 13）に進む前段として、**機械的に判定可能な品質ゲート 8 項目** を通すことを必須にする。1 項目でも fail した場合は Phase 4 へループバックし、原因を解消してから再判定する。

---

## 10-1. 必須ゲート一覧（AC-1〜AC-8 対応）

| Gate # | 名称 | コマンド | 期待 | 対応 AC |
| --- | --- | --- | --- | --- |
| G-1 | `*.test.ts(x)` 残存 0 件 | `find . -name '*.test.ts' -o -name '*.test.tsx' \| grep -v node_modules \| grep -v .next \| grep -v .open-next \| wc -l` | `0` | AC-1 |
| G-2 | vitest.include 単一化 | `grep -E '\{test,spec\}' vitest.config.ts \| wc -l` | `0` | AC-2 |
| G-3 | coverage.exclude から test 行削除 | `grep -E '\*\.test\.\{ts,tsx\}' vitest.config.ts \| wc -l` | `0` | AC-3 |
| G-4 | typecheck PASS | `mise exec -- pnpm typecheck` | exit 0 | AC-1 / AC-7 |
| G-5 | lint PASS | `mise exec -- pnpm lint` | exit 0 | AC-1 / AC-7 |
| G-6 | vitest 実行 PASS | `mise exec -- pnpm test --run` | exit 0、`numTotalTests` が rename 前と一致 | AC-7 |
| G-7 | coverage delta ±0.5pt 以内 | Phase 9 の before/after JSON を比較 | `total.lines.pct` 差が 0.5 以下 | AC-7 |
| G-8 | CI gate 動作確認 | Phase 9-2 の 3 シナリオが全 PASS | PASS | AC-4 / AC-5 / AC-6 |

---

## 10-2. ゲート判定 SOP

```bash
# G-1
find . -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) \
  -not -path '*/node_modules/*' -not -path '*/.next/*' -not -path '*/.open-next/*' \
  | tee outputs/phase-10/g1-find-result.txt | wc -l
# 期待: 0

# G-2 / G-3
grep -nE '\{test,spec\}' vitest.config.ts | tee outputs/phase-10/g2-grep.txt
grep -nE '\*\.test\.\{ts,tsx\}' vitest.config.ts | tee outputs/phase-10/g3-grep.txt
# どちらも 0 行であること

# G-4
mise exec -- pnpm typecheck 2>&1 | tee outputs/phase-10/g4-typecheck.txt

# G-5
mise exec -- pnpm lint 2>&1 | tee outputs/phase-10/g5-lint.txt

# G-6
mise exec -- pnpm test --run --reporter=json > outputs/phase-10/g6-vitest.json
jq '.numTotalTests, .numTotalTestSuites, .numFailedTests' outputs/phase-10/g6-vitest.json
diff <(jq '.numTotalTests' outputs/phase-09/test-discovery-before.json) \
     <(jq '.numTotalTests' outputs/phase-10/g6-vitest.json) \
     | tee outputs/phase-10/g6-numTotalTests-diff.txt
# 期待: diff 空

# G-7
mise exec -- pnpm test --run --coverage --reporter=json-summary > outputs/phase-10/g7-coverage-after.json
# rename 前の coverage は Phase 9 で取得済み (outputs/phase-09/coverage-before.json)
python3 - <<'EOF' | tee outputs/phase-10/g7-coverage-delta.txt
import json
b = json.load(open('outputs/phase-09/coverage-before.json'))
a = json.load(open('outputs/phase-10/g7-coverage-after.json'))
for k in ['lines', 'statements', 'branches', 'functions']:
    delta = a['total'][k]['pct'] - b['total'][k]['pct']
    print(f"{k}: before={b['total'][k]['pct']} after={a['total'][k]['pct']} delta={delta:+.2f}")
    assert abs(delta) <= 0.5, f"coverage delta exceeded ±0.5pt on {k}"
print("coverage delta gate: PASS")
EOF
```

> Python3 が無い場合は jq + bc で同等計算を行う。Phase 4 で実行スクリプトを `scripts/migration/coverage-delta-check.sh` として実装することを推奨（任意）。

---

## 10-3. ゲート不合格時のループバック

| Gate | 不合格時のアクション |
| --- | --- |
| G-1 | `find` 結果のパスを `git mv` で `*.spec` に rename → Phase 4 T-09 から再実行 |
| G-2 / G-3 | `vitest.config.ts` を再編集 → Phase 4 T-10 から再実行 |
| G-4 | typecheck エラー箇所を最小差分で修正、import path 変更があれば全件修正 |
| G-5 | `mise exec -- pnpm lint --fix` → 残違反のみ手修正 |
| G-6 | `numTotalTests` 減少時は include glob と rename 漏れの両面を再確認 |
| G-7 | coverage delta > 0.5pt の場合、include / exclude の glob 設定漏れを疑う |
| G-8 | hook script / workflow yaml の構文を再確認、`bash -n` で syntax check |

ループバックは最大 3 回まで自動実施。4 回目以降は Phase 9 のテスト戦略自体を見直す。

---

## 10-4. DoD（タスク全体の完了条件 — index.md AC-1〜AC-8 を機械判定形式で再掲）

| # | 条件 | 判定方法 |
| --- | --- | --- |
| 1 | `find . -name '*.test.ts' -o -name '*.test.tsx' \| grep -v node_modules` が 0 件 | G-1 |
| 2 | `vitest.config.ts` の `test.include` が `*.spec.{ts,tsx}` 単一 | G-2 |
| 3 | `vitest.config.ts` の `coverage.exclude` から `**/*.test.{ts,tsx}` 削除 | G-3 |
| 4 | `pnpm test --run` の `numTotalTests` が rename 前と同一 | G-6 |
| 5 | coverage delta ±0%（許容誤差 ±0.5pt） | G-7 |
| 6 | `scripts/hooks/block-test-suffix.sh` が `.test.ts(x)` staged 時に exit != 0 | G-8（Phase 9-2-A） |
| 7 | `.github/workflows/verify-test-suffix.yml` が main/dev push および PR で trigger し fail 動作可能 | G-8（Phase 9-2-B） |
| 8 | CLAUDE.md / ADR / skill changelog に追記反映 | Phase 12 で確認 |

> 上記 8 条件全てが PASS した時点で Phase 11 へ進む。1 件でも未達なら Phase 4 ループバック。

---

## 10-5. ゲート結果の記録

`outputs/phase-10/gate-summary.md` に以下形式で記録:

```markdown
# Phase 10 品質ゲート結果

| Gate | 判定 | 実測 | 取得ログ |
| --- | --- | --- | --- |
| G-1 残存 0 件 | PASS / FAIL | (件数) | outputs/phase-10/g1-find-result.txt |
| G-2 二段階記法 0 | PASS / FAIL | (件数) | outputs/phase-10/g2-grep.txt |
| G-3 test exclude 削除 | PASS / FAIL | (件数) | outputs/phase-10/g3-grep.txt |
| G-4 typecheck | PASS / FAIL | exit code | outputs/phase-10/g4-typecheck.txt |
| G-5 lint | PASS / FAIL | exit code | outputs/phase-10/g5-lint.txt |
| G-6 vitest numTotalTests | PASS / FAIL | before=N / after=N | outputs/phase-10/g6-numTotalTests-diff.txt |
| G-7 coverage delta | PASS / FAIL | lines Δ=±0.0% | outputs/phase-10/g7-coverage-delta.txt |
| G-8 CI gate 動作 | PASS / FAIL | 3 シナリオ | outputs/phase-09/gate-*.txt |
```

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| Phase 9 テスト戦略 | G-6 / G-8 の入力データを Phase 9 出力に依存 | 9-1 / 9-2 の出力を参照 |
| Phase 11 Evidence | G-1〜G-8 の出力ファイルをそのまま `outputs/phase-11/` に転写 | Phase 11 のパスマップに従う |
| Phase 13 PR | gate-summary.md を PR 本文 Test plan に転記 | Phase 13 13-2 ステップ 1 と一致 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/issue-623-vitest-spec-suffix-convergence/index.md | AC-1〜AC-8 |
| 必須 | docs/30-workflows/issue-623-vitest-spec-suffix-convergence/phase-09.md | テスト戦略の出力ファイル |
| 必須 | vitest.config.ts | G-2 / G-3 の対象 |
| 参考 | CLAUDE.md「よく使うコマンド」 | `mise exec` / `pnpm` 規約 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/gate-summary.md | G-1〜G-8 集約表 |
| ログ | outputs/phase-10/g1-find-result.txt | find の生出力 |
| ログ | outputs/phase-10/g2-grep.txt | 二段階記法 grep 結果 |
| ログ | outputs/phase-10/g3-grep.txt | test exclude grep 結果 |
| ログ | outputs/phase-10/g4-typecheck.txt | typecheck 出力 |
| ログ | outputs/phase-10/g5-lint.txt | lint 出力 |
| ログ | outputs/phase-10/g6-vitest.json | vitest JSON |
| ログ | outputs/phase-10/g6-numTotalTests-diff.txt | diff 結果 |
| ログ | outputs/phase-10/g7-coverage-after.json | coverage JSON |
| ログ | outputs/phase-10/g7-coverage-delta.txt | delta 計算結果 |

---

## 完了条件

- [ ] G-1〜G-8 の 8 ゲートが全 PASS
- [ ] `gate-summary.md` が作成され、全 row が PASS
- [ ] ループバック発生時は原因と再判定結果が `gate-summary.md` に記録されている
- [ ] DoD 8 条件が機械判定で確認できている

---

## aiworkflow-requirements 参照セクション

| 参照対象 | 用途 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/testing.md` | テスト命名規約（存在する場合） |
| `.claude/skills/task-specification-creator/references/spec-update-workflow.md` | Phase 12 同期手順 |

---

## タスク 100% 実行確認【必須】

- [ ] 全ゲートが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-10 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 11（Evidence 収集）
- 引き継ぎ事項: `outputs/phase-10/` の全ファイルを `outputs/phase-11/evidence-bundle/` 配下に転写・要約
- ブロック条件: 1 ゲートでも FAIL が残っている場合は Phase 11 に進まない

## 実行タスク

- G-1〜G-8 の品質ゲートを実行する。
