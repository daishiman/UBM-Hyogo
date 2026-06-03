# Phase 3: 設計レビュー（Gate-A 証跡 / issue-1069 tag code rename）

> 本ファイルは `outputs/artifacts.json` の Gate-A `evidence_path` から参照される設計レビュー証跡である。
> Phase 4（実装）へ進める可否を判定する。

## 3.1 判定サマリ

**判定: PASS（Phase 4 へ進める）**

Phase 1（要件定義）・Phase 2（設計・ADR）の内容を、実コード（`apps/api/src/repository/tagDefinitions.ts` / `apps/api/src/routes/admin/tags.ts` / `apps/api/src/repository/auditLog.ts` / `apps/api/migrations/0002_admin_managed.sql` / `apps/api/migrations/0004_seed_tags.sql`）と突合し、設計に矛盾・破壊範囲の見落とし・命名不整合がないことを確認した。

## 3.2 レビュー観点チェック

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 単一責務 | ✅ | rename は既存 `updateTagDefinition` の atomic CAS 拡張に閉じ、新モジュール・新 endpoint を生やさない。audit 発火は code rename と label/category で独立判定し責務が混線しない。 |
| 破壊的変更の局所性 | ✅ | `updateTagDefinition` 戻り値型変更の call site は `tags.ts:175` の 1 箇所のみ。既存テスト影響は `tagDefinitions.write.repository.spec.ts:54,65,71` の 3 アサーションに限定（Phase 2 §2.6）。 |
| error code 命名整合 | ✅ | 新規 `tag_stale_conflict` は既存 `tag_code_conflict` / `tag_not_found`（`tags.ts:44-51`）と同じ snake_case。repository reason `stale` / `code_conflict` / `not_found` も既存 `CreateTagDefinitionResult` の `code_conflict` と整合（Phase 1 §1.4）。 |
| audit 整合 | ✅ | 新 action `admin.tag.code_renamed` は既存 dot 区切り規則（`admin.tag.created/updated/deactivated`・`tags.ts:92`）に整合。`AuditAction = RepoBrand<string>`（enum なし）/`AuditTargetType` の `tag`（`auditLog.ts:8-15`）が既存のため `auditLog.ts` 無変更で受容（Phase 2 §2.2）。 |
| 参照整合の証明 | ✅ | `member_tags` は `PRIMARY KEY (member_id, tag_id)` で tag_id 参照（`0002_admin_managed.sql:43-51`）。rename は tag_id 不変ゆえ AC-3 は設計上満たされる。Reg-1 で実証済み。 |
| optimistic 設計の妥当性 | ✅ | `expectedCode` による CAS は既存 `code`（`UNIQUE NOT NULL`・`0002_admin_managed.sql:36`）を token 流用し version 列追加（schema 変更）を回避。`code` 指定時のみ必須で、label/category 更新の後方互換を保つ（Phase 2 §2.5）。 |
| 後方互換性 | ✅ | `UpdateTagBodyZ` の `code`/`expectedCode` は optional だが、`code` 指定時のみ `expectedCode` を必須化する。code 未指定の label/category 更新は従来どおり `admin.tag.updated` のみ発火（C-6・R-6 で検証）。 |

## 3.3 4 条件評価

| 条件 | 評価 | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | 誤 code の clean rename で「新 code 作成 + 旧 logical delete」によるデータ衛生悪化を解消し、audit で old/new code を追跡可能にする | **PASS** | Phase 1 §1.8 根本問題・AC-1/AC-4 |
| 実現性 | 既存 PATCH の後方互換拡張・既存ヘルパ（`getTagDefinitionByIdRaw`/`isUniqueError`/`appendTagAudit`）再利用で実装可能。新 endpoint・schema 変更不要 | **PASS** | Phase 2 §2.2-2.5・破壊範囲は call site 1 箇所 |
| 整合性 | error code・audit action・repository reason の命名が既存規則に整合。`auditLog.ts` 型変更不要。member_tags 参照整合不変 | **PASS** | Phase 1 §1.4・Phase 3 §3.2 |
| 運用性 | seed は `INSERT OR IGNORE` で rename 後も無害（AC-5）。seed と code のずれは不変条件 #13 注記で明示（AC-6）。`verify:static-manifest` で drift 検出 | **PASS** | Phase 2 §2.8・`0004_seed_tags.sql:7-63` |

4 条件すべて **PASS**。

## 3.4 受け入れ基準の設計カバレッジ確認

| AC | 設計上の充足箇所 | 検証手段 |
| --- | --- | --- |
| AC-1 | Phase 2 §2.1 ADR（immutable → rename 可・issue-1035 supersede） | spec 改訂（不変条件 #13） |
| AC-2 | `tag_code_conflict` / `tag_stale_conflict` を別 error code で 409（Phase 2 §2.4） | C-2 / C-3 |
| AC-3 | tag_id 参照不変（Phase 2 §2.7） | R-5 / Reg-1 |
| AC-4 | `admin.tag.code_renamed` before/after code（Phase 2 §2.4 step 6） | C-5 / Reg-2 |
| AC-5 | `INSERT OR IGNORE` + `verify:static-manifest` + grep（Phase 2 §2.8） | DoD verify:static-manifest |
| AC-6 | 不変条件 #13 注記で seed/code ずれ運用注意を明記（Phase 2 §2.8） | spec 改訂 |

全 AC が設計でカバーされている。

## 3.5 残課題（MINOR）

| ID | 課題 | 区分 | 対応方針 |
| --- | --- | --- | --- |
| M-1 | `apps/web` の admin tag master 専用 CRUD UI（code 編集導線）が未整備。本サイクルは rename API surface のみで UI からの code 編集導線がない。 | **MINOR / 未タスク候補** | 本タスクスコープ外。Phase 12 で未タスク候補として記録し、別 Issue 化を検討（本タスクでは起票しない）。 |
| M-2 | regression test（`members.tags.contract.spec.ts` の Reg-1）は DESIGN-BRIEF §4 で edit「任意」扱い。 | **MINOR** | AC-3 証明のため可能なら追加するが、R-5（repository 層）で参照整合は担保済。必須ではない。 |

いずれも Phase 4 進行を妨げる blocker ではない。

## 3.6 Gate-A 結論

- レビュー観点 7 項目すべて ✅。
- 4 条件評価すべて PASS。
- 全 AC が設計でカバー。
- 残課題は MINOR のみで blocker なし。

→ **Gate-A: PASS。Phase 4（実装）へ進行可。**
