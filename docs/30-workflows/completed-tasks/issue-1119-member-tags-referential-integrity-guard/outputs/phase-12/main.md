# Phase 12 — 変更サマリ（issue-1119-member-tags-referential-integrity-guard）

> **status: implemented_local** / 実装区分=実装仕様書 / implementation_mode=new / **NON_VISUAL**
> GitHub Issue #1119（CLOSED 維持・reopen しない）/ 親 #1070 / 元 unassigned spec=`task-issue-1070-followup-003-member-tags-foreign-key-evaluation`

---

## 1. 何を解決するか

`member_tags.tag_id` が `tag_definitions.tag_id` を参照するが **DB-level の参照整合性保証が無い**ため、
`tag_definitions` に存在しない `tag_id` を持つ孤児行（orphan）を**検出・監査できない**ギャップがある。
唯一の防壁は issue-1070 の削除時 count guard（参照ありタグの physical delete を 409 で拒否）のみで、
**既に存在してしまった孤児行**を可視化する手段が無い。

本タスクは、`apps/api/migrations/0022_member_photos.sql:4` の documented no-FK 架構（D1 では FK を使わず
application 層で整合性を保つ）を**反転させず尊重**し、application 層の孤児行検出ガードで根本解決する。

---

## 2. 採用 approach（ユーザー承認 2026-06-06）

- **DB-level FOREIGN KEY は採用しない**（ADR-1119）。migration 追加なし・テーブル再作成なし。
- 代替として application 層の孤児行検出ガードを実装する。
- issue-1070 の count guard は撤去せず **責務分離して共存**（防止＝count guard / 検出＝orphan detection の二段防壁）。

---

## 3. 変更サマリ（実装済み）

### repository layer（`apps/api/src/repository/memberTags.ts` を編集）

- `OrphanMemberTag` 型を追加（`{ memberId, tagId, source, assignedAt, assignedBy: string | null }`）。
- `detectOrphanMemberTags(c): Promise<OrphanMemberTag[]>` を追加（孤児行配列を返す read 関数）。
- `countOrphanMemberTags(c): Promise<number>` を追加（孤児件数を返す read 関数・不変条件テスト用）。
- SQL は両関数とも `WHERE tag_id NOT IN (SELECT tag_id FROM tag_definitions)`。

### route layer（`apps/api/src/routes/admin/tags.ts` を編集）

- `GET /admin/tags/orphans`（read-only 監査 endpoint）を追加。
- レスポンス: `{ ok: true, count, orphans }`。
- 静的セグメント `/tags/orphans` を `/tags/:tagId` 系より**前**に登録し route capture を回避。

### test / fixture layer

- 新規 `apps/api/src/repository/__tests__/memberTags.orphan.repository.spec.ts`（orphan detection repository spec）。
- `apps/api/src/routes/admin/tags.contract.spec.ts` を編集（`GET /admin/tags/orphans` contract test 追加）。
- `apps/api/src/routes/admin/members.contract.spec.ts` は編集しない。`tag_a`/`tag_b` は既に `tag_definitions` 定義済みであり、テスト由来の孤児 0 を回帰確認する（AC-5）。

> `*.spec.ts` のみ使用（invariant #8）。新 migration / D1 schema 変更 / Google Form 仕様変更なし。

---

## 4. 受入基準カバレッジ（AC-1〜AC-7）

| AC | 内容 | 反映先 |
|----|------|--------|
| AC-1 | DB-level FK 不採用の意思決定（根拠付き） | phase-2 ADR-1119 |
| AC-2 | 孤児検出関数（`detectOrphanMemberTags` / `countOrphanMemberTags`） | memberTags.ts / repository spec |
| AC-3 | INSERT 3 経路の tag_id 先在検証を回帰 baseline 化（`assignTagsToMember` helper 単体の未定義 tag skip を含む） | repository / contract spec |
| AC-4 | count guard と orphan detection の責務分離を明記 | phase-2 §4 / implementation-guide Part 2 |
| AC-5 | fixture 健全性確認（`members.contract.spec.ts` は編集なしで孤児 0） | members.contract.spec.ts |
| AC-6 | `GET /admin/tags/orphans` endpoint + contract test | tags.ts / tags.contract.spec.ts |
| AC-7 | `countOrphanMemberTags() == 0` 不変条件 + 非破壊 | repository spec / 既存 issue-1070 ガード spec |

---

## 5. 不変条件

- invariant #5（D1 直接アクセスは apps/api に閉じる・apps/web 非接触）
- invariant #8（`*.spec.ts` のみ・`*.test.{ts,tsx}` 禁止）
- invariant #13（member_tags write 経路は `assign*` 4 関数に限定。追加は read 関数のみ。`detect`/`count` prefix は禁止 prefix に非該当）
- documented no-FK 架構（`0022:4`）維持・強化
- issue-1070 ガード非破壊（count guard + 409 を撤去せず共存）

---

## 6. Gate evidence

| Gate | status | passed_at | approver | notes |
|------|--------|-----------|----------|-------|
| Gate-A | **passed** | 2026-06-06 | daishiman | implemented_local: Phase 1-13 仕様書一式、apps/api 実装、focused tests/typecheck/lint、Phase 12 strict 7 完了 |

---

## 7. user-gated 境界

以下は **user の明示承認後のみ**実施する（本 implemented_local 段階では未実施）。

- commit / push
- PR 作成（`gh pr create --base dev`）
- staging / production deploy
- 実 D1 への孤児行調査クエリ実行
