# Phase 9: 品質保証

> 実装完了後の品質ゲート結果を記録する。本タスクは NON_VISUAL（API only）かつ「ファイル削除なし・新規追加 + 既存編集のみ」のため、削除確認は N/A。

## 1. 一括判定方針

以下 3 系統を **すべて緑** で実装完了とする。1 つでも失敗したら原因解消まで完了としない。

| 系統 | 判定 | コマンド |
|------|------|---------|
| 型チェック | `@ubm-hyogo/api` の TypeScript エラー 0 | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` |
| Lint | repo 全体の lint 違反 0（`--fix` で解消できない手修正含む） | `mise exec -- pnpm lint` |
| 対象 vitest | 新規 + regression test がすべて pass | 下記 §2 |

## 2. targeted vitest（FB-UI-02-2 / メモリ制約対策）

全件 `pnpm test` は重いため、対象指定で実行する:

```bash
mise exec -- pnpm exec vitest run \
  apps/api/src/routes/admin/tags.contract.spec.ts \
  apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts \
  apps/api/src/routes/admin/members.tags.contract.spec.ts \
  apps/api/src/repository/__tests__/auditLog.repository.spec.ts
```

| spec | 検証対象 |
|------|---------|
| `tags.contract.spec.ts`（新規） | AC-1..AC-5 の endpoint contract（status / response shape / audit 件数） |
| `tagDefinitions.write.repository.spec.ts`（新規） | repository write 5 関数の SQL 挙動・冪等性・code 衝突 |
| `members.tags.contract.spec.ts`（regression） | **AC-7**: 既存 `GET /admin/members/:memberId/tags` の response shape に regression 無し |
| `auditLog.repository.spec.ts`（regression） | `AuditTargetType` に `"tag"` 追加後も既存 audit append/export が無回帰 |

> type-d gate 確認（C-1）: `memberTags.readonly.test-d.ts` への無影響を確認するため、必要に応じて `mise exec -- pnpm --filter @ubm-hyogo/api test -- --typecheck`（既存 type-d 実行経路）も走らせる。`tagDefinitions.ts` には readonly gate が無いため write 関数追加で FAIL しないことを実測で残す。

## 3. ファイル削除なし確認（FB-UI-02-1）

本タスクの inventory（Phase 1 §inventory）は **新規追加 + 既存編集のみ**で、ファイル削除・rename はゼロ。

- 新規: `tags.ts` / `tags.contract.spec.ts` / `tagDefinitions.write.repository.spec.ts`
- 編集: `tagDefinitions.ts` / `auditLog.ts` / `index.ts` / `specs/01-api-schema.md`

→ **削除に伴う参照断（dead import / 404 link）確認は N/A**。新規 import（`adminTagsRoute`）が `index.ts` で正しく解決されることのみ typecheck で担保する。

## 4. D1 直接アクセスが `apps/api` に閉じる確認（AC-6 / CLAUDE.md invariant #5）

`apps/web` から tag master write を参照していないこと、D1 binding が `apps/web` に漏れていないことを grep で確認する:

```bash
# apps/web 配下に tag master write endpoint / repository への参照が無いこと（0 hit を期待）
grep -rn "createTagDefinition\|updateTagDefinition\|deactivateTagDefinition\|listTagDefinitionsPaged\|getTagDefinitionByIdRaw" apps/web/src || echo "OK: no tag-master-write reference in apps/web"

# apps/web から /admin/tags への write 直叩き（POST/PATCH/DELETE）が無いこと（read fetch は別 / admin proxy 経由のみ許容）
grep -rn "DB\b" apps/web/src | grep -i "tag" || echo "OK: no D1 binding for tags in apps/web"
```

> 期待: tag master write の D1 アクセスは `apps/api/src/repository/tagDefinitions.ts` に閉じ、`apps/web` には repository 関数・D1 binding の参照が一切無い。admin UI（将来の inline-create 導線）は本タスクのスコープ外（未タスク）であり、本サイクルでは `apps/web` 非接触。

## 5. 不変条件 #13 のコード ↔ spec 同期確認

不変条件 #13 が**コード側コメント**と**正本 spec** で同一定義になっていることを確認する（drift 防止）:

| 同期面 | 場所 | 確認内容 |
|--------|------|---------|
| コード | `apps/api/src/repository/tagDefinitions.ts`（48 行付近の改訂コメント） | 「tag master CRUD = 第3経路。`create/update/deactivate` のみ許可。code immutable。論理削除 active=0 / member_tags row 保持。admin route + audit 必須」 |
| spec | `docs/00-getting-started-manual/specs/01-api-schema.md`（不変条件 #13 節） | 同一文言の「3. 管理者による tag master CRUD」節 + endpoints/audit action テーブル |

確認コマンド（両者に `immutable` / `active=0` / `admin.tag.` の語が揃っていること）:

```bash
grep -n "不変条件 #13\|immutable\|active=0" apps/api/src/repository/tagDefinitions.ts
grep -n "不変条件 #13\|tag master\|admin.tag." docs/00-getting-started-manual/specs/01-api-schema.md
```

> 両者で「code immutable」「論理削除 active=0」「audit action `admin.tag.created/updated/deactivated`」が一致していることを目視 + grep で確認する。不一致があれば spec を正本として合わせる。

## 6. 実測結果

§1〜§5 の主要 gate は Phase 11 で実測済み。focused D1 Vitest は 4 files / 32 tests PASS、`@ubm-hyogo/api` typecheck PASS、repo lint PASS。staging runtime smoke / commit / push / PR は user-gated。
