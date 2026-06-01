# Phase 7: カバレッジ確認

| 項目 | 値 |
| --- | --- |
| 追加プロダクションコード | **0 行**（テストファイルのみ追加） |
| カバレッジ閾値への影響 | なし（プロダクション分母が増えない） |

## カバレッジ対象

本ワークフローの成果物は新規テストファイル `apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts` のみ。
`src` 配下のプロダクションモジュールは追加・変更しない。`extractCrons` はテストファイル内に閉じた
ローカル関数であり、カバレッジ計測の対象（`src` の被テストコード）には含まれない。

したがって:

- プロダクションコードの分母が増えないため、**ライン / ブランチカバレッジの割合は低下しない**。
- 新規 spec はそれ自身が実行されて pass するだけで、既存モジュールのカバレッジに干渉しない。

## `extractCrons` 関数の分岐網羅表（テストファイル内ロジックの自己網羅）

`extractCrons` はカバレッジ計測対象外だが、ガードの信頼性のため TC-7 で全分岐を網羅する。

| 分岐 | 条件 | 網羅 TC |
| --- | --- | --- |
| B-1: section 見出し不在 | `start === -1` → `return []` | TC-7b |
| B-2: section 見出し発見 | `start !== -1` | TC-1/2/3, TC-7a/c/d/e |
| B-3: 次 section で範囲打切 | range 内に `^\[` 行あり → `end = i` | TC-7e |
| B-4: EOF まで範囲継続 | 次 section なし → `end = lines.length` | TC-7a（末尾セクション） |
| B-5: コメント / 別 key 行を除外 | `startsWith("#")` / `^crons\s*=` 不一致を filter | TC-7c, TC-7d |
| B-6: crons 行不在 | range 内に crons 行なし → `return []` | TC-7b（section はあるが crons なし系も同経路） |
| B-7: クォート内文字列抽出ループ | `quoteRe.exec` で全要素 push | TC-1/2/3, TC-7a |
| B-8: 空要素スキップ | `value.length > 0` false → push しない | （防御。空配列要素は実 wrangler に無いが TC-7 雛形で検証可能） |

> B-8 は現行 wrangler.toml に該当ケースが無いため、必要なら TC-7 にサブケース（`crons = ["", "0 18 * * *"]` → `["0 18 * * *"]`）を追加して網羅可能。

## coverage-guard との関係

- `scripts/coverage-guard.sh`（pre-push / CI）は「カバレッジが下がっていないか」を見る gate。
- 本変更は **spec test の追加のみ**でプロダクションコードを増やさないため、分母不変・分子は spec 実行で増えこそすれ減らない。
  → coverage-guard を fail させる経路は無い（カバレッジ低下を起こさない）。
- sync-merge 時の coverage-guard 一時低下スキップ（CLAUDE.md 記載）にも該当しない（merge commit 不要の単純追加）。

## 実行コマンド

```bash
# guard spec のみ実行（ファイル path 指定）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts
```

| 観点 | 期待 |
| --- | --- |
| 実行結果 | TC-1..7（サブケース含む）すべて pass |
| カバレッジ | 既存閾値を下回らない（プロダクション分母不変） |
| 依存 | 追加なし（`node:fs` / `node:url` / `node:path` 標準のみ） |

## DoD（Phase 7）

- 追加プロダクションコード 0・カバレッジ閾値非影響であることを明記。
- `extractCrons` の分岐網羅表（B-1..8）と網羅 TC の対応を提示。
- coverage-guard とカバレッジ低下が起きない理由を明記。
- 実行コマンド `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts` を提示。
