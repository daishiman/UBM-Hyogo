# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-02a-tag-assignment-queue-management |
| Phase 番号 | 1 / 3（spec_created 段階） |
| Phase 名称 | 要件定義 |
| Wave | 2-plus (serial) |
| 作成日 | 2026-05-01 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | spec_created |

## 目的

`tag_assignment_queue` の **書き込み側 repository / workflow** の責務を確定する。02a `memberTags.ts` は read-only であり、Forms 同期から発生する tag 割当 candidate を queue に積む経路自体が現状存在しない。本 Phase では:

1. 02a Phase 12 で発見された「queue 自体が未実装で Forms→tag 反映が成立しない」構造的欠落を **真の論点**として固定する。
2. AC 10 件を P50（中央値工数）で実装可能な粒度に分解する。
3. `artifacts.json.metadata.visualEvidence` を `NON_VISUAL` に確定する（repository / workflow であり UI 成果物がないため）。
4. 仕様語と実装語のずれ（`candidate / confirmed / rejected` ↔ `queued / resolved / rejected`）を一次資料の grep で確認し spec-extraction-map に下書きする。

## 実行タスク

1. P50 チェック：本タスクは「repository 1 ファイル + 状態遷移 + idempotency unique index + retry/DLQ + 型レベル read-only test」で構成され P50 で 1〜2 日程度。後続 07a を巻き込まない範囲に留める。
2. AC 列挙：index.md の AC-1〜AC-10 を quantitative 化（http status / DB 事後状態 / 型 test 結果）。
3. visualEvidence 確定：`NON_VISUAL`（screenshot 不要、artifact は SQL / TypeScript の grep + test ログのみ）。
4. spec-extraction-map：`docs/00-getting-started-manual/specs/08-free-database.md` から `tag_assignment_queue` の column を抽出し、仕様語と実装語の対応表ドラフトを作る。
5. true issue 抽出：(a) idempotency key の最小単位、(b) retry の終端条件、(c) DLQ の保存形態、(d) 02a read-only 制約の固定方法。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | tag_assignment_queue / member_tags テーブル定義 |
| 必須 | docs/00-getting-started-manual/specs/12-search-tags.md | queue panel と運用フロー |
| 必須 | docs/30-workflows/completed-tasks/02a-parallel-member-identity-status-and-response-repository/outputs/phase-12/unassigned-task-detection.md | 発見元（#3） |
| 必須 | docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/index.md | 下流の resolve workflow（消費側契約） |
| 必須 | CLAUDE.md | 不変条件 #5, #13 |
| 参考 | docs/30-workflows/unassigned-task/04b-followup-004-admin-queue-resolve-workflow.md | 類似 queue 運用の先行事例 |

## 実行手順

### ステップ 1: scope 確定

- 入力（enqueue）: `{ memberId, responseId, tagCode, source: 'forms_sync' }`。
- 出力: `{ queueId, status: 'queued', enqueuedAt, isExisting: boolean }`（idempotent ヒット時は `isExisting=true`）。
- 状態遷移：`queued`（仕様語 candidate）→ `resolved`（confirmed） / `rejected`。逆遷移は失敗。
- error: 400（zod 違反） / 409（state conflict） / 422（FK 不整合：member 不在 / tagCode 不在） / 500（D1 エラー）。

### ステップ 2: 状態遷移表（要件レベル）

| from | to | 条件 | 担当タスク |
| --- | --- | --- | --- |
| (none) | queued | enqueue 入力が valid + idempotency miss | 本タスク |
| (none) | queued (existing) | idempotency hit（同 row 返却、新規 INSERT なし） | 本タスク |
| queued | resolved | 07a が confirm action で呼ぶ | 07a |
| queued | rejected | 07a が reject action で呼ぶ | 07a |
| queued | dlq | retry N 回失敗 | 本タスク |
| resolved → * | × | 不可（不変条件 #13） | 本タスク（拒否ロジック） |
| rejected → * | × | 不可 | 本タスク（拒否ロジック） |

### ステップ 3: AC quantitative 化

- AC-1: repository が `enqueue / findById / listPending / transitionStatus / softDelete / moveToDlq` を export し型 test pass。
- AC-2: `transitionStatus(queued → resolved)` のみ成功し、それ以外の組合せは Result.error。
- AC-3: 同一 idempotency key で `enqueue` を 2 回呼び、INSERT が 1 件のみ（D1 の `changes` で確認）。
- AC-4: retry が指数バックオフ（例: 1s, 2s, 4s）で 3 回まで、4 回目で DLQ 隔離。
- AC-5: 02a `memberTags.ts` の export 型に `insert*` / `update*` / `delete*` が **存在しない**ことを `tsc --noEmit` ベースの型 test で固定。
- AC-6: `apps/web` から `apps/api/src/repositories/tagAssignmentQueue.ts` への import が dependency-cruiser で `error` レベル。
- AC-7: enqueue / transition / dlq 移動で `audit_log` に entry（action: `tag_queue.enqueue` / `tag_queue.dlq_moved`）。
- AC-8: spec-extraction-map と route / repo / migration の grep 結果が一致。
- AC-9: migration grep 照合表で全 column が一致。
- AC-10: 03b から `enqueueTagCandidate(env, payload)` を 1 行で呼べる（試験用 import で確認）。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 状態遷移を state machine 図 + idempotency / retry / DLQ 設計へ展開 |
| Phase 3 | alternative 評価（idempotency 粒度、retry 戦略、DLQ 保存形態） |
| 07a | resolve workflow が `transitionStatus` を呼び出す前提を引き継ぐ |
| 08a | repository の contract test 対象 |

## 多角的チェック観点

| 不変条件 | チェック | 理由 |
| --- | --- | --- |
| #5 | repository は `apps/api` 内のみ。`apps/web` から import 禁止 | data access boundary |
| #13 | `member_tags` への書込みは 07a 経由のみ。本 repository は queue のみ操作 | tag 反映の単一経路 |
| 02a read-only | `memberTags.ts` の write 系 export を禁止 | 02a の不変条件継承 |
| 認可境界 | enqueue は forms sync 内部 hook、resolve は admin gate 経由（07a） | 操作主体の分離 |
| 無料枠 | 1 enqueue = 2 D1 writes（queue + audit） | 100k writes/日 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | scope（入出力 / status code） | 1 | spec_created | |
| 2 | 状態遷移表 | 1 | spec_created | 7 行 |
| 3 | AC quantitative | 1 | spec_created | 10 件 |
| 4 | spec-extraction-map ドラフト | 1 | spec_created | 仕様語↔実装語 |
| 5 | true issue 抽出 | 1 | spec_created | 4 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | scope + 状態遷移 + AC + true issue |
| メタ | artifacts.json | Phase 1 を spec_created |

## 完了条件

- [ ] AC 10 件すべて quantitative
- [ ] 状態遷移表が 6 行以上
- [ ] visualEvidence = `NON_VISUAL` で artifacts.json に固定
- [ ] true issue が 4 件以上
- [ ] 02a `memberTags.ts` read-only 担保方針が言語化されている

## タスク100%実行確認

- 全実行タスクが spec_created
- artifacts.json で Phase 1 を spec_created

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ: 状態遷移表 + idempotency 方針 + spec-extraction-map ドラフト
- ブロック条件: AC 未確定 / visualEvidence 未確定なら次へ進めない

## 真の論点

1. idempotency key の単位は `(memberId, responseId)` とする。tagCode は admin resolve 時に確定するため enqueue key には含めず、responseId 込みにすることで再回答ごとに re-evaluate できる。
2. retry の最終失敗を別 table（`tag_assignment_queue_dlq`）に隔離するか同一 table の `status='dlq'` で済ますか → 案 B（同一 table、status 拡張）：migration コスト最小。
3. 02a read-only の固定は `tsc` 型 test のみか dependency-cruiser も併用か → 両方（型 + 構造）。
4. 03b の sync 完了 hook で同期実行か background queue か → 同期（無料枠内、即時性優先、失敗は本 repository の retry/DLQ で吸収）。

## 依存境界

- 上流: 02a（read-only 制約）、02b（既存 schema）、03a（forms sync）。
- 下流: 07a（resolve）、08a（test）。
- responsibility: queue の write 経路は本タスクが単独で持ち、`member_tags` への影響は 07a に閉じる。

## 価値とコスト

- 価値: Forms→tag 反映パイプラインの左半分が成立し、07a の resolve が実 row を消費可能になる。
- コスト: D1 writes は 1 enqueue あたり 2 writes、月 1000 件想定で 2000 writes/月（無料枠の 0.07%）。

## 4 条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | tag パイプラインを成立させるか | TBD（Phase 2 で確証） |
| 実現性 | D1 + Hono + 既存 02b schema で成立するか | TBD |
| 整合性 | 不変条件 #5, #13, 02a read-only を破らないか | TBD |
| 運用性 | retry / DLQ / idempotency が運用に耐えるか | TBD |
