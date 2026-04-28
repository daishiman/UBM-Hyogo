# Lessons Learned: 02b — meeting/tag queue + schema diff repository

UBM-Hyogo `02b-parallel-meeting-tag-queue-and-schema-diff-repository` タスクの Phase 12 close-out から抽出した苦戦知見と再発防止策の正本。

- 同期日: 2026-04-27
- 対象タスクルート: `docs/30-workflows/completed-tasks/02b-parallel-meeting-tag-queue-and-schema-diff-repository/`
- 実装パス: `apps/api/src/repository/`（attendance / meetings / schemaDiffQueue / schemaQuestions / schemaVersions / tagDefinitions / tagQueue + `_shared/`）
- 一次ソース: `outputs/phase-12/{implementation-guide,system-spec-update-summary,skill-feedback-report,phase12-task-spec-compliance-check}.md`

---

## 1. 不変条件の追補（02b 由来）

| ID | 不変条件 | 担保場所 |
| --- | --- | --- |
| #5（再確認） | D1 への直接アクセスは `apps/api` に閉じる | `apps/api/src/repository/_shared/` 経由のみ |
| #13 | tag は queue 経由のみ書き込み（`tag_assignment_queue`）。`tag_definitions` は read-only マスタ | `tagDefinitions.ts` に write API 不在で担保 |
| #14 | schema diff queue の status 正本は `'queued'`（未解決を pending と呼ばない） | `schemaDiffQueue.ts` の status 列挙 |
| #15 | `schemaVersions.getLatestVersion()` は `synced_at DESC` で確定 | `schemaVersions.ts` の ORDER BY |

---

## 2. 苦戦知見 L-02B-001〜005

### L-02B-001: schema diff queue の "未解決状態" の表現揺れ
- 症状: 設計初期に `pending` / `unresolved` / `open` 等が混在し、SQL クエリで取りこぼしが発生
- 対処: `status='queued'` を未解決の正本表現に固定。`resolve()` 経由で `'resolved'`、明示棄却で `'dismissed'`
- 再発防止: 不変条件 #14 を `database-implementation-core.md` に明記、queue 系 repository は status 列挙を TS 型でリテラル固定

### L-02B-002: tag queue の単方向書き込み境界
- 症状: `tag_definitions` への直接 INSERT/UPDATE 経路を渡す案が出た
- 対処: write API を `tag_assignment_queue` への enqueue/resolve に限定。`tag_definitions` には read API のみ実装
- 再発防止: 不変条件 #13 を resource-map に登録。`task-specification-creator` 側でも repository 系 Phase 2 設計に「ALLOWED 書き込み表」を必須化

### L-02B-003: meeting attendance 状態遷移の SQL 直書き
- 症状: 状態遷移ロジックが `attendance.ts` 内に SQL 直書きで散在し、移送候補 helper の正式化が後回し
- 対処: phase-12 unassigned-task-detection 経由で `02b-followup-001-status-readonly-helper.md` として 02a 担当へ移送
- 再発防止: 状態遷移を持つ repository は Phase 2 設計で **ALLOWED 表**（from → to の許可遷移行列）を必須セクションとする

### L-02B-004: NON_VISUAL タスクで Phase 11 screenshot 要求が残る
- 症状: repository 層・型定義のみのタスクなのに Phase 11 雛形が screenshot を要求し、無価値な空スクショが生成される懸念
- 対処: Phase 11 outputs を「適用外」として skip 判定し compliance-check で許容
- 再発防止: `task-specification-creator` の Phase 11 雛形に NON_VISUAL ガード（タスク種別が repository / type-only の場合は screenshot 系成果物を不要扱い）を追加

### L-02B-005: spec_created / docs_only タスクで実装が混入した場合の Phase 12 再判定不在
- 症状: 仕様作成専用・ドキュメント専用のタスク種別宣言下でも実装ファイルが付随した場合、Phase 12 の judgement を再判定する手順が未整備
- 対処: 02b では実装あり → docs_only ではないと再判定して通常 close-out
- 再発防止: `task-specification-creator/SKILL.md` の再判定ルールに「Step 2 再判定ガード（実装ファイルの有無で種別を再評価）」を明記

---

## 3. fake D1 テストパターン（repository 単体テストの正本）

実装で確立した fake は `apps/api/src/repository/_shared/__fakes__/fakeD1.ts`。in-memory pattern-matching SQL で D1 binding の `prepare/bind/all/first/run` を再現する形。repository unit test の事実上のテンプレート。

特徴:
- D1 binding 互換 surface（`prepare → bind → all/first/run`）を満たす
- INSERT / UPDATE / DELETE / SELECT の最小サブセットを SQL パターンマッチで処理
- 状態遷移・queue 整合性・not-found guard の 3 軸テストを Miniflare 不要で回せる
- 統合テストへの橋渡しは `02b-followup-003-miniflare-d1-integration-test.md`（08a 担当）

参照先（int-test-skill 側で詳細テンプレ化）: `.claude/skills/int-test-skill/references/fake-d1-repository-pattern.md`

### 3 軸チェックリスト
1. **状態遷移**: ALLOWED 表に基づく許可/拒否ケース、from→to の全網羅
2. **queue 整合性**: enqueue→resolve→dismiss のライフサイクル、idempotency、同一キー二重投入
3. **not-found guard**: resolve/update 系で対象不在時の明示エラー（silent no-op 禁止）

---

## 4. システム仕様書への影響（軽微 Note 追記）

`outputs/phase-12/system-spec-update-summary.md` で示された 4 spec への反映は軽微 Note レベル。本 lessons-learned で要点のみ集約：

- `03-data-fetching`: schema diff queue / tag queue が **unidirectional**（書き込みは queue 経由のみ）
- `08-free-database`: 02b 実測の reads 0.24% / writes 0.11%（D1 free tier 比）
- `11-admin-management`: tag 書き込みは queue 経由のみ（不変条件 #13 再掲）
- `12-search-tags`: `tag_definitions` は 6 カテゴリ single source。read-only マスタ

---

## 5. 後続タスク handoff

### 未タスク（unassigned-task 配置済み）
| ID | パス | 移送先 |
| --- | --- | --- |
| 02b-followup-001 | `docs/30-workflows/unassigned-task/02b-followup-001-status-readonly-helper.md` | 02a |
| 02b-followup-002 | `docs/30-workflows/unassigned-task/02b-followup-002-dependency-cruiser-config.md` | 02c |
| 02b-followup-003 | `docs/30-workflows/unassigned-task/02b-followup-003-miniflare-d1-integration-test.md` | 08a |

### 下流仕様書側で吸収済み（未タスク化せず implementation-guide で引き継ぎ）
- 03a / 04c / 07a / 07b / 07c

---

## 関連参照

- `references/database-implementation-core.md` L172- 「UBM-Hyogo D1 Repository 契約（02b）」
- `references/lessons-learned-d1a-schema-migrations.md`（01a の seed/migrations 知見）
- `indexes/resource-map.md` UBM-Hyogo タスクワークフロー（canonical task root）
- `indexes/quick-reference.md` UBM-Hyogo D1 Repository 早見（02b）
- `indexes/topic-map.md` 「UBM-Hyogo D1 Repository 契約（02b）」エントリ
