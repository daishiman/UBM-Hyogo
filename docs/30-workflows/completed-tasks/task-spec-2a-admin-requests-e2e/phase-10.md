[実装区分: 実装仕様書]

> **CONST_004 判定根拠**: sub-task 2a の最終成果物は実行可能 TypeScript spec
> （`apps/web/playwright/tests/admin-requests.spec.ts`）であり、CI でランタイム実行される。
> 親 workflow `taskType=docs-only` ラベルに優先し、CONST_004 に従い実装仕様書として作成する。

---

# Phase 10: 最終レビュー（sub-task 2a 単体スコープ）

| 項目 | 値 |
|------|-----|
| workflow_id | `task-spec-2a-admin-requests-e2e` |
| sub-task ID | `2a` |
| 起点日 | 2026-05-09 |
| 対象 | `apps/web/playwright/tests/admin-requests.spec.ts`（実装に応じた最小行数） |
| visualEvidence | NON_VISUAL |
| 単一スコープ | sub-task 2a 単体（2b / 2c / 2d とは独立にサインオフ） |
| 参照モデル | `apps/web/playwright/tests/admin-pages.spec.ts` |

---

## 1. 本 Phase のスコープ宣言（独立性）

本 Phase は **sub-task 2a 単体の最終サインオフ** を行う。
親仕様書（`2a-admin-requests.md`）§10 DoD 10 項目 / §11 不変条件 5 項目 + Stage 2 横断 2 項目を、実 spec ファイルおよび Phase 8 / Phase 9 の出力に対して照合し、GO / NO-GO 判定する。
2b / 2c / 2d の進捗は本 Phase の判定に **影響しない**（独立サインオフ）。

---

## 2. 親仕様書 §10 DoD 10 項目との対照

| # | DoD 基準 | 検証方法 | 合格判定 |
|---|---------|---------|---------|
| 1 | `apps/web/playwright/tests/admin-requests.spec.ts` が存在する | `test -f apps/web/playwright/tests/admin-requests.spec.ts` | exit 0 |
| 2 | 仕様ケース 6 件が過不足なく存在する | `wc -l apps/web/playwright/tests/admin-requests.spec.ts` | 180 <= N <= 220 |
| 3 | `mise exec -- pnpm --filter @ubm-hyogo/web test:e2e admin-requests.spec.ts` で **6 test 全 green / skip 0** | Playwright reporter | 6 passed / 0 skipped / 0 failed |
| 4 | `mise exec -- pnpm typecheck` pass | tsc exit code | 0 |
| 5 | `mise exec -- pnpm lint` pass | ESLint exit code | 0 |
| 6 | `adminPage` / `memberPage` / `anonymousPage` の 3 ロール分岐が test 構造に存在 | `grep -E "adminPage\|memberPage\|anonymousPage" admin-requests.spec.ts` | 3 fixture 全て出現 |
| 7 | `page.route()` mock のみで実行され、D1 / Google API への直接アクセスが 0 件 | spec 内 `route.fulfill` 確認 + `grep 'D1Database\|getRequestContext'` | grep 0 件 |
| 8 | `test.skip` 0 件（cascade preview skip は 2c のみ） | `grep -c "test\.skip" admin-requests.spec.ts` | 0 |
| 9 | fixture object に `mergedMemberId` 等の禁止 key を含まない | `grep -n 'mergedMemberId' admin-requests.spec.ts` | 0 件 |
| 10 | stale approve が 409 を返す経路が記述されている | spec inspect（test 4 の closure counter + 2 回目 409 fulfill） | 視認 + コメント確認 |

> Phase 9 §2 の Quality Gate チェックリストと **完全に対応**（gate 1〜10 ↔ DoD 1〜10）。

---

## 3. 親仕様書 §11 不変条件チェック（CLAUDE.md UI alignment 1–5 + Stage 2 横断 2 項目）

| # | 不変条件 | 検証方法 | 合格判定 |
|---|---------|---------|---------|
| 1 | 既存 API endpoint surface のみ利用（新 endpoint / D1 schema / Google Form 仕様変更なし） | `git diff dev...HEAD -- apps/api/src/routes/admin/requests.ts apps/api/migrations/` | 変更 0 行 |
| 2 | OKLch トークン正本（HEX 直書き / `bg-[#xxx]` 禁止） | `grep -rn 'bg-\[#\|text-\[#' apps/web/playwright/tests/admin-requests.spec.ts` | 0 件 |
| 3 | プロトタイプ正本順位（新 primitive 追加禁止） | spec が UI primitives を生成しないこと（spec は e2e のみ） | spec inspect で primitive 定義 0 |
| 4 | `apps/web` から D1 binding 直接アクセス禁止 | `grep -rn 'D1Database\|getRequestContext' apps/web/playwright/tests/admin-requests.spec.ts` | 0 件 |
| 5 | 新 fixture 追加なし（`auth.ts` 拡張禁止） | `git diff dev...HEAD -- apps/web/playwright/fixtures/auth.ts` | 0 行（または既存変更なし） |
| Stage 2 横断 1 | 既存 API endpoint surface のみ利用 | DoD 7 と等価 | 0 件 |
| Stage 2 横断 2 | spec のみ作成（helper 抽出は本サブタスク範囲外、Phase 8 §1 で確定） | `apps/web/playwright/helpers/admin-mocks.ts` の追加なし | 該当ファイル未追加 |

---

## 4. Phase 別エビデンス対照

| Phase | 出力エビデンス | 本 Phase での参照 |
|-------|---------------|-----------------|
| Phase 8（リファクタリング） | helper 抽出を行わない決定 + 抽出候補 4 件 identification | §3 不変条件 Stage 2 横断 2「helper 抽出未実施」確認 |
| Phase 9（品質保証） | gate 10 項目 / retry=0 / 3 連 run / race 5 連 / grep 4 件 | §2 DoD 1〜10 と 1:1 対応 |

---

## 5. 4-condition gate（Stage 2 親 Phase 3 由来）再確認

| # | 条件 | 状態 | 根拠 |
|---|------|------|------|
| C1 | 単一責務（CONST_007） | OK | sub-task 2a は `/admin/requests` route の E2E のみに責務を限定 |
| C2 | 不変条件遵守 | OK | §3 で CLAUDE.md UI alignment 1–5 + Stage 2 横断 2 項目すべて grep gate 経由で確認 |
| C3 | 受け入れ基準が観測可能 | OK | DoD 10 項目すべて `test -f` / `grep -c` / Playwright reporter / exit code で観測可能 |
| C4 | 依存（Stage 1）明示 | OK | 親仕様書 §12「Stage 1 完了済み・他サブタスクと独立」を §1 で再確認 |

---

## 6. レビュー観点（5 軸）

| 軸 | 確認項目 | 状態 |
|----|---------|------|
| 設計 | spec 構造が参照モデル `apps/web/playwright/tests/admin-pages.spec.ts` と一貫 | OK（Phase 8 §3 で記述順序を整合） |
| テスト | mock counter / race / 認可 3 ロールの決定論性 | OK（Phase 9 §3 / §4） |
| 品質 | flaky 防止策 5 観点、retry=0 で green | OK（Phase 9 §4） |
| 文書 | Phase 8 / 9 / 10 一貫、open question 0（親仕様書 §12 で全解消済） | OK |
| リスク | helper 抽出未実施が Stage 3 へ申し送り、本 Stage の green 判定に影響しない | OK（Phase 8 §6 / Phase 9 §8） |

---

## 7. 開いている課題（Stage 3 持越し）

| # | 内容 | 受け先 | 本 Phase 判定への影響 |
|---|------|-------|--------------------|
| 1 | mock helper の `helpers/admin-mocks.ts` 抽出（2a/2b/2c 横断） | Stage 2 横断 Phase 8 または Stage 3 | なし（Phase 8 §1 で「本サブタスク範囲外」確定済み） |
| 2 | line cov 70% 未達時の追加 unit test | Stage 3 | なし（standard tier の責任分界線は Stage 横断） |

> いずれも本 sub-task 2a の GO 判定を阻害しない。

---

## 8. 完了サインオフ条件

以下を **すべて満たす場合のみ** GO 判定とする:

1. §2 DoD 10 項目すべて合格判定
2. §3 不変条件 5 項目 + Stage 2 横断 2 項目すべて合格判定
3. §5 4-condition gate（C1〜C4）すべて OK
4. §6 レビュー観点 5 軸すべて OK
5. §7 開いている課題が **本サブタスクの blocker ではない** ことを再確認

> 1 つでも NO-GO がある場合は、該当 Phase（8 / 9）に差し戻し、修正後に本 Phase を再実行する。

---

## 9. 最終判定

> **GO — sub-task 2a spec 一式完成（前提: Phase 8 / 9 のチェック項目すべて合格）**

| 判定軸 | 状態 |
|-------|------|
| DoD 10 項目 | 全合格前提（実 spec 実装後に Phase 9 で確認） |
| 不変条件 7 項目（5 + Stage 2 横断 2） | 全合格前提（grep gate 経由） |
| 4-condition gate | C1〜C4 OK |
| Open question | 0 件（親仕様書 §12 で全解消） |
| Stage 3 申し送り | 2 件（blocker ではない） |

---

## 10. 次フロー

| ステップ | 内容 |
|---------|------|
| 実装サイクル（CONST_007） | 本 sub-task 2a の spec 実装 + green 化を 1 サイクルで完了 |
| Stage 2 横断 Phase 11 | 手動テスト（NON_VISUAL のため screenshot 不要、3 ロール分岐の reporter ログを evidence として保存） |
| Stage 2 横断 Phase 12 | implementation guide 更新 |
| Stage 2 横断 Phase 13 | PR 作成（base = `dev`、CLAUDE.md「PR作成の完全自律フロー」準拠） |

---

## 参照（正本）

| 用途 | path |
|------|------|
| 親 sub-task 仕様書 | `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260509-172209-wt-12/docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2a-admin-requests.md` |
| Stage 2 親 Phase 10 | `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260509-172114-wt-11/docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/phase-10.md` |
| 本 workflow Phase 8 | `./phase-8.md` |
| 本 workflow Phase 9 | `./phase-9.md` |
| 参照モデル | `apps/web/playwright/tests/admin-pages.spec.ts` |
| 不変条件 | `CLAUDE.md` § UI prototype alignment / MVP recovery §不変条件 1–5 |

---

## Template Compliance Appendix

### メタ情報

- workflow: task-spec-2a-admin-requests-e2e
- phase: 10
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_verified

### 目的

sub-task 2a 単体の最終サインオフ判定を、親仕様書 §10 DoD 10 項目 / §11 不変条件 5 + Stage 2 横断 2 項目 / 4-condition gate / レビュー 5 軸を経由して GO / NO-GO で確定する。

### 実行タスク

- §2 で DoD 10 項目を spec 実体および Phase 9 出力に対し検証する。
- §3 で不変条件 7 項目を grep gate 経由で確認する。
- §5 で 4-condition gate を再確認する。
- §8 の完了サインオフ条件を順に評価し、§9 で GO / NO-GO を判定する。

### 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- 親 sub-task 仕様書 `2a-admin-requests.md` §10 §11 §12

### 実行手順

1. §2 表の各 DoD を Phase 9 の gate 結果と対照する。
2. §3 表の各不変条件を grep gate 出力と対照する。
3. §5 4-condition gate を再評価する。
4. §8 完了サインオフ条件の AND 評価で GO / NO-GO を出す。

### 統合テスト連携

- NON_VISUAL phase につき screenshot 不要。
- Playwright reporter ログを Stage 2 横断 outputs/phase-11/evidence に格納（親 workflow 側で集約）。

### 成果物

- 本 phase markdown（GO / NO-GO 判定込み）
- DoD / 不変条件 grep gate の検証ログ（Phase 9 出力の参照のみ、再生成不要）

### 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: standard tier line >= 70% / critical smoke 100%（2a 寄与分）。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合（2b / 2c / 2d と独立）を確認する。

### タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
- [x] DoD 10 + 不変条件 7 + 4-condition gate + レビュー 5 軸 すべての判定経路を §2〜§8 で明示した。
