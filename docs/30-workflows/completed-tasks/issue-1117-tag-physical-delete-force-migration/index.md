# issue-1117 — tag physical delete force-migration（参照付き tag の強制移行）実装仕様書

> **実装区分: 実装仕様書**（コード実装を伴う。CONST_004 デフォルト準拠）
> physical delete 対象 tag に `member_tags` 参照があるとき、参照を別 tag（移行先）へ全件付け替えてから元 tag を物理削除する **強制移行（force-migration）経路** を `apps/api` に追加した実装仕様。Issue #1117（= issue-1070 followup-001）の AC-1..AC-7 を route / repository / audit / 正本 spec / focused D1 Vitest へ写像し、local 実装・証跡を同一サイクルで完了した。physical delete は不可逆操作のため `physical deletion 2-stage`（production runtime mutation のみ user-gated）として設計する。commit / push / PR / staging runtime / production tag 強制移行・物理削除 / Issue 状態変更は user-gated。

## 実装区分の判定根拠（CONST_004）

- Issue #1117 のラベルは `type:improvement`（改善タスク）だが、AC-1..AC-7 は **新 endpoint・repository 関数・SQL 移行戦略・audit・参照整合ガード** を要求しており、コード変更なしでは目的（強制移行経路の提供・移行後の安全な物理削除）を達成できない。
- よって **デフォルトの実装仕様書** として作成する（ラベルより実態優先）。
- 強制移行と physical delete の **production 実行のみ** が不可逆かつ user-gated。endpoint コード・移行 SQL・参照ガード・audit・tests は本サイクルで実装可能であり、先送りしない（CONST_007 準拠）。

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | `TASK-ISSUE-1117-PHYSICAL-DELETE-FORCE-MIGRATION` |
| Issue | [#1117](https://github.com/daishiman/UBM-Hyogo/issues/1117)（**CLOSED 維持**・reopen しない） |
| source unassigned-task | `docs/30-workflows/unassigned-task/task-issue-1070-followup-001-physical-delete-force-migration.md` |
| 親ワークフロー | `issue-1070-tag-reactivate-physical-delete`（completed） |
| 分類 | implementation / API endpoint / admin tag master lifecycle / force-migration |
| 視覚証跡 | NON_VISUAL（API only / `apps/web` 非接触） |
| 不可逆区分 | `physical deletion 2-stage`（`references/non-visual-irreversible-task-rules.md` 適用） |
| workflow_state | `implemented_local_evidence_captured`（local 実装・focused D1 Vitest・正本 API spec 同期済み） |
| implementation_mode | `new`（issue-1070 の physical delete 拒否経路に強制移行の前段を追加） |
| governance_mutation_user_gate | `true` |

## 真の論点（要件レビュー一次結論）

1. **着手前 baseline と解消結果**: 着手前の現行コード（`tagDefinitions.ts` / `routes/admin/tags.ts`）では、physical delete は `physicalDeleteTagDefinition` で参照ありを **409 `tag_has_references` で拒否するだけ** であり、参照を別 tag へ寄せて元 tag を消す経路が存在しなかった。本サイクルで `migrateMemberTagReferences` / `forceMigrateAndPhysicalDeleteTagDefinition` と `DELETE /admin/tags/:tagId/physical?migrateTo=<dest>` を追加し、強制移行 + COUNT=0 再検証 + 物理削除の二段経路を local 実装済みにした。
2. **Issue の現行コード最適化**: Issue #1117 本文は issue-1070 land 前の前提を一部含むが、issue-1070 は landed 済み（`countMemberTagReferences` / `physicalDeleteTagDefinition` / 409 `tag_has_references` が実在）。本仕様は **現行コードを正本** として AC を写像する。最適化点は §「Issue の現行コードへの最適化」を参照。
3. **責務境界**: route → repository（既存 admin tag route の慣例に一致・use-case 層なし）。`apps/web` 非接触。**新 schema migration 不要**（移行は DDL ではなく runtime のデータ操作であり、移行先 tag は実行時指定のため固定 SQL migration では表現できない → **専用 endpoint 方式を採用**）。
4. **強制移行と通常 physical delete を同一経路に混ぜない（AC-7）**: 通常 physical delete=`DELETE /admin/tags/:tagId/physical`（issue-1070 既存・参照ありは 409 で不変）、強制移行=`DELETE /admin/tags/:tagId/physical?migrateTo=<destTagId>`（query で移行先を明示したときのみ移行 → 参照 0 確認 → 既存 physical delete を呼ぶ二段構成）。移行先未指定の既存挙動を退化させない。
5. **4 条件評価**: 価値性=PASS（誤付与 tag の参照を正しい tag へ寄せてから完全削除する運用需要を満たす）／実現性=PASS（issue-1070 の physical delete + audit + contract test に完全な前例・migration 不要・SQL は `UPDATE`+衝突時 `INSERT OR IGNORE`+`DELETE`）／整合性=PASS（issue-1070 の 409 拒否経路を温存・参照ガードで孤児化禁止・移行後 `COUNT=0` 確認後のみ削除）／運用性=PASS（audit に移行件数/src/dest/actor 記録・runbook に逆移行ロールバック方針・production は user gate で不可逆操作を保護）。

## Issue の現行コードへの最適化

| # | Issue 本文の記述 | 現行コードの事実 | 本仕様の最適化 |
|---|------------------|------------------|----------------|
| O1 | 「新 migration もしくは専用 endpoint + runbook」 | 移行先 tag は実行時に運用者が選ぶ可変値であり、固定 DDL migration では表現不能。`physicalDeleteTagDefinition` は既に endpoint 経由 | **専用 endpoint 方式に確定**（`DELETE /admin/tags/:tagId/physical?migrateTo=<dest>`）。新 schema migration は作らない |
| O2 | `member_tags` は `PRIMARY KEY (member_id, tag_id)` のみ FK 無し | `migrations/0002_admin_managed.sql:43-51` で確認（FK 不在・`idx_member_tags_member` のみ） | 移行・ガードは全て application-level SQL。`(member_id, dest)` PK 衝突は `INSERT OR IGNORE`+`DELETE` で吸収 |
| O3 | physical delete の 409 拒否経路を退化させない | `physicalDeleteTagDefinition` が `referenceCount>0` で `{ok:false, reason:"has_references"}` 返却（`tagDefinitions.ts:230-233`）、route が `failWithBody(c,"tag_has_references")`（`tags.ts:272`） | 移行は既存拒否経路の **前段** に積む。`migrateTo` 未指定時は完全に既存挙動（AC-7 regression） |
| O4 | 移行を audit に記録 | audit は `appendTagAudit(c,{action,targetId,before,after})`（`tags.ts`）+ `auditLog.ts`（`before_json`/`after_json`/`actor`） | 新 action `admin.tag.references_migrated`（before=`{tag_id:src, dest, referenceCount}`、after=`{migratedCount, deleted:true}`）を追加。`AuditAction` は `RepoBrand<string>` で enum 変更不要 |
| O5 | 移行先 tag 検証 | `getTagDefinitionByIdRaw` が row 取得・`active` 列あり | 移行先 not_found / 非 active / `src===dest` を実行前に検証し、新エラーコードで拒否 |

## スコープ（Issue #1117 AC-1..AC-7）

| AC | 内容 | 本仕様の確定方針 |
|----|------|------------------|
| AC-1 | 移行先 tag を明示指定して `member_tags` の `src` 参照を `dest` 参照へ全件移行 | `migrateMemberTagReferences(c, src, dest)`：`INSERT OR IGNORE ... SELECT` で dest 行を作り、`DELETE FROM member_tags WHERE tag_id=src` で source 行を除去。返却 `{sourceReferenceCount,migratedCount}` |
| AC-2 | `(member_id, dest)` PK 衝突でも孤児を作らず吸収 | 衝突 member は `INSERT OR IGNORE INTO member_tags(member_id,tag_id) SELECT member_id, dest ...` 後に `DELETE FROM member_tags WHERE tag_id=src` で src 行除去。重複は dest 側に集約 |
| AC-3 | 移行完了後 `src` 参照 0 のときのみ既存 physical delete で元 tag 削除 | 移行後 `countMemberTagReferences(src)===0` を再検証し、0 のときのみ `physicalDeleteTagDefinition(src)` を呼ぶ二段構成 |
| AC-4 | 移行と物理削除を audit 記録（件数・src/dest・実行者） | `admin.tag.references_migrated`（移行）+ 既存 `admin.tag.physically_deleted`（削除）を append。actor は既存 audit 経路で記録 |
| AC-5 | 移行先不在 / 非 active / `src===dest` を実行せず明示エラーで拒否 | `migration_target_not_found`(404) / `migration_target_inactive`(409) / `migration_target_same_as_source`(400) を route 前段で検証 |
| AC-6 | runbook に逆移行ロールバック方針を明文化 | `outputs/phase-12/force-migration-runbook.md`（移行前 `member_tags` snapshot 保全・逆移行 dest→src 手順・user approval marker） |
| AC-7 | issue-1070 の 409 `tag_has_references` 拒否経路が退化しない | `migrateTo` 未指定の `DELETE /admin/tags/:tagId/physical` は既存挙動を完全保持。contract test で 409 を regression 固定 |

## スコープ外（理由を明記・CONST_007）

- **`member_tags` への DB-level FOREIGN KEY 追加**: スキーマ変更を伴う独立した大規模関心事（unassigned-task U-3 相当）。本サイクルの強制移行は application-level SQL で完結し、FK 追加は不要。実施時期=要件確定後の別 Issue、実施場所=新 migration。CONST_005 例外条件①②に該当（独立した大規模スコープ・合意未済の仕様分岐）。
- **admin UI からの強制移行 / 物理削除導線**（`apps/web`）: issue-1070 followup の別関心事（U-2 相当）。本 issue の AC に UI は含まれない。
- **tag master CRUD / logical delete / reactivate の再設計**: issue-1035 / issue-1070 で実装済み。本仕様は触らない。

## 実装区分の確定（CONST_005 必須項目）

| 必須項目 | 本仕様での所在 |
|----------|----------------|
| 変更対象ファイル一覧と変更種別 | Phase 1 §1.5 / Phase 5 §実装計画 |
| 関数・型・モジュールのシグネチャ | Phase 2 §設計 / Phase 5 |
| 入力・出力・副作用の定義 | Phase 2 §I/O 契約 |
| テスト方針（追加テストファイル・ケース） | Phase 4 / Phase 6 |
| ローカル実行・検証コマンド | Phase 9 / 各 phase 末尾 |
| 完了条件（DoD） | Phase 10 §DoD |

## フェーズ構成

| Phase | 名称 | 成果物 | 状態 |
|-------|------|--------|------|
| 1 | 要件定義 | `outputs/phase-1/phase-1.md` | spec authored |
| 2 | 設計 | `outputs/phase-2/phase-2.md` | spec authored |
| 3 | 設計レビュー | `outputs/phase-3/phase-3.md` | spec authored |
| 4 | テスト作成 | `outputs/phase-4/phase-4.md` | spec authored |
| 5 | 実装 | `outputs/phase-5/phase-5.md` | spec authored |
| 6 | テスト拡充 | `outputs/phase-6/phase-6.md` | spec authored |
| 7 | カバレッジ確認 | `outputs/phase-7/phase-7.md` | spec authored |
| 8 | リファクタリング | `outputs/phase-8/phase-8.md` | spec authored |
| 9 | 品質保証 | `outputs/phase-9/phase-9.md` | spec authored |
| 10 | 最終レビュー | `outputs/phase-10/phase-10.md` | spec authored |
| 11 | 手動テスト | `outputs/phase-11/manual-test-result.md` | spec authored（NON_VISUAL） |
| 12 | ドキュメント同期 | `outputs/phase-12/main.md` ほか strict 7 | spec authored |
| 13 | commit-pr-release | `outputs/phase-13/phase-13.md` | pending_user_approval |

## 検証コマンド（実装サイクルで使用）

```bash
# 単体（repository D1 test）
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts
# 統合（endpoint contract）
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm lint
```

## runtime / user-gated 境界

本サイクルでは **local 実装・focused D1 Vitest・正本 API spec 同期** まで完了する。staging runtime smoke、production tag 強制移行・物理削除 mutation、commit、push、PR、Issue 状態変更は user-gated。Issue #1117 は CLOSED を維持する。
