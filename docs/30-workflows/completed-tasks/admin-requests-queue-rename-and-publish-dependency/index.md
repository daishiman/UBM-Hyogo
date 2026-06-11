# admin-requests-queue-rename-and-publish-dependency

管理画面の「依頼キュー」(`/admin/requests`) を **会員本人発の申請を承認する場所**だと一目で分かるよう、(1) 名称を「会員からの申請」へ平易化し、(2) 会員管理(`/admin/members`) の直接公開トグルとの**依存関係を画面上で明示**（申請中バッジ + 相互リンク + 説明文）し、(3) staging で挙動確認できる**テスト依頼 seed**（既存 TEST-MEM へ pending 申請を紐付け）を整備する実装仕様書群。

`[実装区分: 実装仕様書]` / taskType: implementation / visualEvidence: VISUAL / workflow_state: implemented_local_evidence_captured

## 真因（要約）

依頼キューと会員管理は冗長ではない。依頼キュー = **会員本人**が出した「公開停止/再開」「退会」申請の**承認フロー**、会員管理 = **管理者起点**の即時公開トグル。冗長に見えるのは UI がこの違い・相互関係を一切説明しておらず、名称も不親切なため（真因 = apps/web 表現層の情報設計欠如。機能・API・D1 は無罪）。→ 削除せず存続させ、命名・依存可視化・テスト seed を整備する。

## スコープ（3 レーン・1 サイクル完結）

| Lane | 内容 | 主な変更 |
| --- | --- | --- |
| A | テスト依頼 seed | `apps/api/src/testing/test-accounts/{catalog,build-seed-sql}.ts` + 生成 SQL 再生成 |
| B | 命名平易化 + 依頼キュー役割明確化 | `apps/web` requests page / RequestQueuePanel / RequestQueueDetail / shell-config |
| C | 会員管理 申請中バッジ + 相互リンク + API | `apps/api` members list projection + shared schema + `apps/web` members 行/説明 |

## 構成

- [_shared-context.md](./_shared-context.md) — **SSOT**（決定・命名マップ・データ契約・AC・コマンド）
- `outputs/phase-1/phase-1.md` 〜 `phase-3/phase-3.md` — 設計書（要件 / 設計 / 設計レビューゲート）
- `outputs/phase-4..10/phase-N.md` — テスト作成 / 実装 / 拡充 / カバレッジ / リファクタ / 品質 / 最終レビュー
- `outputs/phase-11/manual-test-result.md` — 手動テスト evidence inventory（screenshot は実装後 user-gated）
- `outputs/phase-12/*` — strict 7（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）
- `outputs/phase-13/phase-13.md` — commit / PR（user-gated）

## ユーザー決定（2026-06-09）

存続+役割明確化 / 新名称「会員からの申請」/ 既存 TEST 会員に依頼紐付け / 会員管理に申請中バッジ + 相互リンク+説明文。
