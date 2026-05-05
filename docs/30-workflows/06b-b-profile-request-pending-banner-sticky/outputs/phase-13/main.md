# Phase 13: PR 作成 — 06b-b-profile-request-pending-banner-sticky-001

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-b-profile-request-pending-banner-sticky-001 |
| phase | 13 / 13 |
| wave | 06b-fu |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| user_approval_required | true |

## 目的

実装・実測完了後、ユーザー明示承認を経てから PR を作成する手順を定義する。本仕様書作成タスク内では実行しない。実装フェーズで `/ai:diff-to-pr` を起動して完遂する。

## 適用前提

- Phase 1〜12 の仕様書が揃い、実装側 Phase 5 / 9 / 11 が PASS（または S4 例外で AWAITING_VISUAL_CAPTURE）
- `outputs/phase-11/screenshots/` に reload 永続性 + 409 stale UI の PNG が存在（または BLOCKED 記録）
- `outputs/phase-12/implementation-guide.md` に Part 1 / Part 2 が記載済み

## 三役ゲート

| # | ゲート | 通過条件 | タイミング |
| --- | --- | --- | --- |
| 1 | user 承認ゲート | `outputs/phase-13/change-summary.md` 提示 → user 明示承認文言 | 必ず最初 |
| 2 | ローカル品質検証ゲート | `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `pnpm test` 全 PASS | ゲート 1 後 |
| 3 | push / PR 作成ゲート | commit → push → `gh pr create` | ゲート 2 後 |

## 実行手順

### 1. ローカル動作確認依頼

ユーザーに `/profile` で以下を確認してもらう:

- 申請後 reload しても banner が残ること（AC-1）
- 重複ボタンが server pending state で disabled（AC-2）
- 旧タブで再 submit → 409 表示（AC-3）

### 2. 変更サマリー提示

`outputs/phase-13/change-summary.md` に以下を記載:

- 追加 / 変更 / 削除ファイル一覧（Phase 12 implementation-guide と同期）
- 影響範囲（`/profile` UI + `GET /me/profile` schema 拡張）
- screenshot 参照
- evidence path
- rollback 手順（revert 1 commit、API/web 同 commit のため不整合なし）

### 3. ローカル品質検証

```bash
pnpm install --force
pnpm typecheck
pnpm lint
pnpm test
```

結果を `outputs/phase-13/local-check-result.md` に記録。

### 4. ブランチ確認

| 項目 | 値 |
| --- | --- |
| ブランチ命名 | `feat/06b-b-profile-request-pending-banner-sticky` |
| 派生元 | `dev`（最新を取り込み済み） |
| merge target | `dev`（staging 検証後 `dev → main`） |

### 5. PR 作成

PR title:

```
feat(profile): make pending request banner sticky via server-side state
```

PR body 構成:

````markdown
## Summary
- `/profile` の pending banner を server-side state ベースで sticky 化（reload で消えない）
- `GET /me/profile` を拡張し `pendingRequests` を返却（schema 追加）
- 重複アクションボタンを server state ベースで disabled
- 409 ハンドリングは既存 `SelfRequestError(code:'DUPLICATE_PENDING_REQUEST')` を再利用（新 code 追加なし）

## Changes
### apps/api
- `src/routes/me/schemas.ts`（`PendingRequestsZ` 追加 / `MeProfileResponseZ` 拡張）
- `src/repository/adminNotes.ts`（pending-only read helper 追加）
- `src/routes/me/services.ts`（`getPendingRequestsForMember` 追加、pending-only read model 使用）
- `src/routes/me/index.ts`（`GET /me/profile` で pending 合成）
- `src/routes/me/index.test.ts`（reload sticky / duplicate 409 / pending-only edge case）

### apps/web
- `app/profile/page.tsx`（pending を props で渡す）
- `app/profile/_components/RequestActionPanel.tsx`（disabled 判定を server pending 優先に、submit 後 `router.refresh()`）
- `src/lib/api/me-types.ts` / `me-types.test-d.ts`（web mirror 型）
- `playwright/tests/profile-pending-sticky.spec.ts`（新規）

### docs
- `docs/00-getting-started-manual/specs/05-pages.md`
- `docs/00-getting-started-manual/specs/07-edit-delete.md`
- `docs/00-getting-started-manual/specs/09-ui-ux.md`

## Test plan
- [x] `pnpm --filter @ubm-hyogo/api typecheck` PASS
- [x] `pnpm --filter @ubm-hyogo/web typecheck` PASS
- [x] `pnpm --filter @ubm-hyogo/api test -- apps/api/src/routes/me/index.test.ts` PASS（script は apps/api suite 全体を実行: 106 files / 683 tests）
- [x] `pnpm --filter @ubm-hyogo/web test -- apps/web/app/profile/_components/RequestActionPanel.test.tsx apps/web/src/lib/api/me-types.test-d.ts` PASS（script は apps/web suite 全体を実行: 48 files / 399 tests）
- [ ] Playwright `profile-pending-sticky` PASS（authenticated runtime capture pending）
- [ ] grep gate（#4 / #5 / #11 / S5）

## Screenshots
（Phase 11 で取得した PNG を `raw.githubusercontent.com` 絶対 URL で挿入）
- TC-01-pending-banner-after-reload-light.png
- TC-02-button-disabled-light.png
- TC-03-stale-409-light.png

## Invariants
- #4 profile body edit forbidden — body field 追加なし
- #5 apps/web D1 direct access forbidden — `cloudflare:d1` import 0 件
- #11 member self-service boundary — web API path に `:memberId` 不在（BFF passthrough 流用）

## Related
- GitHub Issue: #428
- Depends on: 06b-A, 06b-B
- Blocks: 06b-C-profile-logged-in-visual-evidence
````

### 6. gh pr create コマンド例

```bash
gh pr create \
  --title "feat(profile): make pending request banner sticky via server-side state" \
  --base dev \
  --head feat/06b-b-profile-request-pending-banner-sticky \
  --body "$(cat <<'EOF'
## Summary
- /profile の pending banner を server-side state で sticky 化（reload で消えない）
- GET /me/profile に pendingRequests を追加
- 重複ボタンを server state で disabled、409 は SelfRequestError(DUPLICATE_PENDING_REQUEST) を再利用

## Test plan
- [ ] pnpm typecheck PASS
- [ ] pnpm lint PASS
- [ ] pnpm test PASS
- [ ] Playwright profile-pending-sticky PASS

## Invariants
- #4 / #5 / #11 維持

## Related
- Issue: #428
- Depends: 06b-A, 06b-B
- Blocks: 06b-C

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

> 推奨は `/ai:diff-to-pr` 起動。手動 fallback として上記を残す。

### 7. PR コメント追加

`/ai:diff-to-pr` Phase 5.5 / 5.6 に従い:

- `implementation-guide.md` 全文（Part 1 / Part 2）を本文 or コメントに含む
- screenshot を絶対 URL で投稿

### 8. CI 確認

```bash
gh pr checks <PR番号>
gh pr view <PR番号> --json mergeStateStatus,statusCheckRollup
```

CI 全 PASS を `outputs/phase-13/pr-info.md` に記録。

### 9. タスク完了処理

user 明示承認後、通常の commit / push / PR 手順 + CI 結果記録を実行。本タスク root の `completed-tasks/` 配下への移動は本仕様書段階では行わない。

## pre-PR チェックリスト

- [ ] `git status --porcelain` 空
- [ ] `git diff main...HEAD --name-only` 取得
- [ ] `pnpm typecheck` PASS
- [ ] `pnpm lint` PASS
- [ ] `pnpm test` PASS
- [ ] `outputs/phase-11/screenshots/` に必須 PNG が存在（または S4 例外を文書化）
- [ ] `outputs/phase-12/implementation-guide.md` に Part 1 / Part 2 両方が存在
- [ ] solo dev policy（`required_pull_request_reviews=null`）維持
- [ ] CI gate 通過確認

## 成果物

| 成果物 | パス | 必須 |
| --- | --- | --- |
| ローカル検証ログ | `outputs/phase-13/local-check-result.md` | ✅ |
| 変更サマリー | `outputs/phase-13/change-summary.md` | ✅ |
| PR 作成ログ | `outputs/phase-13/pr-creation-result.md` | ✅ |
| PR 情報 | `outputs/phase-13/pr-info.md` | ✅ |
| 集約 | `outputs/phase-13/main.md` | ✅ |

## 完了条件

- [ ] user 明示承認取得
- [ ] ローカル品質検証 4 種全 PASS
- [ ] PR title が確定文言で作成
- [ ] PR body に Summary / Changes / Test plan / Screenshots / Invariants / Related
- [ ] implementation-guide.md がコメントで投稿
- [ ] screenshot が絶対 URL で表示（または S4 例外）
- [ ] CI 全 PASS
- [ ] 本 Phase 内タスク 100% 実行

## タスク 100% 実行確認【必須】

- [ ] 仕様書作成タスクでは PR 作成を実行しない
- [ ] 実装フェーズで本仕様に従い `/ai:diff-to-pr` を起動する前提を明記
- [ ] solo dev policy と整合

## 次 Phase への引き渡し

Phase 完了 へ、PR URL、CI 結果、completed-tasks 移動済み path を渡す。
