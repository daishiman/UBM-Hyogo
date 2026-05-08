> 関連 source: docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-04-w3-par-window-guard-and-logger.md
> 実装区分: 実装仕様書

# Phase 13: commit / PR 作成 / G1-G4 承認ゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-04-w3-window-guard-and-logger |
| Wave | W3 |
| 実行種別 | NON_VISUAL |
| Phase 番号 | 13 / 13 |
| 上流 Phase | 12（6 ドキュメント完了） |
| 下流 Phase | なし（task-05 / task-09..17 unblock） |
| 状態 | pending（**user 明示許可まで実コミット / push / PR 作成は禁止**） |
| CONST_005 準拠 | ○ |

## 目的

Phase 11 の PASS 5 evidence と Phase 12 の implementation-guide / changelog を入力に、CLAUDE.md「PR作成の完全自律フロー」§Phase 13 仕様および `.claude/commands/ai/diff-to-pr.md` に準拠した commit 系列と PR 本文を**準備**する。本 phase 内では実 commit / push / PR 作成は **行わない**（ユーザー明示許可待ち）。

## ⚠️ Approval Gate

CLAUDE.md「PR作成の完全自律フロー」は **ユーザーが明示的に「PR 作成」「PR 出して」「diff-to-pr」相当を依頼した場合**に発動する。本 phase の仕様書記述自体は単なる手順整備であり、**user 承認なしに `git commit` / `git push` / `gh pr create` を実行しない**。

## diff scope 規律

`SCOPE.md §6 / CLAUDE.md「diff scope 規律」` を遵守。`git diff --name-only dev...HEAD` の出力を以下の許容範囲に厳格に絞る:

### 許容範囲

| カテゴリ | パス |
|----------|------|
| 本 task package（仕様書 / 証跡） | `docs/30-workflows/task-04-w3-window-guard-and-logger/**` |
| logger / SSR ガード本体 | `apps/web/src/lib/is-browser.ts` |
| 同上 | `apps/web/src/lib/logger.ts` |
| logger テスト | `apps/web/src/lib/__tests__/is-browser.test.ts` |
| 同上 | `apps/web/src/lib/__tests__/logger.test.ts` |
| ESLint rule | `apps/web/eslint.config.mjs` |
| 既存 `window` 参照修正（最小） | task-04 §6 grep で検出された箇所のうち、画面 task に委譲しない部分 |
| 元仕様の status 反映（任意） | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-04-w3-par-window-guard-and-logger.md`（DoD チェック更新のみ） |

### 禁止範囲（混入時 `git checkout HEAD -- <path>` で復旧）

- `apps/api/**`（本 task は web ランタイム閉鎖）
- `docs/00-getting-started-manual/specs/**` の構造変更（参照差し込みのみ可）
- 他 task package（task-02 / 03 / 05 / 09..17 dir）

### 確認コマンド

```bash
git fetch origin dev
git diff --name-only origin/dev...HEAD | tee outputs/phase-13/diff-scope.log
# 上記 log を §許容範囲 と突き合わせ、範囲外を 0 件にしてから commit
```

## commit メッセージ案（feat / chore / test 分割）

CLAUDE.md「commit を新規作成（amend 禁止）」を遵守。以下 3 commit に分割推奨（PR 内で論理単位を分けるため）。

### commit 1: feat — 本体追加

```
feat(web/lib): add isBrowser guard and structured logger

- apps/web/src/lib/is-browser.ts: typeof window !== 'undefined' の集約
- apps/web/src/lib/logger.ts: JSON 一行 + Sentry capture の薄ラッパ
- error / warn は task-03 の captureException / captureMessage を呼ぶ
- runtime tag (browser / workers / nodejs) を payload に付与

Refs: docs/30-workflows/task-04-w3-window-guard-and-logger/phase-12.md
```

### commit 2: chore — ESLint rule + 既存 window 参照修正

```
chore(web): enforce no-restricted-globals for window/document

- eslint.config.mjs: window / document の素手参照を禁止
- overrides で instrumentation-client.ts / lib/sentry/** は除外
- 既存 SSR-unsafe な window 参照を isBrowser() でラップ（最小修正）

Refs: docs/30-workflows/task-04-w3-window-guard-and-logger/outputs/phase-12/unassigned-task-detection.md
```

### commit 3: test — 単体テスト

```
test(web/lib): add unit tests for is-browser and logger

- jsdom / node 双方の isBrowser() 判定
- logger.error が captureException を 1 回呼ぶ
- logger.warn が captureMessage を level: warning で呼ぶ
- child() が base fields をマージする
- Sentry hook throw でも logger は throw しない
```

各 commit には CLAUDE.md 既定のフッタを付与する:

```
Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

## PR 本文テンプレ

CLAUDE.md「PR作成の完全自律フロー」§実行順序 9 + `.claude/commands/ai/diff-to-pr.md`（Phase 13 仕様）に準拠。`outputs/phase-12/implementation-guide.md` の主要見出しを必ず反映。`outputs/phase-11/` に screenshot がない（NON_VISUAL）ため screenshot セクションは作らない。

```markdown
## Summary
- `apps/web/src/lib/is-browser.ts` で `typeof window !== 'undefined'` を 1 関数に集約
- `apps/web/src/lib/logger.ts` で JSON 一行 + Sentry capture の構造化 logger を新設
- `eslint.config.mjs` に `no-restricted-globals` で `window` / `document` 素手参照を禁止
- 既存 SSR-unsafe な `window.` 参照を `isBrowser()` ガードでラップ（grep 検出 0 件まで圧縮）

## Why
- task-04 (W3 / window-guard-and-logger): SSR / Workers ランタイムで `window` 参照が走り `ReferenceError` を起こすリスクを構造的に排除
- task-03 (Sentry SDK 統合) の `captureException` / `captureMessage` を logger に結線し、観測層を Sentry と接続
- task-05 (`app/error.tsx`) と task-11..17 (画面 task) の前提を確定

## Changes
- 新規: `apps/web/src/lib/is-browser.ts`, `apps/web/src/lib/logger.ts`
- 新規テスト: `apps/web/src/lib/__tests__/is-browser.test.ts`, `apps/web/src/lib/__tests__/logger.test.ts`
- 変更: `apps/web/eslint.config.mjs`（`no-restricted-globals`）
- 変更（最小）: 既存 `window` 直参照箇所の `isBrowser()` ラップ
- ドキュメント: `docs/30-workflows/task-04-w3-window-guard-and-logger/` 配下 phase-11/12/13 + outputs

## Invariants（CLAUDE.md / task-04 §0.5）
- D1 直接アクセス禁止 → logger payload に SQL / binding を含めない
- ランタイムシークレット → logger に DSN / AUTH_SECRET を流さない
- 平文 `.env` 禁止 → logger 出力先は `getEnv()` 経由
- 公開 API endpoint 不変 → `apps/api` への変更なし

## Evidence (Phase 11 / NON_VISUAL)
- typecheck: `outputs/phase-11/evidence/typecheck.log`
- lint: `outputs/phase-11/evidence/lint.log`
- test: `outputs/phase-11/evidence/test.log`
- build: `outputs/phase-11/evidence/build.log`
- grep-gate: `outputs/phase-11/evidence/grep-gate.log`（`is-browser.ts` / `instrumentation-client.ts` 以外で 0 件）

## Test plan
- [ ] CI: typecheck / lint / test / build / verify-design-tokens すべて green
- [ ] staging deploy 後、`logger.error` を発火し Sentry dashboard で event 受信を確認（G4）
- [ ] staging で SSR 警告 / `ReferenceError: window` 0 件を `wrangler tail` で確認

## Downstream Unblocked
- task-05 (`app/error.tsx` で logger 利用)
- task-11..17 (画面 task の `window` 参照書き換え)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## PR 設定

| 項目 | 値 |
|------|-----|
| base branch | `dev`（CLAUDE.md 既定 / MEMORY: 既定ブランチは dev） |
| head branch | 例: `feat/task-04-window-guard-and-logger`（自律命名可） |
| draft | false |
| reviewer | なし（solo 運用 / `required_pull_request_reviews=null`） |

```bash
gh pr create --base dev --head <feature-branch> \
  --title "feat(web): window guard集約 + 構造化logger (task-04)" \
  --body "$(cat outputs/phase-13/pr-template.md)"
```

## G1-G4 承認ゲート

本 task は runtime deploy / D1 apply 不要。G3 / G4 は CI gate + staging smoke のみ。

| Gate | 内容 | 判定根拠 |
|------|------|----------|
| **G1** | ローカル PASS 5 点 | Phase 11 evidence 5 ファイル全て exit 0 / grep-gate 0 件 |
| **G2** | PR 作成（base=dev） | `gh pr view` で URL / base 確認、PR 本文に implementation-guide 反映 |
| **G3** | CI gate green | typecheck / lint / test / build / verify-design-tokens / verify-indexes-up-to-date |
| **G4** | dev merge 後 staging Workers での runtime smoke | wrangler tail で JSON 一行 logger / Sentry event 受信確認 |

### G4 staging smoke 手順

```bash
# dev branch が staging Workers にデプロイされた後
mise exec -- pnpm --filter @ubm-hyogo/web exec wrangler tail \
  --config apps/web/wrangler.toml --env staging \
  > outputs/phase-13/staging-tail.log &

# staging URL に対し logger.error が走る経路を 1 回踏む（例: 一時的なテスト route）
# Sentry dashboard で event ID を採取し outputs/phase-13/g4-sentry.md に記録
```

evidence:
- `outputs/phase-13/staging-tail.log`
- `outputs/phase-13/g4-sentry.md`

## non-goal（本 phase 内）

- 実 `git commit` / `git push` / `gh pr create` の実行（**user 明示許可まで保留**）
- staging / production への deploy
- D1 migration apply（本 task 範囲外）

## 多角的チェック観点

- CLAUDE.md「Cloudflare 系 CLI 実行ルール」: `wrangler` 直接実行禁止 → `bash scripts/cf.sh` 経由を本 phase からも徹底
- CLAUDE.md「sync-merge 時の hook 挙動」: main 取り込み merge commit が含まれる場合、coverage-guard は自動スキップされる前提（`--no-verify` 不要）
- diff scope: `git diff --name-only origin/dev...HEAD` を必ず確認

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | diff-scope.log 生成・許容範囲確認 | pending |
| 2 | commit 3 本のメッセージ確定（feat / chore / test） | pending |
| 3 | PR template `outputs/phase-13/pr-template.md` 確定 | pending |
| 4 | **user 承認**（Approval Gate） | pending |
| 5 | `gh pr create --base dev` 実行 | blocked by 4 |
| 6 | G3 CI gate green 確認 | pending |
| 7 | G4 staging smoke 実施 | pending |
| 8 | outputs/phase-13/phase-13.md 集約 | pending |

## 成果物

| 種別 | パス |
| --- | --- |
| ドキュメント | outputs/phase-13/pr-template.md |
| evidence | outputs/phase-13/diff-scope.log |
| evidence（G4） | outputs/phase-13/staging-tail.log |
| evidence（G4） | outputs/phase-13/g4-sentry.md |
| サマリ | outputs/phase-13/phase-13.md |

## 完了条件 (DoD)

- [ ] diff-scope.log が許容範囲のみであること
- [ ] PR template が implementation-guide.md の主要見出しを反映
- [ ] PR base が `dev`
- [ ] G1（PASS 5 点）クリア
- [ ] G2（PR 作成）：user 承認後に実行され URL 記録
- [ ] G3（CI green）
- [ ] G4（staging smoke）：Sentry event 受信 + JSON 一行 logger 確認
- [ ] CONST_005 準拠

## 次 Phase

- なし（task-04 完了）
- 引き継ぎ: task-05（`app/error.tsx` で logger 利用）/ task-11..17（画面ごとの `window` 参照書き換え）

## 実行タスク

1. diff scope を確認する。
2. commit / push / PR はユーザー明示許可後のみ実行する。
3. G1〜G4 の gate 結果を PR 本文に反映する。

## 参照資料

| 種別 | パス |
| --- | --- |
| Phase 12 | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| CLAUDE | `CLAUDE.md` |
