# Phase 9: 品質保証

> 親フェーズ: タスク仕様書（implemented_local_evidence_captured）
> 対象 Issue: #224 公開 members list の tags 一括取得（N+1 防止）

## 目的

実装が機能要件（AC-1〜AC-5）・非機能要件・後方互換を満たすことを、自動検証コマンドで一括判定する。本タスクは API 層のみの変更（NON_VISUAL）であり、UI 変更を含まない。

## 検証マトリクス

| 観点 | コマンド | 合格条件 |
|------|----------|----------|
| 型整合 | `mise exec -- pnpm typecheck` | エラー 0 |
| Lint | `mise exec -- pnpm lint` | エラー 0 / 警告 0 |
| API 単体テスト | `mise exec -- pnpm --filter @ubm-hyogo/api test --run` | 全 spec green（contract spec + use-case spec） |
| shared 単体テスト | `mise exec -- pnpm --filter @ubm-hyogo/shared test --run` | 全 spec green（zod schema） |
| N+1 検知 | 上記 use-case spec | `listTagsByMemberIds` が **1 回だけ** 呼ばれることを mock 呼び出し回数で assert（AC-2/AC-5） |
| 後方互換 | 上記 contract spec | `expand` 未指定時にレスポンスへ tags キーが付与されない（AC-3） |

## 後方互換チェック

- **`expand` 未指定時のレスポンス byte 互換**: tags キーを一切付与せず、既存の items 形状を維持する（AC-3）。
- **`appliedQuery` 6 キー contract test の回帰維持**: `appliedQuery` は `.strict()` を維持し、`q/zone/status/tags/sort/density/page/limit` の 6 系キー構造を変えない。`expand` は `appliedQuery` に **含めない**。既存 contract spec が回帰で守る。
- **visibility filter の維持**: 公開対象 member のみ返す既存フィルタは変更しない（AC-4）。tags の一括取得対象 memberId は visibility filter 通過後の集合から導出する。

## shared 型 consumer wiring（同一 wave 確認）

shared パッケージの型・schema 変更は単独では型エラーや未配線を招くため、以下を **同一 PR（同一 wave）** で揃える:

| レイヤ | ファイル | 内容 |
|--------|----------|------|
| zod 定義 | `packages/shared/src/zod/viewmodel.ts` | `PublicMemberTagZ` 新規 + `PublicMemberListItemZ.tags` optional |
| 型 export | `packages/shared/src/types/viewmodel/index.ts` | `PublicMemberListItem.tags?` |
| API view source | `apps/api/src/view-models/public/public-member-list-view.ts` | `PublicMemberListItemSource.tags?` |
| API parse | `apps/api/src/_shared/search-query-parser.ts` | `expand: ("tags")[]` |
| API use-case | `apps/api/src/use-cases/public/list-public-members.ts` | expand=tags 時の一括取得 + groupBy |

> shared 側だけ先行マージすると apps 側の参照が未配線になるため、上記を分割せず同一 PR に含める。

## `PublicMemberListItemZ` 非 strict と親 `.strict()` の影響整理

- `PublicMemberListItemZ` は `tags` を optional 追加するため **非 strict** を維持する（未知キー許容ではなく、`tags` を任意キーとして許す）。`expand` 未指定時に `tags` が無くても valid。
- 一方 `appliedQuery` は **`.strict()`** を維持する。`expand` は `appliedQuery` の対象外であり、`.strict()` 配下に `expand` を持ち込むと既存 contract が壊れるため、`expand` を `appliedQuery` へ混入させない。
- この 2 つの strictness 差（item は非 strict / appliedQuery は strict）が後方互換の要であり、テストで両側を固定する。

## DoD（Definition of Done）

- [ ] typecheck / lint / api test / shared test が全て green
- [ ] N+1 検知（helper 1 回呼び出し）を spec で assert（AC-2/AC-5）
- [ ] `expand` 未指定時に tags 非付与（AC-3）を contract spec で固定
- [ ] visibility filter 維持（AC-4）を確認
- [ ] shared 型 consumer wiring が同一 wave で揃っている
- [ ] `PublicMemberListItemZ` 非 strict / `appliedQuery` strict の差が維持される

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test --run
mise exec -- pnpm --filter @ubm-hyogo/shared test --run
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 完了条件

全検証コマンドが green で、後方互換チェック・consumer wiring・strictness 差の各項目を満たすこと。
