---
spec_classification: implementation_spec
state: spec_created
phase: 13
phase_name: PR作成
task_id: public-member-common-ui-card-unification
---

# Phase 13: PR 作成

> ⚠️ **本 Phase はユーザーの明示承認後のみ実施する（user-gated）。** commit / push / PR 作成は本仕様書作成タスクでは**一切実行しない**。実装が landed し、ユーザーが「PR 作成」と明示した時のみ、下記手順で実施する。

---

## メタ情報

| キー | 値 |
|------|----|
| task_id | `public-member-common-ui-card-unification` |
| PR base ブランチ | **`dev`**（CLAUDE.md PR フロー準拠。`main` への PR は production リリース時の `dev → main` のみ） |
| 作業ブランチ | `docs/public-member-common-ui-card-unification-spec`（実装時は実装内容に応じ `feat/...` を別途作成しうる） |
| workflow_state | `spec_created`（PR は user-gated・未作成） |

---


## 目的

user の明示承認後にのみ実施する PR 作成手順と PR 前チェックリストを確定する。

## PR 前チェック（実装完了後・PR 実施前）

| チェック | 確認方法 | 期待 |
|---------|---------|------|
| typecheck | `mise exec -- pnpm typecheck` | GREEN |
| lint（verify:no-inline-style / boundaries 含む） | `mise exec -- pnpm lint` | GREEN |
| トークン検証 | `mise exec -- pnpm verify:tokens` | PASS（HEX 直書き 0） |
| apps/web vitest | `mise exec -- pnpm --filter @ubm/web test` | GREEN（新プリミティブ spec 含む） |
| build | `mise exec -- pnpm build` | GREEN（OpenNext Workers 互換 webpack build） |
| apps/api 変更 0 | `git diff dev...HEAD --name-only -- apps/api` | 出力なし（AC-9） |
| PR 対象ファイル一覧 | `git diff dev...HEAD --name-only` | 漏れなし確認の正本 |
| Phase 11 screenshot 参照 | `outputs/phase-11/screenshots/*.png` の存在 | PR 本文にカード化・ボタン統一・背景統一の視覚証跡を参照（取得済みの場合） |
| 未コミット 0 | `git status --porcelain` | 空 |

---

## PR 本文の作成

- `outputs/phase-12/implementation-guide.md`（Part 1 概念 ＋ Part 2 技術）の内容を漏れなく反映する。
- `.claude/commands/ai/diff-to-pr.md` を Phase 13 仕様として扱う。
- `outputs/phase-11/screenshots/` に画像がある場合は PR 本文にスクリーンショット参照を含める。画像がない場合はスクリーンショット専用セクションを作らない。
- カード化マッピング表の trace（全情報のカード化＝AC-4）・ボタン統一（AC-3）・背景集約（AC-5）・機械可読 ID 保全（AC-7）・apps/api 非接触（AC-9）を要点として記載する。

## PR 作成コマンド（user-gated）

```bash
# ユーザー明示承認後のみ実行
gh pr create --base dev --title "feat(web): 公開・会員8画面を共通レイアウト層へ載せ替え（カード化／ボタン統一／背景統一）" --body-file <implementation-guide ベースの PR 本文>
```

---

## 本 Phase で実行しないこと（spec_created の不変条件）

- `git add` / `git commit` / `git push` を**実行しない**。
- `gh pr create` を**実行しない**。
- staging デプロイ・staging screenshot baseline を**実行しない**（全て user-gated）。

> 本仕様書作成タスクの成果物は **docs/メタファイルのみ**。コード実装・commit・PR は全てユーザー明示承認後の別フェーズで行う。

---

## 実行タスク（ユーザー承認後に実施）

1. PR 前チェック（typecheck / lint / verify:tokens / vitest / build / apps/api 0 件）を全て GREEN にする。
2. `git diff dev...HEAD --name-only` で PR 対象ファイルを確定する。
3. implementation-guide.md を正本に PR 本文を作成し、`gh pr create --base dev` で作成する。
4. PR URL・採用ブランチ・実行した自動修復・解消したコンフリクト・残課題を1回だけ報告する。

---

## 参照資料

| 種別 | Path | 用途 |
|------|------|------|
| PR フロー正本 | `CLAUDE.md` §PR作成の完全自律フロー | base=dev・検証順序 |
| diff-to-pr 仕様 | `.claude/commands/ai/diff-to-pr.md` | PR 本文構成 |
| PR 本文の正本 | `outputs/phase-12/implementation-guide.md` | 反映元 |
| 視覚証跡 | `outputs/phase-11/screenshots/` | PR スクリーンショット参照 |

---


## 成果物

- `phase-13-pr.md`（PR base=`dev` / PR 前チェックリスト / user-gated 明記 / commit・push は本タスク非実行）

## 完了条件

- [ ] ユーザー明示承認後のみ実施することが最上部に明記されている。
- [ ] PR base = `dev`、PR 前チェック（5検証 + apps/api 0 + screenshot 参照）が定義されている。
- [ ] commit / push / PR を本仕様書作成タスクでは実行しないことが明記されている。
