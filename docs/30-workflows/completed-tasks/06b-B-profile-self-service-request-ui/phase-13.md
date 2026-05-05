# Phase 13: PR 作成 — 06b-B-profile-self-service-request-ui

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-B-profile-self-service-request-ui |
| phase | 13 / 13 |
| wave | 06b-fu |
| mode | parallel（実依存は serial） |
| 作成日 | 2026-05-02 |
| taskType | feature-spec / VISUAL_ON_EXECUTION |
| visualEvidence | VISUAL_ON_EXECUTION |
| user_approval_required | true |

## 目的

実装・実測完了後、ユーザー明示承認を経てから PR を作成する手順を定義する。本 Phase は仕様書作成タスク内では実行せず、実装フェーズで `/ai:diff-to-pr` を起動して完遂する。

## 適用前提

- Phase 1〜12 の仕様書が揃っており、実装側の Phase 5（実装ランブック）/ Phase 9（品質保証）/ Phase 11（実測 evidence）が PASS していること
- `outputs/phase-11/screenshots/` に request-panel / visibility-dialog / delete-dialog / duplicate-409-banner の実 PNG が存在すること
- `outputs/phase-12/implementation-guide.md` に Part 1 / Part 2 が記載済みであること

## 三役ゲート

| # | ゲート | 通過条件 | 実行タイミング |
| --- | --- | --- | --- |
| 1 | user 承認ゲート | `outputs/phase-13/change-summary.md` を提示し、user の明示文言で承認取得 | 必ず最初 |
| 2 | ローカル品質検証ゲート | `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `pnpm test` 全 PASS | ゲート 1 後 |
| 3 | push / PR 作成ゲート | commit → push → `gh pr create` | ゲート 2 後 |

> 仕様書作成タスク本体（本 worktree）では PR 作成を実行しない。実装 worktree で本仕様に沿って実行する。

## 実行手順

### 1. ローカル動作確認依頼【必須】

ユーザーに `/profile` をローカルで開き、以下を確認してもらう。

- 公開停止 / 再公開ボタンが表示されること
- 退会ボタンが表示されること
- 既に pending 申請がある場合、ボタンが disabled になり banner が表示されること
- 申請成功後 `RequestPendingBanner` が表示されること

### 2. 変更サマリー提示

`outputs/phase-13/change-summary.md` に以下を書き、ユーザーへ提示する。

- 追加ファイル / 変更ファイル一覧（Phase 12 implementation-guide と同期）
- 影響範囲（`/profile` のみ、API 既存）
- スクリーンショット参照（`outputs/phase-11/screenshots/*.png`）
- Phase 11 / 12 evidence path 一覧
- rollback 手順（revert 1 commit で原状復帰）

### 3. ローカル品質検証

```bash
pnpm install --force
pnpm typecheck
pnpm lint
pnpm test
```

結果は `outputs/phase-13/local-check-result.md` に記録。

### 4. ブランチ確認

| 項目 | 値 |
| --- | --- |
| ブランチ命名 | `feat/06b-B-profile-self-service-request-ui` |
| 派生元 | `dev`（最新を取り込み済み） |
| merge target | まず `dev`、staging 検証後に `dev → main` |

### 5. PR 作成（user 承認後のみ）

PR title:

```
feat(profile): add visibility & delete self-service request UI
```

PR body 構成（`.github/pull_request_template.md` 準拠 + Phase 12 implementation-guide 反映）:

````markdown
## Summary
- `/profile` に公開停止/再公開申請と退会申請の UI を追加
- `apps/web/src/lib/api/me-requests.ts` を新設し `POST /me/visibility-request` / `POST /me/delete-request` を呼び出す
- 二重申請 409 をユーザー文言として可視化し、本文編集 UI は追加しない（不変条件 #4 を構造で担保）

## Changes
### apps/web (UI)
- `app/profile/_components/RequestActionPanel.tsx`（新規）
- `app/profile/_components/VisibilityRequestDialog.tsx`（新規）
- `app/profile/_components/DeleteRequestDialog.tsx`（新規）
- `app/profile/_components/RequestPendingBanner.tsx`（新規）
- `app/profile/_components/RequestErrorMessage.tsx`（新規）
- `app/profile/page.tsx`（panel 差し込み）

### apps/web (lib)
- `src/lib/api/me-requests.ts`（新規 client helper）
- `src/lib/api/me-requests.types.ts`（新規型）

### docs
- `docs/00-getting-started-manual/specs/05-pages.md`
- `docs/00-getting-started-manual/specs/07-edit-delete.md`
- `docs/00-getting-started-manual/specs/09-ui-ux.md`

## Test plan
- [ ] `pnpm typecheck` PASS
- [ ] `pnpm lint` PASS
- [ ] `pnpm test`（unit / integration）PASS
- [ ] Playwright E2E S1（visibility hide）/ S2（visibility public）/ S3（delete）/ S4（duplicate 409）PASS
- [ ] 手動確認: dialog focus trap / esc close / role=dialog
- [ ] 手動確認: 401 時 `/login?redirect=/profile` に遷移

## Screenshots
（Phase 11 で `outputs/phase-11/screenshots/` に出力された PNG を `raw.githubusercontent.com` 絶対 URL で挿入）
- TC-01-request-panel-default-public-light.png
- TC-02-request-panel-default-hidden-light.png
- TC-03-visibility-dialog-open-light.png
- TC-04-delete-dialog-open-light.png
- TC-06-duplicate-409-light.png

## Invariants checked
- #4 profile body edit forbidden — dialog の input は `desiredState` / `reason` のみ
- #5 apps/web D1 direct access forbidden — `cloudflare:d1` import 0 件
- #11 member self-service boundary — URL は `/me/visibility-request` / `/me/delete-request` の 2 本に閉じる

## Related
- Depends on: 06b-A-me-api-authjs-session-resolver
- Blocks: 06b-C-profile-logged-in-visual-evidence

## その他
- Phase 12 実装ガイド反映元: `docs/30-workflows/completed-tasks/06b-B-profile-self-service-request-ui/outputs/phase-12/implementation-guide.md`
- 反映ポイント: Part 1 概念説明（公開停止/退会/二重申請防止）、Part 2 API 契約と error mapping
````

### 6. gh pr create コマンド例

```bash
gh pr create \
  --title "feat(profile): add visibility & delete self-service request UI" \
  --base dev \
  --head feat/06b-B-profile-self-service-request-ui \
  --body "$(cat <<'EOF'
## Summary
- /profile に公開停止/再公開申請と退会申請の UI を追加
- POST /me/visibility-request / POST /me/delete-request の client helper を新設
- 二重申請 409 をユーザーに可視化（本文編集 UI は追加しない）

## Test plan
- [ ] pnpm typecheck PASS
- [ ] pnpm lint PASS
- [ ] pnpm test PASS
- [ ] Playwright S1/S2/S3/S4 PASS

## Invariants
- #4 / #5 / #11 維持

## Related
- Depends: 06b-A-me-api-authjs-session-resolver
- Blocks: 06b-C-profile-logged-in-visual-evidence

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

> 推奨は `/ai:diff-to-pr` の起動。手動 fallback として上記 `gh pr create` を残す。

### 7. PR コメント追加

`/ai:diff-to-pr` Phase 5.5 / 5.6 に従い、以下を追加コメントとして投稿する。

- `implementation-guide.md` 全文（Part 1 / Part 2）
- `outputs/phase-11/screenshots/*.png` を `raw.githubusercontent.com/<repo>/<commit>/<path>` 絶対 URL で投稿

### 8. CI 確認

```bash
gh pr checks <PR番号>
gh pr view <PR番号> --json mergeStateStatus,statusCheckRollup
```

CI 全 PASS を `outputs/phase-13/pr-info.md` に記録する。

### 9. タスク完了処理

この workflow root はすでに `docs/30-workflows/completed-tasks/06b-B-profile-self-service-request-ui/` に配置済み。Phase 13 で追加の root move は実行しない。ユーザー明示承認後に限り、通常の commit / push / PR 手順と CI 結果記録だけを実行する。

## pre-PR チェックリスト

- [ ] `git status --porcelain` が空
- [ ] `git diff main...HEAD --name-only` が PR 包含ファイル一覧として取得できる
- [ ] `pnpm typecheck` PASS
- [ ] `pnpm lint` PASS
- [ ] `pnpm test` PASS
- [ ] `outputs/phase-11/screenshots/` に必須 5 PNG が存在
- [ ] `outputs/phase-12/implementation-guide.md` に Part 1 / Part 2 両方が存在
- [ ] solo dev 運用ポリシーに従い、`required_pull_request_reviews=null` を維持（branch protection 未変更）
- [ ] CI gate（`required_status_checks`）通過確認

## 成果物

| 成果物 | パス | 必須 |
| --- | --- | --- |
| ローカル検証ログ | `outputs/phase-13/local-check-result.md` | ✅ |
| 変更サマリー | `outputs/phase-13/change-summary.md` | ✅ |
| PR 作成ログ | `outputs/phase-13/pr-creation-result.md` | ✅ |
| PR 情報 | `outputs/phase-13/pr-info.md` | ✅ |
| 集約サマリー | `outputs/phase-13/main.md` | ✅ |

## 完了条件

- [ ] user 明示承認を取得した
- [ ] ローカル品質検証 4 種が全 PASS
- [ ] PR title `feat(profile): add visibility & delete self-service request UI` で作成
- [ ] PR body に Summary / Changes / Test plan / Screenshots / Invariants / Related が含まれる
- [ ] `implementation-guide.md` 全文がコメントとして投稿された
- [ ] スクリーンショットが絶対 URL で表示される
- [ ] CI 全 PASS
- [ ] task ディレクトリを `completed-tasks/` に移動した
- [ ] 本 Phase 内の全作業を 100% 完了

## タスク 100% 実行確認【必須】

- [ ] **本仕様書作成タスクでは PR 作成を実行しない**（user approval ゲート前提）
- [ ] 実装フェーズで本仕様に従って `/ai:diff-to-pr` を起動する前提を明記している
- [ ] solo dev 運用（`required_pull_request_reviews=null`）と整合している

## 次 Phase への引き渡し

Phase 完了 へ、PR URL、CI 結果、completed-tasks 移動済み path を渡す。
