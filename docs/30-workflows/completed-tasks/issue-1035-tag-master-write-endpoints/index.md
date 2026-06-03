# issue-1035 — tag master (tag_definitions) write endpoints + pagination/search

> **実装区分: 実装完了ワークフロー**（コード実装を伴う。CONST_004 準拠）
> tag master (`tag_definitions`) への管理者 CRUD API を新設する。Phase 1-10 の実装仕様をコントラクトとして、同 wave で `apps/api` 実装・focused D1 Vitest・typecheck・lint・正本 API spec 同期まで完了した。commit / push / PR / staging runtime smoke / Issue 状態変更のみ user-gated。

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | `TASK-ISSUE-1035-TAG-MASTER-WRITE-ENDPOINTS` |
| Issue | [#1035](https://github.com/daishiman/UBM-Hyogo/issues/1035)（**CLOSED 維持**・reopen しない） |
| 親ワークフロー | `issue-982-drawer-tag-pill-editing` |
| 分類 | implementation / API endpoint / admin CRUD |
| 視覚証跡 | NON_VISUAL（API only） |
| workflow_state | `implemented_local_evidence_captured`（local 実装・検証完了、PR/staging は user-gated） |
| implementation_mode | `new` |

## 真の論点（要件レビュー一次結論）

1. **真の論点**: tag master (`tag_definitions`) は現状 **read-only**（`tagDefinitions.ts:48` 「不変条件 #13: write API は提供しない」）。「member に付けたい tag が master に無い」場合に admin が tag を新規作成する導線が無く UX が途切れる。これを解消するため、tag master への **管理者 CRUD（第3の write 経路）** を正式に追加する。
2. **依存関係・責務境界**: 既存不変条件 #13（2026-05 再定義）は **member_tags** の write 2 経路（queue resolve / admin manual）を定めたもので、**tag master 自体の write は対象外**。本タスクは「tag master CRUD」という **第3経路**を追加し、不変条件 #13 をコードコメント（`tagDefinitions.ts`）と正本 spec（`specs/01-api-schema.md`）の両方で再定義する。責務は route → repository（use-case 層なし、既存 admin route 慣例に一致）。
3. **価値とコストの均衡**: 初回価値 = admin が tag master を CRUD でき、member tag 付与の UX 断絶を解消。高コスト項目 = UI drawer inline-create 導線だが、**issue #1035 の AC-1..AC-7 はすべて API endpoint** であり UI 導線は AC に含まれない（「苦戦箇所」に導線設計が割れる旨の記載のみ）。よって UI 統合は **issue スコープ外**として Phase 12 未タスク候補に分離する（CONST_007 の「先送り」ではなく、別 issue の関心事）。
4. **改善優先順位**: API endpoint 群（GET/POST/PATCH/DELETE）+ repository write 関数 + audit 型拡張 + 正本 spec 更新を 1 サイクルで完結。
5. **4 条件評価**: 価値性=PASS（read-only 制約解消）／実現性=PASS（既存 member tags write・audit・pagination パターンの完全な前例あり・migration 不要）／整合性=PASS（不変条件 #13 を 2 箇所で同期再定義・code immutable で member_tags 参照整合を維持）／運用性=PASS（audit 記録で監査運用・既存 GET regression なし）。

## スコープ（issue #1035 AC-1..AC-7）

| AC | 内容 | 本仕様の確定方針 |
|----|------|------------------|
| AC-1 | `POST /admin/tags { code, label, category }` で persist、code 衝突 → 409 `tag_code_conflict` | code UNIQUE 違反を catch して 409 |
| AC-2 | `PATCH /admin/tags/:tagId { label?, category? }` で更新 | **code は immutable**。label/category のみ更新 |
| AC-3 | `DELETE /admin/tags/:tagId` は論理削除（`active=0`）、assigned 済 `member_tags` 保持 | UPDATE active=0。member_tags は触らない |
| AC-4 | `GET /admin/tags` が pagination + search、`total`/`items` を返す | `q`（code/label 部分一致）+ `page`/`pageSize`、inactive も含めて一覧（master 管理ビュー） |
| AC-5 | write で audit `admin.tag.created`/`updated`/`deactivated` を actor+tagId で 1 件記録 | state 変化時のみ append（再送 no-op では増やさない） |
| AC-6 | D1 直接アクセスは `apps/api` に閉じる（CLAUDE.md invariant #5） | route → repository のみ、`apps/web` 非接触 |
| AC-7 | 既存 `GET /admin/members/:memberId/tags`（issue-982）に regression 無し | available は `active=1` 全件のまま。surface 変更なし |

## スコープ外（issue #1035 の AC に含まれない）

- **UI drawer inline-create 導線**（`apps/web` admin-ui）: issue 本文「苦戦箇所」記載のみで AC 化されていない。Phase 12 未タスク候補として formalize（→ `outputs/phase-12/unassigned-task-detection.md`）。
- **物理削除 / reactivate endpoint**: followup-002 でスコープ外明記。誤作成 tag 整理要件が確定したら別タスク。
- **D1 migration**: `active` カラムは migration 0002 で既存のため **新規 migration 不要**。

## Phase 一覧

| Phase | 名称 | 出力 |
|-------|------|------|
| 1 | 要件定義 | `outputs/phase-1/phase-1.md` |
| 2 | 設計 | `outputs/phase-2/phase-2.md` |
| 3 | 設計レビュー | `outputs/phase-3/phase-3.md` |
| 4 | テスト作成 | `outputs/phase-4/phase-4.md` |
| 5 | 実装 | `outputs/phase-5/phase-5.md` |
| 6 | テスト拡充 | `outputs/phase-6/phase-6.md` |
| 7 | カバレッジ確認 | `outputs/phase-7/phase-7.md` |
| 8 | リファクタリング | `outputs/phase-8/phase-8.md` |
| 9 | 品質保証 | `outputs/phase-9/phase-9.md` |
| 10 | 最終レビュー | `outputs/phase-10/phase-10.md` |
| 11 | 手動テスト | `outputs/phase-11/manual-test-result.md` |
| 12 | ドキュメント同期 | `outputs/phase-12/main.md` ほか strict 7 |
| 13 | commit-pr-release | `outputs/phase-13/phase-13.md`（user-gated） |

## 正本順位（衝突時）

1. 本 workflow の `outputs/phase-{1,2,3}/*.md`（設計確定）
2. `docs/00-getting-started-manual/specs/01-api-schema.md`（不変条件 #13 / endpoints）
3. 既存実装コード（`apps/api/src/routes/admin/members.ts`・`repository/memberTags.ts`・`repository/tagDefinitions.ts`・`repository/auditLog.ts`）

## 関連タスク

| ID | 関係 | 状態 |
|----|------|------|
| issue-982-drawer-tag-pill-editing | 親（member_tags write + tag master read 実装） | completed |
| issue-982-followup-002 (= #1035) | 本タスク（tag master write） | implemented_local_evidence_captured |
| UI drawer inline-create 導線 | 子（未タスク候補） | Phase 12 で formalize |
