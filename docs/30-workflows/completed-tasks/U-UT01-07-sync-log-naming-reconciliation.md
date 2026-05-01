# U-UT01-07: `sync_log` 論理名と既存 `sync_job_logs` / `sync_locks` の整合タスク

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | U-UT01-07 (UT-01 検出 U-7) |
| タスク名 | `sync_log` 論理名と既存 `sync_job_logs` / `sync_locks` の整合（命名 reconciliation 設計） |
| 親タスク | UT-01 (Sheets→D1 同期方式定義) |
| 関連タスク | UT-04 (D1 データスキーマ設計) / UT-09 (Sheets→D1 同期ジョブ実装) |
| 直交タスク | U-8 (sync 状態 enum / trigger enum 統一) / U-9 (retry 回数 / offset resume 統一) |
| 優先度 | HIGH |
| 推奨Wave | Wave 1（UT-04 物理 migration 着手前） |
| 状態 | spec_created |
| 作成日 | 2026-04-29 |
| taskType | docs-only-design-reconciliation |
| visualEvidence | NON_VISUAL |
| 既存タスク組み込み | なし（独立タスクとして起票） |
| 組み込み先 | - |

## 後継 workflow

| 種別 | パス |
| --- | --- |
| spec_created workflow | `docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/` |

## 目的

UT-01 Phase 2 で論理設計した `sync_log` テーブルと、既に `apps/api/migrations/0002_sync_logs_locks.sql` で物理化されている `sync_job_logs` / `sync_locks` の二重 ledger 化を防ぐため、**命名と概念の canonical reconciliation** を設計文書として確定する。本タスクは設計 reconciliation のみを行い、物理 migration の追加・改修・適用は含まない（それらは UT-04 / UT-09 のスコープ）。

UT-01 Phase 12 の 30 種思考法レビューで、以下の差分が検出された:

- 論理名 `sync_log`（UT-01） vs 物理名 `sync_job_logs` + `sync_locks`（既存実装）
- 論理は単一テーブル設計、物理は ledger / lock を 2 テーブルに分離
- カラム差分（`processed_offset` / `idempotency_key` / `lock_expires_at` 等が物理側に未実装）

これらを放置すると UT-04 / UT-09 が誤って `sync_log` という第3のテーブルを作成し、二重 ledger / migration 衝突 / データ消失リスクが発生する。本タスクで canonical 命名・対応表・後方互換戦略・migration 戦略を確定し、UT-04 / UT-09 が迷わず着手できる設計成果物を残す。

## スコープ

### 含む

- canonical 命名の決定（`sync_log` 概念名を物理 `sync_job_logs` + `sync_locks` のどちらに寄せるか / 別案の評価）
- 既存物理テーブル → 論理設計のマッピングマトリクス（カラム単位、enum 値単位、機能単位）
- 物理側で不足しているカラム（`processed_offset` / `idempotency_key` / `lock_expires_at` 概念の sync_locks 側既存有無）の追加要否判定（設計判定のみ・DDL 発行は UT-04）
- 後方互換戦略（既存 `sync_job_logs` を rename するか / view を作るか / 共存させるか）の比較表と採択
- migration 戦略の決定（in-place ALTER / 新テーブル + データ移行 / no-op 採択のどれか）
- shared 契約（`packages/shared` の型）に向けた canonical name の宣言メモ
- U-8（enum 統一）/ U-9（retry / offset 統一）との直交性確認チェックリスト
- UT-04 / UT-09 への引き継ぎ事項の明文化

### 含まない

- 物理 DDL の発行・migration ファイル追加（→ UT-04）
- 既存 `apps/api/migrations/0002_sync_logs_locks.sql` の書き換え（権限外）
- `apps/api/src/jobs/sync-sheets-to-d1.ts` のコード変更（→ UT-09）
- enum 値（`pending|in_progress|completed|failed` ↔ `running|success|failed|skipped`）の canonical 決定（→ U-8）
- `DEFAULT_MAX_RETRIES` の正本化（→ U-9）
- shared `Zod` schema の実装（→ U-10）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-01 (Sheets→D1 同期方式定義) | 論理設計 `sync_log` の出典。Phase 2 outputs/sync-log-schema.md と Phase 12 の対応表（§9）が起点 |
| 上流 | 既存実装 `apps/api/migrations/0002_sync_logs_locks.sql` | 物理側の現状把握 |
| 上流 | 既存実装 `apps/api/src/jobs/sync-sheets-to-d1.ts` | 物理側のロック / ログ書込フロー把握 |
| 下流 | UT-04 (D1 データスキーマ設計) | 本 reconciliation の結論を根拠に migration 計画を確定 |
| 下流 | UT-09 (Sheets→D1 同期ジョブ実装) | 本 reconciliation の canonical name を実装で参照 |
| 直交 | U-8 (enum 統一) | enum 値は本タスク対象外。命名と enum を分離して扱う |
| 直交 | U-9 (retry / offset 統一) | 数値ポリシーは本タスク対象外。カラム有無の設計判定のみ含む |

## 苦戦箇所【記入必須】

**1. 「論理設計の正本」と「既に動いている物理実装」のどちらを優先するかの判断軸が不明瞭**
UT-01 Phase 2 の sync-log-schema.md は論理正本として書かれているが、既存 migration `0002_sync_logs_locks.sql` は本番で稼働している。レビュアーが「論理に揃えて物理を rename すべき」「物理は動いているので論理側を後追い修正すべき」のどちらの立場を取るかで結論が真逆になる。本タスクでは **採択基準を「破壊的変更コスト < 概念純度」のトレードオフで先に明文化** してから命名 canonical を決めること。経験的には既存稼働物理を canonical に寄せ、論理側を「概念チェックリスト」に降格させる方が安全だが、その判断ロジック自体を成果物に残さないと UT-04 / UT-09 が同じ議論を再演する。

**2. `sync_log` 単一論理に対し物理が `sync_job_logs` + `sync_locks` の 2 テーブル分離である点の翻訳が漏れやすい**
論理側の 13 カラム（特に `lock_expires_at` / `idempotency_key`）は ledger と lock の責務が混在しており、物理側の責務分離（ledger = `sync_job_logs` / lock = `sync_locks`）と一対一にならない。マッピング表で 「`sync_log.lock_expires_at` → `sync_locks.expires_at`」「`sync_log.idempotency_key` → 物理未実装（追加要否判定が必要）」のように **論理 1 行 → 物理 N 行 / 0 行** の N:M 対応を許容して書かないと、UT-04 で「該当カラムなし＝新規追加」と早合点して二重 ledger 化する。

**3. 「後方互換戦略 = 何もしない」も正当な選択肢だが、明示しないと migration 衝突を誘発する**
既存 `sync_job_logs` / `sync_locks` を rename / view 化せずに「物理名を canonical として固定し、論理 `sync_log` は概念用語に格下げする」no-op 戦略が最もリスクが低い場合がある。しかし「何もしない」を結論として書かないと、UT-04 担当が「論理に揃えて rename すべき」と善意で migration を追加し、本番データのテーブル名変更による rollback 不能事故を起こす。**no-op 採択でも採択理由・代替案却下理由を明文として残す** こと。

**4. U-8（enum 統一）/ U-9（retry / offset 統一）と本タスクのスコープ境界が曖昧になりやすい**
レビュー中に「enum 値が canonical でないと命名 canonical も決まらないのでは」という議論が混入しがちだが、命名 reconciliation と enum reconciliation は独立に決定可能（テーブル名は enum 値に依存しない）。**直交性確認チェックリスト** を成果物に含め、本タスクで enum / retry に踏み込まないことを明示する。

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| 二重 ledger 化（UT-04 が `sync_log` を新規 CREATE TABLE） | 本番で同期履歴が 2 系統に分裂、監査整合崩壊 | 本仕様書で物理 canonical を明文化 + UT-04 着手前提条件に本仕様書参照を必須化 |
| migration 衝突（rename を後付け） | 本番 D1 で table rename 失敗 / rollback 不能 | no-op / view / rename の 3 択を事前比較表で評価し、no-op を第一候補に置く |
| データ消失リスク（既存 `sync_job_logs` の DROP & 再作成） | 監査ログ全消失 | DROP を伴う戦略は明示的に却下案として記載し、UT-04 が選択肢として検討しない状態にする |
| 論理 → 物理マッピング誤訳（`lock_expires_at` を ledger 側に追加など） | lock 責務が ledger に漏出、stale lock 検出ロジック破綻 | カラム単位マッピング表で「物理側責務テーブル」を明示（lock 系は `sync_locks` に固定） |
| U-8 / U-9 への越境（enum / retry 値を本タスクで決めてしまう） | 直交タスクのスコープ侵食、レビュー差し戻し | 直交性チェックリストで「本タスクは enum 値・retry 値・offset 値を決定しない」を明文化 |
| `sync_log` 用語が aiworkflow-requirements / database-schema 仕様に残置 | システム仕様と実装乖離、後続タスクの再混乱 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` の `sync_log` 言及箇所を canonical name へ更新する Phase を含める（doc-only 編集） |

## 検証方法

| # | 検証項目 | 手段 | 合格条件 |
| --- | --- | --- | --- |
| 1 | canonical 命名の一意性 | grep で `sync_log` / `sync_job_logs` / `sync_locks` の出現箇所を全文検索し、新ドキュメント内で canonical 名と論理概念名の使い分けが一貫していることを確認 | 全箇所で「物理 = `sync_job_logs` / `sync_locks`」「概念 = `sync_log`（注釈付き）」が判別可能 |
| 2 | マッピング表の完全性 | UT-01 Phase 2 sync-log-schema.md の 13 カラムすべてが新マトリクスに登場し、物理対応 / 未実装 / 不要のいずれかが付与されている | カラム漏れ 0、判定空欄 0 |
| 3 | 既存実装との整合 | `apps/api/migrations/0002_sync_logs_locks.sql` と `apps/api/src/jobs/sync-sheets-to-d1.ts` を Read し、物理側に存在するカラム / enum / 関数がマトリクスに反映されているか確認 | 既存実装の全カラムがマトリクス左欄（物理側）に列挙されている |
| 4 | 後方互換戦略の比較表 | no-op / view 化 / rename / 新テーブル + 移行 の 4 案について「破壊性 / 実装コスト / 監査連続性 / rollback 容易性」を 4 軸で評価した表が存在 | 採択案 1、却下案 3 すべてに採否理由が明記 |
| 5 | 直交性確認 | U-8 / U-9 のスコープと本タスクのスコープが重複していないことをチェックリストで確認 | enum 値・retry 値・offset 値の決定が本タスクに含まれていない |
| 6 | UT-04 / UT-09 引き継ぎ可能性 | 各下流タスクの担当者視点で「本仕様書だけ読めば canonical name と migration 戦略が分かるか」を self-review | 引き継ぎセクションに「決定事項 / 未決定事項 / 参照すべき関連タスク」が網羅 |
| 7 | システム仕様 drift 解消 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` の sync 系記述が本仕様書の canonical 名と一致するように更新案を提示（実適用は本タスクで行う doc-only 編集の範囲内） | 該当ファイルの diff が成果物に含まれるか、追補不要であれば「不要」を明記 |

## 受入条件（AC）

- [ ] **AC-1（命名 canonical 決定）**: `sync_log` 概念名と物理 `sync_job_logs` / `sync_locks` のどちらを canonical とするか決定し、採択理由（破壊的変更コスト評価を含む）が明文化されている
- [ ] **AC-2（既存 → 新マッピング表）**: UT-01 Phase 2 論理 13 カラムすべてが、物理側の対応カラム / 物理未実装 / 不要 のいずれかに分類された 1:N マッピング表が存在する
- [ ] **AC-3（後方互換戦略）**: no-op / view / rename / 新テーブル+移行 の 4 案比較表と採択結果（および却下理由）が記載され、採択戦略が「データ消失を伴わない」ことが明示されている
- [ ] **AC-4（migration 計画）**: UT-04 が参照すべき migration 戦略（in-place ALTER / no-op / 新規 migration の追加 等）が決定され、UT-04 引き継ぎ事項として箇条書きされている
- [ ] **AC-5（U-8 / U-9 直交性確認）**: 本タスクが enum 値（U-8）・retry / offset 値（U-9）の決定を含まないことがチェックリスト形式で確認され、直交境界が明文化されている
- [ ] **AC-6（システム仕様 drift 解消）**: `.claude/skills/aiworkflow-requirements/references/database-schema.md` の sync 系記述が本タスクの canonical 名と整合しているか確認し、必要であれば doc-only 更新案を成果物に含める

## 実行概要

1. 既存実装（`apps/api/migrations/0002_sync_logs_locks.sql` / `apps/api/src/jobs/sync-sheets-to-d1.ts`）を Read で全文確認し、物理側の真の状態を抽出する
2. UT-01 Phase 2 outputs `sync-log-schema.md` の論理 13 カラムを抽出し、左 = 論理 / 右 = 物理 のマッピング表草案を作成する
3. 命名 canonical の 3 案（A: 物理を canonical 化 / B: 論理を canonical 化し物理を rename / C: 論理を概念名に降格し物理を canonical 化）を「破壊性・実装コスト・監査連続性・rollback 容易性」で評価し、A or C を第一候補に置く
4. 後方互換戦略 4 案（no-op / view / rename / 新テーブル+移行）を比較表化し、データ消失を伴う案を明示却下する
5. UT-04 / UT-09 引き継ぎ事項を箇条書き化し、本タスクで決定したこと / 未決定で下流に委ねること を明確に分離する
6. U-8 / U-9 との直交性チェックリストを作成し、enum / retry / offset の決定を本タスクに混入させないことを担保する
7. `.claude/skills/aiworkflow-requirements/references/database-schema.md` の sync 系記述を確認し、必要なら doc-only 更新案を成果物に含める

## 完了条件

- [ ] AC-1〜AC-6 がすべて満たされている
- [ ] 苦戦箇所セクションが具体的に記入されている（既存実装と論理設計の差分が見落とされやすい点を 4 項目以上）
- [ ] リスクと対策が二重 ledger / migration 衝突 / データ消失 の 3 リスクを最低限カバー
- [ ] 検証方法が 5 項目以上、合格条件付きで列挙
- [ ] スコープ「含まない」セクションで物理 migration 適用が UT-04 のスコープであることが明示
- [ ] U-8 / U-9 との直交関係が成果物本文で明文化
- [ ] コード変更 0、commit 0（本タスクは設計 reconciliation のみ）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-log-schema.md | 論理設計の正本（13 カラム + §9 既存実装対応表） |
| 必須 | docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-12/unassigned-task-detection.md | U-7 の検出根拠 + U-8 / U-9 との直交関係 |
| 必須 | docs/30-workflows/completed-tasks/UT-01-sheets-d1-sync-design.md | 親タスク仕様 |
| 必須 | docs/30-workflows/unassigned-task/UT-04-d1-schema-design.md | 下流（migration 計画の受け取り側） |
| 必須 | apps/api/migrations/0002_sync_logs_locks.sql | 物理側の現状（Read のみ・改変権限なし） |
| 必須 | apps/api/src/jobs/sync-sheets-to-d1.ts | 物理側の利用フロー（Read / Grep のみ） |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | システム仕様側の canonical 命名整合確認 |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | docs-only / NON_VISUAL 縮約テンプレ準拠 |
| 参考 | docs/30-workflows/completed-tasks/UT-01-sheets-d1-sync-design.md（同上） | フォーマット模倣元 |

## 注意事項

- 本タスクは **設計 reconciliation のみ**。コード変更・migration 追加・コミットは行わない
- 既存実装（`apps/api/migrations/0002_sync_logs_locks.sql` / `apps/api/src/jobs/sync-sheets-to-d1.ts`）を書き換える権限は本タスクにない。Read / Grep で確認するのみ
- U-8（enum 統一）・U-9（retry / offset 統一）は **直交タスク**。本タスクでは enum 値 / retry 値 / offset 値の canonical 決定を含めない
- visualEvidence: NON_VISUAL（UI なし・スクリーンショット不要）
- taskType: docs-only-design-reconciliation（Phase 11 縮約テンプレ + Phase 12 docs-only 判定ブランチを適用）
- workflow_state: `spec_created`（実装着手前。Phase 12 close-out で workflow root を `completed` に書き換えない）
