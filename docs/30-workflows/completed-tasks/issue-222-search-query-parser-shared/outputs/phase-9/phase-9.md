# Phase 9 — 品質保証

> SSOT: [`../../shared-context.md`](../../shared-context.md) §5.3 / §6 / §7 を正本とする。

## 1. line budget / link / mirror parity 観点

| 観点 | 内容 | 判定基準 |
|------|------|---------|
| line budget | 新規 `search-query-primitives.ts` は SSOT §3.1 の identifier 群に閉じた小規模ファイル。spec ドキュメントは各 phase-N.md 単位で簡潔に保つ | 肥大化なし（純関数 + tuple + 制限値のみ） |
| link | 各 phase-N.md の SSOT 相対リンク（`../../shared-context.md`）が解決すること | リンク切れ 0 |
| mirror parity | 本タスクは `.claude/skills/**` や `.agents/**` の mirror 対象ファイルを編集しない（コード対象は `packages/shared` / `apps/api` / `apps/web` のみ） | mirror 影響なし（parity 検査対象外） |

## 2. ファイル削除確認（FB-UI-02-1）

**本タスクは削除ファイルなし。** 全変更は「編集」または「新規」のみ。

| 区分 | ファイル |
|------|---------|
| 新規 | `packages/shared/src/public-search/search-query-primitives.ts` |
| 新規 | `packages/shared/src/public-search/index.ts` |
| 新規 | `packages/shared/src/public-search/__tests__/search-query-primitives.spec.ts` |
| 編集 | `packages/shared/package.json`（`exports` に `./public-search` 追加） |
| 編集 | `apps/api/src/_shared/search-query-parser.ts`（shared import へ置換） |
| 編集 | `apps/web/src/lib/url/members-search.ts`（shared import へ置換） |
| 削除 | なし |

> 既存ローカル定義は「削除」ではなく shared import への「置換」として同一ファイル内で処理される（ファイル単位の delete は発生しない）。

## 3. 検証コマンド一覧（SSOT §5.3 正本）と合格基準

| # | コマンド | 合格基準 |
|---|---------|---------|
| 1 | `mise exec -- pnpm exec vitest run packages/shared/src/public-search/__tests__/search-query-primitives.spec.ts` | SP-01〜SP-12 全 pass（AC-4） |
| 2 | `mise exec -- pnpm exec vitest run apps/api/src/_shared/__tests__/search-query-parser.spec.ts apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts` | 無変更で全 pass（AC-2） |
| 3 | `mise exec -- pnpm exec vitest run apps/web/src/lib/url/__tests__/members-search.spec.ts` | 無変更で全 pass（AC-6） |
| 4 | `mise exec -- pnpm --filter @ubm-hyogo/shared typecheck` | エラー 0 |
| 5 | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | エラー 0 |
| 6 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | エラー 0（AC-5 web import 可能） |
| 7 | `mise exec -- pnpm lint` | violation 0（boundary lint 含む・AC-5） |
| 8 | `grep -rn "ZONE_VALUES\|VALID_ZONES\|0_to_1" apps/api/src/_shared/search-query-parser.ts apps/web/src/lib/url/members-search.ts` | 重複定義 0 hit（AC-7） |

> typecheck（4-6）成功は AC-1（`@ubm-hyogo/shared/public-search` の export 解決）と AC-5（web から import 可能・boundary 維持）を同時に担保する。

## 4. grep gate（不変条件）

| 観点 | コマンド | 期待 |
|------|---------|------|
| 重複定義消滅（AC-7） | §3 #8 | 0 hit |
| HEX 直書き無関係（OKLch 非接触） | `grep -nE '#[0-9a-fA-F]{3,8}' packages/shared/src/public-search/search-query-primitives.ts` | 0 hit |
| test suffix 統一（不変条件 #8） | `find packages/shared/src/public-search -name "*.test.ts"` | 0 hit（`*.spec.ts` のみ） |
| web→api 直接参照禁止 | `grep -rn "apps/api\|@ubm-hyogo/api" apps/web/src/lib/url/members-search.ts` | 0 hit（shared 経由のみ） |

## 5. 不変条件チェック（SSOT §7）

| # | 不変条件 | 本タスクでの担保 |
|---|---------|-----------------|
| 1 | D1 直接アクセスは `apps/api` に閉じる | shared は zod primitives のみ・D1 非接触。コマンド 1/4 で確認 |
| 2 | `apps/web`→`apps/api` 直接 import 禁止（boundary lint） | shared 経由のみ。コマンド 7 + §4 grep で確認 |
| 3 | 既存 API endpoint surface / D1 schema 不変 | endpoint・schema を一切触らない（編集対象は parser/serializer の内部定数・関数のみ） |
| 4 | OKLch トークン無関係（.ts のみ・CSS/HEX 非接触） | §4 HEX grep で 0 hit 確認 |
| 5 | 新規 test は `*.spec.ts` のみ | §4 test suffix grep で確認 |

## 6. 視覚整合

`visualEvidence: NON_VISUAL`。UI/ルート変更がないため screenshot は不要（Phase 11 で NON_VISUAL 宣言 + 自動テスト件数を主証跡として記録）。

## 7. ゲート

- [ ] §3 の検証コマンド 1〜8 が全て合格基準を満たす
- [ ] §4 grep gate が全て期待値
- [ ] §5 不変条件 1〜5 を充足
- [ ] 削除ファイル 0（§2）

## 完了条件

- [x] 検証コマンド一覧（SSOT §5.3）と各合格基準を記載
- [x] 削除ファイル 0・mirror parity・line budget 観点を確認
- [x] 不変条件（D1 非接触・boundary lint・OKLch 無関係・`*.spec.ts` のみ）を充足判定
