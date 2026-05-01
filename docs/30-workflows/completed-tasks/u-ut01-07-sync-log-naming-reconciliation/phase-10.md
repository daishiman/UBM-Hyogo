# Phase 10: 最終レビューゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `sync_log` 論理名と既存 `sync_job_logs` / `sync_locks` の整合 (U-UT01-07) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビューゲート |
| 作成日 | 2026-04-30 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動テスト検証 / NON_VISUAL 縮約) |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| Wave | 1 |

## 目的

Phase 1〜9 で蓄積した文書資産・採択ロジック・品質ゲート結果を横断レビューし、4 条件（価値性 / 実現性 / 整合性 / 運用性）の最終評価と AC-1〜AC-6 全件 PASS を確定する。
さらに UT-04 / UT-09 への引き継ぎ十分性、U-8 / U-9 との直交性、aiworkflow-requirements drift 解消方針を Go/No-Go 判定に組み込み、Phase 11（NON_VISUAL 縮約 manual evidence 採取）への進行可否を確定する。

## 判定基準

| 判定 | 条件 | 対応 |
| --- | --- | --- |
| PASS（GO） | 4 条件全 PASS / AC 全 PASS / 直交性 OK / 引き継ぎ十分 / drift 方針確定 | Phase 11 へ進行 |
| MINOR | 軽微な指摘あり（line budget 微逸脱・cross-link 軽微切れ等） | 未タスク化記録後 Phase 11 へ進行 |
| MAJOR | 重大な問題あり（用語揺れ残置 / AC 未達 / 直交侵食） | 該当 Phase へ戻り（Phase 8 / Phase 2） |
| CRITICAL | 致命的な問題あり（canonical 採択覆る等） | Phase 1 へ戻り再要件化 |

## 実行タスク

1. AC-1〜AC-6 達成状態評価（spec_created 視点）（完了条件: 全件 PASS / FAIL 確定）。
2. 4 条件最終判定（完了条件: 価値性 / 実現性 / 整合性 / 運用性すべて PASS）。
3. 直交性チェック（完了条件: U-8 / U-9 への侵食 0）。
4. UT-04 / UT-09 引き継ぎ十分性確認（完了条件: 各タスク担当者が本仕様書のみで着手可能と判定できる粒度）。
5. aiworkflow-requirements drift 解消方針の確定（完了条件: Phase 12 doc-only 更新案の有無確定）。
6. MAJOR / MINOR の戻り条件と未タスク化方針確定（完了条件: ルール明文化）。
7. Go/No-Go 判定確定（完了条件: `outputs/phase-10/go-no-go.md` に GO 記述）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/phase-07.md | AC マトリクス |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/phase-08.md | DRY 化結果 |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/phase-09.md | 文書品質ゲート結果 |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/ | 単一正本群 |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-07-sync-log-naming-reconciliation.md | AC-1〜AC-6 / 苦戦箇所 |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/index.md | 引き継ぎ先（migration 計画） |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-07-FU01-ut09-canonical-sync-job-receiver.md | UT-09 実装受け皿確定 follow-up |
| 参考 | docs/30-workflows/ut-04-d1-schema-design/phase-10.md | 書式模倣元 |

## GO / NO-GO 判定マトリクス（AC × 達成状態）

> **評価基準**: spec_created 段階のため、「Phase 1〜9 で具体的に確定し、UT-04 / UT-09 が本仕様書を読むだけで着手可能な粒度に分解されているか」で判定する。

| AC | 内容 | 達成状態 | 仕様確定先 | 判定 |
| --- | --- | --- | --- | --- |
| AC-1 | canonical 命名決定 + 採択理由（破壊的変更コスト評価含む） | 仕様確定 | Phase 2 `naming-canonical.md` | PASS |
| AC-2 | 論理 13 カラム × 物理 1:N マッピング表 | 仕様確定 | Phase 2 `column-mapping-matrix.md` | PASS |
| AC-3 | 後方互換 4 案比較 + 採択 + 却下理由 + データ消失なし明示 | 仕様確定 | Phase 2 `backward-compatibility-strategy.md` | PASS |
| AC-4 | UT-04 引き継ぎ migration 戦略 | 仕様確定 | Phase 2 `handoff-to-ut04-ut09.md` | PASS |
| AC-5 | U-8 / U-9 直交性チェックリスト | 仕様確定 | Phase 2 `handoff-to-ut04-ut09.md` | PASS |
| AC-6 | aiworkflow-requirements drift 整合確認 + 必要時 doc-only 更新案 | 仕様確定（Phase 11 で drift 0 hits 採取済み / 適用案は Phase 12） | Phase 9 drift 結果 + Phase 12 documentation | PASS |

## 4 条件最終判定

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 二重 ledger 化リスクを設計段階で根絶し、UT-04 / UT-09 が迷わず着手できる単一正本を提供する。 |
| 実現性 | PASS | docs-only であり、コード変更 0 / migration 改変 0 / 権限境界変更 0 で完結する。 |
| 整合性 | PASS | 不変条件 #1（schema を mapper 層に閉じる）/ #5（D1 access apps/api 内閉鎖）/ #7（Form 再回答が更新経路）を維持。既存 `apps/api/migrations/0002_sync_logs_locks.sql` を改変せず物理 canonical として尊重。 |
| 運用性 | PASS | 単一正本化により UT-04 / UT-09 / 後続レビューでの再議論コストが排除される。aiworkflow-requirements drift 解消ルートも提示済み。 |

**最終判定: GO（PASS）**

## 直交性チェック

| 直交対象 | 本タスクのスコープ境界 | 判定 |
| --- | --- | --- |
| U-8（sync 状態 enum / trigger enum 統一） | 本タスクは enum 値の canonical 決定を含まない。テーブル名のみ確定。 | OK（侵食 0） |
| U-9（retry 回数 / offset resume 統一） | 本タスクは数値ポリシー決定を含まない。カラム有無の設計判定のみ。 | OK（侵食 0） |
| UT-04（D1 schema 設計） | 本タスクは migration 戦略を decisive に確定するが DDL 発行は UT-04 のスコープ。 | OK（境界明確） |
| UT-09（Sheets→D1 同期ジョブ実装） | 本タスクは canonical name を確定するが mapper 実装は UT-09 のスコープ。 | OK（境界明確） |

## UT-04 / UT-09 引き継ぎ十分性確認

| 引き継ぎ項目 | UT-04 への提供内容 | UT-09 への提供内容 | 十分性 |
| --- | --- | --- | --- |
| 物理 canonical name | `sync_job_logs` / `sync_locks`（既存実装尊重） | 同左 | OK |
| 論理概念扱い | `sync_log` は概念名として注釈付きで残置 | 同左 | OK |
| 1:N マッピング表 | 論理 13 カラム × 物理対応 / 未実装 / 不要 | mapper 実装の入力 | OK |
| migration 戦略 | no-op 第一候補・データ消失なし戦略のみ採択候補 | mapper 実装で no-op 前提 | OK |
| 不足カラム判定 | `idempotency_key` / `processed_offset` 等の追加要否設計判定（DDL 発行は UT-04） | UT-04 が決めた DDL に従って実装 | OK |
| データ消失却下案 | DROP & 再作成案を明示却下 | 同左 | OK |

## aiworkflow-requirements drift 解消方針

- Phase 9 で drift 実測計画を確定済み。
- Phase 11 manual-smoke-log で実測コマンドを実行し結果を採取。
- drift 検出時は Phase 12 で doc-only 更新案を `.claude/skills/aiworkflow-requirements/references/database-schema.md` に対する diff として成果物に含める（mirror sync は .agents 側にも反映義務）。
- 既存記述 drift なし時は AC-6 を「既存 drift なし / canonical 追補は UT-04 判定」として close。

## MAJOR / MINOR 戻り条件

| 判定 | 戻り先 | 理由 |
| --- | --- | --- |
| MINOR（line budget 軽微逸脱） | Phase 8 | 文書 DRY 化で再分割 |
| MINOR（cross-link 軽微切れ） | Phase 8 | navigation drift 修正 |
| MAJOR（用語揺れ残置） | Phase 8 | 用語統一やり直し |
| MAJOR（AC 未達） | Phase 7 | AC マトリクス再構築 |
| MAJOR（直交侵食） | Phase 2 | 採択ロジック再検討 |
| CRITICAL（canonical 採択覆る） | Phase 1 | 要件再確認 |

## MINOR 判定の未タスク化方針

- 本タスクで MINOR が出た場合は **必ず未タスク化** する（`docs/30-workflows/unassigned-task/` 配下に新規 .md 起票）。
- Phase 12 `unassigned-task-detection.md` に該当 ID を記載し、次 Wave 以降の優先度評価に回す。
- 本 Phase 時点では MINOR は **想定なし**（4 条件全 PASS / AC 全 PASS）。

## open question の Phase 振り分け

| # | 質問 | 受け皿 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | aiworkflow-requirements drift 検出時の doc-only 更新案の最終形 | Phase 11（実測）/ Phase 12（適用案） | 計画済み |
| 2 | UT-04 が「不足カラム追加」を採択した場合の本仕様書側更新要否 | UT-04 着手後の追補 | 申し送り |
| 3 | U-8 / U-9 が enum / retry を確定後、本仕様書のマッピング表に enum 列を追加するか | 後続レビュー | 申し送り |

## Phase 11 進行 GO / NO-GO

### GO 条件（すべて満たすこと）

- [ ] AC-1〜AC-6 すべて PASS
- [ ] 4 条件最終判定 PASS
- [ ] 直交性侵食 0
- [ ] UT-04 / UT-09 引き継ぎ十分性 OK
- [ ] aiworkflow-requirements drift 解消方針確定
- [ ] MAJOR が一つもない

### NO-GO 条件（一つでも該当）

- 4 条件のいずれかに MAJOR が残る
- AC のうち PASS でないものがある
- 直交侵食が検出される
- UT-04 / UT-09 引き継ぎが不十分（担当者が再質問必須となる粒度）
- drift 解消方針が未定

## 実行手順

### ステップ 1: AC マトリクス再評価
- Phase 7 / Phase 9 を基に AC-1〜AC-6 を spec_created 視点で評価。

### ステップ 2: 4 条件最終判定
- Phase 3 base case + Phase 9 QA を統合して評価。

### ステップ 3: 直交性チェック
- U-8 / U-9 への侵食有無確認。

### ステップ 4: UT-04 / UT-09 引き継ぎ十分性
- 各タスク担当者視点で本仕様書を self-review。

### ステップ 5: drift 解消方針確定
- Phase 9 計画 + Phase 11 実測 + Phase 12 適用ルートを確定。

### ステップ 6: MAJOR / MINOR 戻り条件確定
- ルールのみ記述（本 Phase で発生想定なし）。

### ステップ 7: Go/No-Go 確定
- `outputs/phase-10/go-no-go.md` に GO 判定記述。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | GO 判定を入力に NON_VISUAL 縮約 manual evidence を採取 |
| Phase 12 | drift 検出時の doc-only 更新案を formalize |
| Phase 13 | GO/No-Go 結果を PR description に転記 |
| UT-04 | canonical name + migration 戦略を migration 計画の入力に使用 |
| UT-09 | canonical name を mapper 実装の入力に使用 |

## 多角的チェック観点

- 価値性: 単一正本提供により UT-04 / UT-09 の着手スピードが向上。
- 実現性: docs-only / コード変更 0 / 権限変更 0。
- 整合性: 不変条件 #1 / #5 / #7 を維持し、既存 migration を尊重。
- 運用性: drift 解消ルートが Phase 11 / 12 に明示されている。
- 認可境界: 本 Phase は読み取りのみで権限境界を変更しない。
- 直交性: U-8 / U-9 への侵食 0、UT-04 / UT-09 のスコープ境界明確。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC-1〜AC-6 達成評価 | 10 | spec_created | 6 件 |
| 2 | 4 条件最終判定 | 10 | spec_created | PASS |
| 3 | 直交性チェック | 10 | spec_created | U-8 / U-9 / UT-04 / UT-09 |
| 4 | 引き継ぎ十分性確認 | 10 | spec_created | UT-04 / UT-09 |
| 5 | drift 解消方針確定 | 10 | spec_created | Phase 11 / 12 ルート |
| 6 | MAJOR / MINOR 戻り条件 | 10 | spec_created | ルール明文化 |
| 7 | Go/No-Go 判定 | 10 | spec_created | GO |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/go-no-go.md | Go/No-Go 判定・AC マトリクス・4 条件・直交性・引き継ぎ十分性・drift 方針 |
| メタ | artifacts.json | Phase 10 状態の更新 |

## 完了条件

- [ ] AC-1〜AC-6 全件に達成状態が付与されている
- [ ] 4 条件最終判定が PASS
- [ ] 直交性侵食 0
- [ ] UT-04 / UT-09 引き継ぎ十分性が確認されている
- [ ] aiworkflow-requirements drift 解消方針が確定
- [ ] MAJOR / MINOR 戻り条件が明文化されている
- [ ] Go/No-Go 判定が GO で確定
- [ ] outputs/phase-10/go-no-go.md が作成済み

## タスク 100% 実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 成果物 `outputs/phase-10/go-no-go.md` 配置予定
- AC × 4 条件 × 直交性 × 引き継ぎ × drift × 戻り条件 × Go/No-Go の 7 観点すべて記述
- artifacts.json の `phases[9].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 11 (手動テスト検証 / NON_VISUAL 縮約)
- 引き継ぎ事項:
  - GO 判定（spec_created 段階）
  - drift 実測コマンドを Phase 11 manual-smoke-log で実行
  - NON_VISUAL 縮約テンプレ適用（screenshot 不要 / 代替 evidence 採用）
  - UT-04 / UT-09 引き継ぎ事項を `outputs/phase-02/handoff-to-ut04-ut09.md` / `handoff-to-ut04-ut09.md` で確定済み
- ブロック条件:
  - 4 条件のいずれかが MAJOR
  - AC で PASS でないものが残る
  - drift 解消方針が未定
  - UT-04 / UT-09 引き継ぎ不十分
