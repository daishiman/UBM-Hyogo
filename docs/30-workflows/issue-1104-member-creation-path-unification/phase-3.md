# Phase 3: 設計レビュー — issue-1104-member-creation-path-unification

> [実装区分: 実装仕様書] / NON_VISUAL / ゲート: Gate-A（spec_review）

## 1. 4 条件評価

| 条件 | 評価 | 根拠 |
|------|------|------|
| **価値性** | PASS | 誰の何のコストを下げるか明確: 将来の member 作成経路追加時に、開発者が `member_status` 生成を手で覚えておくコストをゼロにする。orphan 由来 404 の再発（admin の中核機能停止）を構造的に封じる。`createMemberWithStatus` を経由する限り orphan が出ない |
| **実現性** | PASS | 初回スコープで実装可能な厚み: 新規 helper 1 個（既存 `upsertMember` + `ensureMemberStatusRow` を内部委譲）+ 呼び出し側 2 ファイル差し替え + auto-link 1 行連結 + tests。新規 SQL/migration/型なし。1 サイクル内完結（CONST_007） |
| **整合性** | PASS | 責務境界が矛盾なく閉じる: 生成責務 = repository helper が所有 / mutation 防御（P-3）= route が所有、を明確に分離（F-4）。`apps/web` 不変・endpoint surface 不変・FK は followup-002 へ委譲で重複なし |
| **運用性** | PASS | 導入後の verify が D1 contract test で機械化可能。grep gate（新規生成経路に独立 `ensureMemberStatusRow` が残らない）で AC-3 を検証。backfill 0025 と併存して legacy 修復と新規予防が両立 |

## 2. 設計の技術的検証

| 検証項目 | 結果 |
|---------|------|
| 循環 import の有無 | **なし**。`members.ts` → `status.ts`（`ensureMemberStatusRow`）の単方向。`status.ts` の現行 import は `_shared/db` / `_shared/brand` / `@ubm-hyogo/shared` / `_shared/sql` のみで `members.ts` を import しない。`identities.ts` → `status.ts` も同様に単方向 |
| `member_status` 既定行生成の安全性 | **安全**。NOT NULL 列は全て DEFAULT 値あり（`0002_admin_managed.sql:5-15`）。`INSERT OR IGNORE INTO member_status (member_id) VALUES (?1)` で完結 |
| 冪等性 | **保証**。`createMemberWithStatus` 内の両 write が `ON CONFLICT DO UPDATE` / `INSERT OR IGNORE`。再呼び出しで重複・例外なし |
| writeCount セマンティクス | **不変**。ingest の `writeCount += 2` は helper 内部 2 write のまま維持 |
| auto-link の戻り値契約 | **不変**。`backfillIdentityFromCandidate` は `Promise<MemberIdentityRow \| null>` を維持（status 連結は副作用追加のみ・戻り値に影響しない） |
| 既存 endpoint surface | **不変**。route・レスポンス shape に変更なし |

## 3. リスクと緩和

| リスク | 影響 | 確率 | 緩和 |
|--------|------|------|------|
| auto-link への status 連結で session 解決のレイテンシ増 | 低 | 低 | +1 write（INSERT OR IGNORE）のみ。auto-link は初回 backfill 時のみ発火（既存 identity は早期 return）。実害無視可能 |
| `createMemberWithStatus` 命名が既存と衝突 | 低 | 低 | `grep` で `createMemberWithStatus` 不在を確認済み（`createMemberTagsProvider` のみ）。衝突なし |
| F-4 で P-3 を保持 → AC-3「散在集約」と矛盾と誤読される | 低 | 中 | implementation-guide / phase-2 §3 に「AC-3 の集約対象は新規生成経路 P-1/P-2。P-3 は mutation 防御で性質が異なり意図的保持」を明記。grep gate は P-1/P-2 を対象に判定 |
| 既存 ingest spec / auto-link spec が helper 差し替えで回帰 | 中 | 低 | Phase 4 で既存 spec を RED 前に棚卸し。レスポンス・write 結果不変を AC-5 で強制。既存 spec 全 PASS をゲート |
| followup-002（FK）と二重対応 | 低 | 低 | 本タスクは migration を作らない（AC-7）。FK は DB 層・別 Issue で分離済み |

## 4. ゲート判定

| ゲート | 判定 | 根拠 |
|-------|------|------|
| Gate-A（spec_review） | **PASS（implemented_local_evidence_captured 段階）** | 4 条件すべて PASS。root cause（生成責務分散 + auto-link 欠落）と採用方針（単一 helper 集約 + F-4 防御保持）が整合。Phase 4 へ進行可 |

> 本タスクは **implemented_local_evidence_captured**（ローカル実装・focused 証跡取得済み）。Gate-A は設計レビュー、Gate-B は実装証跡、Gate-C は commit/PR/staging user gate として分離する。

## 5. 完了条件

- [x] 4 条件評価（全 PASS）
- [x] 循環 import 非発生を確認
- [x] リスク緩和策を固定
- [x] Gate-A 判定（PASS・Phase 4 進行可）
