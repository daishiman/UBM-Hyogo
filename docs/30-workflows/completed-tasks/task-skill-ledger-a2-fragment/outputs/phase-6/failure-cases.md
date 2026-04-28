# Failure Cases（F-1 〜 F-11）

| ID | テスト | 期待 | 実装 |
| -- | ------ | ---- | ---- |
| F-1 | nonce 4 回連続衝突 | `CollisionError` throw | `skill-logs-append.test.ts` C-3 |
| F-2 | front matter `timestamp` 欠損 | path を stderr + exit 1 | `skill-logs-render.test.ts` C-7 |
| F-3 | front matter `branch` 欠損 | 同上 | F-2 と同じパス（`parseFragment` の `REQUIRED_KEYS` 検証で網羅） |
| F-4 | front matter `author` 欠損 | 同上 | 同上 |
| F-5 | front matter `type` 欠損 | 同上 | 同上 |
| F-6 | front matter YAML parse error | path を stderr + exit 1 | `skill-logs-render.test.ts` C-8 |
| F-7 | path 240 byte 超 | append helper が事前 reject + throw | `fragment-path.ts:isWithinPathByteLimit` |
| F-8 | escaped-branch 64 文字超 | trailing trim で 64 文字に収束 | `branch-escape.test.ts`（append.test.ts 内） |
| F-9 | `--out` が `LOGS.md` を指す | exit 2 | `skill-logs-render.test.ts` C-9 |
| F-10 | `--out` が `SKILL-changelog.md` を指す | exit 2 | `skill-logs-render.test.ts` F-10 |
| F-11 | `--since` 不正 ISO | throw `invalid --since` | `skill-logs-render.test.ts` F-11 |

## エラーメッセージ仕様

| 状況 | stderr メッセージ |
| ---- | ----------------- |
| timestamp 欠損 | `<rel-path>: missing required front matter key: timestamp` |
| YAML parse 失敗 | `<rel-path>: front matter parse failed: <reason>` |
| `--out` tracked 拒否 | `--out refuses to overwrite tracked canonical ledger: <path>` |
| `--since` 不正 | `invalid --since value (not ISO8601): <input>` |
| nonce 4 回衝突 | `collision unresolved after 4 attempts` |

## 検証コマンド

```bash
mise exec -- pnpm vitest run scripts/skill-logs-render.test.ts scripts/skill-logs-append.test.ts
```

16/16 Green を確認済。
