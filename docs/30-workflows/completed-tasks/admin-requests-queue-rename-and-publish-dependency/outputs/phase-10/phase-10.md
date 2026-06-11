# Phase 10 — 最終レビューゲート（Gate-B 相当）

`[実装区分: 実装仕様書]` / taskType: implementation / visualEvidence: VISUAL / workflow_state: implemented_local_evidence_captured / 判定: **GO**

> 正本は [_shared-context.md](../../_shared-context.md)。Phase 4-9（テスト方針→実装手順→カバレッジ→リファクタ→品質保証）の整合を最終検証し、実装着手可否を判定する。本サイクルでローカル実装済み（GO ＝ Phase 11 evidence と Phase 12 同期へ進む）。

---

## 10.1 AC-1..13 レビュー判定表（SSOT §6）

| AC | 内容 | 充足する成果物 / テスト | 判定 |
| --- | --- | --- | --- |
| AC-1 | サイドバー・ページタイトル・パネル h1・パンくず（日本語）が「会員からの申請」 | Lane B 命名マップ（§3）/ `RequestQueuePanel.component.spec.tsx`（新ラベル assert）/ shell-config | GO |
| AC-2 | 「会員本人発の申請を承認/却下する場所」「即時変更は会員管理から」の説明文 | Lane B page/panel 説明文（§3 ページ説明）/ component spec | GO |
| AC-3 | 依頼画面から「会員管理」への相互リンク | Lane B 相互リンク（§2.3）/ component spec で href assert | GO |
| AC-4 | ルート/API パス/ファイル名/id/data-\*/セレクタ不変 | Phase 9 §9.4 grep 表（変更前後同一）| GO |
| AC-5 | catalog.ts に 3 件 pending 申請定義 + build-seed-sql が INSERT 生成 | Lane A（§4）/ `build-seed-sql.spec.ts` / `catalog.spec.ts` | GO |
| AC-6 | 再生成 seed.sql に 3 INSERT + drift guard byte 一致 PASS | `gen-test-accounts-seed.mjs --check` / build-seed-sql.spec.ts | GO |
| AC-7 | cleanup.sql に `DELETE ... note_id LIKE 'TEST-NOTE-%'` | Lane A cleanup 生成 / build-seed-sql.spec.ts | GO |
| AC-8 | seed 適用後 `?type=visibility_request` に 2 件 / `delete_request` に 1 件（staging 確認は user-gated） | seed データ設計（§4 表 3 件 = V01/V02/D01）/ staging 検証は Phase 13 | GO（staging 確認 user-gated）|
| AC-9 | list item に `pendingRequestTypes` 配列 | Lane C API（§5）/ `members.contract.spec.ts`（空配列含む）| GO |
| AC-10 | pending 行に「申請中」バッジ + クリックで該当タブ遷移 | Lane C UI / members 行 component spec（href type 分岐）| GO |
| AC-11 | 会員管理ページに説明 + 相互リンク | Lane C UI（§5 説明文）/ component spec | GO |
| AC-12 | HEX 0 件 + 既存 admin/contract tests 非破壊 | Phase 9 §9.1 HEX gate / §9.4 非破壊表 | GO |
| AC-13 | 承認経路と直接 PATCH 経路が共に機能し独立（依存整合明示）| Phase 2.4 依存可視化 / 既存 resolve・member-status 経路不変 / 仕様で明示 | GO |

---

## 10.2 4 条件の最終評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| **矛盾なし** | GO | 「削除しない（存続+役割明確化）」決定と全 Lane が整合。命名は表示テキスト限定で内部識別子（AC-4）と矛盾しない。バッジは publish_state とは独立軸で出すため「会員管理で非公開」と「再公開申請 pending」が交差表示でき矛盾なく依存可視化。 |
| **漏れなし** | GO | ユーザー 6 問（用途不明 / 依存関係 / 整理 / 追加要否 / 命名 / テスト seed）すべてに Lane A/B/C が対応。スコープ外 2 項（500 修正・before/after 差分 UI）は Phase 12 baseline 記録として明示済。 |
| **整合性あり** | GO | Lane C の SQL（相関サブクエリ）→ `parsePendingRequestTypes` → `AdminMemberListViewZ` → web 再宣言 zod/adapter → 行バッジ → Link(type) のデータフロー（Phase 2.5）が一貫。Phase 7 のカバレッジ目標と Phase 8 のリファクタ配置（parseTagsJson 隣）が整合。 |
| **依存関係整合** | GO | 既存 API/D1 を尊重し新 endpoint・schema 変更なし。seed は既存 catalog→build-seed-sql→drift guard の決定論パイプラインに接続。承認経路（requests.ts resolve）と直接トグル経路（member-status.ts PATCH）は不変のまま独立（AC-13）。 |

---

## 10.3 不変条件チェック（CLAUDE.md / SSOT §10）

| 不変条件 | 遵守 | 根拠 |
| --- | --- | --- |
| 既存 API endpoint surface のみ・新 endpoint なし | ✅ | `/members` projection 拡張のみ・path 不変 |
| D1 schema 変更なし | ✅ | admin_member_notes は既存・seed 追加のみ・新規 index 作らない（既存 index 活用） |
| apps/web から D1 直接アクセス禁止 | ✅ | バッジは API レスポンス `pendingRequestTypes` を読むのみ |
| admin mutation は useAdminMutation 経由 | ✅ | 既存 resolve フロー不変・新規 mutation なし |
| 色は OKLch トークン正本・HEX 禁止 | ✅ | Phase 9 §9.1 HEX gate 0 件 / 既存 chip 再利用 |
| spec ファイルは `*.spec.{ts,tsx}` のみ | ✅ | Phase 7 §7.2 / lefthook block-test-suffix |
| admin form input は FormField 経由（#9） | ✅ | 本タスクは新規 input を増やさない（表示ラベル + バッジ + リンクのみ） |
| 新規 primitive を生やさない | ✅ | バッジは既存 status バッジ/チップ再利用（Phase 8 §8.1）|
| Google Form schema を固定しすぎない / consent キー統一 | ✅（無関係・非接触） | 本タスクは Form 領域に触れない |

---

## 10.4 残課題 / user-gated 境界

| 項目 | 区分 | 扱い |
| --- | --- | --- |
| `GET /api/admin/members/TEST-MEM-01 500` の調査・修正 | スコープ外（Q4 非選択）| Phase 12 未タスク検出に baseline 記録 |
| 承認 before→after 公開状態の差分強調 UI | スコープ外（Q4 非選択）| Phase 12 baseline 記録 |
| ルートパス `/admin/requests` のリネーム | 意図的不変（AC-4）| 表示ラベル平易化で目的達成・対象外 |
| staging seed 投入（`seed-test-accounts.sh --env staging --action apply`） | **user-gated** | Phase 13・承認後のみ |
| AC-8 の staging 実挙動確認（2 件 / 1 件） | **user-gated** | seed 投入後の staging 確認 |
| screenshot（Phase 11 evidence） | **user-gated** | implemented_local_evidence_captured ゆえ実装後に取得（PNG は現時点 0） |
| commit / PR / push | **user-gated** | Phase 13 |

> implemented_local_evidence_captured × VISUAL のため Phase 11 のスクリーンショットは実装完了後に取得する。本サイクルでは PNG 0 件（capture metadata status=pending_implementation）で正常。

---

## 10.5 判定

**GO（Gate-B passed・spec 完成）**。

- Phase 1-3（要件/設計/Gate-A）+ Phase 4-9（テスト方針/実装手順/カバレッジ/リファクタ/品質保証）が一貫し、AC-1..13 がすべて成果物/テストへ紐付く。
- 4 条件すべて GO、不変条件すべて遵守。
- **実装そのものは本プロンプトのサイクルでは行わない**。本実装サイクルが Phase 4-9 の手順に従い 1 サイクルで実装し、staging 投入・screenshot・commit・PR を user-gated で実施する。

---

## 10.6 完了条件（Phase 10）

- [ ] AC-1..13 全件を成果物/テストへ紐付けたレビュー判定表を作成した
- [ ] 4 条件（矛盾なし/漏れなし/整合性あり/依存関係整合）をすべて GO 評価した
- [ ] 不変条件（CLAUDE.md / SSOT §10）を全件チェックした
- [ ] 残課題と user-gated 境界（staging seed・screenshot・commit・PR）を明示した
- [ ] 判定 GO（spec 完成・実装は後続プロンプト）を確定した
- [x] 本 Phase ではコード実装を完了し、コミットは user-gated として未実行
