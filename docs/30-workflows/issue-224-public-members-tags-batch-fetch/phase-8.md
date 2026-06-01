# Phase 8: リファクタリング

> 親フェーズ: タスク仕様書（implemented_local_evidence_captured）
> 対象 Issue: #224 公開 members list の tags 一括取得（N+1 防止）

## 目的

実装後のコードを単一責務・可読性・重複排除の観点で見直す。本タスクは「`expand=tags` 指定時のみ tags を 1 query で一括取得し groupBy で割り当てる」最小変更であり、新規の構造的複雑性を持ち込まない。リファクタリングは原則 **最小限** とし、採否を以下に明示する。

## リファクタ候補と判定

| 対象 | Before | After | 判定 | 理由 |
|------|--------|-------|------|------|
| `expand` の許可値検証 | parse 内に `tags` 文字列を直書き | `EXPAND_WHITELIST = ['tags'] as const` を `search-query-parser.ts` 内に定数化 | 採用 | 将来 expand 対象が増えた際の参照箇所を 1 箇所に集約。型 `("tags")[]` の正本を定数由来にでき、文字列マジック値を排除できる |
| groupBy 処理 | use-case 内に inline で memberId → tags の Map 構築 | 現状維持（use-case 内 inline） | 不採用 | 1 回限りの単純な `reduce`/`Map` 構築であり、ヘルパー抽出は呼び出し側 1 箇所のみで再利用がない。抽出はオーバーエンジニアリング |
| `listTagsByMemberIds` の戻り値整形 | フラット配列を返す（変更なし） | 現状維持 | 不採用 | helper は無改変が前提（不変条件）。整形は use-case 側の責務に閉じる |
| `PublicMemberTagZ` の配置 | （新規） | `packages/shared/src/zod/viewmodel.ts` 内に既存 zod 群と同居 | 採用 | 既存 viewmodel 定義群と同一ファイルに置くことで型 export 経路を統一し、import 循環を避ける |

> `EXPAND_WHITELIST` 定数化は採用するが、これは実装フェーズの最小差分内に収める軽微な整理であり、新規ファイルや新規抽象を生やすものではない。

## DoD（Definition of Done）

- [ ] リファクタ採否が表で判定されている
- [ ] 不採用候補に理由が明記されている
- [ ] 採用候補（`EXPAND_WHITELIST` 定数化）が実装フェーズの最小差分内に収まる
- [ ] helper（`listTagsByMemberIds`）を無改変に保つ方針が明記されている

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test --run
mise exec -- pnpm --filter @ubm-hyogo/shared test --run
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 完了条件

リファクタリング判定が文書化され、最小差分方針（helper 無改変・新規抽象を生やさない）が維持されていること。
