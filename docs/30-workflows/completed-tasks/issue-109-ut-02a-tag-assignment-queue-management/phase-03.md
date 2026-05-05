# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-02a-tag-assignment-queue-management |
| Phase 番号 | 3 / 3 |
| Phase 名称 | 設計レビュー |
| Wave | 2-plus (serial) |
| 作成日 | 2026-05-01 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) — 実装着手時に展開 |
| 状態 | spec_created |

## 目的

Phase 2 設計の代替案を比較し、PASS / MINOR / MAJOR で判定する。あわせて Phase 4 開始条件、simpler alternative の有無、type-level read-only test（02a `memberTags.ts`）の確認手順を確定する。

## 実行タスク

1. alternative 4 案の起こし
2. PASS / MINOR / MAJOR 判定
3. simpler alternative の検討（YAGNI 観点）
4. Phase 4 開始条件
5. 02a `memberTags.ts` read-only test の確認手順

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/state-machine.md | レビュー対象 |
| 必須 | outputs/phase-02/spec-extraction-map.md | 仕様語↔実装語 |
| 必須 | outputs/phase-02/migration-grep-table.md | column 照合 |
| 必須 | docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/phase-03.md | 下流の判定整合 |

## Alternative 4 案

### 案 A: idempotency key を `(memberId, tagCode)` のみとする（responseId を含めない）

- pros: key が短く index 効率良い、再回答でも重複登録されない。
- cons: 再回答ごとの再評価ができない。Forms 修正で tag が外れる/付くケースで queue が更新されない。
- 不変条件影響: なし。
- 判定: **MINOR**（不採用、運用上の柔軟性で `(memberId, responseId, tagCode)` を採用）。

### 案 B: DLQ を別 table（`tag_assignment_queue_dlq`）に分離

- pros: 通常 query に DLQ 行が混入しない、index 効率良い。
- cons: migration コスト増、admin requeue 時のデータ移動が必要、status 一覧の整合性確保コスト。
- 不変条件影響: なし。
- 判定: **MINOR**（不採用、`status='dlq'` 拡張で十分）。

### 案 C: 02a `memberTags.ts` の read-only 担保を runtime check のみで行う

- pros: 実装簡単。
- cons: ビルド時に検出できない、開発中の事故を防げない。`vitest --typecheck` の方が早期検出可能。
- 不変条件影響: 02a の read-only 制約を **構造的**に守れない。
- 判定: **MAJOR**（不採用、type-level test 必須）。

### 案 D: enqueue を background queue（Cloudflare Queues）に切り出す

- pros: forms sync の latency 削減、retry を Queue に委譲。
- cons: 追加サービス導入、無料枠は Queues も別計上、即時性低下、本タスクのスコープ膨張。
- 不変条件影響: なし。
- 判定: **MINOR**（不採用、03b sync 内同期 + 本 repository の retry/DLQ で十分）。

### 採用案: Phase 2 設計

- idempotency: `(memberId, responseId)` 複合 unique index（現行 candidate は tagCode 未確定）
- DLQ: 同一 table の `status='dlq'` 拡張
- read-only 担保: type-level test + dependency-cruiser
- enqueue: 03b sync 内同期実行

## PASS / MINOR / MAJOR 判定

| 案 | 判定 | 採否 |
| --- | --- | --- |
| A: key を memberId+tagCode のみ | MINOR | 不採用 |
| B: DLQ を別 table | MINOR | 不採用 |
| C: read-only を runtime のみ | MAJOR | 不採用 |
| D: Cloudflare Queues 採用 | MINOR | 不採用 |
| Phase 2 案（採用） | PASS | 採用 |

## simpler alternative 検討（YAGNI）

- retry 回数 3 → 1 に縮小：transient error の実頻度が極小ならありうるが、初回失敗時の admin への影響が大きいので **3 を維持**。
- DLQ なし（失敗時は通常の queued に残置）：監視性が下がり、永久 retry の事故源になるため **DLQ は残す**。
- 仕様語↔実装語対応表を省略：grep ずれが恒久バグ化するため **省略不可**。

結論: Phase 2 案より単純な代替で価値を維持できるものはなく、現設計を採用する。

## Phase 4 開始条件

| 項目 | 条件 |
| --- | --- |
| state machine | 確定（dlq 含む） |
| idempotency | 確定（複合 unique index） |
| retry/DLQ | 確定（指数バックオフ + status 拡張） |
| schema ownership | 確定（apps/api/src/schemas/tagAssignmentQueue.ts） |
| migration × repo 照合表 | Phase 2 で 9 列分作成済み |
| 02a read-only test 案 | 提示済み（vitest --typecheck） |
| 上流 repo signature | 02b 既存 schema が確認済みであること |

## 02a `memberTags.ts` read-only test の確認手順

1. 本タスク実装着手前に `pnpm exec vitest run --typecheck apps/api/src/repositories/__tests__/memberTags.readonly.test-d.ts` を pass 化。
2. 本タスク実装後（tag_assignment_queue 関連 PR 内）も同 test を再実行し pass を維持。
3. dependency-cruiser ルール: `apps/web/**` から `apps/api/src/repositories/tagAssignmentQueue.ts` への import を `error`。
4. grep 確認: `rg "from .*memberTags" apps/api/src --type ts` の結果に write 系 import が現れない。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4（実装着手時） | 採用案を test 戦略の前提に |
| Phase 7（実装着手時） | 設計選択の根拠 |
| 07a | resolve 側の `transitionStatus` 仕様一致を確認 |

## 多角的チェック観点

| 不変条件 | チェック | 理由 |
| --- | --- | --- |
| #5 | 全案で repository を apps/api 内に閉じる | data access boundary |
| #13 | 全案で member_tags への直接 INSERT を行わない | tag 経路の単一化 |
| 02a read-only | 案 C を MAJOR で不採用、type-level 必須化 | 構造的担保 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | alternative 起こし | 3 | spec_created | A/B/C/D |
| 2 | 判定 | 3 | spec_created | PASS/MINOR/MAJOR |
| 3 | simpler alternative | 3 | spec_created | YAGNI |
| 4 | Phase 4 開始条件 | 3 | spec_created | 7 項目 |
| 5 | read-only 確認手順 | 3 | spec_created | 4 ステップ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | alternative 比較 + 判定 + Phase 4 入口 |
| メタ | artifacts.json | Phase 3 を spec_created |

## 完了条件

- [ ] alternative 4 案
- [ ] 判定（C が MAJOR で不採用、A/B/D は MINOR）
- [ ] simpler alternative 検討の結論
- [ ] Phase 4 開始条件 7 項目
- [ ] read-only test の確認手順 4 ステップ

## タスク100%実行確認

- 全 alternative 記載
- 採用案確定
- artifacts.json で Phase 3 を spec_created

## 次 Phase

- 次: 4 (テスト戦略) — 実装着手時に展開
- 引き継ぎ: 採用設計 + Phase 4 開始条件 + read-only test 手順
- ブロック条件: PASS 判定が成立しない場合は Phase 2 へ差し戻し

## Handoff to Phase 4

| 項目 | 内容 |
| --- | --- |
| 採用設計 | 複合 unique index idempotency + status='dlq' 拡張 + 03b 同期 hook |
| 確定 module | tagAssignmentQueue (repo), tagAssignmentQueueSchema, enqueueTagCandidate |
| 確定 contract | enqueue / findById / listPending / transitionStatus / moveToDlq |
| open question | retry の transient error 範囲（D1 のどの error code を transient とするか） |
| blocker | なし（02b 既存 schema が確認済みであること） |
