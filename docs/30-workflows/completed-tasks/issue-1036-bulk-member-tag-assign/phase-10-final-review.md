# Phase 10: 最終レビュー — issue-1036-bulk-member-tag-assign

> 実装区分: 実装仕様書 / VISUAL_ON_EXECUTION / implementation_mode: new
> 前 Phase: [phase-9-qa.md](phase-9-qa.md) / 次 Phase: [phase-11](outputs/phase-11/) 相当（visual evidence）/ [phase-12](outputs/phase-12/) 相当

## メタ情報

| 項目 | 内容 |
|------|------|
| workflow | issue-1036-bulk-member-tag-assign |
| 目的 | AC-1〜AC-7 の充足を判定し、blocker の有無を確定する。MINOR 指摘は Phase 12 未タスク候補へ送る |
| 入力 | Phase 9（Gate-B 証跡）の結果、Phase 7 coverage、Phase 11 visual（VISUAL のため） |

---

## 10-1. AC 充足判定表

| AC | 受入条件（要旨） | 担当 task | 検証 Phase | 合否基準 | 判定 |
|----|------------------|-----------|-----------|----------|------|
| AC-1 | batch endpoint で複数 memberId × 複数 tagId を op=assign/unassign で一括処理 | task-A | Phase 4/6 contract | bulk contract spec の複数×複数 TC が PASS、200 + results 返却 | ☐ |
| AC-2 | 部分失敗時 `{ results:[{memberId,tagId,status}] }`（status 5 値） | task-A | Phase 4/6 contract | 各 status を返す TC が PASS、status 集合が enum と一致 | ☐ |
| AC-3 | 実 mutation した member×tag 単位で audit 1 件（既存 action 名 parity） | task-A | Phase 4/6 contract | audit_log 行数アサート PASS、action 名が既存単一と byte 一致、batchId 相関あり | ☐ |
| AC-4 | 削除済み / 不在 member は skipped_deleted で skip、他 member 継続 | task-A | Phase 4/6 contract | 削除 TC + 不在 TC で対象 member は skipped_deleted、他 member は assigned/unassigned が継続 | ☐ |
| AC-5 | 同一 bulk 再送が冪等（既成功分 noop、副作用なし） | task-A | Phase 4/6 contract | 再送 TC で 2 回目が全 noop、audit 行数が増えない | ☐ |
| AC-6 | 既存単一 endpoint・既存 BulkActionBar に regression 無し | task-A/B | Phase 9 Step 6 | `members.tags.contract.spec.ts` + 既存 publish/hide/soft-delete TC 全 green | ☐ |
| AC-7 | 既存複数選択を再利用し BulkActionBar に tag picker + 一括付与/解除 + 部分失敗表示を追加 | task-B | Phase 11 visual + component spec | component spec PASS + Phase 11 screenshot 取得（実行時 user-gated） | ☐ |

> 全 AC が ☑ になることが本タスクの完了条件。VISUAL（AC-7）の screenshot は Phase 11 で
> 実行時 user-gated に取得し、`outputs/phase-11/screenshots/` の canonical 名で証跡化する。

---

## 10-2. 設計確定点の最終整合（Phase 3 D-1/D-2/D-3）

| 確定点 | 実装での反映 | 確認 Phase | 判定 |
|--------|--------------|-----------|------|
| D-1: skipped_deleted = 削除 or 不在（書込対象外） | repository 実装コメント + 2 TC（削除 / 不在） | Phase 4/6 | ☐ |
| D-2: bulk route を `:memberId` 系より前に登録 | `members.ts` の route 登録順 + mount / 誤マッチ TC | Phase 4/6 | ☐ |
| D-3: audit batchId 配置（assign=after / unassign=before） | repository audit append + audit shape TC | Phase 4/6 | ☐ |

---

## 10-3. blocker 判定

| 区分 | 定義 | 該当時の扱い |
|------|------|--------------|
| **BLOCKER** | AC 1 件以上が未充足 / Phase 9 のいずれかが FAIL / 不変条件 #5・#9・#10・#13 違反 / type-level gate FAIL | リリース不可。該当 Phase（4 テスト / 5 実装）へ差し戻し、修正後に Phase 9 から再判定 |
| **MINOR** | AC は全充足だが改善余地がある（UI 微調整、tag 多数時の折りたたみ、エラーメッセージ文言等） | リリースは可。Phase 12 の未タスク候補へ記録（10-4） |

**判定ルール**: AC-1〜AC-7 が全て ☑ かつ Phase 9 DoD が全 ☑ かつ 10-2 が全 ☑ のとき **blocker なし**と判定し、
Phase 11（visual）→ Phase 12 へ進む。1 つでも未充足なら BLOCKER とし差し戻す。

---

## 10-4. MINOR 指摘の未タスク化方針（Phase 12 候補）

本タスク AC には不要だが、レビューで挙がりうる改善は **scope-out として Phase 12 の未タスク候補**に送る。
これらは blocker ではない。

| 候補 | 内容 | 既存 scope-out との関係 |
|------|------|-------------------------|
| UT-1036-A | tag master pagination（tag 大規模化時の picker 折りたたみ） | Phase 1 scope-out「tag master pagination（将来課題）」と同一 → Phase 12 未タスク候補へ |
| UT-1036-B | server idempotency-key middleware 連携（#913） | Phase 1 scope-out。本タスクは DB 自然冪等で完結済み。#913 別タスク |
| UT-1036-C | tag master write/CRUD（#1035） | Phase 1 scope-out。read-only `GET /admin/tags` のみ本タスク範囲 |
| UT-1036-D（条件付き） | bulk 上限（200×50）超過時の UX（分割実行ガイド等） | Phase 3 残リスク。AC 上は 400 で足り、UX 改善は MINOR |

> 上記は Phase 12 で「未タスク候補」として列挙し、Issue 化要否はユーザー判断（user-gated）。
> 新規 Issue 作成・本タスクへの取り込みは行わない（1 サイクル完結性を維持）。

---

## 10-5. DoD

- [ ] AC-1〜AC-7 の充足判定が全て確定している（10-1 表が全 ☑ で blocker なし）
- [ ] Phase 3 確定点 D-1/D-2/D-3 が実装に反映され確認済み（10-2 全 ☑）
- [ ] blocker の有無が明示的に判定されている（10-3）
- [ ] MINOR 指摘が Phase 12 未タスク候補として記録されている（10-4）
- [ ] 不変条件 #5/#9/#10/#13 違反が無い（Phase 9 9-2 と整合）
- [ ] VISUAL（AC-7）の Phase 11 screenshot 取得方針が明記されている（実行時 user-gated）
