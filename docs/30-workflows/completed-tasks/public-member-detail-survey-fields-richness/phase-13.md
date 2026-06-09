# Phase 13: PR作成

> **本 phase-13.md は実行仕様の記述のみ。commit / push / PR はユーザーの明示承認後にのみ実行する（CONST_002 / CONST_006）。** 今回サイクルでは local 実装と検証まで完了し、PR 作成は user-gated pending。

---

## 0. 前提（user-gated）

| 項目 | 値 |
| ---- | -- |
| 実行タイミング | user が「PR作成」等を明示承認した後のみ |
| base ブランチ | `dev` |
| 作業ブランチ | `docs/public-member-detail-survey-fields-spec` |
| 今回サイクルでの commit/push/PR | **実行しない**（ユーザー指示なしのため） |

---

## 1. PR 前の品質ゲート（PR の前提条件）

PR 作成前に以下 4 コマンドを通過していること（実装サイクルで実行）:

```bash
pnpm install --force
pnpm typecheck
pnpm lint
bash scripts/verify-pr-ready.sh
```

加えて本タスク固有の確認:

- `verify-design-tokens` green（HEX 直書き 0 / `bg-[#xxx]` 0）。
- targeted test green（Lane A: adapter + public components / Lane B: build-seed-sql）。
- `apps/api/src/routes/` / D1 migration / Google Form schema に変更が無いこと（AC-10 / 不変条件）。

> ゲート失敗時は最大 3 回まで自動修復し、修復差分をコミットしてから PR。失敗パターンは `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` を参照。

---

## 2. PR タイトル / 本文骨子

### タイトル（案）

```
feat(web): 公開メンバー詳細を proto 準拠5セクション化 + test-accounts seed 全項目化
```

### 本文骨子

#### 変更要約

- 公開メンバー詳細 `/(public)/members/[id]` を proto 正本（`pages-public.jsx` / `09e-screen-blueprints-public.md` §3）の **Hero / BUSINESS OVERVIEW / TAGS+SNS / PERSONAL / MESSAGE** 5 セクション構成へ作り直し（Lane A: adapter 再構成 + 新規 component 3 + ProfileHero/MemberDetail 編集）。
- `test-accounts` seed を visibility=public 全項目へ拡充し、`TEST-MEM-01` で全セクションが埋まるようにした（Lane B）。
- **API endpoint / D1 schema / Google Form schema は不変**。web 層の表現責務と確認用 seed のみ変更。

#### AC 対応

| AC | 対応 |
| -- | ---- |
| AC-1 | ProfileHero に hometown chip / eyebrow / Avatar xl |
| AC-2 | BusinessOverviewSection（businessOverview / skills / canProvide） |
| AC-3 | TAGS + SNS/WEB（MemberTags + MemberLinks 隣接カード） |
| AC-4 | PersonalSection（KVList 4 行） |
| AC-5 | MessageCard（accent-soft / serif・空時非表示） |
| AC-6 | MemberDetail の proto 表示順 |
| AC-7 | other-fallback で未割当 public field 取りこぼし防止 |
| AC-8 | adapter visibility 二重防御（member/admin 非公開） |
| AC-9 | TEST-MEM-01 seed 全項目化 |
| AC-10 | endpoint/D1/Form 不変・HEX 0・トークン正本 |

#### スクリーンショット参照

- `outputs/phase-11/screenshots/member-detail-full.png` — 全セクション埋まった TEST-MEM-01
- `outputs/phase-11/screenshots/member-detail-sparse.png` — 項目が少ないメンバー
- `outputs/phase-11/screenshots/member-detail-message-hidden.png` — selfIntroduction 無

> 画像が `outputs/phase-11/screenshots/` に実在する場合のみ参照を含める。spec 段階で空なら本セクションは省略する（skill: 画像が無いときスクリーンショット専用セクションを残さない）。

#### 不変条件遵守

- API endpoint surface 不変 / D1 直アクセス無（`apps/web`）/ OKLch トークン正本・HEX 0 / 新規 primitive 無 / visibility 二重防御 / stableKey 定数経由。

---

## 3. PR 作成コマンド（user 承認後・実装サイクル）

```bash
# user 承認後にのみ実行
gh pr create --base dev --head docs/public-member-detail-survey-fields-spec \
  --title "feat(web): 公開メンバー詳細を proto 準拠5セクション化 + test-accounts seed 全項目化" \
  --body-file <PR本文>
```

- `dev` を作業ブランチへ取り込んでから作成（origin/dev に fast-forward 同期 → 作業ブランチで merge → conflict は CLAUDE.md 既定方針で解消）。
- `git diff dev...HEAD --name-only` で PR に入るファイル一覧を漏れなし確認。

---

## 4. 実行抑止の明記

- 今回サイクルでは **commit / push / PR / seed の staging apply を一切実行しない**。
- workflow ステータスは `implemented_local_visual_present_staging_pending`。Phase 13 は `user_gated_pending`。
- PR 完了後は PR URL / 採用ブランチ / 実行した自動修復 / 解消した conflict / 残課題を 1 回だけ報告する。
