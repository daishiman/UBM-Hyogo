# Phase 5: vitest.config.ts 収斂

[実装区分: 実装仕様書]

> **実装区分判定根拠**: `vitest.config.ts` の `test.include` および `coverage.exclude` を実際に編集し、二段階対応（`{test,spec}` および `*.test.{ts,tsx}` exclude）を `*.spec.{ts,tsx}` 単一に収斂させる。コードベース実体への書き込みを伴うため実装仕様書。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | vitest.config の test/spec 二段階対応を spec 単一に収斂 (issue-623) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | vitest.config 収斂 |
| 作成日 | 2026-05-12 |
| 担当 | delivery |
| 前 Phase | 4 (rename 実施) |
| 次 Phase | 6 (lefthook pre-commit gate) |
| 状態 | spec_created |

## 目的

`vitest.config.ts` の以下 2 ブロックを `*.spec.{ts,tsx}` 単一に収斂させる:

1. `test.include`（現状 L42-48）の `{test,spec}` 二段階記法を `spec` 単一に変更
2. `test.coverage.exclude`（現状 L57-77）から `**/*.test.{ts,tsx}` 行を削除

本 Phase は Phase 4 の rename 完了を前提とし、編集後の `numTotalTests` が rename 前と一致することを検証する。

## 前提

- Phase 4 完了: `*.test.ts(x)` 残存 0 件、`mise exec -- pnpm typecheck` PASS
- Phase 4 で計測した `/tmp/issue-623-before.json`（`numTotalTests` 値）が利用可能

## 変更対象ファイル一覧（CONST_005）

| 変更種別 | パス | 変更行 |
| --- | --- | --- |
| 編集 | `vitest.config.ts` | L42-48 (`test.include`), L57-77 (`coverage.exclude`) |

## 具体的な before/after diff

### Block 1: `test.include`（L42-48）

#### before

```ts
    include: [
      "apps/**/src/**/*.{test,spec}.{ts,tsx}",
      "apps/**/app/**/*.{test,spec}.{ts,tsx}",
      "apps/**/migrations/**/*.{test,spec}.ts",
      "packages/**/src/**/*.{test,spec}.{ts,tsx}",
      "scripts/**/*.{test,spec}.ts",
    ],
```

#### after

```ts
    include: [
      "apps/**/src/**/*.spec.{ts,tsx}",
      "apps/**/app/**/*.spec.{ts,tsx}",
      "apps/**/migrations/**/*.spec.ts",
      "packages/**/src/**/*.spec.{ts,tsx}",
      "scripts/**/*.spec.ts",
    ],
```

### Block 2: `coverage.exclude`（L57-77）

#### before（該当先頭 2 行のみ）

```ts
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/node_modules/**",
        // ... 以下不変
      ],
```

#### after（該当先頭 1 行に変更）

```ts
      exclude: [
        "**/*.spec.{ts,tsx}",
        "**/node_modules/**",
        // ... 以下不変
      ],
```

> `coverage.exclude` の `**/*.test.{ts,tsx}` 行のみ削除する。`**/*.spec.{ts,tsx}` 行は保持する（テスト本体を coverage 対象から除外するために必要）。

## Edit 操作シグネチャ

| Edit 番号 | old_string（要旨） | new_string（要旨） |
| --- | --- | --- |
| Edit-1 | `"apps/**/src/**/*.{test,spec}.{ts,tsx}",`〜`"scripts/**/*.{test,spec}.ts",` 5 行 | 上記 5 行の `{test,spec}` を `spec` に変更 |
| Edit-2 | `"**/*.test.{ts,tsx}",\n        "**/*.spec.{ts,tsx}",` | `"**/*.spec.{ts,tsx}",` （test 行を削除） |

## 副作用

- `pnpm test` の discovery target が `*.spec.{ts,tsx}` のみに絞られる
- coverage report から `*.spec.{ts,tsx}` のみが除外され、過去残存していた `*.test.{ts,tsx}` exclude は冗長として削除される（Phase 4 完了後は exclude 対象ファイルが存在しないため挙動に影響なし）

## エラーハンドリング

- `pnpm test --run` で `numTotalTests` が Phase 4 計測値と一致しない場合:
  - 差分が **減少**: rename 漏れ（include で hit しないファイルが silent skip）→ Phase 4 を再点検
  - 差分が **増加**: include が広がっている可能性。Phase 2 設計 diff を再確認
- `grep -E '\{test,spec\}' vitest.config.ts` が 1 件以上 hit: Edit-1 の適用漏れ
- `grep -E '\*\.test\.\{ts,tsx\}' vitest.config.ts` が 1 件以上 hit: Edit-2 の適用漏れ

## テスト方針

| 観点 | コマンド | 期待 |
| --- | --- | --- |
| AC-2 二段階記法 0 | `grep -E '\{test,spec\}' vitest.config.ts` | 0 hit |
| AC-3 test exclude 削除 | `grep -E '\*\.test\.\{ts,tsx\}' vitest.config.ts` | 0 hit |
| spec include 存続 | `grep -cE '\*\.spec\.\{ts,tsx\}' vitest.config.ts` | 5 hit 以上（include 4 + exclude 1） |
| AC-7 numTotalTests 不変 | `diff <(jq '.numTotalTests' /tmp/issue-623-before.json) <(jq '.numTotalTests' /tmp/issue-623-after.json)` | diff 空（exit 0） |
| coverage delta | `jq '.total.lines.pct' coverage/coverage-summary.json` を before/after で比較 | ±0.0% |
| typecheck | `mise exec -- pnpm typecheck` | PASS |
| lint | `mise exec -- pnpm lint` | PASS |

## ローカル実行・検証コマンド

```bash
# 1. 編集（Edit-1 / Edit-2 を順に適用）
#   実装者は Edit ツールまたはエディタで vitest.config.ts を編集する

# 2. 静的検証
grep -E '\{test,spec\}' vitest.config.ts && echo "FAIL: 二段階記法残存" || echo "OK"
grep -E '\*\.test\.\{ts,tsx\}' vitest.config.ts && echo "FAIL: test exclude 残存" || echo "OK"
grep -cE '\*\.spec\.\{ts,tsx\}' vitest.config.ts  # 5 以上

# 3. typecheck / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 4. numTotalTests 比較（AC-7）
mise exec -- pnpm test --run --reporter=json > /tmp/issue-623-after.json
diff \
  <(jq '.numTotalTests' /tmp/issue-623-before.json) \
  <(jq '.numTotalTests' /tmp/issue-623-after.json)

# 5. coverage delta（任意）
mise exec -- pnpm test --coverage --run --reporter=json-summary
jq '.total.lines.pct' coverage/coverage-summary.json

# 6. commit
git add vitest.config.ts
git commit -m "chore(test): collapse vitest include/exclude to *.spec only"
```

## DoD（Phase 5 完了基準）

- [ ] Edit-1 / Edit-2 が `vitest.config.ts` に適用済み
- [ ] `grep -E '\{test,spec\}' vitest.config.ts` 0 hit（AC-2）
- [ ] `grep -E '\*\.test\.\{ts,tsx\}' vitest.config.ts` 0 hit（AC-3）
- [ ] `numTotalTests` が Phase 4 before 値と一致（AC-7）
- [ ] `mise exec -- pnpm typecheck` / `pnpm lint` PASS
- [ ] 1 コミット `chore(test): collapse vitest include/exclude to *.spec only` 作成
- [ ] lefthook / GitHub Actions / CLAUDE.md / ADR は未編集（Phase 6-8 / Phase 12 責務）

## aiworkflow-requirements 参照セクション

| 参照対象 | 用途 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/testing.md` | テスト規約の正本確認 |
| `.claude/skills/task-specification-creator/references/spec-update-workflow.md` | Phase 12 同期手順 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | vitest.config.ts | 編集対象本体 |
| 必須 | docs/30-workflows/issue-623-vitest-spec-suffix-convergence/phase-02.md | D-2 diff 設計 |
| 参考 | docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md | ADR 既存記述 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| コード | vitest.config.ts | include / coverage.exclude 編集後 |
| ドキュメント | outputs/phase-05/config-diff.md | before/after 実 diff、numTotalTests 比較結果 |

## 次 Phase

- 次: 6 (lefthook pre-commit gate)
- 引き継ぎ事項: vitest.config 収斂済みの状態、`numTotalTests` after 値、coverage delta
- ブロック条件: `numTotalTests` 不一致または grep 残存ありで Phase 6 に進まない

## 実行タスク

- T-10 を実行し、`vitest.config.ts` を `*.spec.{ts,tsx}` 単一へ収斂する。

## 完了条件

- `{test,spec}` と `**/*.test.{ts,tsx}` が `vitest.config.ts` に残っていない。

## 統合テスト連携

- Phase 10 G-2 / G-3 / G-6 / G-7 の入力にする。
