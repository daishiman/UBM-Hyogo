# E2E Quality Uplift — Stage 1: Critical Regression Assertions

> 既存 E2E spec に対して **最高価値の failure-mode assertion** を 2 種追加するワークフロー。
> PR #594 で `test.describe.skip` が解除済みだが、最も重大な regression（プライバシー漏洩・state 一貫性）を捕捉する assertion がまだ無い状態を解消する。

## メタ情報

| 項目 | 値 |
|------|----|
| workflow id | `e2e-quality-uplift-stage-1` |
| branch | `feat/task-spec-e2e-stage-2` |
| 起票日 | 2026-05-08 |
| tier | standard（E2E lines >= 80% / critical route smoke 100%） |
| implementation_mode | `new`（既存 spec ファイルへの assertion / test case 追加） |
| サイクル | CONST_007 単一サイクル（無関係 route への spec 追加禁止） |
| depends-on | `e2e-quality-uplift-stage-0`（PR #594 由来 unskipped specs が dev に取り込まれていること） |

## サブタスク

| ID | サブタスク | 対象 spec | 対象 route | failure-mode |
|----|-----------|----------|-----------|--------------|
| 1a | Public-flow email leak assertion | `apps/web/playwright/tests/public-flow.spec.ts` | `/`, `/(public)/members`, `/(public)/members/[id]` | プライバシー漏洩（`responseEmail` / 非 public consent member の email が DOM に出力される） |
| 1b | Pending-sticky race assertion | `apps/web/playwright/tests/profile-visibility-request.spec.ts`, `apps/web/playwright/tests/profile-delete-request.spec.ts` | `/profile` | state 不一致（提出直後だけ pending を表示し、navigate 復帰後に消える＝サーバ正本が反映されない） |

## 受け入れ条件（workflow 全体）

- [x] 1a: `responseEmail` 既知 fixture 値（`system+responseEmail@example.test`）が `/`, `/members`, `/members/[id]` の DOM 全体に対して `not.toContainText` で assert される。
- [x] 1a: 任意の email-like 文字列が body に存在しないことを補助 assertion として組み込み（false negative 削減）。
- [x] 1b: visibility-request / delete-request 双方で「submit → 202 → pending 表示 → 別 route へ navigate → `/profile` に戻る → 依然として pending banner が見える」round-trip assertion を追加する。
- [x] 1b: 復帰時の server-side `GET /me/profile` を local mock API で返し、`pendingRequests` に該当 type が含まれた response を返却する。
- [x] CI gate 相当のローカル Playwright smoke が green。実行結果は `outputs/phase-11/evidence/e2e-run.txt` に記録済み。
- [x] `apps/api` production code に変更を入れない。`apps/web/src/styles/tokens.css` は既存 axe contrast failure を解消する最小 token 修正のみ。

## 範囲外（明示的）

- 新規 spec ファイル作成（既存 2 ファイルへの追記のみ）。
- 他 route（`/login`, `/admin/*`, `/(admin)/*`）への assertion 拡張。
- D1 schema 変更・API endpoint 追加・production code の Auth.js 認証実装変更。
- Playwright fixture の `signSession()` は本サイクルで shared JWT helper に接続し、Stage 2 依存条件の placeholder 0 件 gate と整合させる。
- HEX/`bg-[#xxx]` 移行や design token 全面整備（ただし既存 axe contrast failure 解消に必要な最小 accent token 修正は本サイクル内で実施）。

## 不変条件参照

| ID | 内容 | 出典 |
|----|------|------|
| INV-3 | `responseEmail` は system field、UI に表示しない | `CLAUDE.md` 重要な不変条件 #3 |
| INV-PUB | 非 public consent member の PII を public route に露出しない | `docs/00-getting-started-manual/specs/01-api-schema.md`（consent キー定義） |
| INV-API-ONLY | `apps/web` は D1 直接アクセス禁止、API 経由のみ | `CLAUDE.md` 重要な不変条件 #5 |
| INV-PROTO | プロトタイプ未掲載でも primitive を増やさない | UI prototype alignment 不変条件 #3 |

## Phase 1-13 ステータス

| Phase | 名称 | ステータス | 成果物 |
|-------|------|-----------|--------|
| 1 | 要件定義 | done | `phase-1.md` |
| 2 | 設計 | done | `phase-2.md` |
| 3 | 設計レビュー | done | `phase-3.md` |
| 4 | テスト計画 | done | `phase-4.md` |
| 5 | テスト実装 | done | `phase-5.md` |
| 6 | 実装 | done | `phase-6.md` |
| 7 | 静的検証 | done | `phase-7.md` |
| 8 | 動的検証 | done | `phase-8.md` |
| 9 | 受け入れ検証 | done | `phase-9.md` |
| 10 | 統合 | done | `phase-10.md` |
| 11 | リリース準備 | done | `phase-11.md` |
| 12 | 中学生レベル概念説明 | done | `phase-12.md` |
| 13 | PR 作成 | pending_user_approval | `phase-13.md` |

## 関連ドキュメント

| パス | 用途 |
|------|------|
| `apps/web/playwright/fixtures/auth.ts:19` | `memberPage` / `adminPage` / `anonymousPage` fixture（共通利用） |
| `apps/web/playwright/tests/public-flow.spec.ts:9` | 1a の追記対象 describe |
| `apps/web/playwright/tests/profile-visibility-request.spec.ts:7` | 1b の追記対象 describe |
| `apps/web/playwright/tests/profile-delete-request.spec.ts:7` | 1b の追記対象 describe |
| `apps/web/playwright/fixtures/d1-seed.ts` | 既知 fixture email を seed する場合の参照 |

## 機械検証メタ情報

| key | value |
| --- | --- |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| coverageTier | standard |
| workflow_state | implemented_local |
| evidence_state | e2e_verification_recorded |
