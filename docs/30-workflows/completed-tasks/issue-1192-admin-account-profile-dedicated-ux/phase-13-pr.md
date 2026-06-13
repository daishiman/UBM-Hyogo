---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 13
phase_name: commit-pr-release
task_id: issue-1192-admin-account-profile-dedicated-ux
---

# Phase 13: commit / push / PR 作成

> ⚠️ **本 Phase はユーザーの明示承認後のみ実施する（user-gated・CONST_002）。** commit / push / PR 作成は本仕様書作成タスクでは**一切実行しない**。実装が landed し、ユーザーが「PR 作成」と明示した時のみ、下記手順で実施する。

---

## メタ情報

| キー | 値 |
|------|----|
| task_id | `issue-1192-admin-account-profile-dedicated-ux` |
| 元 Issue | #1192（**CLOSED のまま維持**・PR からの再オープン・close キーワード参照は行わない） |
| PR base ブランチ | **`dev`**（CLAUDE.md「PR作成の完全自律フロー」準拠。`main` への PR は production リリース時の `dev → main` のみ） |
| 作業ブランチ | `docs/issue-1192-admin-account-profile-ux-spec`（実装時は実装内容に応じ `feat/...` を別途作成しうる） |
| workflow_state | `implemented_local_evidence_captured`（PR は user-gated・未作成） |

---

## 目的

ユーザーの明示承認後にのみ実施する commit / push / PR 作成の手順・PR 前チェックリスト・PR 本文構成を確定する。

## G 系 multi-stage approval（CONST_002）

commit → push → PR 作成は**それぞれ独立の承認単位**とする。1 回の「承認」で 3 操作を連鎖実行しない。

| Gate | 操作 | 承認条件 |
|------|------|---------|
| G-1 | `git add` + `git commit` | ユーザーが commit を明示承認 |
| G-2 | `git push` | G-1 完了後、ユーザーが push を明示承認 |
| G-3 | `gh pr create --base dev` | G-2 完了後、ユーザーが PR 作成を明示承認 |

> ユーザーが「PR 作成」「diff-to-pr」と包括的に依頼した場合は、CLAUDE.md「PR作成の完全自律フロー」を適用し、同フローの手順（dev 同期 → 品質検証 → PR 作成）で完遂してよい。その場合も本仕様書作成タスク内では実行しない。

## PR 前チェック（実装完了後・PR 実施前）

| チェック | 確認方法 | 期待 |
|---------|---------|------|
| typecheck | `mise exec -- pnpm typecheck` | GREEN |
| lint | `mise exec -- pnpm lint` | GREEN |
| focused Vitest | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/app/(member)/profile/page.spec.tsx apps/web/app/(member)/profile/_components/__tests__/AdminAccessNotice.component.spec.tsx` | GREEN（T-C1〜T-C3 / T-P1〜T-P3 + 既存 degrade guard 全件） |
| トークン検証 | `mise exec -- pnpm verify:tokens` | PASS（HEX 直書き 0・AC-7） |
| apps/api / packages 差分 0 | `git diff --name-only -- apps/api packages` | 出力なし（AC-8） |
| PR 対象ファイル一覧 | `git diff dev...HEAD --name-only` | 漏れなし確認の正本（変更 4 ファイル + docs） |
| Phase 11 screenshot 参照 | `outputs/phase-11/screenshots/*.png` の存在 | **取得済みの場合のみ** PR 本文に視覚証跡参照を含める。未取得（現状 `.gitkeep` のみ）の場合はスクリーンショット専用セクションを作らない |
| 未コミット 0 | `git status --porcelain` | 空 |

---

## PR 本文の作成

- `outputs/phase-12/implementation-guide.md`（Part 1 概念 + Part 2 技術契約）の内容を漏れなく反映する。
- `.claude/commands/ai/diff-to-pr.md` を Phase 13 仕様として扱う（CLAUDE.md「PR作成の完全自律フロー」参照）。
- 要点として以下を記載する:
  - Issue #1192 は **CLOSED のまま維持**し、本 PR は CLOSED Issue の current-code 再スコープ実装である旨（`Closes #1192` 等の close キーワードは使わない）。
  - 分岐 (b) 確定根拠: `resolveSession` が member identity 必須 → ログイン済み管理者は構造的に必ず member identity を持つ。
  - 変更 4 ファイルのみ・`apps/api` / `packages/` / D1 / Google Form / CSS トークン差分ゼロ（AC-8）。
  - AC-1〜AC-9 の充足状況。

### PR タイトル案

```
feat(web): /profile に管理者向け管理画面導線を追加（Issue #1192 再スコープ実装）
```

## PR 作成コマンド（user-gated・G-3）

```bash
# ユーザー明示承認後のみ実行
gh pr create --base dev --title "feat(web): /profile に管理者向け管理画面導線を追加（Issue #1192 再スコープ実装）" --body-file <implementation-guide ベースの PR 本文>
```

---

## 本 Phase で実行しないこと（user-gated の不変条件）

- `git add` / `git commit` / `git push` を**実行しない**。
- `gh pr create` を**実行しない**。
- Issue #1192 の再オープン・コメント追加を**しない**（CLOSED のまま維持）。
- staging デプロイ・staging screenshot 取得を**実行しない**（全て user-gated）。

> 本実装サイクルではコード実装と local verification まで完了する。commit・push・PR・staging 認証 screenshot は全てユーザー明示承認後の別フェーズで行う。

---

## 実行タスク（ユーザー承認後に実施）

1. PR 前チェック（typecheck / lint / focused Vitest / verify:tokens / apps/api・packages 差分 0）を全て GREEN にする。
2. G-1: commit 承認を得て `git commit` する。
3. G-2: push 承認を得て `git push` する。
4. G-3: PR 作成承認を得て、`git diff dev...HEAD --name-only` で対象を確定し、implementation-guide.md を正本に PR 本文を作成して `gh pr create --base dev` で作成する。
5. PR URL・採用ブランチ・実行した自動修復・解消したコンフリクト・残課題を 1 回だけ報告する。

---

## 参照資料

| 種別 | Path | 用途 |
|------|------|------|
| PR フロー正本 | `CLAUDE.md` §PR作成の完全自律フロー | base=dev・検証順序・コンフリクト方針 |
| diff-to-pr 仕様 | `.claude/commands/ai/diff-to-pr.md` | PR 本文構成 |
| PR 本文の正本 | `outputs/phase-12/implementation-guide.md` | 反映元 |
| 視覚証跡 | `outputs/phase-11/screenshots/` | PR スクリーンショット参照（取得済みの場合のみ） |

---

## 成果物

- `phase-13-pr.md`（PR base=`dev` / PR タイトル案 / PR 前チェックリスト / G 系 multi-stage approval / user-gated 明記）

## 完了条件

- [x] ユーザー明示承認後のみ実施すること（CONST_002）が最上部に明記されている。
- [x] commit → push → PR が独立承認（G-1/G-2/G-3）として定義されている。
- [x] PR base = `dev`、PR タイトル案、PR 前チェックが定義されている。
- [x] スクリーンショットは取得済みの場合のみ PR 本文に含めることが明記されている。
- [x] Issue #1192 を CLOSED のまま維持する（close キーワード不使用）ことが明記されている。
