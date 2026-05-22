# Implementation Guide — Issue #622 packages test suffix rename

## Part 1: 中学生レベル

### なぜ必要か

学校のプリントを集めるとき、同じ種類のプリントなのに「テスト用」「確認用」など名前がばらばらだと、先生も生徒も探すのに時間がかかる。このタスクも同じで、テスト用ファイルの名前が `apps` 側では `.spec.ts`、`packages` 側では `.test.ts` のまま残っているため、後で探す人や自動確認の道具が迷いやすい。

### 何をするか

`packages/shared` と `packages/integrations` にある 28 個のテスト用ファイルを、名前だけ `.test.ts` から `.spec.ts` にそろえる。中身は変えない。名前を変えるときは `git mv` を使い、過去の変更履歴がたどれるようにする。

### 今回作ったもの

たとえば、なくし物をしないように持ち物リストを作るのと同じで、今回は名前変更を実行し、後から確認できるリストと説明書もそろえた。

- `artifacts.json`: この作業の状態を書く台帳
- `outputs/phase-05/rename-mapping.csv`: 28 個の名前変更リスト
- `outputs/phase-11/`: 実行ログと確認結果
- `outputs/phase-12/`: 実装ガイド、同期記録、確認表

### 専門用語セルフチェック

| 用語 | 日常語での言い換え |
| --- | --- |
| package | 役割ごとに分けた道具箱 |
| rename | ファイルの名前変更 |
| `git mv` | 履歴を残しながら名前を変える命令 |
| suffix | ファイル名の最後につく目印 |
| ADR | なぜその決め方にしたかを書くメモ |

## Part 2: 技術者向け

### TypeScript の型定義

```ts
type RenameCategory = "unit" | "db" | "zod" | "mapper" | "contract";

interface RenameMappingRow {
  package: "shared" | "integrations";
  before: string;
  after: string;
  category: RenameCategory;
}
```

### CSV schema

`outputs/phase-05/rename-mapping.csv` は `package,before,after,category` の 4 列、header + 28 data rows とする。`before` / `after` が `git mv` の唯一の入力で、`category` は ADR 補助情報に限定する。

### CLIシグネチャ

```bash
git mv <before> <after>
mise exec -- pnpm --filter '<package-name>' test
```

### 使用例

```bash
CSV="docs/30-workflows/issue-622-packages-test-suffix-rename/outputs/phase-05/rename-mapping.csv"
tail -n +2 "$CSV" | while IFS=, read -r pkg before after category; do
  git mv "$before" "$after"
done
```

### テスト構成

```bash
find packages -name '*.test.ts' -o -name '*.test.tsx' | wc -l
find packages -name '*.spec.ts' -o -name '*.spec.tsx' | wc -l
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm -r test
mise exec -- pnpm --filter '@ubm-hyogo/shared' test
mise exec -- pnpm --filter '@ubm-hyogo/integrations' test
mise exec -- pnpm --filter '@ubm-hyogo/integrations-google' test
```

### エラーハンドリング

- If a target path already exists, stop before overwriting and inspect the collision.
- If `git mv` fails on a case-insensitive filesystem, use a temporary intermediate name.
- If test count changes after rename, revert the local rename batch and compare `rename-mapping.csv` with `find packages/shared packages/integrations -name '*.test.ts' -o -name '*.test.tsx'`.

### エッジケース

| Case | Handling |
| --- | --- |
| `auth.contract.test.ts` | Rename to `auth.contract.spec.ts`; keep the existing `contract` marker. |
| nested google package | Run `@ubm-hyogo/integrations-google` separately so nested package tests are not missed. |
| future prefix design | Keep as ADR Non-goal; do not mix with rename-only implementation. |

### 設定項目と定数一覧

| Constant | Value |
| --- | --- |
| expected rename rows | 28 |
| expected `*.test.ts(x)` after rename | 0 |
| expected `*.spec.ts(x)` after rename | 28 |
| downstream convergence issue | #623 |
