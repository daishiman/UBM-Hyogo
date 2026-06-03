# Phase 8: リファクタリング — issue-1036-bulk-member-tag-assign

> 実装区分: 実装仕様書 / VISUAL_ON_EXECUTION / implementation_mode: new
> 前 Phase: [phase-7-coverage.md](phase-7-coverage.md) / 次 Phase: [phase-9-qa.md](phase-9-qa.md)

## メタ情報

| 項目 | 内容 |
|------|------|
| workflow | issue-1036-bulk-member-tag-assign |
| 方針 | Green を保ったまま、**重複削減 / 既存パターン整合**のみ実施（Feedback RT-03: 対象/Before/After/理由テーブル形式） |
| 非方針 | 過剰リファクタ・新規抽象の前倒し導入は行わない（後述 8-3） |

## 目的

Phase 5 で Green になった bulk 実装について、(a) repository 層の SQL 断片重複、
(b) UI 層の tag pill 利用パターン drift を評価し、**必要最小の整合**だけを行う。
テストは常に Green を維持する（リファクタ後に Phase 9 で再検証）。

---

## 8-1. リファクタ候補テーブル（対象 / Before / After / 理由）

| # | 対象 | Before | After | 理由 / 判定 |
|---|------|--------|-------|-------------|
| RF-1 | bulk helper と既存 `assignTagToMemberByAdmin` / `unassignTagFromMemberByAdmin` の write SQL | bulk は専用 loop 内に `INSERT OR IGNORE` / `DELETE` を直接記述。既存単一関数も同等 SQL を保持 | **SQL 文字列断片のみ** module-private 定数（例: `INSERT_MEMBER_TAG_SQL` / `DELETE_MEMBER_TAG_SQL`）に切り出し、bulk loop と単一関数で共有 | 重複削減。ただし**関数呼び出しの共通化はしない**（下記 RF-2 で却下） |
| RF-2 | bulk loop が単一 helper をループ呼びする案 | （検討案）bulk が `assignTagToMemberByAdmin` を N×M 回呼ぶ | **採用しない**。Phase 2 確定どおり bulk は専用 loop を維持 | 単一関数は audit を内包し 1 回 1 audit。bulk は「実 mutation のみ audit」「status 判定」「batchId 相関」「事前一括取得で N+1 回避」を内包する別責務。ループ呼びは N+1（tag master / deleted map を毎回再取得）と audit 設計差で破綻するため却下 |
| RF-3 | status 判定の `changes > 0` 分岐 | assign / unassign で類似の `meta.changes > 0 ? X : "noop"` を 2 箇所記述 | 小ヘルパ `resolveChangeStatus(changes, hitStatus): BulkTagItemStatus` に集約（`changes > 0 ? hitStatus : "noop"`） | 分岐重複の局所削減。1 行関数で過剰でない範囲 |
| RF-4 | member skip 判定（不在 / is_deleted=1 → skipped_deleted） | loop 内 inline 条件 | `isWriteTarget(memberId, deletedMap): boolean` に抽出し意図を明示 | Phase 3 D-1 の「skipped_deleted = 書込対象外（削除 or 不在）」を関数名で表現。可読性向上 |
| RF-5 | BulkActionBar の tag picker と既存 `MemberDrawer` 配下 `MemberTagsEditor` の TagPill 利用 | bulk 側 tag picker を独自 toggle 実装で組む可能性 | 既存 `MemberTagsEditor` の TagPill 利用パターン（`selected` / `onClick` / `aria-pressed` / category グルーピング）と**同一の props 渡し方**に揃える | navigation / interaction drift 削減。プロトタイプ正本順位（不変条件・新規 primitive を生やさない）に整合 |
| RF-6 | 部分失敗集計ロジック | BulkActionBar 内に inline 集計 | `summarizeBulkResult(results): BulkTagSummary` を同ファイル内 module スコープ関数へ抽出（既存 `useBulkRepublish` の failures 集計と命名整合） | テスト容易性 + 既存集計命名との整合。新規ファイルは作らない |

---

## 8-2. 整合確認（既存パターンとの drift チェック）

| 観点 | 確認内容 |
|------|----------|
| audit action 名 parity | bulk が `admin.member.tag_assigned` / `tag_unassigned` を再利用していること（既存単一と byte 一致・AC-3） |
| TagPill props 契約 | bulk picker と `MemberTagsEditor` で `selected` / `onClick` / `disabled` / `aria-pressed` の渡し方が一致 |
| mutation 経路 | `@/features/admin/hooks/useAdminMutation` 経由（不変条件 #10）。legacy `@/lib/useAdminMutation` 不使用 |
| SQL 共有後の挙動不変 | RF-1 の定数化後も `INSERT OR IGNORE` / `DELETE` の SQL 文字列が変化していないこと（Phase 9 で test 再 green 確認） |

---

## 8-3. 過剰リファクタを避ける方針（明記）

- **却下: bulk の単一 helper ループ呼び**（RF-2）。責務差と N+1 で破綻するため統合しない。
- **却下: 汎用 BulkPicker primitive の新設**。tag 以外の bulk 対象が現れるまで抽象化しない（YAGNI）。
- **却下: tag master のキャッシュ層 / pagination**。scope-out（#1035 / 将来課題）。本タスクでは導入しない。
- **却下: audit に correlation_id 列を新設する DB 変更**。Phase 3 D-3 どおり after/before の `batchId` で相関し、schema 変更しない（不変条件: D1 schema 変更禁止）。
- リファクタは RF-1/RF-3/RF-4/RF-5/RF-6 の**局所整合に限定**し、振る舞い（status / audit / endpoint shape）は一切変えない。

---

## 8-4. DoD

- [ ] RF-1（SQL 断片共有）/ RF-3（status ヘルパ）/ RF-4（skip 判定ヘルパ）を適用し挙動不変
- [ ] RF-5（TagPill 利用パターン整合）/ RF-6（集計ヘルパ抽出）を適用し UI 挙動不変
- [ ] RF-2 ループ呼び案を却下した理由が本書に記録されている
- [ ] 過剰リファクタ却下方針（8-3）が明記されている
- [ ] リファクタ後に全 test が Green を維持（Phase 9 で最終確認）
- [ ] audit action 名 parity / TagPill props 契約 / mutation 経路 の drift が無い
