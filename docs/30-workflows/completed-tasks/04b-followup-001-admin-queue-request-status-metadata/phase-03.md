# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04b-followup-001-admin-queue-request-status-metadata |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| Wave | 4 (followup, serial) |
| 作成日 | 2026-04-30 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | completed |

## 目的

Phase 2 で確定した「列追加 + repository guard」案を、3 つの alternative 案と比較して PASS-MINOR-MAJOR 判定で評価し、不変条件 #4 / #5 / #11 への影響を最終確認した上で採用案を確定する。Phase 4 以降の検証戦略・実装ランブックの設計前提を固定する。

## 実行タスク

1. Alternative 3 案の構造化（A: CHECK 制約案 / B: 別テーブル分離案 / C: 採用案 = 列追加 + repository guard）
2. 各案を 4 軸（実現性 / 整合性 / 運用性 / 拡張性）で PASS-MINOR-MAJOR 判定
3. 不変条件 #4 / #5 / #11 への影響レビュー（各案ごと）
4. 採用案（C）の最終確定理由を quantitative に記述
5. リスク・トレードオフの明示と Phase 4 以降のテストでカバーする項目への落とし込み
6. 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）の最終判定

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-01.md | AC・値域・状態遷移表 |
| 必須 | phase-02.md | DDL 草案・interface・partial index |
| 必須 | apps/api/migrations/0006_admin_member_notes_type.sql | 直前 migration の構造判断材料 |
| 必須 | docs/00-getting-started-manual/specs/07-edit-delete.md | spec 整合 |
| 必須 | CLAUDE.md | 不変条件 #4 / #5 / #11 |
| 参考 | docs/30-workflows/04b-parallel-member-self-service-api-endpoints/phase-03.md | 04b 設計レビューの体裁 |

## Alternative 案の評価

### Alternative A: CHECK 制約で値域固定案

DDL に `CHECK (request_status IN ('pending','resolved','rejected') OR request_status IS NULL)` を付与し、DB レイヤで値域を強制する。

| 軸 | 判定 | 根拠 |
| --- | --- | --- |
| 実現性 | **MAJOR** | SQLite (D1) の `ALTER TABLE ... ADD COLUMN` は CHECK 制約を伴う列追加に対応するが、後から CHECK を強化/緩和する場合はテーブル再作成（CREATE TABLE new + INSERT ... SELECT + DROP + RENAME）が必要。enum 拡張時の運用コストが大きい |
| 整合性 | PASS | 不変条件 #4 / #5 / #11 には抵触しない |
| 運用性 | MINOR | 値域を 1 箇所（DDL）で守れるが、enum 追加時に再 migration 必要。アプリ側 (zod) と二重管理になる |
| 拡張性 | MAJOR | 新ステータス（例: `expired`）追加時にテーブル再作成 migration が必要 |

**判定: 不採用（MAJOR 2 件）**。SQLite の制約強化コストが MVP の柔軟性を損なう。

### Alternative B: 別テーブル分離案

`admin_member_request_queue (queue_id, member_id, request_type, status, resolved_at, resolved_by_admin_id, ...)` を新設し、`admin_member_notes` から request 系を切り離す。

| 軸 | 判定 | 根拠 |
| --- | --- | --- |
| 実現性 | MINOR | 新テーブル + 既存 `visibility_request` / `delete_request` 行のデータ移行 + repository 二重化が必要。MVP 直後で実データが少ないとはいえ migration 工数が大きい |
| 整合性 | MINOR | 不変条件には抵触しないが、04b 直後の Alternative C（不変条件 #4 と整合する選択）を覆す形になり、04b の Phase 3 設計判断と齟齬 |
| 運用性 | MINOR | テーブル増えると admin オペレーション（list / search）の join が増え運用負荷が上がる |
| 拡張性 | PASS | 将来 request 系が増えた場合は綺麗に分離できる |

**判定: 不採用（MINOR 3 件）**。MVP では「note_type による queue 化」を採用済み（04b Phase 3）であり、これを正としたまま列追加で済む案 C が整合性で勝る。将来的に request 系が肥大化した時点で再検討する。

### Alternative C: 列追加 + repository guard 案（採用）

`admin_member_notes` に `request_status` / `resolved_at` / `resolved_by_admin_id` の 3 列を追加。値域は zod / repository helper 入口で固定し、状態遷移は `UPDATE ... WHERE request_status='pending'` で構造的に強制する。partial index `idx_admin_notes_pending_requests` で `hasPendingRequest` の検索を高速化する。

| 軸 | 判定 | 根拠 |
| --- | --- | --- |
| 実現性 | **PASS** | `ALTER TABLE ADD COLUMN` 3 つ + UPDATE backfill + CREATE INDEX のみ。SQLite で容易に適用可能 |
| 整合性 | **PASS** | 04b の Phase 3（note_type queue 化）を正としたまま、不変条件 #4 / #5 / #11 のいずれにも抵触しない |
| 運用性 | **PASS** | 1 テーブルで request / general を扱い、既存 list / search クエリが壊れない。helper 入口で値域を守るため、enum 追加は zod 1 行修正で完了 |
| 拡張性 | MINOR | 将来 request 系が極端に増えた場合は B 案に再分割する余地あり。MVP では問題なし |

**判定: 採用（PASS 3 件 / MINOR 1 件）**。

## 不変条件への影響レビュー

| 不変条件 | A 案 | B 案 | C 案（採用） |
| --- | --- | --- | --- |
| #4: response_fields は本人 PATCH 不可 / 申請は別テーブル化 | PASS（admin_member_notes 内変更のみ） | PASS（別テーブル分離） | **PASS**（admin_member_notes 単独変更、member_responses 不変） |
| #5: D1 直接アクセスは apps/api 限定 | PASS | PASS | **PASS**（migration / repository ともに apps/api 配下） |
| #11: 管理者は member 本文を直接編集できない | PASS | PASS | **PASS**（markResolved / markRejected は admin_member_notes のみ UPDATE） |

採用案 C はいずれの不変条件にも抵触せず、04b Phase 3 で確立された「note_type による queue 化」の延長線上にある。

## 採用案の最終確定理由

1. **04b Phase 3 設計判断との整合**: 04b は「申請を別テーブル化せず note_type で表現する」を Alternative C（採用）として確立済み。本タスクで B 案（別テーブル分離）に切り替えると、直前の設計判断と矛盾する。
2. **SQLite の制約特性**: `ALTER TABLE ADD COLUMN` は安全だが、CHECK 制約の後付け強化はテーブル再作成を伴う。値域は zod / repository 層で守る方針が SQLite 運用と整合する。
3. **state transition の構造的強制**: `UPDATE ... WHERE request_status='pending'` という SQL 述語に組み込むことで、resolved/rejected/general 行への誤遷移を「UPDATE 0 件」で構造的に防げる。アプリ側 if 文に依存しない。
4. **partial index での hot path 最適化**: `hasPendingRequest` は本人申請 API のホットパスで毎回呼ばれる。pending 行限定の partial index で「件数小・selectivity 高」の特性を活かせる。
5. **下流タスク（07a / 07c）の接続性**: helper interface `markResolved` / `markRejected` を export することで、後続 admin resolve workflow が DDL 変更ゼロで完結できる。先行投資効果が大きい。

## リスク・トレードオフ

| リスク | 影響度 | 対策 | 担保 Phase |
| --- | --- | --- | --- |
| backfill 漏れで既存 pending 行が NULL のまま残る | 高 | migration 内 `UPDATE WHERE note_type IN (...) AND request_status IS NULL` を必ず実行し、適用後に検証 SELECT を回す | Phase 5 (runbook) / Phase 6 (異常系) |
| 値域違反（zod 通過外の値が DB に書かれる） | 中 | repository helper 入口で `RequestStatus` 型に固定。直接 SQL を発行する経路を作らない | Phase 4 (test) |
| general 行に request_status が誤って書かれる | 中 | helper の WHERE 句に `request_status='pending'` を含めることで general 行 (NULL) を構造的に除外 | Phase 4 (test) |
| 07a / 07c が helper を import せず別経路で UPDATE する | 中 | helper を export 確定し、後続タスクの phase-02 で import を必須記載 | 07a / 07c phase-02 |
| `Date.now()` (INTEGER ms) と既存 `created_at` (TEXT ISO8601) の表記混在 | 低 | resolved_at は範囲検索より単発 read 用途中心。view model 化時に必要なら ISO8601 へ変換するヘルパを別途追加 | Phase 8 (DRY) |

## 4 条件評価（最終）

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | admin 処理後の再申請を許容し audit 整合を取れるか | **PASS** | resolved/rejected 後の本人再申請が 202 で通ること、状態が DB 列で正本化されることが AC-3 / AC-7 で保証 |
| 実現性 | `ALTER TABLE` + repository helper + spec 追記の組合せで MVP 内で完了するか | **PASS** | DDL 3 行 + UPDATE 1 行 + CREATE INDEX 1 行 + repository 数十行 |
| 整合性 | 不変条件 #4 / #5 / #11 を破らずに完了するか | **PASS** | 全条件 PASS（上表） |
| 運用性 | 07a / 07c の後続実装が helper 1 セットで完結するか | **PASS** | `markResolved` / `markRejected` の export で DDL 変更不要 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 採用案 C のリスクをテストでカバーする項目（backfill 件数 / state transition 構造的防御 / partial index hit）を test strategy に組み込む |
| Phase 5 | 採用案 C の DDL / repository 実装の擬似コードを runbook 化 |
| Phase 6 | 異常系（resolved → resolved の重複 resolve / general への markResolved / 不正 noteId）を網羅 |
| Phase 7 | AC マトリクスの実装側を採用案 C のファイル群にトレース |

## 多角的チェック観点

| 観点 | チェック | 結果 |
| --- | --- | --- |
| 不変条件 #4 | response_fields 不変 | PASS |
| 不変条件 #5 | apps/api 内完結 | PASS |
| 不変条件 #11 | member 本文不変 | PASS |
| 認可境界 | helper 認可は呼出側責務 | OK（本タスク対象外） |
| 無料枠 | D1 storage / writes 影響無視可 | PASS |
| 拡張性 | 将来 B 案への移行余地あり | MINOR（許容） |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | Alt A / B / C の構造化 | 3 | pending |
| 2 | 4 軸 PASS-MINOR-MAJOR 判定 | 3 | pending |
| 3 | 不変条件影響レビュー | 3 | pending |
| 4 | 採用案確定理由 | 3 | pending |
| 5 | リスク・トレードオフ整理 | 3 | pending |
| 6 | 4 条件評価最終 | 3 | pending |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | Alt 3 案 + PASS-MINOR-MAJOR + 採用理由 + 4 条件評価 |
| メタ | artifacts.json | Phase 3 を completed |

## 完了条件

- [ ] Alternative 3 案がそれぞれ 4 軸で評価
- [ ] 採用案 C が PASS 3 件以上、MAJOR 0 件
- [ ] 不変条件 #4 / #5 / #11 が全 PASS
- [ ] 採用理由が 5 項目以上の quantitative な記述
- [ ] リスク 5 件に対し対策と担保 Phase が紐付く
- [ ] 4 条件評価が全 PASS

## タスク100%実行確認

- [ ] 実行タスク 6 件すべて completed
- [ ] artifacts.json で phase 3 を completed
- [ ] outputs/phase-03/main.md が Phase 4 テスト戦略の入力として参照可能

## 次 Phase への引き渡し

- 次: 4 (テスト戦略)
- 引き継ぎ: 採用案 C のリスク（backfill 漏れ / 値域違反 / general 行誤更新 / 別経路 UPDATE / 時刻表記混在）をテスト項目として継承
- ブロック条件: 採用案が PASS 過半数を取れない / 不変条件で MAJOR が出る / 4 条件で MAJOR が出る場合は Phase 2 へ差し戻し
