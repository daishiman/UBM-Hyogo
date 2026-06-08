# Phase 9: 品質保証

> 実装完了後の品質ゲート方針を確定する。本タスクは NON_VISUAL（API only / `apps/web` 非接触）かつ「ファイル削除なし・新規 2 関数追加 + 既存編集 + 既存 spec へのケース追記のみ」のため、削除確認は N/A。強制移行 + 物理削除は **不可逆操作** であり、production runtime mutation のみ user-gated とする安全性レビューを本 Phase の必須項目に含める。

## 成果物

強制移行 + 物理削除実装後に通した品質ゲートのチェックリストと、不可逆操作の安全性レビュー基準。本 Phase は「local 実装で何を緑判定したか」を確定し、実測は Phase 11 で Gate-B 証跡として記録する。

## 1. 一括判定方針

以下 4 系統を **すべて緑** で実装完了とする。1 つでも失敗したら原因解消まで完了としない。

| 系統 | 判定 | コマンド |
|------|------|---------|
| 型チェック | `@ubm-hyogo/api` の TypeScript エラー 0 | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` |
| Lint | repo 全体の lint 違反 0（`--fix` で解消できない手修正含む） | `mise exec -- pnpm lint` |
| 対象 vitest（D1） | write repository test + contract test がすべて pass | 下記 §2 |
| HEX 直書きなし | 変更ファイルに色 HEX / `bg-[#...]` 等の直書きが無いこと（API only で本来不要だが gate として確認） | 下記 §5 |

## 2. targeted D1 vitest（メモリ制約対策 / D1 binding 必須）

repository / route は D1 binding に依存するため、unit config ではなく D1 config で対象指定実行する（全件 `pnpm test` は重いため対象指定 / FB-UI-02-2）:

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts
```

| spec | 区分 | 検証対象 |
|------|------|---------|
| `tagDefinitions.write.repository.spec.ts` | 追記 | `migrateMemberTagReferences`（非衝突全件移動 / `(member_id,dest)` 衝突を `INSERT OR IGNORE`+`DELETE` で吸収 / 参照 0 → `migratedCount=0`・移行前 source 参照数 一致）・`forceMigrateAndPhysicalDeleteTagDefinition`（src/dest not_found / dest inactive / `src===dest` / 正常二段で移行 + 削除 / 移行後 0 再検証）の SQL 挙動 |
| `tags.contract.spec.ts` | 追記 + regression | **AC-1..AC-5 + AC-7**: `DELETE /tags/:tagId/physical?migrateTo=dest`（204 + 二段 audit / 404 `migration_target_not_found` / 409 `migration_target_inactive` / 400 `migration_target_same_as_source`）。**AC-7 regression**: `migrateTo` 無指定の既存 `DELETE /tags/:tagId/physical`（404 / 409 `tag_has_references`+`referenceCount` / 204 + audit 1 件）が issue-1070 と完全一致で退化しない |

> `AuditAction` は `RepoBrand<string>` で enum を持たないため、新 action `admin.tag.references_migrated` 追加による brand 型変更は不要（route の literal union 拡張のみ）。

## 3. ファイル削除なし確認

本タスクの inventory（Phase 1 §1.5）は **新規 2 関数追加 + 既存編集 + 既存 spec ケース追記のみ**で、ファイル削除・rename はゼロ。

- 編集: `tagDefinitions.ts`（`migrateMemberTagReferences` / `forceMigrateAndPhysicalDeleteTagDefinition` + 型 `ForceMigrateAndPhysicalDeleteTagResult` 追加）/ `tags.ts`（`DELETE /tags/:tagId/physical` の `migrateTo` 分岐 + audit union + `ERROR_TO_STATUS` 3 行）/ `specs/01-api-schema.md`
- 追記: `tagDefinitions.write.repository.spec.ts` / `tags.contract.spec.ts`（既存 spec へケース追加・新 spec ファイルなし）

→ **削除に伴う参照断（dead import / 404 link）確認は N/A**。新 endpoint path を増やさず既存 `DELETE /tags/:tagId/physical` に query 分岐を足すだけで mount 行も増えず、`index.ts` への変更なし（再利用）。新 migration なし。

## 4. D1 直接アクセスが `apps/api` に閉じる確認（CLAUDE.md invariant #5）

`apps/web` から強制移行 repository・endpoint を参照していないこと、D1 binding が `apps/web` に漏れていないことを grep で確認する:

```bash
# apps/web 配下に強制移行 repository への参照が無いこと（0 hit を期待）
grep -rn "migrateMemberTagReferences\|forceMigrateAndPhysicalDeleteTagDefinition" apps/web/src \
  && echo "NG: force-migration reference leaked into apps/web" \
  || echo "OK: no force-migration reference in apps/web"

# apps/web から /physical?migrateTo 直叩きが無いこと（admin proxy 経由のみ許容・本サイクル UI 非接触）
grep -rn "migrateTo" apps/web/src \
  && echo "NG: migrateTo call leaked into apps/web" \
  || echo "OK: no migrateTo call in apps/web"

# member_tags 移行 SQL（INSERT OR IGNORE ... member_tags / DELETE FROM member_tags）が apps/api の repository にのみ存在すること
grep -rn "member_tags" apps --include=*.ts | grep -iv "apps/api"
```

> 期待: 強制移行の D1 アクセスは `apps/api/src/repository/tagDefinitions.ts` に閉じ、`apps/web` には repository 関数・D1 binding・`migrateTo` endpoint 呼び出しが一切無い。admin UI からの強制移行導線は本タスクスコープ外（issue-1070 followup-002 系の関心事）であり、本サイクルでは `apps/web` 非接触。

## 5. HEX 直書きなし確認（design token gate / task-18）

API only タスクのため本来色は登場しないが、CLAUDE.md invariant（OKLch トークン正本化）に従い変更ファイルに HEX / `bg-[#...]` / `text-[#...]` が混入していないことを確認する:

```bash
grep -rnE "#[0-9a-fA-F]{3,8}\b|bg-\[#|text-\[#" \
  apps/api/src/repository/tagDefinitions.ts \
  apps/api/src/routes/admin/tags.ts \
  && echo "NG: HEX literal found" \
  || echo "OK: no HEX literal in changed files"
```

> 期待: 0 hit（API ロジックのみで色直書きなし）。

## 6. audit append-only / 参照整合（孤児化禁止）QA チェックリスト

| 観点 | 確認内容 | 確認手段 |
|------|---------|---------|
| audit append-only | 強制移行成功時のみ audit 2 件（`references_migrated` 先 → `physically_deleted` 後）append。既存 audit 行の UPDATE/DELETE をしない | contract spec の audit 件数 / 順序 assert |
| audit before/after | `admin.tag.references_migrated`=`{tag_id:src,dest,referenceCount}`→`{migratedCount,deleted:true}`、`admin.tag.physically_deleted`=削除前 full row→`null` | contract spec の before/after shape assert |
| 検証失敗時 audit 0 | not_found / inactive / same / has_references の各拒否では audit を発火させない | spec の `expect(auditCount).toBe(0)` |
| 参照整合（孤児化禁止） | 移行は `INSERT OR IGNORE`+`DELETE` で `(member_id,dest)` 衝突を吸収し重複・孤児を作らない。移行後 `countMemberTagReferences(src)===0` を再検証してから削除 | repository spec で「衝突 member が dest に 1 行集約・src 行全消去・member_tags 件数整合」を assert |
| AC-7 退化防止 | `migrateTo` 無指定の physical delete が issue-1070 の 409 `tag_has_references` 拒否経路を完全保持 | contract regression spec で 409+referenceCount を固定 |
| `migratedCount` 正確性 | `DELETE FROM member_tags WHERE tag_id=src` の 移行前 source 参照数 が元 src 参照数（衝突分含む）と一致 | repository spec の件数 assert（FB-CRONVL-001） |

```bash
# audit action 文字列がコードと spec で一致していること（drift 防止）
grep -n "admin.tag.references_migrated" apps/api/src/routes/admin/tags.ts
grep -n "admin.tag.references_migrated" docs/00-getting-started-manual/specs/01-api-schema.md

# 移行 SQL が application-level の INSERT OR IGNORE + DELETE であること（DB-FK 不在の防壁）
grep -n "INSERT OR IGNORE INTO member_tags" apps/api/src/repository/tagDefinitions.ts
grep -n "DELETE FROM member_tags WHERE tag_id" apps/api/src/repository/tagDefinitions.ts

# 新 error code が ERROR_TO_STATUS に登録されていること
grep -n "migration_target_not_found\|migration_target_inactive\|migration_target_same_as_source" apps/api/src/routes/admin/tags.ts
```

## 7. 不可逆操作の安全性レビュー（physical deletion 2-stage）

強制移行 + 物理削除は **production で実行すると復元不能**（`member_tags` 付け替え + `tag_definitions` row 削除 + code 解放）であるため、以下の安全境界を実装完了の必須条件とする。`references/non-visual-irreversible-task-rules.md` を適用する。

| 安全境界 | 基準 | 確認 |
|---------|------|------|
| コード/ガード/audit/test は実装可能 | repository 2 関数・route `migrateTo` 分岐・contract test は本サイクルで実装し緑にする。コード実装自体は user-gate 対象外 | §2 の write/contract spec が PASS |
| production runtime mutation は user-gated | staging/production への実際の強制移行・物理削除リクエスト発行は user 承認後のみ。`governance_mutation_user_gate=true` | Phase 13 の user approval marker・本サイクルで production mutation を実行しない |
| runbook 必須 | 移行前 `member_tags` snapshot 保全・逆移行（dest→src）手順・参照 0 確認 → backup → 実行 → audit 確認 → rollback 手段を `outputs/phase-12/force-migration-runbook.md` に規定 | Phase 12 で runbook 作成・runbook なしで production 実行しない（AC-6） |
| 移行先誤指定の不可逆削除防止 | 移行前に not_found / inactive / `src===dest` を検証し、誤った dest への付け替え後の削除を構造で阻止 | §2 の検証 case PASS（C-M2/C-M3/C-M4） |
| AI 自動実行の防止 | AI エージェントが強制移行・物理削除を自動で本番実行しないこと。コード/test の緑化までを自動範囲とし、production mutation は明示承認境界で停止 | Phase 13 user-gated 宣言・runbook の承認 marker |

## 8. mirror parity / 構造整合（補助確認）

| 観点 | 確認 |
|------|------|
| 正本 spec 同期 | `docs/00-getting-started-manual/specs/01-api-schema.md` に強制移行 endpoint（`?migrateTo`）・新 error code 3 種・新 audit action `admin.tag.references_migrated` が記載され、コードと文字列一致（§6 grep） |
| 新 migration なし | `apps/api/migrations/` に新ファイル追加が無いこと（schema 変更ゼロ・移行は runtime データ操作） |
| contract surface 最小 | 新 path・新 spec ファイルを増やさず既存に追記（Phase 2 §2.7 / Phase 8 §1） |

## 9. 実測結果（Phase 11 で追記）

§1〜§8 の主要 gate は Phase 11（Gate-B 証跡）で実測済み。focused D1 Vitest 2 files / 25 tests、`@ubm-hyogo/api` typecheck、repo lint は PASS。staging/production runtime smoke / 強制移行・physical delete production mutation / commit / push / PR は user-gated。
