# Phase 9 — 品質保証

> **[実装区分: 実装仕様書]**（`implementation_mode: new`）。typecheck / lint / 全 spec green の判定基準を固定し、NON_VISUAL backend タスクとして該当しない検証項目（HEX/localhost 焼き込み・mirror parity）を明示的に N/A 化する。

## 1. 品質ゲート一覧（判定基準）

| ゲート | コマンド | 合格基準 | 不合格時の対応 |
|--------|----------|----------|----------------|
| typecheck | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | exit 0・型エラー 0 件。特に `memberTags.readonly.test-d.ts`（invariant #13 readonly type guard）が green | 型注釈漏れ / export/import 不整合を最小差分で修正し再実行 |
| lint | `mise exec -- pnpm lint` | exit 0・lint 違反 0 件 | `pnpm lint --fix` → 残違反のみ手修正 |
| orphan repository spec | `vitest run --config=vitest.d1.config.ts apps/api/src/repository/__tests__/memberTags.orphan.repository.spec.ts` | 全ケース green（TC-R/E 系） | 失敗ケースを Phase 4/6 設計と突合し修正 |
| tags contract spec | `vitest run ... apps/api/src/routes/admin/tags.contract.spec.ts` | `GET /admin/tags/orphans`（TC-C 系）+ issue-1070 ガード（409・TC-C03）全 green | 同上 |
| members contract spec | `vitest run ... apps/api/src/routes/admin/members.contract.spec.ts` | fixture 編集なしで全 green | fixture 由来孤児が残る場合は実測前提を再確認し、必要最小の定義追加に切り替える |
| tagDefinitions write spec | `vitest run ... apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts` | issue-1070 count guard 非破壊（TC 既存）全 green | 撤去・改変していないか diff 確認 |

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

## 2. invariant #13 typecheck（readonly type guard）の合格判定

`memberTags.readonly.test-d.ts` は、`insert*`/`update*`/`delete*`/`upsert*`/`assign*`/`bulk*` prefix の新規 export を `expectTypeOf` 系で禁止する型レベルガードである。本タスクの追加 export は `detectOrphanMemberTags` / `countOrphanMemberTags` の **read 2 関数**であり、いずれも禁止 prefix に非該当。

- **合格基準**: typecheck（`.test-d.ts` を含む）が exit 0。新規 export が禁止 prefix ガードを発火させない。
- **確認方法**: typecheck ログに `memberTags.readonly.test-d.ts` 由来のエラーが 0 件であること。

## 3. NON_VISUAL backend ゆえ N/A とする検証項目（明示）

| 検証項目 | 通常の対象 | 本タスクでの扱い | 根拠 |
|----------|------------|------------------|------|
| HEX 直書き / `bg-[#xxx]` 焼き込み grep | UI/VISUAL タスク（design-tokens gate） | **N/A** | 追加成果物は D1 read 関数・JSON endpoint・テストのみで CSS / className / 色値を一切含まない。レンダリング画面の変更ゼロ |
| `127.0.0.1:8888` 等 localhost 焼き込み grep | `apps/web/src` ランタイム | **N/A** | 変更は `apps/api` のみ。`apps/web` 非接触（invariant #5）。エンドポイント URL のハードコードなし |
| mirror parity（`.agents/skills` ↔ `.claude/skills`） | skill 資材変更タスク | **N/A** | 本タスクは `apps/api` 実装仕様書であり skill mirror 資材を変更しない。skill index drift 非該当 |
| design-tokens gate（`verify-design-tokens`） | 色トークン変更 | **N/A** | 色トークン非接触 |
| Playwright visual / screenshot baseline | VISUAL タスク | **N/A** | NON_VISUAL（Phase 1 §5 宣言）。UI 描画変更なし |

> N/A は「検証を怠った」のではなく「タスク種別上、検証対象が物理的に存在しない」ことの明示記録（Feedback 4 整合）。

## 4. QA 合否の総合判定基準

以下を **全て満たす** ことを合格条件とする。

1. typecheck exit 0（invariant #13 readonly guard 含む green）。
2. lint exit 0。
3. §1 の 4 spec が全ケース green。
4. issue-1070 ガード spec（409 / count guard）が非破壊で green。
5. `countOrphanMemberTags()` 不変条件（TC-R08）成立（helper 誤用時も孤児 0）。
6. §3 の N/A 項目が「対象不在」根拠付きで記録されている。

## 完了条件（Phase 9）

- [ ] typecheck / lint / 4 spec の合格基準を固定した
- [ ] invariant #13 readonly type guard の green 判定基準を明記した
- [ ] HEX / localhost 焼き込み・mirror parity・design-tokens gate を NON_VISUAL backend ゆえ N/A と根拠付きで明示した
- [ ] QA 総合合否基準（6 条件）を固定した
- [ ] 出力: [outputs/phase-9/quality-assurance-report.md](outputs/phase-9/quality-assurance-report.md)
