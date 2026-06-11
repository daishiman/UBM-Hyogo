# Phase 11 Manual Test Result（VISUAL_ON_EXECUTION）

Status: `pending`（implemented_local_evidence_captured・実スクリーンショット未取得 / PNG 0）

## VISUAL_ON_EXECUTION 宣言

| 項目 | 値 |
|------|-----|
| タスク種別 | implementation / UI（公開詳細ページ表示検証） |
| visualEvidence | **VISUAL_ON_EXECUTION** |
| visualEvidenceStatus | **staging_visual_pending_user_gate**（implemented_local_evidence_captured・staging apply とスクリーンショット撮影は user-gated） |
| 視覚的である理由 | 成果は「公開詳細ページが全 public 項目を full/all-fields/edge データで描画する様子の目視確認」であり、描画可能な画面要素を持つ |

## 証跡の主ソース（実行後の staging スクリーンショット = pending）

本タスクの主証跡は、staging に seed apply 後に取得する公開詳細ページのスクリーンショットである（Phase 11 `phase-11.md` の EV-01..08）。implemented_local_evidence_captured の現時点では **未取得**。理由は以下:

- staging D1 への seed apply（`scripts/seed-test-accounts.sh --env staging --action apply`）が **user-gated**（CONST_002 / CONST_006）。
- authenticated / staging スクリーンショット撮影が **user-gated**。
- local実装は完了済み（implemented_local_evidence_captured）であり、staging反映前のためruntime画像は未取得。

| ID | 予約ファイル（未取得） | 対応 TC | status |
|----|------------------------|---------|--------|
| EV-01 | `evidence/member-detail-test-mem-06-full.png` | TC-01 | staging_visual_pending_user_gate |
| EV-02 | `evidence/member-detail-test-mem-06-visibility-guard.png` | TC-02 | staging_visual_pending_user_gate |
| EV-03 | `evidence/member-detail-test-mem-01-full.png` | TC-03 | staging_visual_pending_user_gate |
| EV-04 | `evidence/member-detail-test-mem-07-tags-dense.png` | TC-04 | staging_visual_pending_user_gate |
| EV-05 | `evidence/member-detail-test-mem-09-full-data.png` | TC-05 | staging_visual_pending_user_gate |
| EV-06 | `evidence/member-detail-test-mem-10-edge.png` | TC-06 | staging_visual_pending_user_gate |
| EV-07 | `evidence/member-detail-test-mem-09-links-conditional.png` | TC-07 | staging_visual_pending_user_gate |
| EV-08 | `evidence/members-list-public-listed.png` | TC-08 | staging_visual_pending_user_gate |

## 現時点の代替証跡（Phase 4 / 6 設計の自動テスト spec）

スクリーンショットが pending の間、本タスクの正しさは以下の **自動テスト spec（Phase 4 / 6 で設計・今回のlocal実装で実行）** が代替証跡となる。これらは fixture 駆動で staging データに依存せず、公開詳細ページの全 public 項目描画・全項目保持・visibility 二重防御を検証する。

| spec ファイル | 検証内容 | 対応 AC |
|---------------|----------|---------|
| `apps/api/src/testing/test-accounts/__tests__/catalog.spec.ts` | TEST-MEM-01..10 の `profile` が表示バリエーション・マトリクス通り 31 stable_key を保持（09 全項目入力・10 エッジ・member/admin データ投入） | AC-1, AC-2, AC-3 |
| `apps/api/src/testing/test-accounts/__tests__/build-seed-sql.spec.ts` | per-member profile から全 stable_key 分の `response_fields` 行 + `schema_questions` visibility 行が生成される | AC-4, AC-5 |
| `apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts` | committed 生成物との byte 一致（drift guard）、in-memory D1 適用後の公開項目取得・member/admin の公開 view 非漏洩・`seed→cleanup→seed` 冪等 | AC-4, AC-5, AC-9 |
| `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` | adapter が full/all-fields/edge fixture で全 public 項目をセクション割当 + 全項目保持 + member/admin 非表示（contract spec） | AC-6 |
| `apps/web/src/components/public/__tests__/*.spec.tsx` | 各 public コンポーネントの描画 spec（必要時追補） | AC-6 |

> contract spec / adapter component spec は Phase 4（テスト作成）と Phase 6（テスト拡充）で設計し、今回のlocal実装で実行・PASS させる。本 wave（implemented_local_evidence_captured）では spec 設計のみ。

## スクリーンショット未取得の理由（再掲）

- **implemented_local_evidence_captured**: local code / seed 再生成 / focused tests は完了済み。staging apply と screenshot は user-gated である。
- **staging apply は user-gated**: 実 staging D1 への seed 投入はユーザー明示承認後のみ。
- **撮影対象がまだ無い**: 拡充後の catalog による seed が staging へ適用された後に初めて全項目描画が出現する。

## 実行記録（実行後に追記）

実行後（user-gated）に以下を記録する。本 wave では未実行。

- `scripts/seed-test-accounts.sh --env staging --action apply` → （未実行）
- `/members/TEST-MEM-06`（+ 01 / 07 / 09 / 10）目視 → TC-01..08 合否（未実行）
- EV-01..08 スクリーンショット取得 → （未取得）

## スクリーンショット

なし（implemented_local_evidence_captured・pending）。`outputs/phase-11/evidence/` 配下に本 wave では画像を配置しない。実行後に EV-01..08 を配置する。
