# Phase 5: データモデル

## 5.1 不変宣言

| 項目 | 不変 |
| --- | --- |
| 閾値の正本は `aiworkflow-requirements` のみ | 他 source は実行設定（executor / display） |
| 閾値の型は `number`（整数 or 小数） | `string` 比較は禁止。全 source を `Number()` 正規化する |
| `LintResult.sources` の順序 | aiworkflow-requirements, coverage-guard.sh, codecov.yml の固定順 |
| `value: null` の意味 | optional source（codecov.yml）が不在の場合のみ |
| `mismatches` の生成基準 | non-null values の組み合わせから不一致ペアを文字列化 |

## 5.2 型定義（TypeScript）

```ts
export type ThresholdSourceName =
  | "aiworkflow-requirements"
  | "coverage-guard.sh"
  | "codecov.yml";

export type ThresholdSource = {
  name: ThresholdSourceName;
  path: string;
  value: number | null;
};

export type LintResult = {
  ok: boolean;
  sources: ThresholdSource[];
  mismatches: string[];
};

export type ParseError = {
  source: ThresholdSourceName;
  path: string;
  reason: string;
};

export type LintFailure =
  | { kind: "drift"; result: LintResult }
  | { kind: "parse"; errors: ParseError[] };
```

## 5.3 正本パース構造

`quality-requirements-advanced.md` 内の coverage 表は次の構造を想定:

```markdown
| パッケージ           | lines | branches | functions | statements |
| -------------------- | ----- | -------- | --------- | ---------- |
| apps/web             | 80    | 80       | 80        | 80         |
| apps/api             | 80    | 80       | 80        | 80         |
| packages/shared      | 80    | 80       | 80        | 80         |
```

抽出ロジック:

1. 全行を read
2. `\|\s*(apps/web|apps/api|packages/shared)\s*\|` にマッチする行を集める
3. 各行から `\|\s*([0-9]+(?:\.[0-9]+)?)\s*\|` を 4 つ抽出
4. 全 12 セルが同値であれば「正本値」として確定
5. 1 つでも食い違うか、行が見つからない場合は parse failure（exit 2）

> 注: 正本表の列順 / 行 anchor は本タスクで固定化しない。lint 側で「`apps/web` / `apps/api` / `packages/shared` の 3 行が存在し、それぞれ 4 列の数値全てが同値であること」を要件として吸収する。

## 5.4 executor パース構造

`scripts/coverage-guard.sh` の line 22 に `THRESHOLD=80` がある。抽出ロジック:

1. 全行を read
2. `/^THRESHOLD=([0-9]+(?:\.[0-9]+)?)/m` で最初の hit を確定
3. group 1 を `Number()` 正規化

## 5.5 codecov.yml パース構造（任意）

未配置のため将来形のみ規定:

```yaml
coverage:
  status:
    project:
      default:
        target: 80%
    patch:
      default:
        target: 80%
```

抽出ロジック:

1. ファイル不在 → `value: null` でスキップ（2-source モード）
2. 存在 → 全行 read
3. `/^\s*target:\s*['"]?([0-9]+(?:\.[0-9]+)?)['"]?\s*%?\s*$/mg` で全 hit を抽出
4. 抽出値が全て同値なら採用、食い違いは parse failure（exit 2）
5. 1 つも見つからなければ parse failure（exit 2）

## 5.6 比較ロジック

```
nonNullValues = sources.filter(s => s.value !== null).map(s => s.value);
ok = nonNullValues.every(v => v === nonNullValues[0]);

mismatches = []
for i, j of pairs(nonNullValues):
  if sources[i].value !== sources[j].value:
    mismatches.push(`${sources[i].name} (${sources[i].value}) != ${sources[j].name} (${sources[j].value})`)
```

## 5.7 不変条件と D1 / Auth 境界

| 境界 | 影響 |
| --- | --- |
| D1 schema | 無関係（read-only / shell script + Markdown） |
| Auth.js | 無関係 |
| `apps/web` env アクセス（CLAUDE.md task-02） | 無関係（`getEnv()` 経路を使わない） |
| `apps/api` Hono routes | 無関係 |
