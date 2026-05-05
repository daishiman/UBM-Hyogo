# Phase 8: DRY 化 / 仕様間整合

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Schema alias apply hardening / 大規模 back-fill 再開可能化 (UT-07B) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 / 仕様間整合 |
| 作成日 | 2026-05-01 |
| 前 Phase | 7（AC マトリクス） |
| 次 Phase | 9（品質保証） |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| タスク分類 | implementation（contract DRY + 仕様正本同期） |

## 目的

本タスクは migration / repository / workflow / route / test の実コード更新を伴う implementation タスクであり、Phase 1〜7 で蓄積した設計入力（DB 制約 / 再開可能 back-fill / retryable HTTP contract / 大規模実測 plan / runbook / 異常系 / AC マトリクス）が **複数ファイル / 複数の正本（本タスク docs / 親タスク 07b 完了済成果物 / `aiworkflow-requirements/references/*` / `apps/api/migrations/*.sql`）に重複転記** されていないかを単一正本観点で検証する。

implementation タスクの DRY は「コード抽出」ではなく、**(1) 同一値ドメイン（HTTP status / failure code / backfill_status enum）を定義するセクションが複数 Phase に散在しないこと、(2) 親タスク 07b 完了済 implementation-guide との重複転記を排除し差分のみを本タスクで保持すること、(3) `aiworkflow-requirements` の正本へ反映する差分が一意であること、(4) shared 配置（`packages/shared/src/types/zod`）への影響を不変条件 #5 と整合させた形で評価すること** の 4 軸で構成する。

ここでの drift を放置すると、Phase 11 の大規模実測 evidence で「どの contract が正本か」「どの migration 順序が正本か」を判断する手間が生じ、Phase 12 の system-spec-update-summary で 07b 完了済仕様の上書きや重複転記が発生する。

---

## 実行タスク

1. **値ドメインの single-source 化**: `backfill_status`（5 値: `pending` / `in_progress` / `completed` / `exhausted` / `failed`）/ failure code（`backfill_cpu_budget_exhausted` / `stable_key_collision`）/ HTTP status（200 / 202 / 409 / 422）の 3 種類が `outputs/phase-02/retryable-contract-design.md` を唯一正本としていることを確認する（完了条件: Phase 5 / 6 / 7 は値リテラル再列挙ではなく link 参照にとどめる）。
2. **マッピング表の single-source 化**: 仕様語 ↔ 実装語対応表（`backfill_status` 仕様語 ↔ TS リテラル ↔ SQL リテラル）が Phase 2 `retryable-contract-design.md` のみで定義され、Phase 5 / 6 / 7 / 11 では link のみであることを確認する（完了条件: 表の重複定義 0）。
3. **親タスク 07b 完了済成果物との差分整理**: `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/outputs/phase-12/implementation-guide.md` と本タスク docs の重複箇所（`__extra__:<questionId>` 命名規約 / `deleted_members` JOIN soft-delete / `response_fields` のカラム不在吸収方針）を整理する（完了条件: 07b 既出事項は本タスク内では link 参照のみ、本タスク独自差分（partial UNIQUE / cursor 管理 / 202 retryable）のみ全文記述）。
4. **`aiworkflow-requirements` への差分の一意化**: 本タスクで更新が必要な `references/api-endpoints.md` / `references/database-schema.md` / `references/task-workflow-active.md` / indexes に対する差分を `outputs/phase-08/main.md` 内で 1 表に集約する（完了条件: 差分追記の重複 0、追記対象ファイルごとに該当セクションが特定）。
5. **shared 配置（`packages/shared/src/types/zod`）への影響評価**: 本タスクは原則 `apps/api/**` に閉じる（不変条件 #5）。ただし HTTP response body の型（`backfill` フィールド / failure code enum）が将来 admin UI から参照される可能性を `packages/shared` 配置候補として評価し、本タスク内で実装するか follow-up とするかを明記する（完了条件: 「本タスクは apps/api 内 zod のみ。shared 配置は別タスクで判断」を base case として確定し、不変条件 #5 違反 0 を確認）。
6. **直交性確認（関連タスクとの責務侵食排除）**: 親タスク 07b（完了済 / 既存 endpoint・workflow 実装の正本） / UT-04（D1 schema 設計の正本） / 監視アラート follow-up（`backfill.status='failed'` 検知）/ admin UI polling follow-up の責務に踏み込む記述が本タスクに混入していないかを確認する（完了条件: 関連タスク 4 件すべてに「本タスクは含まない」セクションで境界が明示されている）。
7. **navigation drift 確認**: `outputs/phase-XX/*.md` / `index.md` / `artifacts.json` / 親タスク 07b dir / `aiworkflow-requirements/references/*` / 起票 unassigned-task / GitHub Issue #293 リンクのリンク切れ / 参照名と実ファイル名一致を確認する（完了条件: リンク切れ 0）。

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/phase-01.md 〜 phase-07.md | DRY 化対象 |
| 必須 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/index.md | 用語・直交関係・AC の正本 |
| 必須 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/artifacts.json | path 整合の起点 |
| 必須 | docs/30-workflows/completed-tasks/UT-07B-schema-alias-hardening-001.md | 起票仕様 |
| 必須 | docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/outputs/phase-12/implementation-guide.md | 親タスク完了済仕様（重複転記禁止） |
| 必須 | docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/outputs/phase-12/unassigned-task-detection.md | 検出根拠（重複転記禁止） |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | API contract 同期更新対象 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | D1 schema 同期更新対象 |
| 必須 | .claude/skills/aiworkflow-requirements/references/task-workflow-active.md | task workflow 同期更新対象 |
| 参考 | docs/30-workflows/u-ut01-08-sync-enum-canonicalization/phase-08.md | DRY 化観点の参照事例 |
| 参考 | docs/30-workflows/ut-04-d1-schema-design/phase-08.md | DRY 化観点の参照事例 |

---

## Before / After 比較テーブル

### 値ドメイン定義の重複

| 対象 | Before（仮想 drift） | After（本 Phase 確定） | 理由 |
| --- | --- | --- | --- |
| `backfill_status` 5 値 | Phase 2 / Phase 5 / Phase 6 / Phase 7 で個別列挙される可能性 | `outputs/phase-02/retryable-contract-design.md` 内 §仕様語実装語対応表のみが正本、他 Phase は link 参照 | implementation タスクの contract DRY は「enum / status の単一定義箇所」が肝 |
| failure code（`backfill_cpu_budget_exhausted` / `stable_key_collision`） | Phase 2 / Phase 5 api-contract-update / Phase 6 failure-cases で再掲しがち | `outputs/phase-02/retryable-contract-design.md` のみが正本、Phase 5 / 6 は link | 後発 grep 漏れの根本対策 |
| HTTP status 5 ケース（200 / 202 in_progress / 202 exhausted / 409 / 422） | Phase 2 / Phase 5 / Phase 7 ac-matrix で再掲しがち | `outputs/phase-02/retryable-contract-design.md` のみが正本 | route test 観点も link 参照に統一 |
| partial UNIQUE index DDL | Phase 2 db-constraint-design / Phase 5 migration-runbook で再掲 | `outputs/phase-02/db-constraint-design.md` のみが正本、Phase 5 は migration ファイル名と適用順序のみ記述 | DDL 二重記述による drift を防ぐ |

### 親タスク 07b 完了済仕様との差分整理

| 対象 | 07b 完了済 implementation-guide | 本タスク docs | DRY 方針 |
| --- | --- | --- | --- |
| `__extra__:<questionId>` 命名規約 | 全文記述（正本） | link 参照のみ | 07b 正本維持 |
| `deleted_members` JOIN soft-delete | 全文記述（正本） | link 参照のみ | 07b 正本維持 |
| `response_fields` カラム不在の吸収方針 | §「実 DB と仕様書の差分吸収」全文記述（正本） | Phase 1 / Phase 5 implementation guide で「07b 正本を継続採用」のみ記述 | 07b 正本維持・本タスクは決定事項のみ |
| pre-check のみの collision 防御 | 既存実装説明として記述 | link 参照のみ + 「二段防御に強化」差分記述 | 強化点のみ本タスクで全文 |
| **partial UNIQUE index（新規）** | 未記述 | 本タスク Phase 2 db-constraint-design.md で全文記述（正本） | 本タスク独自差分 |
| **cursor 管理 / 再開可能 back-fill（新規）** | 未記述 | 本タスク Phase 2 resumable-backfill-design.md で全文記述（正本） | 本タスク独自差分 |
| **202 retryable contract（新規）** | 未記述 | 本タスク Phase 2 retryable-contract-design.md で全文記述（正本） | 本タスク独自差分 |
| **10,000 行以上の大規模実測（新規）** | 未実施 | 本タスク Phase 2 large-scale-measurement-plan.md / Phase 11 evidence で記述 | 本タスク独自差分 |

### `aiworkflow-requirements` 同期更新対象（差分の一意化）

| 対象ファイル | 追記セクション | 追記内容 | 単一正本 |
| --- | --- | --- | --- |
| `references/api-endpoints.md` | `POST /admin/schema/aliases` 応答仕様 | HTTP 5 ケース（200 / 202 in_progress / 202 exhausted / 409 / 422）+ failure code 2 種 | 本タスク Phase 2 retryable-contract-design.md からの転記のみ。Phase 12 で同期 PR を起こす |
| `references/database-schema.md` | `schema_questions` 物理制約 | partial UNIQUE index（`(revision_id, stable_key) WHERE ...`）の DDL 抜粋 | 本タスク Phase 2 db-constraint-design.md からの転記のみ |
| `references/database-schema.md` | `schema_diff_queue` カラム追加 | `backfill_cursor TEXT NULL` / `backfill_status TEXT NULL` | 本タスク Phase 2 resumable-backfill-design.md からの転記のみ |
| `references/task-workflow-active.md` | UT-07B 完了状態 | spec_created → 実装完了に更新（Phase 12 同期） | 本タスク artifacts.json からの転記のみ |
| indexes（`.claude/skills/aiworkflow-requirements/indexes/*`） | 該当 index への新規エントリ | `backfill_status` / `backfill_cpu_budget_exhausted` / `partial UNIQUE schema_questions` のキーワード追加 | 本タスク Phase 12 ドキュメント更新時に `pnpm indexes:rebuild` で再生成 |

### shared 配置（`packages/shared/src/types/zod`）への影響評価

| 対象 | 本タスクでの取り扱い | 不変条件 #5 整合 | follow-up 候補 |
| --- | --- | --- | --- |
| HTTP response body 型（`alias` / `backfill` フィールド） | `apps/api` 内 zod schema として定義（shared 移行は本タスクスコープ外） | apps/api 内に閉じるため違反 0 | admin UI 側でも参照する場合は follow-up で `packages/shared/src/types/zod` 配置を検討 |
| `backfill_status` enum 型 | apps/api 内に enum 定義 | apps/api 内に閉じる | 同上 |
| failure code enum 型 | apps/api 内に enum 定義 | apps/api 内に閉じる | 同上 |
| zod schema | apps/api 内 route 直近で定義 | D1 binding は触れない | 同上 |

> **base case**: 本タスクは `apps/api` 内 zod のみ。shared 配置は admin UI から参照する必要が確定した時点で別タスクで判断する。これにより不変条件 #5（D1 への直接アクセスは `apps/api` に閉じる）への影響をゼロに保つ。

---

## 重複削除の対象一覧

| # | 重複候補 | 削除方針 | 適用範囲 |
| --- | --- | --- | --- |
| 1 | `backfill_status` 5 値の列挙 | Phase 2 のみ正本、Phase 5 / 6 / 7 は link | 本タスク全 phase-XX.md |
| 2 | failure code（`backfill_cpu_budget_exhausted` / `stable_key_collision`） | Phase 2 のみ正本、他は link | 本タスク全 phase-XX.md |
| 3 | HTTP 5 ケース contract | Phase 2 のみ正本、他は link | 本タスク全 phase-XX.md |
| 4 | partial UNIQUE index DDL | Phase 2 db-constraint-design.md のみ正本、Phase 5 migration-runbook は migration ファイル名と適用順序のみ | 本タスク全 phase-XX.md |
| 5 | `__extra__:<questionId>` 命名規約 / `deleted_members` JOIN | 07b 完了済 implementation-guide のみ正本、本タスクは link | 本タスク全 phase-XX.md |
| 6 | `response_fields` カラム不在吸収方針 | 07b 完了済 implementation-guide のみ正本、本タスクは Phase 1 / Phase 5 で「07b 正本を継続」記述のみ | 本タスク Phase 1 / Phase 5 |
| 7 | 苦戦箇所 3 件（カラム不在 / UNIQUE 未実装 / 10,000 行未実測） | 起票.md および Phase 1 main.md のみ正本、他 phase は ID 参照 | 本タスク全 phase-XX.md |
| 8 | 直交関係表（07b 完了済 / UT-04 / 監視 follow-up / admin UI polling follow-up） | index.md のみ正本、各 phase は文中で link のみ | 本タスク全 phase-XX.md |

---

## navigation drift の確認

| チェック項目 | 確認方法 | 想定結果 |
| --- | --- | --- |
| artifacts.json `phases[*].outputs` と各 phase-XX.md の成果物 path 一致 | grep `outputs/phase-` | 完全一致 |
| index.md `Phase 一覧` 表の file 列と実ファイル名 | ls で照合 | 完全一致 |
| index.md `主要参照` 表のパス（`apps/api/**` / `aiworkflow-requirements/references/*`） | ls で照合 | 実在 |
| phase-XX.md 内の他 phase 参照リンク | `../phase-YY.md` を全件確認 | リンク切れ 0 |
| 起票 unassigned-task への参照 | `docs/30-workflows/completed-tasks/UT-07B-schema-alias-hardening-001.md` | 実在 |
| 親タスク 07b 完了済 dir への参照 | `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/**` | 実在 |
| `aiworkflow-requirements` 正本ファイル参照 | `.claude/skills/aiworkflow-requirements/references/*` 各ファイル | 実在 |
| GitHub Issue link | Issue #293（CLOSED 状態のまま参照） | 実在 |
| 関連 follow-up タスク参照 | 監視アラート / admin UI polling / queue 分離（Phase 11 結果次第） | follow-up 起票時点では「未起票（候補）」として記述。実起票後にリンク化 |

---

## 共通化パターン

- implementation タスクでも contract / enum / status / DDL の **値ドメイン単一定義箇所** が DRY の本体。
- 同じ値リテラル / DDL を 2 箇所以上で記述したら必ず一方を link 参照に置き換える。
- 親タスク（07b 完了済）の正本に既出の事項は本タスク内では link 参照のみとする。
- `aiworkflow-requirements` への同期は Phase 12 で 1 回にまとめ、複数 Phase からの重複追記を避ける。
- 不変条件 #5 を侵さないため、shared 配置は本タスクで「先送り」明示。
- 関連タスクの責務（07b 既存実装 / UT-04 schema 設計 / 監視 / UI polling）に踏み込まない。

---

## 実行手順

### ステップ 1: 値ドメイン重複の洗い出し
- `grep -rn "backfill_status\|backfill_cpu_budget_exhausted\|stable_key_collision\|in_progress\|exhausted" docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/` を実行。
- Phase 2 以外で値リテラルが列挙されている箇所を表化し、link 参照へ書き換え方針を確定。

### ステップ 2: 親タスク 07b 完了済仕様との重複洗い出し
- `grep -rn "__extra__\|deleted_members\|questionId" docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/` を実行。
- 07b 完了済 implementation-guide に既出の事項が本タスク内に全文転記されていないか確認。

### ステップ 3: `aiworkflow-requirements` 差分の一意化
- 本タスクで追記が必要な `references/api-endpoints.md` / `references/database-schema.md` / `references/task-workflow-active.md` / indexes の追記内容を `outputs/phase-08/main.md` 内の 1 表に集約。
- Phase 12 同期 PR の入力として使用する。

### ステップ 4: shared 配置の影響評価
- `packages/shared/src/types/zod` への配置候補（response body 型 / `backfill_status` enum / failure code enum / zod schema）を列挙。
- 「本タスクは apps/api 内のみ、shared 配置は follow-up」を base case として確定。
- 不変条件 #5 違反 0 を確認。

### ステップ 5: 直交性確認
- 関連タスク 4 件（07b 完了 / UT-04 / 監視 / admin UI polling）の責務侵食がないかを確認。

### ステップ 6: navigation drift 確認
- artifacts.json の outputs path / index.md / 各 phase-XX.md / 親タスク dir / `aiworkflow-requirements/references/*` / GitHub Issue #293 のリンクを照合。

### ステップ 7: outputs/phase-08/main.md に集約
- 上記 6 観点の結果と Before / After 表を 1 ドキュメントに統合。

---

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | DRY 化済みの単一正本 path を品質保証 link 検証 / AC トレース表の前提に使用 |
| Phase 10 | navigation drift 0 / 親タスク 07b との差分整理完了を GO/NO-GO の根拠に使用 |
| Phase 11 | 大規模実測 evidence の前提として contract 単一正本（Phase 2 retryable-contract-design.md）を参照 |
| Phase 12 | system-spec-update-summary.md / documentation-changelog.md に DRY 化結果と `aiworkflow-requirements` 同期差分を反映 |
| 親タスク 07b 完了 | 07b 完了済仕様への上書きは行わず、本タスク独自差分のみを追記する境界を維持 |
| UT-04（関連） | D1 schema 設計の正本は UT-04 が保持、本タスクは partial UNIQUE と `schema_diff_queue` カラム追加 migration のみ追記 |

---

## 多角的チェック観点

- **価値性**: DRY 化により後続 Phase 11 / 12 着手時の「どの contract / DDL / enum が正本か」を即特定可能。`aiworkflow-requirements` 同期差分が 1 表に集約され、Phase 12 PR レビュー負荷が軽減。
- **実現性**: implementation タスクであっても、契約文書 DRY は grep + 表化で完結する。
- **整合性**: 不変条件 #5（D1 access apps/api 内）に違反しない。shared 配置は follow-up 明示で apps/api 境界を維持。親タスク 07b との重複 0。
- **運用性**: 命名一貫性で grep 検索性が向上、Phase 12 で `aiworkflow-requirements` 同期 PR を 1 回に集約。
- **不変条件 #5 への影響**: migration / repository / workflow / route すべて apps/api 内に閉じる方針が DRY 化後も維持されている。
- **親タスク 07b 完了済仕様の保護**: 07b 既出事項を本タスクで上書きせず link 参照に統一。

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 値ドメイン重複洗い出し（`backfill_status` / failure code / HTTP status） | 8 | spec_created | grep 結果を表化 |
| 2 | DDL / 命名規約の重複洗い出し（partial UNIQUE / `__extra__:` / `deleted_members`） | 8 | spec_created | 親 07b 完了済正本との差分明示 |
| 3 | `aiworkflow-requirements` 差分の一意化 | 8 | spec_created | 4 ファイルへの追記内容を 1 表に集約 |
| 4 | shared 配置（`packages/shared/src/types/zod`）への影響評価 | 8 | spec_created | 本タスクは apps/api 内のみを base case 確定 |
| 5 | 直交性確認（07b 完了 / UT-04 / 監視 / admin UI polling） | 8 | spec_created | 責務侵食 0 |
| 6 | navigation drift 確認 | 8 | spec_created | リンク切れ 0 |
| 7 | outputs/phase-08/main.md 作成 | 8 | spec_created | 全項目集約 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | DRY 化結果（Before/After・重複削除・親 07b 差分整理・aiworkflow-requirements 同期差分・shared 配置影響・navigation drift） |
| メタ | artifacts.json | Phase 8 状態の更新 |

---

## 完了条件

- [ ] `backfill_status` / failure code / HTTP status の値ドメイン定義の重複が 0（Phase 2 のみ正本）
- [ ] partial UNIQUE index DDL の重複が 0（Phase 2 db-constraint-design.md のみ正本）
- [ ] 親タスク 07b 完了済 implementation-guide からの重複転記が 0（`__extra__:` / `deleted_members` / カラム不在吸収方針は link 参照のみ）
- [ ] `aiworkflow-requirements` への追記差分が 1 表に集約（重複 0）
- [ ] shared 配置（`packages/shared/src/types/zod`）への影響評価が「本タスクは apps/api 内のみ、shared は follow-up」で確定
- [ ] 不変条件 #5 違反 0（migration / repository / workflow / route すべて apps/api 内）
- [ ] 関連タスク 4 件（07b 完了 / UT-04 / 監視 / admin UI polling）への責務侵食 0
- [ ] navigation drift（artifacts.json / index.md / phase-XX.md / outputs path / 親タスク dir / aiworkflow-requirements / Issue #293）が 0
- [ ] outputs/phase-08/main.md が作成済み

---

## タスク 100% 実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 成果物が `outputs/phase-08/main.md` に配置予定
- Before / After が 4 区分（値ドメイン / 親 07b 差分 / aiworkflow-requirements 同期 / shared 配置）で網羅
- 重複削除候補 8 件
- navigation drift 0
- 不変条件 #5 違反 0
- artifacts.json の `phases[7].status` が `spec_created`

---

## 次 Phase への引き渡し

- 次 Phase: 9（品質保証）
- 引き継ぎ事項:
  - DRY 化済みの単一正本 path 表（Phase 9 link 検証 / AC トレース表の前提として参照）
  - 親タスク 07b 完了済仕様との差分整理結果（本タスク独自差分のみが Phase 11 / 12 evidence の対象）
  - `aiworkflow-requirements` 同期差分 1 表（Phase 12 同期 PR 入力）
  - shared 配置 = follow-up 確定（不変条件 #5 維持）
  - navigation drift 0 状態の維持（Phase 9 link 検証で再確認）
- ブロック条件:
  - 値ドメイン or DDL が複数 Phase に重複定義されたまま
  - 親タスク 07b 完了済仕様を上書き / 全文転記している箇所がある
  - `aiworkflow-requirements` への追記差分が複数 Phase に分散
  - shared 配置判断が「未決」のまま Phase 9 に進む
  - 不変条件 #5 違反が検出される
  - navigation drift が 0 にならない
