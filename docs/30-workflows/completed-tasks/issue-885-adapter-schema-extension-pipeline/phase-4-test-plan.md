# Phase 4: テスト計画

## 1. 本タスクのテスト方針

本タスクは README 新規 + spec ファイル末尾コメント追加のメタタスクのため、**新規テストケースは追加しない**。代わりに以下 4 種の検証を行う:

| 種別 | 検証内容 | コマンド |
|---|---|---|
| 既存 spec 回帰 | 既存 8 ケース全て PASS | `pnpm --filter @ubm-hyogo/web test -- member-detail.spec.ts` |
| typecheck | コメント追加で型エラーが発生しないこと | `pnpm typecheck` |
| lint | コメントブロック ESLint 違反なし | `pnpm lint` |
| README presence | README が存在し最低限の章立てを持つこと | `test -f apps/web/src/lib/adapters/README.md && grep -q "5 ステップ" apps/web/src/lib/adapters/README.md && grep -q "責務 mapping" apps/web/src/lib/adapters/README.md` |

## 2. EXTENSION TEMPLATE の自己検証

template コメントブロックは「コメントのみ」のため vitest 実行時に評価されない。`// === EXTENSION TEMPLATE ===` / `// === END EXTENSION TEMPLATE ===` で囲み、Phase 6 で `grep -c "EXTENSION TEMPLATE" apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` が `2` を返すことを presence test 代わりに使う。

## 3. 既存 8 ケースの想定挙動

| # | spec 名 | 期待 |
|---|---|---|
| 1 | fixture が `PublicMemberProfileZ.parse` で valid | PASS |
| 2 | 既存 8 ケース統括 / `toMemberDetailProps` が正しい props を返す | PASS |
| 3 | `visibility=member` の `responseEmail` 除外 | PASS |
| 4 | `visibility=admin` のみで構成された `consent` section 除外 | PASS |
| 5 | unknown kind silent skip | PASS |
| 6 | 入力 mutate しない | PASS |
| 7 | `publicSections: []` → `sections: []` | PASS |
| 8 | 出力 field に `visibility` / `source` キー無し | PASS |

> 上記番号は Phase 2 §4 の責務 mapping 表と一致。Phase 5 実装時に最終確認する。

## 4. PR 全体 verify

Phase 9 / 10 で次を実行する:

```bash
pnpm install --force
pnpm typecheck
pnpm lint
pnpm --filter @ubm-hyogo/web test -- member-detail.spec.ts
bash scripts/verify-pr-ready.sh
```

すべて PASS を要件とする。
