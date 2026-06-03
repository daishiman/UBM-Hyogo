# Phase 3: 設計レビュー

## メタ情報

| 項目 | 内容 |
|------|------|
| workflow | issue-1036-bulk-member-tag-assign |
| 前提 | Phase 1, Phase 2 完了 |
| 目的 | Phase 4（テスト作成）へ進めるかを判定し、Phase 2 で保留した決定点を確定する |

## レビュー観点と判定

| 観点 | 判定 | コメント |
|------|------|----------|
| R1: AC 充足設計か | PASS | AC-1〜AC-7 すべてに設計上の写像がある |
| R2: 不変条件整合（#5/#9/#10/#13） | PASS | bulk write は apps/api に閉じ、type gate と #13 コメントで第3経路を機械強制 |
| R3: 命名規則 vs 実装名照合 | PASS | 下表 |
| R4: 冪等性設計 | PASS | DB 自然冪等（複合 PK + INSERT OR IGNORE / DELETE changes 判定）。#913 非依存 |
| R5: 部分失敗レポート | PASS | loop + 個別 status。db.batch() 不使用の理由が明記 |
| R6: audit 設計 | PASS | 実 mutation のみ append、action 名 parity、batchId 相関 |
| R7: N+1 回避 | PASS | tag master / member deleted を事前一括取得 |
| R8: ルート順序 | 要確定 → D-2 で確定 | bulk path と `:memberId` の誤マッチ回避 |
| R9: member 不在の status 扱い | 要確定 → D-1 で確定 | AC で未定義だった概念 |
| R10: audit before/after の batchId 配置 | 要確定 → D-3 で確定 | unassign 時の埋め場所 |
| R11: state ownership 分離 | PASS | MembersClientShell（選択）/ BulkActionBar（tag・op・結果） |

## 命名規則 vs 実装名 照合（R3）

| 新規 identifier | 既存規則との整合 | 判定 |
|-----------------|------------------|------|
| `bulkApplyMemberTagsByAdmin` | `…ByAdmin` suffix（assignTagToMemberByAdmin と同列） | OK |
| `BulkTagOp` / `BulkTagItemStatus` / `BulkTagOpResultItem` | PascalCase 型・既存 `TagRef` と同レイヤ | OK |
| endpoint `POST /admin/members/tags/bulk` | 既存 `/members/:memberId/tags` と同 segment 体系 | OK |
| endpoint `GET /admin/tags` | 既存 `/tags/queue`（tags-queue.ts）と prefix 整合 | OK |
| web `bulkApplyMemberTags` / `fetchTagMaster` | camelCase・既存 `assignMemberTag` と同列 | OK |
| audit action（再利用） | `admin.member.tag_assigned` / `tag_unassigned` をそのまま | OK（AC-3 parity） |

## 保留決定点の確定

### D-1（R9）: member 不在 / 削除済みの status 扱い

**決定**: `status` の意味を以下に固定する。
- `skipped_deleted`: member が **存在し** `member_status.is_deleted = 1`。
- member が `member_identities` に **存在しない** 場合も、bulk の堅牢性のため **`skipped_deleted` として results に返す**（呼び出し側 UI は「skip された member×tag」としてまとめて表示できれば足り、不在と削除済みを区別する AC 要件は無い）。
- 理由: AC-4 は「削除済み member は skip し他 member は継続」。不在 member を 404 で endpoint 全体を落とすと「他 member は継続」に反する。よって **不在も skip 扱い**にして endpoint は 200 + results を返す。
- **ただし** event の意味的明瞭性のため、Phase 4 のテストでは「不在 member → skipped_deleted」「is_deleted=1 → skipped_deleted」の両ケースを別 TC で固定し、実装コメントに「skipped_deleted は『書き込み対象外 member』を意味する（削除済み or 不在）」と明記する。

### D-2（R8）: Hono ルート登録順序

**決定**: `app.post("/members/tags/bulk", …)` を `app.get/post/delete("/members/:memberId/tags…", …)` **より前に登録**する。
- Hono は登録順で最初にマッチした route を使う。`:memberId` は任意文字列にマッチするため、`/members/tags/bulk` が `:memberId="tags"` + `/bulk`（未定義）と誤解されないよう、具体パスを先に置く。
- Phase 4 で `members.mount.spec.ts` 相当の mount 順テスト、または contract test で `POST /members/tags/bulk` が 200 を返し `404`/誤ルートにならないことを assert する。
- `GET /admin/tags` は `members.ts` 内ではなく **`/admin` ルータ直下**（members prefix 外）に mount する。`/admin/members/...` とは prefix が異なるため衝突しない。mount 先は Phase 4 で既存 router 構成（`apps/api/src/routes/admin/_shared.ts` / index mount）を確認して確定する。

### D-3（R10）: audit before/after の batchId 配置

**決定**:
- assign 実行時: `before: null`, `after: { tagId, source: "manual", batchId }`
- unassign 実行時: `before: { tagId, batchId }`, `after: null`
- 既存単一 endpoint の before/after 構造（assign: after `{ tagId, source }` / unassign: before `{ tagId }`）に `batchId` を 1 キー足すだけ。action 名・targetType（"member"）・targetId（memberId）は完全 parity。
- これにより監査ログから `batchId` で 1 回の bulk 操作に属する全 audit 行を相関できる（correlation_id 列の新設は不要）。

## 残リスクと対策

| リスク | 対策 | 担当 Phase |
|--------|------|-----------|
| 大量 member×tag（200×50=10000）で loop が長時間化 | zod で `memberIds ≤ 200` / `tagIds ≤ 50` に上限。超過は 400。実運用は数十件想定 | Phase 4（境界テスト） |
| 不在/削除 member と未登録 tag が同時混在 | 直積 loop で member skip を tag より先に判定（skip 時は tag を評価しない） | Phase 4（混在 TC） |
| 既存単一 endpoint への regression | bulk は別 path・別 helper。既存 `members.tags.contract.spec.ts` を Phase 9 で全 green 確認 | Phase 9 |
| type-level gate の allow list 漏れ | Phase 5 で test-d.ts 更新を同 wave 実施、`pnpm test -- --typecheck` で検証 | Phase 5/9 |
| ルート誤マッチ | D-2 の登録順 + Phase 4 mount テスト | Phase 4 |

## 判定

**PASS — Phase 4（テスト作成）へ進む。**
保留決定点 D-1/D-2/D-3 をすべて確定した。設計は AC を全充足し、不変条件と整合し、#913 非依存で 1 サイクル完結する。

## 完了条件 (DoD)

- [x] R1〜R11 を判定
- [x] D-1（member 不在 status）/ D-2（ルート順序）/ D-3（batchId 配置）を確定
- [x] 残リスクと対策を Phase に割り当て
- [x] Phase 4 進行を承認
