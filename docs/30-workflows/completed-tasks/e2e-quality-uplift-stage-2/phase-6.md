# Phase 6: テスト拡充

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-09 |
| 焦点 | admin-only access path / 403 vs `/login` redirect / audit log entry assertion |

> Phase 5 で書かれた最小テストに、**境界条件と認可線引き** を追加する。

---

## 1. admin-only access path の網羅

| spec | role | expected | assertion 種別 |
|------|------|---------|---------------|
| 2a | admin | 一覧 200 表示 | `getByRole('table')` 可視 |
| 2a | member | API 403 → UI は admin layout 内で **403 page** または `/profile` redirect | `expect(page).toHaveURL(/\/profile|\/admin/) ` + 403 表示 OR redirect |
| 2a | anonymous | API 401 → UI **`/login` redirect** | `await expect(page).toHaveURL(/\/login/)` |
| 2b | admin / member / anonymous | 同上 3 行 | 同パターン |
| 2c | admin / member / anonymous | 同上 3 行 | 同パターン |

> 4 admin route（`/admin/requests` / `/admin/identity-conflicts` / `/admin/members` / Stage 1 で既存 4 routes）すべてが critical smoke 100% を満たすため、**3 ロール × 3 routes = 9 認可 assertion** を追加する。

---

## 2. 403 vs `/login` redirect の判定方針

| 入力 | API 応答 | UI 期待挙動 | spec 観点 |
|------|---------|-----------|-----------|
| 認証 cookie 無し | `requireAdmin` → 401 | `/login` redirect | URL アサーション |
| 認証 cookie 有 + `isAdmin=false` | `requireAdmin` → 403 | admin layout が 403 page を描画（または `/profile` redirect） | DOM 文字列 or URL アサーション |
| 認証 cookie 有 + `isAdmin=true` | 200 | admin UI 描画 | DOM 要素可視 |

> 上記 3 入力は Phase 4 §1 Q1 の解決結果に基づく。spec 内では URL/DOM の **どちらか一方** を確認すれば足り（OR 条件の `expect.poll` で吸収）、UI 実装変更耐性を持たせる。

---

## 3. audit log entry assertion（2c）

| step | mock | assertion |
|------|------|----------|
| 1. delete 実行 | POST `**/admin/members/*/delete` → 200 | request body に `reason` |
| 2. UI が audit log を fetch | GET `**/admin/audit*` → fixture entries（削除 entry を含む） | UI 一覧に `action='admin.member.deleted'` 行表示 |
| 3. entry shape | `{ auditId, actorId, actorEmail, action, targetType:'member', targetId, createdAt }` | DOM テキストに `targetId` と action 表示 |

> audit endpoint の sort 順は spec 側 fixture で固定（Phase 4 Q4）。

---

## 4. 失敗系シナリオ追加（拡充）

| spec | 失敗系 test | 追加根拠 |
|------|-----------|---------|
| 2a | 二重 approve 409 | race の決定論検証（mock counter） |
| 2a | reject の reason 空 → 422 | required validation |
| 2b | merge の `SELF_REFERENCE` 400 | self-merge guard（identity-merge.ts:96） |
| 2b | merge の `TARGET_MEMBER_MISMATCH` 400 | conflict id と body の不整合（identity-conflicts.ts:63-65） |
| 2b | merge の `ALREADY_MERGED` 409 | 二重 merge（identity-conflicts.ts:78-80） |
| 2c | reason 空 → 422 | DeleteBodyZ.min(1) |
| 2c | 既削除 → 409 (`member_already_deleted`) | member-delete.ts:64 |

> 失敗系は **API 仕様の error code を spec 側で再確認** する位置付け。実装に対する 2 重 gate。

---

## 5. critical smoke 100% への寄与

| route | smoke | mutation | 計 |
|-------|-------|---------|-----|
| `/admin/requests` | Stage 1 | 2a | 100% |
| `/admin/identity-conflicts` | Stage 1 | 2b | 100% |
| `/admin/members` | Stage 1 | 2c | 100% |
| `/admin/audit` | Stage 1 | 2c の audit assertion で間接観測 | 100% |

> Stage 2 で **admin 4 routes すべて critical smoke 100%** を達成。

---

## 6. coverage 目標値（standard tier）

| 観点 | 目標 | 達成手段 |
|------|------|---------|
| line coverage（apps/web 全体） | >= 70% | 既存 + Stage 2 spec で +N% を見込む（Phase 7 で実測） |
| critical route smoke 成功率 | 100% | §5 |
| admin route mutation 系 | 主要 mutation flow を 1 path 以上カバー | §1, §4 |

---

## 7. Phase 6 完了定義

- [x] admin-only 認可境界が 3 ロール × 3 routes の 9 assertion 設計済み
- [x] 403 vs `/login` の判定方針が確定
- [x] audit log entry assertion が 2c に組み込み
- [x] 失敗系 7 ケース（§4）が spec に追加
- [x] critical smoke 100% への寄与経路が確定

> Phase 7 へ進める。

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-2
- phase: 6
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_verified

## 目的

Stage 2 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 実行タスク

- 既存本文の phase 内容を実行単位として保持する。
- 実ファイル変更、仕様書、Phase evidence、skill feedback の対応を確認する。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 実行手順

1. 本 phase の既存本文を確認する。
2. 対応する実ファイル差分または evidence を確認する。
3. validator と grep gate の結果を Phase 11 / Phase 12 evidence に反映する。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。
- E2E runtime 実行が必要な項目は outputs/phase-11/evidence に結果を保存する。

## 成果物

- 本 phase markdown
- 関連 outputs/phase-11 または outputs/phase-12 evidence
- 必要に応じた apps/web / .claude/skills 実ファイル差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E tier-aware standard lines >=70%、workspace coverage guard は既存基準に従う。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。

