# Phase 13: PR 作成（ユーザー明示承認後のみ実施）

> workflow: mypage-prototype-alignment
> taskType: `implementation` / VISUAL
> **状態: blocked（ユーザー明示承認待ち）**

## 13.1 絶対原則

1. **commit / push / PR 作成は、ユーザーの明示承認後にのみ実行する。** 本仕様書段階では一切実行しない。
2. ローカル確認（typecheck / lint / build / targeted test）を省略しない。
3. base ブランチは **`dev`**（CLAUDE.md デフォルト。`main` への PR は production リリース時の `dev → main` のみ）。

## 13.2 blocked の理由

- 本タスクは仕様書作成フェーズであり、実装サイクル（`03.実装.md`）が未完了。
- Phase 10（最終レビュー）/ Phase 11（screenshot 撮影）/ Phase 12（ドキュメント）の実測 close-out が完了し、かつユーザーが明示承認するまで PR は作成しない。
- Gate-C（`artifacts.json` の external_ops gate）は `pending`。

## 13.3 PR 作成前提条件（実装サイクル完了後に確認）

| 前提 | 確認方法 | 状態 |
|------|----------|------|
| Phase 10 ゲート PASS（BLOCKER 0 件 / MINOR 全件未タスク化） | `outputs/phase-10/phase-10.md` の判定 | （実装後） |
| Phase 11 screenshot 5 枚 + 必須証跡が配置済み | `ls outputs/phase-11/screenshots/*.png` | （実装後） |
| Phase 12 の 6 成果物が物理配置済み | `ls outputs/phase-12/` | （実装後） |
| ローカル検証 PASS | 下記 §13.4 | （実装後） |
| ユーザー明示承認 | チャットでの承認取得 | **未取得** |

## 13.4 ローカル検証コマンド（承認前でも実行可・読み取り検証）

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
# targeted test（Phase 1 §1.6 の範囲）
mise exec -- pnpm --filter @ubm-hyogo/web test -- apps/web/app/profile
# OKLch tokens gate
mise exec -- pnpm exec ...   # verify-design-tokens（task-18 gate）
```

検証結果は `outputs/phase-13/local-check-result.md` に記録する（実装サイクル後）。

## 13.5 PR 本文構成（承認後に作成）

`gh pr create --base dev` で作成する PR 本文は以下構成とする:

| セクション | 内容 |
|-----------|------|
| 変更概要 | `/profile` を prototype `MyProfilePage`（pages-member.jsx:219-371）準拠の視覚構成へ整備し、編集導線（Google Form 再回答）・公開ページ確認・公開状態可視化を発見しやすくした |
| スコープ | 含む: page-head / status banner / VisibilitySummary（Stat grid-3）/ ProfilePreview（Avatar）/ ProfileFields（Card+KVList）/ danger-zone / RevalidateModal / MemberHeader 動線。含まない: 新規 API / D1 schema / インライン本文編集 / Avatar アップロード |
| 不変条件遵守 | 既存 `/me/*` API surface 変更 0 件 / OKLch tokens のみ（`verify-design-tokens` PASS）/ 新規 primitive 0 件 / D1 直接アクセスなし / 本文編集 UI 非描画 |
| 視覚証跡（Phase 11 screenshot 参照） | `outputs/phase-11/screenshots/` の 5 枚（`profile-page-default.png` / `status-banner-public.png` / `visibility-summary.png` / `revalidate-modal-open.png` / `member-header-nav.png`）を参照 |
| 検証コマンド結果 | typecheck / lint / targeted test / verify-design-tokens / Playwright smoke の結果要約 |

> `outputs/phase-11/` に screenshot 画像があるため、PR 本文にスクリーンショット参照を含める。画像がない場合はスクリーンショット項目を作らない（VISUAL タスクのため通常は含める）。

## 13.6 実行手順（ユーザー承認取得後のみ）

1. ユーザーから明示承認を取得する。
2. `git fetch origin dev` → ローカル `dev` を `origin/dev` に fast-forward 同期。
3. 作業ブランチ（`feat/mypage-prototype-alignment` 系）に `dev` をマージし、コンフリクトを CLAUDE.md の既定方針で解消。
4. §13.4 のローカル検証を実行し、失敗時は最大 3 回まで自動修復。
5. `git add -A` → commit（コミットメッセージ末尾に `Co-Authored-By: Claude ...`）。
6. `git diff dev...HEAD --name-only` で PR 対象ファイル一覧を取得し漏れなし確認。
7. `gh pr create --base dev` で PR 作成。
8. `outputs/phase-13/pr-info.md` / `pr-creation-result.md` に PR URL・採用ブランチ・検証結果を記録。

## 13.7 成果物（承認後に作成）

| 成果物 | パス | タイミング |
|--------|------|-----------|
| ローカル検証結果 | `outputs/phase-13/local-check-result.md` | 検証実行後 |
| 変更サマリー | `outputs/phase-13/change-summary.md` | commit 前 |
| PR 情報 | `outputs/phase-13/pr-info.md` | PR 作成後 |
| PR 作成結果 | `outputs/phase-13/pr-creation-result.md` | PR 作成後 |

## 13.8 完了根拠（Phase 12 までの記録）

- Phase 1-3: 設計ゲート PASS（Gate-A passed）。
- Phase 4-9: テスト / 実装 / カバレッジ / リファクタ / QA 仕様確定。
- Phase 10: 最終レビュー（DoD 1-9 突合）。
- Phase 11: 3 層評価 + screenshot 5 枚（VISUAL）。
- Phase 12: 6 成果物 close-out。

> 上記がすべて完了し、ユーザー承認を得た時点で Phase 13 を blocked → 実行へ遷移する。それまでは本ファイルの計画記述に留め、commit / PR は作成しない。
