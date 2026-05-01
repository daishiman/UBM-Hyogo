# Phase 10: 最終レビューゲート / Go-No-Go

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | sync 状態 enum / trigger enum の canonical 統一 (U-UT01-08) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビューゲート / Go-No-Go |
| 作成日 | 2026-04-30 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動検証 / NON_VISUAL 縮約) |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| タスク分類 | specification-design（final review gate） |

## 目的

Phase 1〜9 で蓄積した canonical set 決定 / マッピング表 / shared 配置 / 書き換え対象リスト / runbook / AC マトリクス / DRY 化 / QA の各成果物を横断レビューし、AC-1〜AC-8 すべての達成状態と 4条件最終判定（PASS/MINOR/MAJOR）を確定する。

本タスクは **docs-only / NON_VISUAL / spec_created** であり、実 migration / 実装コミットを伴わない。ゆえに Go 判定の本質は **「後続タスク（UT-04 / UT-09 / U-UT01-10）が本仕様書のみで実装着手できる粒度に達しているか」** である。具体的には:

- canonical set が確定し、変換 UPDATE 疑似 SQL が CHECK 追加と二段階で記述されている
- マッピング表が既存値リテラル全件をカバーしている
- shared 配置決定が U-UT01-10 と直交（責務分離）であることが明記されている
- 書き換え対象リストが file:line 粒度で UT-09 が即着手できる

これらが揃って初めて Phase 11 (NON_VISUAL 縮約) / Phase 12 (7 必須成果物) への引き渡しが可能となる。

## 実行タスク

1. AC-1〜AC-8 の達成状態を spec_created 視点で評価する（完了条件: 全件に「仕様確定」or「Phase 10/12 で確定予定」が付与）。
2. 4条件（価値性 / 実現性 / 整合性 / 運用性）に対する最終再評価を確定する（完了条件: PASS/MINOR/MAJOR が一意に決定）。
3. Go-No-Go 判定基準を適用する（完了条件: 5 つの Go 条件すべての充足 or いずれか 1 つでも MAJOR で差し戻し）。
4. 後続タスク（UT-04 / UT-09 / U-UT01-10）が本仕様書のみで実装着手できる粒度かレビューする（完了条件: 各タスクごとに「本仕様書から着手可能 / 不可」の判定 + 必要追加情報を記述）。
5. MAJOR 検出時の Phase 2 差し戻しルートを確定する（完了条件: canonical-set-decision.md / value-mapping-table.md / shared-placement-decision.md のいずれを再策定するかが特定可能）。
6. Phase 11 (NON_VISUAL 縮約) / Phase 12 (7 必須成果物) への引き渡し条件を明文化する（完了条件: NON_VISUAL タスクのため screenshot 不要 / manual-evidence.md + link-checklist.md による代替 evidence 採用、Phase 12 で 7 必須成果物作成計画の確定）。
7. open question を Phase 11/12 へ送り出す（完了条件: 残課題の受け皿 Phase が指定）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/u-ut01-08-sync-enum-canonicalization/phase-07.md | AC マトリクス |
| 必須 | docs/30-workflows/u-ut01-08-sync-enum-canonicalization/phase-08.md | DRY 化結果 |
| 必須 | docs/30-workflows/u-ut01-08-sync-enum-canonicalization/phase-09.md | QA 結果 |
| 必須 | docs/30-workflows/u-ut01-08-sync-enum-canonicalization/phase-03.md | 設計レビューゲート（base case） |
| 必須 | docs/30-workflows/u-ut01-08-sync-enum-canonicalization/index.md | AC / 不変条件 / 直交関係 |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-08-sync-enum-canonicalization.md | 起票仕様 |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/index.md | 後続タスク（UT-04）の引き渡し先 |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md | 後続タスク（UT-09）の引き渡し先 |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-10-shared-sync-contract-types.md | shared 実装コミット先（直交確認） |
| 参考 | docs/30-workflows/ut-04-d1-schema-design/phase-10.md | 最終レビュー観点の参照事例 |

## Go / No-Go 判定マトリクス（AC × 達成状態）

> **評価基準**: docs-only / spec_created 段階のため、「契約文書として完備し、後続タスクが本仕様書のみで実装着手できる粒度」で判定する。

| AC | 内容 | 達成状態（spec_created 時点） | 仕様確定先 | 判定 |
| --- | --- | --- | --- | --- |
| AC-1 | `status` canonical set 確定（5 値: pending / in_progress / completed / failed / skipped） | 仕様確定 | Phase 2 canonical-set-decision.md | PASS |
| AC-2 | `trigger_type` canonical set 確定（3 値: manual / cron / backfill）+ `triggered_by` 別カラム分離 | 仕様確定 | Phase 2 canonical-set-decision.md | PASS |
| AC-3 | 既存値 → canonical 値マッピング表（変換 UPDATE 疑似 SQL を含む） | 仕様確定 | Phase 2 value-mapping-table.md | PASS |
| AC-4 | shared 配置先決定（types + Zod 併設、U-UT01-10 と直交） | 仕様確定 | Phase 2 shared-placement-decision.md | PASS |
| AC-5 | 既存実装書き換え対象範囲リスト（ファイル + 行番号 + 変更種別） | 仕様確定 | Phase 5 rewrite-target-list.md | PASS |
| AC-6 | U-UT01-07 / U-UT01-09 / U-UT01-10 との直交関係明記 | 仕様確定 | index.md + 起票.md §直交関係 | PASS |
| AC-7 | 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）が全 PASS で根拠付き | 本 Phase で確定 | 下記 4条件最終再評価 | PASS |
| AC-8 | Phase 12 で 7 必須成果物確認 | Phase 12 で確定予定 | outputs/phase-12/*.md | 引き渡し |

## 4 条件最終再評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | UT-01 論理設計と既存実装の enum 差分が canonical set として確定し、後続 UT-04 / UT-09 / U-UT01-10 が同一値ドメインを参照可能。サイレントドリフト累積（DB 制約 / 集計クエリ / UI ラベル 3 層）の根本対策となる。 |
| 実現性 | PASS | docs-only タスクのため実装コストなし。canonical 5 値 + 3 値の決定根拠 + 変換 UPDATE 疑似 SQL（2 段階 migration: UPDATE → CHECK 追加）が Phase 5 contract-runbook で具体記述済み。既存値 7 件全てが canonical へマッピング済（Phase 9 カバレッジ確認済）。 |
| 整合性 | PASS | 不変条件 #4（admin-managed data 分離: `triggered_by='admin'` 別カラム化）/ #5（D1 access apps/api 内: shared は型 / Zod のみ）を遵守。関連タスク U-UT01-07（命名整合）/ U-UT01-09（retry/offset）/ U-UT01-10（shared 実装）と直交、責務侵食なし。Phase 8 DRY 化で値ドメインの単一正本（Phase 2）化済み。 |
| 運用性 | PASS | grep 検索性向上、後続実装着手時に「どの値ドメインが正本か」を Phase 2 の 3 ファイルに集約参照可能。書き換え対象リストが file:line 粒度のため UT-09 着手時の手戻り削減。docs-only のため運用負荷なし。 |

**最終判定: GO（4条件全 PASS）**

## Go-No-Go 判定基準

### Go 条件（5 件すべて満たすこと）

- [x] **canonical set 確定**: status 5 値 / trigger_type 3 値が Phase 2 で唯一の正本として確定
- [x] **マッピング表完備**: 既存値 7 件全件が canonical へマッピングされ、変換 UPDATE 疑似 SQL が記述
- [x] **配置決定**: shared 配置（types + Zod 併設）が確定、U-UT01-10 と直交（実装は U-UT01-10）が明記
- [x] **書き換え対象リスト具備**: ファイル × 行番号 × 変更種別が UT-09 着手粒度で記述
- [x] **直交性証明**: U-UT01-07 / U-UT01-09 / U-UT01-10 の責務との非侵食が表で証明

### No-Go 条件（いずれか 1 つでも MAJOR で差し戻し）

| MAJOR 条件 | 差し戻し先 |
| --- | --- |
| canonical 値が複数案併存のまま確定していない | Phase 2 (canonical-set-decision.md) |
| 既存値の grep 結果にマッピング未カバーが残る | Phase 2 (value-mapping-table.md) |
| shared 配置決定が「未決」または U-UT01-10 と統合 / 分離が曖昧 | Phase 2 (shared-placement-decision.md) |
| 書き換え対象リストが行番号粒度で記述されていない | Phase 5 (rewrite-target-list.md) |
| 直交関係表で U-UT01-07/09/10 の責務に踏み込んでいる箇所がある | Phase 2 / Phase 8 |

**判定: GO（5 件すべて充足、MAJOR 0 件）**

## 後続タスク着手可能性レビュー

| 後続タスク | 必要情報 | 本仕様書での提供状態 | 着手可能性 |
| --- | --- | --- | --- |
| **UT-04 (D1 schema 設計)** | `sync_job_logs` テーブルの `status` / `trigger_type` CHECK 句に使う canonical 値 + `triggered_by` 列の追加判断 | Phase 2 で確定済み + Phase 5 で 2 段階 migration 疑似 SQL（UPDATE → CHECK）記述済み | **着手可能** |
| **UT-09 (Sheets→D1 同期ジョブ実装)** | 既存実装の書き換え対象（`apps/api/src/jobs/sync-sheets-to-d1.ts` の status / trigger 値書き込み箇所）+ 集計クエリの silent drift 対策 | Phase 5 rewrite-target-list.md に file:line 粒度で記述、Phase 6 異常系で集計クエリ silent drift 対策記述 | **着手可能** |
| **U-UT01-10 (shared 契約型実装)** | 配置先（`packages/shared/src/types/sync.ts` + `packages/shared/src/zod/sync.ts`）+ 型シグネチャ案 | Phase 2 shared-placement-decision.md に配置先 + 型シグネチャ案記述、本タスクと直交（実装は U-UT01-10 単独） | **着手可能** |

> 3 タスクすべてが「本仕様書のみで実装着手可能」と判定。追加情報依頼は不要。

## MAJOR 検出時の差し戻しルート

| MAJOR 種別 | 差し戻し先 Phase | 差し戻し対象成果物 |
| --- | --- | --- |
| canonical 値ドメイン未確定 | Phase 2 | `outputs/phase-02/canonical-set-decision.md` |
| 既存値カバレッジ漏れ | Phase 2 | `outputs/phase-02/value-mapping-table.md` |
| shared 配置未決 | Phase 2 | `outputs/phase-02/shared-placement-decision.md` |
| 書き換え対象の粒度不足 | Phase 5 | `outputs/phase-05/rewrite-target-list.md` |
| 直交関係侵食 | Phase 2 / Phase 8 | `index.md` + 該当 phase の責務記述 |

> 本 Phase での MAJOR 検出は 0 件。差し戻しは発生しない。

## Phase 11 / Phase 12 への引き渡し条件

### Phase 11 (NON_VISUAL 縮約) への引き渡し

- 本タスクは **docs-only / NON_VISUAL / visualEvidence=NON_VISUAL** のため、screenshot は不要。
- 代替 evidence として以下を Phase 11 で作成:
  - `outputs/phase-11/manual-evidence.md`: canonical set / マッピング表 / 配置決定 / 書き換え対象リストの spec lint 結果（grep 出力 + AC トレース）
  - `outputs/phase-11/link-checklist.md`: link 検証結果（リンク切れ 0 を ✅ で記録）
  - `outputs/phase-11/main.md`: 上記 2 ファイルの統合サマリー
- Phase 11 の所要時間: 30 分以内（spec lint + link check のみ）

### Phase 12 (7 必須成果物) への引き渡し

- Phase 12 で以下 7 必須成果物を作成:
  1. `outputs/phase-12/main.md` - サマリー
  2. `outputs/phase-12/implementation-guide.md` - 後続 UT-04 / UT-09 / U-UT01-10 への実装ガイド
  3. `outputs/phase-12/system-spec-update-summary.md` - DRY 化結果と canonical 確定の system-spec への反映
  4. `outputs/phase-12/documentation-changelog.md` - 本タスク docs 追加分の changelog
  5. `outputs/phase-12/unassigned-task-detection.md` - 残課題（open question）の formalize
  6. `outputs/phase-12/skill-feedback-report.md` - task-specification-creator skill への feedback
  7. `outputs/phase-12/phase12-task-spec-compliance-check.md` - 7 必須成果物の自己整合性チェック

### Phase 13 (PR 草案 / 承認チェックリスト) への引き渡し

- Phase 13 は `pending_user_approval`。GitHub Issue #262 は CLOSED のまま、再 OPEN しない。
- Phase 13 は PR 草案と承認チェックリストの文書化に閉じる。`git commit` / `git push` / `gh pr create` の実行手順はユーザー明示承認後の別操作として扱う。
- PR 説明文に本 Go-No-Go 判定結果を転記する計画を Phase 12 で確定。

## open question の Phase 振り分け

| # | 質問 | 受け皿 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | UI ラベル層（管理ダッシュボード status バッジ）の canonical 同期 | 別タスク（UT-08 監視ダッシュボード or UI 別タスク） | 起票.md スコープ外として明記済み |
| 2 | 集計クエリの grep-and-replace 漏れ検知策（実運用後の SLO 観測） | UT-08 / 運用観測タスク | Phase 6 異常系で観測策言及済み |
| 3 | `audit` 概念と `triggered_by='admin'` の責務分離（将来 admin actor 種別追加時） | 将来タスク（admin RBAC 設計） | Phase 12 unassigned-task-detection.md に candidate として送出 |
| 4 | shared パッケージの export 経路（barrel index.ts vs 個別 import） | U-UT01-10 で実装時に確定 | U-UT01-10 への申し送り |
| 5 | canonical set 拡張時の運用ルール（新規 status 追加時の 3 層同期手順） | Phase 12 implementation-guide.md | Phase 12 で runbook 化 |

## 実行手順

### ステップ 1: AC マトリクス再評価
- Phase 7 / Phase 9 の AC トレース表を基に、AC-1〜AC-8 を spec_created 視点で評価。

### ステップ 2: 4条件最終再評価
- Phase 3 の base case 判定 + Phase 9 QA 結果を継承し、本 Phase で再確認。

### ステップ 3: Go 条件 5 件の充足チェック
- canonical set / マッピング表 / 配置決定 / 書き換え対象リスト / 直交性 を順次確認。

### ステップ 4: 後続タスク着手可能性レビュー
- UT-04 / UT-09 / U-UT01-10 の 3 タスクごとに「本仕様書のみで着手可能か」を判定。

### ステップ 5: MAJOR 検出時の差し戻しルート確認
- 本 Phase で MAJOR 0 を確認、ルールのみ記述。

### ステップ 6: Phase 11 / Phase 12 引き渡し条件確定
- NON_VISUAL 縮約 + 7 必須成果物計画を明文化。

### ステップ 7: open question を次 Phase へ送出
- 5 件すべてに受け皿 Phase or 別タスクを指定。

### ステップ 8: outputs/phase-10/go-no-go.md に判定を記述

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | GO 判定を入力に NON_VISUAL 縮約 evidence 作成（screenshot 不要、manual-evidence.md + link-checklist.md） |
| Phase 12 | 7 必須成果物作成、open question #3 を unassigned-task として formalize |
| Phase 13 | GO/NO-GO 結果を PR description に転記（Issue #262 は CLOSED のまま参照） |
| UT-04 | canonical 値ドメイン + 2 段階 migration 疑似 SQL を CHECK 句設計に引き渡し |
| UT-09 | 既存実装書き換え対象（file:line）+ 集計クエリ silent drift 対策を引き渡し |
| U-UT01-10 | shared 配置決定 + 型シグネチャ案（types + Zod 併設）を実装インプットに引き渡し |

## 多角的チェック観点

- 価値性: canonical 確定により後続 3 タスク（UT-04 / UT-09 / U-UT01-10）が同一値ドメインで実装可能。
- 実現性: docs-only のため実装コストなし、Phase 9 で既存値 7 件 100% カバレッジ確認済み。
- 整合性: 不変条件 #4 / #5 遵守、関連タスクと直交（責務侵食なし）。
- 運用性: 書き換え対象 file:line 粒度で UT-09 着手の手戻り削減、grep 検索性向上。
- 認可境界: `triggered_by` 別カラム化により actor / mechanism 軸を schema 上で分離、将来の admin RBAC 拡張時の余地確保。
- 無料枠: docs-only のため D1 storage / reads / writes すべて影響なし。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC-1〜AC-8 達成状態評価 | 10 | spec_created | 8 件 |
| 2 | 4条件最終再評価 | 10 | spec_created | 全 PASS |
| 3 | Go 条件 5 件の充足チェック | 10 | spec_created | 全充足 |
| 4 | 後続タスク着手可能性レビュー | 10 | spec_created | 3 タスク全て着手可能 |
| 5 | MAJOR 差し戻しルート確認 | 10 | spec_created | MAJOR 0 |
| 6 | Phase 11 / Phase 12 引き渡し条件確定 | 10 | spec_created | NON_VISUAL 縮約 + 7 必須成果物 |
| 7 | open question 5 件送出 | 10 | spec_created | 受け皿 Phase 指定 |
| 8 | go-no-go.md 作成 | 10 | spec_created | GO で確定 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/go-no-go.md | GO/NO-GO 判定・AC マトリクス・4条件・後続タスク着手可能性・open question |
| メタ | artifacts.json | Phase 10 状態の更新 |

## 完了条件

- [ ] AC-1〜AC-8 全件に達成状態が付与されている
- [ ] 4 条件最終再評価が全 PASS
- [ ] Go 条件 5 件すべて充足が確認されている
- [ ] 後続タスク（UT-04 / UT-09 / U-UT01-10）の着手可能性が判定されている
- [ ] MAJOR 0 件で差し戻しなしが確定
- [ ] Phase 11 NON_VISUAL 縮約 / Phase 12 7 必須成果物の引き渡し条件が明文化
- [ ] open question 5 件すべてに受け皿 Phase or 別タスクが指定
- [ ] outputs/phase-10/go-no-go.md が作成済み
- [ ] GO 判定で確定

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 成果物 `outputs/phase-10/go-no-go.md` 配置予定
- AC × 4条件 × Go 条件 × 後続着手 × MAJOR × Phase 11/12 引き渡し × open question の 7 観点すべて記述
- artifacts.json の `phases[9].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 11 (手動検証 / NON_VISUAL 縮約)
- 引き継ぎ事項:
  - GO 判定（spec_created 段階）
  - NON_VISUAL タスクであり screenshot 不要、manual-evidence.md + link-checklist.md を採用
  - Phase 12 で 7 必須成果物作成計画
  - open question #1〜#5 を Phase 11/12 / 別タスクで消化
  - 後続 UT-04 / UT-09 / U-UT01-10 が本仕様書のみで実装着手可能（追加情報依頼不要）
- ブロック条件:
  - 4条件のいずれかが MAJOR
  - AC で PASS でないものが残る
  - Go 条件 5 件のいずれかが未充足
  - 後続タスクが「本仕様書のみで着手可能」と判定できない
  - shared 配置の U-UT01-10 関係が未決
