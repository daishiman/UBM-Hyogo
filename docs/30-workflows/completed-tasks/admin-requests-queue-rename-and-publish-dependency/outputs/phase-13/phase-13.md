`[実装区分: 実装仕様書]`

# Phase 13 — commit / PR / release 計画（user-gated）

`taskType: implementation` / `visualEvidence: VISUAL` / `workflow_state: implemented_local_evidence_captured` / status: **pending（user-gated）**

> 正本は [_shared-context.md](../../_shared-context.md)。本 Phase は **ユーザー承認後にのみ実行**する。本サイクル（implemented_local_evidence_captured）では commit / push / PR / staging seed apply を一切行わない。Lane A/B/C のローカル実装、focused tests、typecheck、lint、token gate は PASS 済みであり、ユーザー承認後は staging runtime evidence と PR close-out のみを実行する。

---

## 13.1 実行条件

### ローカルで完了済み

- [x] Lane A/B/C の実装が完了している（[implementation-guide.md](../phase-12/implementation-guide.md) のファイル一覧）
- [x] focused test 全 PASS（API 86/549、shared 21/257、web 238 files / 1752 tests）
- [x] `typecheck`（api / web / shared）PASS
- [x] `lint` PASS
- [x] HEX 0 件（admin UI touched surfaces）
- [x] seed drift guard PASS（再生成 `test-accounts-seed.sql` が committed と byte 一致）

### ユーザー承認後に実行

- [ ] Phase 11 inventory の authenticated runtime screenshot 3 件を取得し Status を `present` へ更新
- [ ] staging seed apply を実行し、staging で AC-8 を確認
- [ ] **ユーザーが Phase 13 実行を承認**（`outputs/phase-13/user-approval-<timestamp>.md`）

---

## 13.2 ブランチ / base

| 項目 | 値 |
| --- | --- |
| base ブランチ | `dev`（既定の PR base） |
| 作業ブランチ | `feat/admin-requests-queue-rename-and-publish-dependency` |
| Issue | なし（`relatedIssue=null`・PR 本文に `Closes`/`Refs` は付けない） |

---

## 13.3 commit / push / PR 手順（user-gated）

```bash
# 1. dev 同期
git fetch origin dev
# 2. 作業ブランチで dev をマージ（コンフリクトは CLAUDE.md 既定方針で解消）
git merge dev
# 3. 実装差分 + workflow docs を全件ステージ
git add -A
git commit -m "feat(admin): 依頼キューを「会員からの申請」へ平易化 + 会員管理に申請中バッジ/相互リンク + テスト依頼 seed"
# 4. 品質検証（PR 作成前）
pnpm install --force
pnpm typecheck
pnpm lint
bash scripts/verify-pr-ready.sh
# 5. push + PR
git push -u origin feat/admin-requests-queue-rename-and-publish-dependency
gh pr create --base dev
```

> staging seed apply は PR とは別の user-gated 操作: `bash scripts/seed-test-accounts.sh --env staging --action apply`（AC-8 の staging 確認用・production は拒否）。

---

## 13.4 PR 本文骨子（implementation-guide.md 反映）

### 概要
ステージング `/admin/requests`（依頼キュー）が「何のための画面か分からない・会員管理と冗長では」と疑問視された課題を解決。RCA で「会員本人発の申請承認フロー」と「管理者起点の即時トグル」は起点の異なる独立経路（機能は無罪・真因は apps/web の情報設計欠如 + 命名不親切）と確定し、機能を削除せず存続させたうえで表示層の改善 + 依存可視化 + テスト seed を 1 サイクルで実施。

### 変更内容（3 レーン）
- **Lane A（seed）**: 既存 TEST-MEM に pending 申請 3 件（TEST-NOTE-V01=公開停止申請 / V02=再公開申請 / D01=退会申請）を `catalog.ts` + `build-seed-sql.ts` で追加し committed seed/cleanup SQL を再生成。
- **Lane B（命名 + 役割明確化）**: 「依頼キュー」族 → 「会員からの申請 / 申請一覧 / 申請詳細」へ表示テキスト + aria-label のみ変更。会員本人発の承認と管理者起点の即時トグルの違いを説明 + 会員管理への相互リンク追加。ルート / API パス / ファイル名 / id / data-* / セレクタは不変。
- **Lane C（申請中バッジ + API）**: `GET /members` に相関サブクエリで `pendingRequestTypes` を projection 追加、`AdminMemberListViewZ` 拡張、会員一覧行に「申請中」バッジ + 該当タブ遷移リンク、会員管理ページに説明 + 相互リンク。

### AC / DoD
AC-1..13 充足（[implementation-guide.md §6](../phase-12/implementation-guide.md)）。typecheck / lint / focused test PASS、HEX 0 件、seed drift guard PASS。

### スコープ外（baseline）
`GET .../members/TEST-MEM-01 500` 修正・承認 before→after diff 表示は Q4 非選択のため本 PR 対象外（別 Issue 化は user-gated）。

### スクリーンショット
Phase 11 inventory の authenticated runtime screenshot（desktop / mobile / 申請中バッジ）を user-gated で取得後に参照を追加。implemented_local_evidence_captured の時点では未取得。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

---

## 13.5 user-gated 境界（再掲）

- commit / push / PR / staging seed apply / authenticated runtime screenshot は **本サイクルでは実行しない**。
- すべてユーザー承認後にのみ実施し、承認は `outputs/phase-13/user-approval-<timestamp>.md` に記録する。
- 本サイクルは apps/ packages/ specs / skills のローカル改善と検証まで完了し、外部 mutation と governance 操作だけを残して締める。
