# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `sync_log` 論理名と既存 `sync_job_logs` / `sync_locks` の整合（命名 reconciliation 設計） |
| issue | #261 (U-UT01-07) |
| Phase 番号 | 1 / 3 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-30 |
| Wave | 1 |
| 実行種別 | docs-only（設計 reconciliation のみ） |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created |

## 目的

UT-01 Phase 2 で論理設計された単一論理テーブル `sync_log`（13 カラム想定）と、既に `apps/api/migrations/0002_sync_logs_locks.sql` で物理化されている `sync_job_logs`（ledger）+ `sync_locks`（lock）の二重 ledger 化リスクを文書契約として解消する。本 Phase は (1) 真の論点を「ledger 二重化防止 + UT-04 / UT-09 への canonical name 引き渡し」に再定義し、(2) AC-1〜AC-6 を index.md と一致させ、(3) 4 条件評価を全 PASS に固定して Phase 2 設計の入力を提供する。

## 真の論点 (true issue)

- 「論理 `sync_log` を採るか物理 `sync_job_logs` / `sync_locks` を採るか」の二者択一ではなく、「**UT-04 / UT-09 が確定 canonical 名で着手できる文書契約を、本番稼働中の物理を破壊せずに提供すること**」が本タスクの本質。
- 副次的論点として、enum 値（U-8）・retry / offset 値（U-9）と命名 reconciliation の **直交性を担保**し、本タスクで enum / retry / offset の決定に踏み込まないこと。これに失敗すると 3 タスクが相互依存して停滞する。
- 三次的論点として、`sync_log` 論理 1 行 → 物理 N 行（ledger / lock 分離）という 1:N 翻訳を **マッピング表として残す**こと。これがないと UT-04 が「物理側に該当カラムなし＝新規追加」と早合点して二重 ledger を再生する。

## visualEvidence の確定

| 項目 | 値 | 根拠 |
| --- | --- | --- |
| visualEvidence | NON_VISUAL | 成果物は Markdown のみ。UI / スクリーンショット対象なし |
| 成果物の物理形態 | テキスト（Markdown） | `outputs/phase-0X/*.md` |
| 検証方法 | grep / Read による文書整合チェック、UT-04 / UT-09 視点での self-review | Phase 3 の設計レビューゲートで判定 |

artifacts.json の `metadata.visualEvidence` を `NON_VISUAL` で確定する。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | UT-01 (Sheets→D1 同期方式定義) | 論理 `sync_log` の 13 カラム設計と Phase 12 の差分検出（U-7） | canonical 名と論理→物理マッピング表 |
| 上流 | 既存実装 `apps/api/migrations/0002_sync_logs_locks.sql` | 物理側の現状（read-only / 改変禁止） | 物理側カラム / index / 制約の写経 |
| 上流 | 既存実装 `apps/api/src/jobs/sync-sheets-to-d1.ts` | 物理側の lock / log 利用フロー（read-only） | 物理側 API 利用パターン |
| 下流 | UT-04 (D1 データスキーマ設計) | 本タスク採択の canonical 名 + migration 戦略 | migration 計画の引き継ぎ事項（idempotency_key 等の追加要否判定を委譲） |
| 下流 | UT-09 (Sheets→D1 同期ジョブ実装) | 本タスク採択の canonical 名 | 実装で参照する canonical name 宣言 |
| 直交 | U-8 (enum / trigger 統一) | 本タスクは enum 値の canonical 決定を**含まない** | 直交性チェックリスト |
| 直交 | U-9 (retry / offset 統一) | 本タスクは retry / offset 値の canonical 決定を**含まない** | 直交性チェックリスト |

## ownership 宣言

| 物理位置 | ownership | 権限 |
| --- | --- | --- |
| `docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/**` | 本タスク | write（生成・更新） |
| `apps/api/migrations/0002_sync_logs_locks.sql` | UT-09 / UT-04 既存物理 | **read-only**（本タスクは改変禁止） |
| `apps/api/src/jobs/sync-sheets-to-d1.ts` | UT-09 | **read-only** |
| `apps/api/migrations/*.sql`（新規） | UT-04 | 本タスクは **追加禁止**（migration 計画の引き継ぎのみ） |
| `.claude/skills/aiworkflow-requirements/references/database-schema.md` | aiworkflow-requirements skill | doc-only 更新可（drift 解消が必要な場合のみ） |

## 受入条件（AC）

issue 本文 AC-1〜AC-6 と完全一致させる。

- [ ] **AC-1（命名 canonical 決定）**: `sync_log` 概念名と物理 `sync_job_logs` / `sync_locks` のどちらを canonical とするか決定し、採択理由（破壊的変更コスト評価を含む）が `outputs/phase-02/naming-canonical.md` に明文化されている
- [ ] **AC-2（既存 → 新マッピング表）**: UT-01 Phase 2 論理 13 カラムすべてが、物理側の対応カラム / 物理未実装 / 不要 のいずれかに分類された 1:N マッピング表が `outputs/phase-02/column-mapping-matrix.md` に存在する
- [ ] **AC-3（後方互換戦略）**: no-op / view / rename / 新テーブル+移行 の 4 案比較表と採択結果（および却下理由）が `outputs/phase-02/backward-compatibility-strategy.md` に記載され、採択戦略が「データ消失を伴わない」ことが明示されている
- [ ] **AC-4（migration 計画）**: UT-04 が参照すべき migration 戦略（in-place ALTER / no-op / 新規 migration の追加 等）が決定され、`outputs/phase-02/handoff-to-ut04-ut09.md` に UT-04 引き継ぎ事項として箇条書きされている
- [ ] **AC-5（U-8 / U-9 直交性確認）**: 本タスクが enum 値（U-8）・retry / offset 値（U-9）の決定を含まないことがチェックリスト形式で `outputs/phase-02/handoff-to-ut04-ut09.md` に確認され、直交境界が明文化されている
- [ ] **AC-6（システム仕様 drift 解消）**: `.claude/skills/aiworkflow-requirements/references/database-schema.md` の sync 系記述が本タスクの canonical 名と整合しているか確認し、必要であれば doc-only 更新案を成果物に含める（不要なら不要を明記）

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | UT-04 / UT-09 が確定 canonical 名で着手できる文書契約を最小コスト（docs のみ）で提供。二重 ledger 化による本番監査ログ分裂を未然に防止 |
| 実現性 | PASS | コード変更・migration 追加なし。Markdown 4 ファイルの執筆のみ。読み込み対象（既存 migration / job コード）は read-only で完結 |
| 整合性 | PASS | 不変条件 #5（D1 アクセスは apps/api 限定）に違反せず、既存物理を破壊しない方針を no-op 第一候補として採る。U-8 / U-9 との直交性も担保 |
| 運用性 | PASS | canonical 名を本タスクで固定することで、UT-04 / UT-09 の着手が並列化可能。doc-only のため rollback コストはゼロ（Markdown revert のみ） |

## 苦戦箇所と AC / 多角的チェックへの対応付け

issue 本文の苦戦箇所 4 件を AC または多角的チェック観点へ対応付ける。

| # | 苦戦箇所（要約） | 対応する AC / 観点 |
| --- | --- | --- |
| 1 | 論理正本 vs 稼働物理のどちらを優先するかの判断軸不明瞭 | AC-1 + 多角的チェック「破壊的変更コスト < 概念純度」評価軸の明文化 |
| 2 | 論理 1 テーブル ↔ 物理 2 テーブル分離の翻訳漏れ（lock 系カラムの責務混在） | AC-2 + 多角的チェック「論理 1 行 → 物理 N 行 / 0 行」許容ルール |
| 3 | 「何もしない」を結論として明示しないと UT-04 が善意で rename を誘発する | AC-3 + AC-4（no-op を第一候補に置き、却下案にも採否理由を残す） |
| 4 | U-8 / U-9 のスコープ境界混入リスク | AC-5（直交性チェックリスト）+ 多角的チェック「enum / retry / offset を本タスクで決めない」 |

## 多角的チェック観点

- **概念純度 vs 破壊性のトレードオフ**: 論理に揃えて物理を rename すると概念純度は上がるが破壊性が高い。Phase 2 の代替案比較で破壊性を最優先評価軸に置く
- **論理 1 行 → 物理 N 行 / 0 行の翻訳ルール**: マッピング表で「物理側責務テーブル」を明示（lock 系は `sync_locks` 固定 / ledger 系は `sync_job_logs` 固定）
- **no-op の正当性**: 「何もしない」が唯一データ消失ゼロを保証することを比較表で立証
- **直交タスク侵食防止**: 本タスクは enum 値・retry 値・offset 値を**決定しない**ことを成果物本文で繰り返し宣言
- **aiworkflow-requirements drift**: `database-schema.md` で `sync_log` / `sync_job_logs` 言及があれば canonical 名へ更新案を提示。grep 結果ゼロなら「不要」を明記

## 完了条件チェックリスト

- [ ] artifacts.json.metadata.visualEvidence = NON_VISUAL 確定
- [ ] artifacts.json.metadata.workflow_state = spec_created 確定
- [ ] 真の論点が「契約提供 + 直交性担保 + 1:N 翻訳明示」の 3 軸に再定義
- [ ] 4 条件評価が全 PASS で根拠付き
- [ ] 依存境界表に上流 3 / 下流 2 / 直交 2 すべて前提と出力付きで記述
- [ ] AC-1〜AC-6 が index.md と完全一致
- [ ] 苦戦箇所 4 件すべてが AC または多角的チェックに対応付け済み
- [ ] ownership 宣言で `apps/api/migrations/*.sql` が read-only と明示
- [ ] 不変条件 #5（D1 アクセス境界）への適合確認

## 実行手順

### ステップ 1: 上流入力の確認

- `apps/api/migrations/0002_sync_logs_locks.sql` を Read し、物理側の真の状態（テーブル名 / カラム / index）を抽出
- `apps/api/src/jobs/sync-sheets-to-d1.ts` を Read し、物理側 lock 取得 / ledger 書込みフローを抽出
- UT-01 Phase 2 outputs（あれば）から論理 13 カラム定義を抽出。なければ issue 本文の差分記述から逆算

### ステップ 2: 真の論点の再定義

- 「テーブル名選定」ではなく「契約提供 + 直交性担保 + 1:N 翻訳明示」の 3 軸で `outputs/phase-01/main.md` 冒頭に明記

### ステップ 3: AC のロック

- AC-1〜AC-6 を `outputs/phase-01/main.md` に列挙し、index.md（後続生成）と完全一致させる

### ステップ 4: 4 条件評価の確定

- 全 PASS 根拠を表形式で固定。MINOR / MAJOR が出る場合は本 Phase で議論を完結させる

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義主成果物（真の論点・依存境界・AC・4 条件評価・苦戦箇所対応） |
| メタ | artifacts.json | Phase 1 状態の更新 + visualEvidence / workflow_state 確定 |

## 次 Phase への引き渡し

- 次 Phase: 2 (設計)
- 引き継ぎ事項:
  - 真の論点 = 契約提供 + 直交性担保 + 1:N 翻訳明示
  - 4 条件評価（全 PASS）の根拠
  - canonical 候補 3 案（A: 物理を canonical 化 / B: 論理を canonical 化し物理を rename / C: 論理を概念名に降格し物理を canonical 化）の比較を Phase 2 で実施
  - 後方互換戦略 4 案（no-op / view / rename / 新テーブル+移行）比較を Phase 2 で実施
  - U-8 / U-9 直交性チェックリストを Phase 2 で生成
- ブロック条件:
  - 4 条件のいずれかが MINOR / MAJOR
  - AC-1〜AC-6 が index.md と乖離
  - visualEvidence が NON_VISUAL 以外で誤確定
  - 既存物理 migration を改変する方針が紛れ込む
