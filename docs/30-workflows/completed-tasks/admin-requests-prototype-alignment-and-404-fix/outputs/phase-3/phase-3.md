# Phase 3 — 設計レビュー

> Phase 1（要件）+ Phase 2（設計）に対して 4 条件（価値性 / 実現性 / 整合性 / 運用性）で gate 判定し、Phase 4 へ進めるか確定する。

---

## 1. 4 条件レビュー

| 観点 | 評価 | 根拠 |
|------|------|------|
| 価値性 | PASS | `/admin/requests` は公開停止 / 退会 governance の入口。404 は最優先復旧対象。UI 整合は admin shell 全体の operability を底上げする。 |
| 実現性 | PASS | API 修正は最悪 redeploy + regression spec のみ。UI は既存 `RequestQueuePanel` 構造を温存し外側 wrapper / primitive 適用に限定。1 サイクル内で完結可能。 |
| 整合性 | PASS | 不変条件 #1〜#11 すべて準拠（Phase 1 §8 checklist + Phase 2 §1 で静的解析確定）。新 endpoint / 新 token / 新 primitive を導入しない。 |
| 運用性 | PASS | Playwright admin-staging-visual に baseline を入れることで CI gate で回帰検知。vitest spec が route mount drift をローカル検知。 |

---

## 2. 論点別レビュー

### 論点 A — 404 修正の root cause 仮説選定

Phase 2 §1 で H2 / H3 / H4 は静的解析で除外、H1（staging bundle drift）を主仮説、URL drift をサブ仮説に絞り込み済み。Phase 5 で curl + deployments list の 2 段確認で確定する設計は **十分な原因切り分け力** を持つ。

### 論点 B — UI 整合の primitive 採用範囲

Phase 2 §3 で採用 primitive を `page-enter / stack-lg / page-head / card / card-pad-lg / card-pad / card-flat / h-section / h-card / btn-row / eyebrow / lede` に限定。すべて `claude-design-prototype/pages-admin.jsx` 既出の primitive で、新規追加なし。整合性 OK。

### 論点 C — `h1` 二重化リスク

page.tsx と RequestQueuePanel.tsx の両方に `h1 依頼キュー` がある現状から、page.tsx を h1 担当に固定し RequestQueuePanel 側は `h2` 以下へ降格する Phase 2 §3 の決定で **二重 h1 回避**。a11y 上の正解（task-spec-creator L-PGHEAD-001 の二重 h1 抑止 lesson と整合）。

### 論点 D — visual baseline の Linux 正本

`apps/web/playwright/tests/visual/admin-staging.spec.ts` の baseline は `*-linux.png` 正本ルール（aiworkflow lessons L-I902-002）に従う。macOS 取得は参考用。Phase 5 / Phase 11 で baseline capture は CI（または `EVIDENCE_DIR` 経由）で取る方針を明記。

---

## 3. Phase 4 進行判定

| Gate | 結果 |
|------|------|
| AC が code-implementable な粒度に分解されている | YES（Phase 1 §3） |
| Inventory が全ファイル列挙 | YES（Phase 1 §4） |
| 設計の決定木 / lane / validation path が確定 | YES（Phase 2 §2 / §4 / §5） |
| 不変条件チェックリストが用意されている | YES（Phase 1 §8） |
| CONST_007 — 1 サイクル完結スコープ | YES（先送り項目なし） |

**判定: GO**（Phase 4 進行可）。

---

## 4. Phase 4 への申し送り

- Phase 4（テスト設計）では Task A の regression spec の正確な test case 一覧（auth presence / type enum / cursor / pagination / 200 happy path）と、Task B の Playwright snapshot 取得手順（admin-staging-visual project + storage state 再利用 + `EVIDENCE_DIR` 切替）を設計する。
- Task A の test は `apps/api` の既存 admin route spec（例: `apps/api/src/routes/admin/members.spec.ts`）の harness を再利用する。
- Task B の Playwright snapshot は既存 `admin-staging.spec.ts` 内に test 追加で済む。新 spec ファイル不要。
