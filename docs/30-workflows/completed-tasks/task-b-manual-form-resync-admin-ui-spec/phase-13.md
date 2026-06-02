# Phase 13 — PR作成（user 明示承認後のみ）

**[実装区分: 実装仕様書 / implementation_mode: verify_existing]**

> PR 作成は **user の明示承認後のみ**実施する。本タスクは `verify_existing`（landed in
> `745c95115` / #1064）であり、**主成果物は docs（Phase 1〜12 の仕様書一式）**。apps コードは
> dev に landed 済みで本ブランチ側の差分はゼロのため、PR は「Task B の正本記述 + 回帰確認の
> 仕様書」を dev へ取り込む docs 中心の PR となる。

---

## 1. 絶対原則

- **base ブランチ = `dev`**（`gh pr create --base dev`）。production リリース時のみ `--base main`。
- commit / push / PR 作成 / Secrets 投入（`SYNC_ADMIN_TOKEN`）/ staging・production deploy /
  runtime screenshot は **すべて user-gated**。本仕様書は手順定義であり、自動実行しない（CONST_002）。
- `.claude/commands/ai/diff-to-pr.md` を Phase 13 仕様として準拠する。

---

## 2. PR に含まれる差分の性質（事前確認）

| 区分 | 内容 |
|------|------|
| docs（主成果物） | `docs/30-workflows/completed-tasks/task-b-manual-form-resync-admin-ui-spec/` 配下の `index.md` / `phase-1..13.md` / `outputs/**` / `artifacts.json` |
| apps コード差分 | **ゼロ**（`745c95115` で dev に landed 済み・本ブランチで再変更しない） |
| skill 同期 | Phase 12 で更新した LOGS.md ×2 / topic-map / index 再生成物 |

> `git diff dev...HEAD --name-only` で PR に入るファイル一覧を取得し、apps 配下に意図しない差分が
> 無いことを確認する（landed 済みコードの再混入防止）。

---

## 3. 実行順序（user 承認後）

1. 現在ブランチ（`docs/task-b-manual-form-resync-admin-ui-spec`）と変更状況を確認する。
2. `git fetch origin dev` → ローカル `dev` を `origin/dev` に fast-forward 同期。
3. 作業ブランチに戻り `git merge dev`。コンフリクトは CLAUDE.md「コンフリクト解消の既定方針」に従い
   自律解消（docs は意味結合 + 重複行除去 / skill ログ系は `pnpm sync:resolve`）。
4. 品質検証（4 コマンド）:
   - `pnpm install --force`
   - `pnpm typecheck`
   - `pnpm lint`
   - `bash scripts/verify-pr-ready.sh`
   - 追加で本タスクの回帰: `mise exec -- pnpm vitest run apps/web/src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts`
5. 検証失敗時は最大 3 回まで自動修復しコミット。
6. `git status --porcelain` で未コミット差分を確認し `git add -A` で全件コミット。
7. `git diff dev...HEAD --name-only` で PR ファイル一覧を確定（漏れなし確認）。
8. `.claude/commands/ai/diff-to-pr.md` + `outputs/phase-12/implementation-guide.md` を参照して PR 本文を作成し
   `gh pr create --base dev` で作成。

---

## 4. PR 本文の必須反映

- `outputs/phase-12/implementation-guide.md` の主要見出し（Part1 / Part2 / 視覚証跡）を漏れなく反映する。
- **スクリーンショット**: `outputs/phase-11/` に実 png が存在する場合のみ参照を含める。本タスクは
  runtime screenshot が user-gated・pending のため、**png が無い場合はスクリーンショット専用セクションを作らない**。
  代替として「主証跡 = 自動テスト TC-B1..B8 / TC-S1..S7 全 pass」「VISUAL だが runtime screenshot user-gated」を明記する。
- landed 事実（`745c95115` / #1064・apps 差分ゼロ）を本文冒頭に記載する。

---

## 5. PR 作成前チェック

- `git status --porcelain` が空であること。
- `git diff dev...HEAD --name-only` が取得済みで apps 配下に意図しない差分が無いこと。
- `implementation-guide.md` の主要見出しが PR 本文へ反映されていること。
- `outputs/phase-11/` の画像数と PR 本文の画像参照が整合していること（png 0 件 → 画像セクションなし）。

---

## 6. 最終レポート（PR 作成完了後・1 回のみ）

PR URL / 採用ブランチ（base=dev）/ 実行した自動修復 / 解消したコンフリクト / 残課題（runtime screenshot ・
`SYNC_ADMIN_TOKEN` 投入が user-gated で pending である旨）を 1 回だけ報告する。

---

## 完了条件

- [x] PR 作成が user 明示承認後のみであることを明記した
- [x] base=dev / production 時のみ main を明記した
- [x] 主成果物が docs（仕様書）で apps コード差分がゼロ（landed 済み）であることを記述した
- [x] commit / push / PR / Secrets 投入 / deploy / screenshot がすべて user-gated であることを明記した
- [x] 実行順序（fetch / merge / 4 コマンド検証 + 回帰 / PR 作成）を定義した
- [x] PR 本文の必須反映（implementation-guide 見出し / screenshot 条件付き / landed 事実）を定義した
- [x] PR 作成前チェックと最終レポート項目を定義した
