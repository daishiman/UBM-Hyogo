# Phase 7: カバレッジ確認

本タスクの変更ファイルである `AdminTopbar.tsx` に対象を限定してカバレッジを確認する。

## 1. 計測対象の限定（Feedback BEFORE-QUIT-002）

- カバレッジ評価対象は **`apps/web/src/components/layout/AdminTopbar.tsx`（本タスクの新規変更ファイル）のみ**。
- `(admin)/layout.tsx`（既存・JSX 置換のみ）や他 primitive・他 route は本タスクのカバレッジ評価対象外とする。これらは無修正 pass の回帰（Phase 6 §3）で担保し、全体カバレッジは `coverage-guard.sh` の baseline で低下なしを確認する。
- 「変更していないファイルのカバレッジ未達」を本タスクの未達として扱わない（責務外ファイルへの gold-plating を避ける / BEFORE-QUIT-002）。

## 2. 目標

| 対象 | 目標 |
|---|---|
| `AdminTopbar.tsx` line coverage | 100% |
| `AdminTopbar.tsx` branch coverage | 100% |
| 全体 line coverage delta | ≥ 0（baseline 維持） |

`AdminTopbar.tsx` は分岐が少ない純粋関数 Server Component のため、Phase 4 + Phase 6 の TC で line/branch 100% に到達できる設計。

## 3. 分岐網羅の根拠表

`AdminTopbar.tsx` の分岐は 2 箇所:
- 分岐A: breadcrumb の `{breadcrumb ?? "管理"}`（nullish coalescing）
- 分岐B: actions の `actions === undefined ? <省略placeholder> : <注入wrapper>`（三項）

breadcrumb（undefined / null / value）× actions（undefined / null / value）の組で、両分岐の全 truthy/falsy 経路を網羅する：

| ケース | breadcrumb 入力 | 分岐A 経路 | actions 入力 | 分岐B 経路 | 担保 TC |
|---|---|---|---|---|---|
| 省略×省略 | undefined | `?? "管理"`（フォールバック） | undefined | `=== undefined` → true（aria-hidden placeholder） | TC-1/2/3/6 |
| 注入×省略 | value | `??` 左辺採用 | undefined | true 経路 | TC-4 |
| 省略×注入 | undefined | フォールバック | value | `=== undefined` → false（注入 wrapper） | TC-5 |
| null×— | null | `?? "管理"`（フォールバック） | — | — | TB-1 |
| 0×— | 0（falsy だが非 null） | `??` 左辺採用（0 を残す） | — | — | TB-3 |
| —×null | — | — | null | false 経路（aria-hidden なし） | TB-2 |
| —×false | — | — | false | false 経路 | TB-2 |

- 分岐A の両側（左辺採用 / 右辺フォールバック）: 「注入×省略」「0」で左辺、「省略」「null」で右辺 → 網羅。
- 分岐B の両側（true: undefined / false: 注入・null・false）: 「省略」で true、「注入」「null」「false」で false → 網羅。
- これにより `AdminTopbar.tsx` の branch coverage は 100% に到達する。

## 4. 計測コマンド

```bash
# AdminTopbar.spec.tsx を coverage 付きで実行（パスに括弧を含まないためエスケープ不要）
mise exec -- pnpm --filter @ubm-hyogo/web test -- --coverage "src/components/layout/__tests__/AdminTopbar.spec.tsx"
```

実行後、`coverage/coverage-summary.json`（または vitest の coverage reporter 出力）から `AdminTopbar.tsx` の line / branch を抽出して 100% を確認する。

## 5. 全体ガード

```bash
bash scripts/coverage-guard.sh --changed
```

`--changed` モードで現在 push 範囲のカバレッジ低下がないことを確認する。merge commit を含む push は CLAUDE.md 個人開発ポリシーにより自動 skip される。

## 6. 期待結果

| 観点 | 期待値 |
|---|---|
| `AdminTopbar.tsx` line coverage | 100% |
| `AdminTopbar.tsx` branch coverage | 100%（分岐A `??` 両側 + 分岐B 三項両側） |
| 全体 line coverage delta | ≥ 0 |

未達の場合は Phase 4（ハッピーパス）/ Phase 6（境界）の TC を追加・再実行する。特に branch 未達時は §3 の根拠表で未踏破の組（例：分岐B の false 経路）を特定し、対応する TC を補う。
