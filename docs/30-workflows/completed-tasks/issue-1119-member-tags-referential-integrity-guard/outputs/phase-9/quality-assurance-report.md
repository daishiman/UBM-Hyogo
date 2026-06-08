# Phase 9 出力 — 品質保証レポート

> 親: [phase-9.md](../../phase-9.md)。typecheck / lint / spec green の判定基準と、NON_VISUAL backend ゆえ N/A とする検証項目を確定する。

## 1. 品質ゲートと合格基準

| ゲート | コマンド | 合格基準 | 実測（2026-06-06） |
|--------|----------|----------|--------------------------|
| typecheck | `pnpm --filter @ubm-hyogo/api typecheck` | exit 0・invariant #13 readonly guard green | PASS（exit 0・`tsc -p tsconfig.json --noEmit`） |
| lint | `pnpm lint` | exit 0・違反 0 | PASS（exit 0・dependency-cruiser OK / stable-key lint OK / no-inline-style OK / workspace lint OK） |
| orphan repository spec | `vitest run ... memberTags.orphan.repository.spec.ts` | TC-R/E 系 全 green | PASS（8 tests。TC-R01〜R08） |
| tags contract spec | `vitest run ... tags.contract.spec.ts` | TC-C 系 + 409 ガード 全 green | PASS（15 tests。TC-C01〜C04 + 既存 409 guard） |
| members contract spec | `vitest run ... members.contract.spec.ts` | fixture 編集なしで全 green | PASS（28 tests。fixture 差分なし） |
| tagDefinitions write spec | `vitest run ... tagDefinitions.write.repository.spec.ts` | issue-1070 count guard 非破壊 green | PASS（8 tests） |

### 一括検証コマンド

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/memberTags.orphan.repository.spec.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts \
  apps/api/src/routes/admin/members.contract.spec.ts \
  apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm lint
```

実測 focused vitest:

```text
Test Files  4 passed (4)
Tests       59 passed (59)
Duration    104.31s
```

## 2. invariant #13 readonly type guard 判定

- 追加 export = `detectOrphanMemberTags` / `countOrphanMemberTags`（read 2 関数）。
- 禁止 prefix（`insert`/`update`/`delete`/`upsert`/`assign`/`bulk`）に**非該当**。
- 合格基準: `memberTags.readonly.test-d.ts` を含む typecheck が exit 0・当該ファイル由来エラー 0 件。

## 3. NON_VISUAL backend ゆえ N/A の検証項目

| 検証項目 | 本タスク扱い | 根拠 |
|----------|--------------|------|
| HEX / `bg-[#xxx]` 焼き込み grep | N/A | 成果物に CSS / className / 色値なし。UI 描画変更ゼロ |
| localhost（`127.0.0.1:8888` 等）焼き込み grep | N/A | 変更は apps/api のみ。apps/web 非接触。URL ハードコードなし |
| mirror parity（`.agents/skills` ↔ `.claude/skills`） | N/A | apps/api 実装仕様書で skill mirror 資材を変更しない |
| design-tokens gate（`verify-design-tokens`） | N/A | 色トークン非接触 |
| Playwright visual / screenshot baseline | N/A | NON_VISUAL・UI 描画変更なし |

> N/A は検証回避ではなく「タスク種別上、検証対象が物理的に不在」の明示記録。

## 4. QA 総合合否基準

以下を全て満たすことを合格条件とする。

1. typecheck exit 0（readonly guard green）
2. lint exit 0
3. §1 の 4 spec 全ケース green
4. issue-1070 ガード spec 非破壊
5. `countOrphanMemberTags()` 不変条件（TC-R08）成立
6. §3 N/A 項目が根拠付きで記録済み

**総合判定: PASS。** commit / push / PR / deploy / 実 D1 orphan query は user-gated のため未実施。
