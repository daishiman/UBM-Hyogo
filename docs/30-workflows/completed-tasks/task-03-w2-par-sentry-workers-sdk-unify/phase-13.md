# Phase 13: PR 作成

## 目的

本 task の成果を PR として提出する。spec PR と implementation PR の境界、本 workflow 内では **spec 仕様書のみを commit** する原則、PR 本文テンプレ、push 前同期チェックを確定する。

## G1 / G2 ゲート

| ゲート | 内容 | 本 workflow での扱い |
| --- | --- | --- |
| **G1: spec PR** | 本 task の `docs/30-workflows/task-03-w2-par-sentry-workers-sdk-unify/**` を commit する PR | 本 workflow の今回ゴール。**ユーザー承認後に作成**する |
| **G2: implementation PR** | F-01〜F-12 の実装変更（apps/web 配下）を commit する PR | 本 workflow の **次回 wave** で作成。本 PR には含めない |

> CLAUDE.md「PR 作成の完全自律フロー」は通常タスクの自律 PR フロー定義だが、**本 task は implemented-local 段階でも commit/PR はユーザー承認まで禁止** とする。

## commit / PR 承認ゲート

1. **本 workflow 内での Claude Code の動作**:
   - Phase 13 までの仕様書（index.md / artifacts.json / phase-01.md〜phase-13.md）を作成して停止
   - **commit は実行しない**（ユーザー指示があるまで）
   - **PR 作成は実行しない**（ユーザー指示があるまで）
2. ユーザーが「commit して」と指示したら、本仕様書ディレクトリのみを `git add docs/30-workflows/task-03-w2-par-sentry-workers-sdk-unify/` で staged し、commit する
3. ユーザーが「PR 出して」と指示したら、本 PR テンプレに従い PR を作成

## push 前同期チェック

```bash
# main / dev の遅れチェック
mise exec -- pnpm sync:check

# 期待: 現在ブランチが origin/main から大きく遅れていないこと
```

CLAUDE.md「リモート同期チェック」より、`git fetch` 後の手動チェックが正規経路。

## branch / scope 確認

```bash
# 現在ブランチ確認
git rev-parse --abbrev-ref HEAD
# 期待: feat/task-03-... 等の feature ブランチ

# diff scope 確認
git diff --name-only main...HEAD | sort -u
# 期待: docs/30-workflows/task-03-w2-par-sentry-workers-sdk-unify/** のみ
```

範囲外混入時は、対象 path の差分を読み、ユーザー変更の可能性がある場合は停止して確認する。復旧が必要な場合も、ユーザー承認後に patch / stash / 別 branch で退避してから戻す。

## commit メッセージテンプレ

```
docs(task-03): add spec for sentry-workers-sdk-unify (W2 par)

Sentry SDK を @sentry/cloudflare（server/edge）と @sentry/nextjs（browser）に
分離する task-03 仕様書一式（Phase 1-13 + index + artifacts.json）。
本 commit は user approval 後に、実装変更とドキュメント同期を含める。

- runtime 別 entry 分離設計（instrumentation.ts / instrumentation-client.ts）
- captureException / captureMessage / register シグネチャ凍結
- 二重 init ガード（__ubmSentryInitialized__）設計
- DSN 注入経路（Cloudflare Secrets + [vars]）
- AC-1〜AC-9 と Phase 11 evidence の 1:1 対応

Refs: docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-03-w2-par-sentry-workers-sdk-unify.md
Depends-on: task-01 (gate), task-02 (env injection)
Depended-by: task-04 (logger), task-05 (error boundary)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

## PR 本文テンプレ

````markdown
## Summary
- task-03（Sentry Workers SDK 統一）の Phase 1-13 仕様書を新規追加
- 実装とドキュメント同期を本 PR に含める
- 親 workflow: ui-prototype-alignment-mvp-recovery / W2 / task-02 と並列

## scope
- 新規: `docs/30-workflows/task-03-w2-par-sentry-workers-sdk-unify/{index.md, artifacts.json, phase-01..13.md}`
- 変更: なし
- 削除: なし

## 凍結契約（下流 task-04 / task-05 への通知）
- `captureException(err, ctx?): Promise<string | undefined>`
- `captureMessage(msg, ctx?): Promise<string | undefined>`
- `register(): Promise<void>`
- `__ubmSentryInitialized__` ガード変数（globalThis / window 共通名）

## AC（implemented-local 段階）
- AC-1〜AC-9 が phase-11 evidence と 1:1 対応
- 不変条件 #1〜#8 trace 完了
- artifacts.json metadata: taskType=implementation / visualEvidence=NON_VISUAL / workflow_state=implemented-local

## 次の wave（本 PR 後）
- 実装 PR: F-01〜F-12（instrumentation.ts / instrumentation-client.ts / capture.ts / tests / 旧 config 削除 / next.config.ts 最小修正）
- staging deploy + Sentry dashboard event 受信確認
- task-04 / task-05 への結線

## 検証
- [x] index.md と artifacts.json の整合性
- [x] phase-01..13.md が必須見出しを備える
- [x] 元タスク §0.7 凍結シグネチャを phase-03 に転載
- [x] CLAUDE.md `scripts/cf.sh` 経由ポリシー記述
- [x] solo-dev branch protection 整合

## Test plan
- [ ] reviewer が phase-03 の凍結シグネチャを確認
- [ ] reviewer が phase-11 AC × evidence マトリクスを確認
- [ ] 後続実装 PR で AC-1〜AC-9 が PASS

🤖 Generated with [Claude Code](https://claude.com/claude-code)
````

## 実 PR 作成コマンド（ユーザー承認後）

```bash
# branch push（初回のみ -u）
git push -u origin <feature-branch>

# PR 作成
gh pr create --title "docs(task-03): add spec for sentry-workers-sdk-unify" --body "$(cat <<'EOF'
## Summary
... (上記テンプレを貼り付け)
EOF
)"
```

## solo-dev branch protection 整合確認

```bash
# CLAUDE.md UT-GOV-001 適用時
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  | grep -E '"required_pull_request_reviews"|"lock_branch"|"enforce_admins"'
# 期待: required_pull_request_reviews=null / lock_branch=false / enforce_admins=true
```

レビュアー必須なし、CI gate と線形履歴のみで保護。

## 実行タスク（チェックリスト）

- [ ] 仕様書 16 ファイル（index.md + artifacts.json + phase-01〜13.md）が存在することを `ls` で確認
- [ ] `pnpm sync:check` で main / dev 同期確認
- [ ] `git diff --name-only main...HEAD` で本 task ディレクトリのみであることを確認
- [ ] commit メッセージテンプレに沿って commit（**ユーザー承認後**）
- [ ] PR 本文テンプレに沿って PR 作成（**ユーザー承認後**）
- [ ] PR URL を最終レポートに記載

## 入力 / 出力

| 種別 | 内容 |
| --- | --- |
| 入力 | 全 Phase 仕様書、CLAUDE.md PR 作成フロー、SCOPE.md §6 |
| 出力 | commit / PR テンプレ、push 前チェックリスト、G1/G2 境界定義 |

## 参照資料

- `CLAUDE.md`「PR作成の完全自律フロー」「solo 運用ポリシー」
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` §6

## 成果物

- 本 phase-13.md（PR テンプレ + 承認ゲート）
- `outputs/phase-13/local-check-result.md` / `pr-template.md` / `pr-info.md` / `pr-creation-result.md`

## 完了条件（DoD）

- [ ] G1（spec PR）/ G2（implementation PR）境界が明文化
- [ ] commit / PR テンプレが Co-Authored-By 含めて記述
- [ ] push 前同期チェック手順が記述
- [ ] solo-dev branch protection 整合確認手順が記述
- [ ] **本 workflow 内では spec 仕様書のみ commit / PR**（ユーザー承認後）の原則が明記

## 統合テスト連携

- Phase 13 は commit / PR 実行ではなく、`outputs/phase-13/local-check-result.md` に local validation 結果、`pr-template.md` に提出文面、`pr-info.md` に未作成状態、`pr-creation-result.md` に user approval pending を記録する。
- 実装 PR のテスト結果は次 wave の Phase 11 evidence として扱い、本 spec PR の成功証跡に混ぜない。

## メタ情報

- workflow: task-03-w2-par-sentry-workers-sdk-unify
- phase: 13
- status: `implemented-local / completed`
- taskType: `implementation`
- visualEvidence: `NON_VISUAL`
