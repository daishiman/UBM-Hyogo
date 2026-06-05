# Phase 9: 品質保証

**[実装区分: 実装仕様書]**

> 実装完了後の品質ゲート結果を記録する。本タスクは NON_VISUAL（`apps/api` のみ・UI 変更なし）かつ「**ファイル削除なし**・既存編集のみ（新規ファイルも追加しない）」のため、削除確認は N/A。
> 本サイクルは `implemented_local_evidence_captured` であり、本 Phase の DoD チェックは実測済み。commit / push / PR / staging runtime / Issue mutation は user-gated。

## 1. DoD チェックリスト（DESIGN-BRIEF §7）

以下を**すべて緑**で実装完了とする。1 つでも失敗したら原因解消まで完了としない。

| # | DoD 項目 | 判定コマンド / 確認 | 期待 |
|---|----------|--------------------|------|
| 1 | focused D1 vitest 全 PASS | `mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts apps/api/src/routes/admin/tags.contract.spec.ts apps/api/src/routes/admin/members.tags.contract.spec.ts apps/api/src/repository/__tests__/auditLog.repository.spec.ts` | 4 files / 全 case PASS（R-1..R-6 + C-1..C-6 + Reg-1..Reg-2） |
| 2 | API typecheck | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | error 0 |
| 3 | lint | `mise exec -- pnpm lint` | exit 0 |
| 4 | static manifest | `mise exec -- pnpm verify:static-manifest` | PASS（drift 検出時のみ `pnpm regenerate:static-manifest` で再生成） |
| 5 | spec 改訂 | `docs/00-getting-started-manual/specs/01-api-schema.md` 不変条件 #13 を「code rename 可（audit 付き）」へ改訂済み | 改訂反映 |
| 6 | HEX 直書き 0 | apps/web 非接触のため**自明**（色トークン関連の変更なし） | N/A（自明 0） |

## 2. D1 config 必須（focused vitest の実行経路）

`tagDefinitions.write.repository.spec.ts` / `tags.contract.spec.ts` / `members.tags.contract.spec.ts` は **D1 config を要求**する。unit config では repository.spec / contract.spec が exclude されるため、必ず `--config=vitest.d1.config.ts` で実行する（DESIGN-BRIEF §6）。

| spec | 検証対象 | テスト ID |
|------|---------|----------|
| `tagDefinitions.write.repository.spec.ts`（edit） | `updateTagDefinition` の rename 成功 / code_conflict / stale / not_found / member_tags 保持 / 後方互換 | R-1..R-6 |
| `tags.contract.spec.ts`（edit） | PATCH code 200 / 409 tag_code_conflict / 409 tag_stale_conflict / 404 / audit code_renamed / code 未指定 label のみ | C-1..C-6 |
| `members.tags.contract.spec.ts`（regression） | rename 後の member tag 解決が tag_id 経由で成立（code に非依存） | Reg-1 |
| `auditLog.repository.spec.ts`（regression） | `admin.tag.code_renamed` 文字列 append が型エラーなく成立・row 取得可 | Reg-2 |

## 3. ファイル削除なし確認 — [FB-UI-02-1]

本タスクの inventory（DESIGN-BRIEF §4）は **全件 edit**（既存ファイルの後方互換拡張）で、ファイル削除・rename・新規追加はゼロ。

- 編集: `tagDefinitions.ts` / `tags.ts` / `01-api-schema.md` / `tagDefinitions.write.repository.spec.ts` / `tags.contract.spec.ts` / `members.tags.contract.spec.ts`（任意）
- regen（必要時のみ）: `static-manifest.json`
- **変更しない**: `auditLog.ts`（`AuditAction` は `RepoBrand<string>` で新 action 文字列に型変更不要）/ `apps/web`（非接触）

→ **削除に伴う参照断（dead import / 404 link）確認は N/A**。`updateTagDefinition` の戻り値型変更（`TagDefinitionRow | null` → discriminated union）は破壊的だが、call site は `apps/api/src/routes/admin/tags.ts:175` の 1 箇所のみで、同時編集により typecheck が整合を担保する。

## 4. lint / typecheck の green 基準 — [FB-UI-02-1]

- typecheck: `updateTagDefinition` の新返却型に対し、route 側の result map が exhaustive（網羅）であること、`UpdateTagDefinitionInput` の `code?` / `expectedCode?` 追加が既存 call site と後方互換であることを error 0 で担保。
- lint: `pnpm lint --fix` で解消できない手修正を含め violation 0。既存 warning-mode の warning が残っても exit 0 を緑基準とする。

## 5. AC-5 grep evidence（stale code 残存なし）

AC-5 の「seed / static manifest / admin UI 表示で stale code が残らない」確認:

```bash
# seed は OR IGNORE(PK=tag_id) で renamed code があっても revert/conflict せず無害
grep -n "INSERT OR IGNORE INTO tag_definitions" apps/api/migrations/0004_seed_tags.sql
# static manifest に code がハードコード参照されていないこと（drift は verify:static-manifest で検出）
mise exec -- pnpm verify:static-manifest
```

> seed drift は無害（PK=tag_id の idempotent insert-only）。admin UI は未整備で stale code を表示する導線が存在しない（apps/web 非接触）。

## 6. mirror parity（N/A）

skill mirror（`.claude/skills/**` / `.agents/**`）の更新は本タスクでは **Phase 12 で扱う**。本 Phase（品質保証）では mirror parity は対象外であり **N/A**。

## 7. 実測結果（実装サイクルで埋める）

§1 の DoD は本サイクルで実行済み。focused D1 Vitest 4 files / 37 tests PASS、API typecheck PASS、repo lint PASS、verify:static-manifest PASS を確認した。staging runtime smoke / commit / push / PR は user-gated。
