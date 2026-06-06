# Phase 9: 品質保証

> 実装完了後の品質ゲート方針を確定する。本タスクは NON_VISUAL（API only）かつ「ファイル削除なし・新規追加 + 既存編集のみ」のため、削除確認は N/A。physical delete は **不可逆操作** であり、production runtime mutation のみ user-gated とする安全性レビューを本 Phase の必須項目に含める。

## 成果物

reactivate + physical delete 実装後に通すべき品質ゲートのチェックリストと、不可逆操作の安全性レビュー基準。spec_created 段階のため本 Phase は「実装後に何をどの基準で緑判定するか」を確定する（実測は Phase 11 で Gate-B 証跡として追記）。

## 1. 一括判定方針

以下 3 系統を **すべて緑** で実装完了とする。1 つでも失敗したら原因解消まで完了としない。

| 系統 | 判定 | コマンド |
|------|------|---------|
| 型チェック | `@ubm-hyogo/api` の TypeScript エラー 0 | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` |
| Lint | repo 全体の lint 違反 0（`--fix` で解消できない手修正含む） | `mise exec -- pnpm lint` |
| 対象 vitest（D1） | 新規 lifecycle test + regression がすべて pass | 下記 §2 |

## 2. targeted D1 vitest（メモリ制約対策 / D1 binding 必須）

repository / route は D1 binding に依存するため、unit config ではなく D1 config で対象指定実行する（全件 `pnpm test` は重いため対象指定）:

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/tagDefinitions.lifecycle.repository.spec.ts \
  apps/api/src/routes/admin/tags.lifecycle.contract.spec.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts \
  apps/api/src/repository/__tests__/auditLog.repository.spec.ts
```

| spec | 区分 | 検証対象 |
|------|------|---------|
| `tagDefinitions.lifecycle.repository.spec.ts` | 新規 | `reactivateTagDefinition`（404 / idempotent no-op / active=0→1）・`countMemberTagReferences`（0 / >0）・`physicalDeleteTagDefinition`（not_found / has_references 拒否 / 参照0 削除 + code 解放）の SQL 挙動 |
| `tags.lifecycle.contract.spec.ts` | 新規 | AC-1..AC-5 の endpoint contract。`POST /tags/:tagId/reactivate`（200 / 404 / no-op で audit 0 / 復帰で audit 1）・`DELETE /tags/:tagId/physical`（204 / 404 / 409 `tag_has_references`+`referenceCount` / 成功で audit 1） |
| `tags.contract.spec.ts` | regression | **AC-6**: 既存 `DELETE /admin/tags/:tagId`（論理・204 + active=0）・`GET /admin/tags` の available `active=1` filter に regression 無し |
| `auditLog.repository.spec.ts` | regression | `AuditTargetType`/`AuditAction`（`RepoBrand<string>`）に `reactivated` / `physically_deleted` action を渡しても既存 append/export が無回帰 |

> `AuditAction` は `RepoBrand<string>` で enum を持たないため、新 action 追加による brand 型変更は不要（route の literal union 拡張のみ）。type-d gate（`tagDefinitions.ts` に readonly gate なし）に write 関数追加で FAIL しないことを実測で残す。

## 3. ファイル削除なし確認

本タスクの inventory（Phase 1 §1.5）は **新規追加 + 既存編集のみ**で、ファイル削除・rename はゼロ。

- 新規: `tagDefinitions.lifecycle.repository.spec.ts` / `tags.lifecycle.contract.spec.ts`
- 編集: `tagDefinitions.ts`（lifecycle 3 関数 + 型）/ `tags.ts`（2 endpoint + audit union + `ERROR_TO_STATUS`）/ `specs/01-api-schema.md`

→ **削除に伴う参照断（dead import / 404 link）確認は N/A**。新 endpoint は既存 `adminTagsRoute` 内追加で mount 行も増えず、`index.ts` への変更なし（再利用）。

## 4. D1 直接アクセスが `apps/api` に閉じる確認（CLAUDE.md invariant #5）

`apps/web` から reactivate / physical delete repository・endpoint を参照していないこと、D1 binding が `apps/web` に漏れていないことを grep で確認する:

```bash
# apps/web 配下に lifecycle repository への参照が無いこと（0 hit を期待）
grep -rn "reactivateTagDefinition\|physicalDeleteTagDefinition\|countMemberTagReferences" apps/web/src \
  || echo "OK: no tag-lifecycle reference in apps/web"

# apps/web から /admin/tags の reactivate / physical 直叩きが無いこと（admin proxy 経由のみ許容・本サイクル UI 非接触）
grep -rn "/reactivate\|/physical" apps/web/src | grep -i "tag" \
  || echo "OK: no reactivate/physical tag call in apps/web"

# DELETE FROM tag_definitions が apps/api の repository にのみ存在すること
grep -rn "DELETE FROM tag_definitions" apps --include=*.ts
```

> 期待: lifecycle の D1 アクセスは `apps/api/src/repository/tagDefinitions.ts` に閉じ、`apps/web` には repository 関数・D1 binding・新 endpoint 呼び出しが一切無い。admin UI からの reactivate / physical 導線は本タスクスコープ外（#1068 の関心事）であり、本サイクルでは `apps/web` 非接触。

## 5. audit append-only / 参照整合（孤児化禁止）QA チェックリスト

| 観点 | 確認内容 | 確認手段 |
|------|---------|---------|
| audit append-only | reactivate / physical 成功時のみ audit 1 件 append。既存 audit 行の UPDATE/DELETE をしない（append のみ） | lifecycle contract spec の audit 件数 assert（no-op reactivate / 409 physical で audit 0） |
| audit before/after | `admin.tag.reactivated`=`{active:false}→{active:true}`、`admin.tag.physically_deleted`=削除前 full row→`null` | contract spec の before/after shape assert |
| state 変化時のみ発火 | 既に active な tag の reactivate（no-op）・参照ありの physical（409）では audit を発火させない | spec の `expect(auditCount).toBe(0)` |
| 参照整合（孤児化禁止） | physical delete は `countMemberTagReferences>0` で **削除前に 409 拒否**。member_tags row を touch しない（孤児 row を作らない） | repository spec で「参照あり tag を physical → 行残存 + member_tags 不変」を assert |
| logical / physical の code 占有差 | logical（active=0）は `code` UNIQUE 占有継続、physical は row 削除で `code` 解放（再作成可能） | repository spec で「physical 後に同 code で create が成功 / logical 後は 409」を assert |

```bash
# audit action 文字列がコードと spec で一致していること（drift 防止）
grep -n "admin.tag.reactivated\|admin.tag.physically_deleted" apps/api/src/routes/admin/tags.ts
grep -n "admin.tag.reactivated\|admin.tag.physically_deleted" docs/00-getting-started-manual/specs/01-api-schema.md

# member_tags 参照ガードが application-level count であること（DB-FK 不在の防壁）
grep -n "COUNT(\*) AS n FROM member_tags WHERE tag_id" apps/api/src/repository/tagDefinitions.ts
```

## 6. 不可逆操作の安全性レビュー（physical deletion 2-stage）

physical delete は **production で実行すると復元不能**（row 削除 + code 解放）であるため、以下の安全境界を実装完了の必須条件とする。`references/non-visual-irreversible-task-rules.md` を適用する。

| 安全境界 | 基準 | 確認 |
|---------|------|------|
| コード/ガード/audit/test は実装可能 | repository ガード・endpoint・contract test は本サイクルで実装し緑にする。コード実装自体は user-gate 対象外 | §2 の lifecycle spec が PASS |
| production runtime mutation は user-gated | staging/production への実際の tag 物理削除リクエスト発行は user 承認後のみ。`governance_mutation_user_gate=true` | Phase 13 の user approval marker・本サイクルで production mutation を実行しない |
| runbook 必須 | physical delete の前提（参照0確認 → backup → 実行 → audit 確認 → rollback 手段）を `outputs/phase-12/physical-delete-runbook.md` に規定 | Phase 12 で runbook 作成・runbook なしで production 実行しない |
| 参照あり強制削除の禁止 | 参照>0 の tag は 409 拒否で arrest。強制移行（member_tags 移行）は本サイクル外・別 Issue（合意未済の不可逆分岐 / CONST_007 例外） | spec / runbook に「強制移行はスコープ外」を明記 |
| AI 自動実行の防止 | AI エージェントが physical delete を自動で本番実行しないこと。コード/test の緑化までを自動範囲とし、production mutation は明示承認境界で停止 | Phase 13 user-gated 宣言・runbook の承認 marker |

## 7. 実測結果（Phase 11 で追記）

§1〜§6 の主要 gate は Phase 11（Gate-B 証跡）で実測する。spec_created 段階のため現時点は **pending**。実装完了後に focused D1 Vitest 件数・`@ubm-hyogo/api` typecheck・repo lint・grep gate 結果を Phase 11 `manual-test-result.md` に記録する。staging/production runtime smoke / physical delete production mutation / commit / push / PR は user-gated。
