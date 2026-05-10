# Phase 12: ドキュメント更新（Implementation Guide）

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-09 |
| 対象読者 | レビュアー / 中学生レベルの読者にも導入を理解してもらう想定 |

> Stage 2 では admin 機能の mutation flow を扱うため、**implementation guide を Part 1（中学生向け概念）と Part 2（実装詳細）の 2 部構成** で記述する。

---

## 1. ドキュメント更新対象

| # | path | 更新種別 |
|---|------|---------|
| 1 | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/outputs/phase-12/implementation-guide.md` | 新規（Part 1/2） |
| 2 | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/index.md` の Phase status | 更新（4-13 = done） |
| 3 | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/outputs/phase-12/unassigned-task-detection.md` | 新規（Stage 3 持越しは既存 Stage 3 spec が所有） |

---

## 2. Implementation Guide Part 1（中学生レベル概念）

| セクション | 内容（要約） |
|-----------|------------|
| なぜテストを書くか | 「ボタンを押したら正しく動く」を毎回手で確認しなくても、ロボット（Playwright）が自動で代わりに確認してくれる |
| admin の仕事とは | 申請を承認したり、間違って 2 つ登録された会員を 1 つに統合したり、退会処理をする「管理人」 |
| 二段確認とは | 大事な操作（削除や公開停止）で「本当にやっていいか」を 2 回聞くしくみ。指が滑って消してしまう事故を防ぐ |
| 認可とは | 「あなたはこの部屋に入っていいか」を確かめること。会員はログイン部屋へ、未ログインは `/login` へ案内 |
| API モックとは | 本物の DB に触らず「もし API がこう答えたら」を仮定してテストする方法。早く・安全に試せる |
| Stage 2 で何を増やしたか | admin の 3 つの操作（承認 / 統合 / 削除）と、それぞれの「失敗したとき」も全部テストに入れた |

---

## 3. Implementation Guide Part 2（実装詳細）

### 3.1 ファイル一覧（4 件）

| path | 役割 |
|------|------|
| `apps/web/playwright/tests/admin-requests.spec.ts` | approve/reject + race + 認可 |
| `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | merge/dismiss + DB 整合 + 認可 |
| `apps/web/playwright/tests/admin-member-delete.spec.ts` | 二段確認 + delete + audit + 認可 |
| `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` | UI ↔ API shape 同型性（zod parse） |

### 3.2 mock pattern（要点）

| pattern | endpoint | 例 |
|---------|---------|-----|
| GET 一覧 | `/admin/requests*` | `mockAdminListGet(page, ..., fixture)` |
| POST mutation | `/admin/requests/*/resolve` | `mockMutation(page, ..., handler)` |
| race counter | 同上 | `withMutationCounter(page, ..., [200,409])` |

### 3.3 認可境界（3 ロール）

| role | API 応答 | UI 期待 |
|------|---------|--------|
| admin | 200 | admin UI 描画 |
| member | 403 | 403 page or `/profile` redirect |
| anonymous | 401 | `/login` redirect |

### 3.4 不変条件

- 新 fixture 追加禁止（`auth.ts` 拡張なし）
- `apps/web` から D1 直接アクセス禁止
- HEX 直書き禁止（OKLch tokens 経由）
- 既存 API endpoint surface のみ利用

### 3.5 cascade preview の扱い（重要）

`apps/web` 側 / `apps/api` 側ともに **cascade preview API は未実装**。Stage 2 では当該 test を `test.skip` で残し、Stage 3 へ持越す。

---

## 4. Task 1〜5 全完了の表明

| Task | 状態 |
|------|------|
| Task 1: 2a `admin-requests.spec.ts` | spec 完了（Phase 4-10） |
| Task 2: 2b `admin-identity-conflicts.spec.ts` | spec 完了 |
| Task 3: 2c `admin-member-delete.spec.ts` | spec 完了（2c-2 のみ skip + 持越し） |
| Task 4: 2d contract test | spec 完了 |
| Task 5: implementation guide | この phase-12 で完了 |

---

## 5. Stage 3 連携事項（既存 Stage 3 spec が所有）

| # | 内容 | 起点 phase |
|---|------|-----------|
| 1 | cascade preview API 実装 + spec 2c-2 有効化 | Phase 4 §1 Q5 | `docs/30-workflows/e2e-quality-uplift-stage-3/` が後続 evidence / gate を所有 |
| 2 | line cov 70% gate の実測取得 | Phase 7 §2 | Stage 3 Phase 11 の `outputs/phase-11/coverage-summary.json` が正本 evidence |
| 3 | `DeleteBodyZ` shared 移管 | Phase 4 §1 Q6 | Stage 2 では named export で contract test を unblock。shared 昇格は任意改善であり未タスク新規作成なし |

> `outputs/phase-12/未タスク.md` は作成しない。Phase 12 strict 7 の正規成果物 `unassigned-task-detection.md` が「新規未タスク 0 件」と、Stage 3 既存 spec への所有権委譲を記録する。

---

## 6. index.md Phase status table 更新

| Phase | 状態 |
|-------|------|
| 1-3 | done（既存） |
| 4-13 | done（本タスクで埋める） |

---

## 7. Phase 12 完了定義

- [x] Part 1（中学生レベル概念説明）含む
- [x] Part 2（実装詳細）含む
- [x] Task 1-5 全完了表明
- [x] Stage 3 連携事項を `unassigned-task-detection.md` に記録
- [x] index.md Phase 4-13 を done に更新

> Phase 13 へ進める。

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-2
- phase: 12
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
