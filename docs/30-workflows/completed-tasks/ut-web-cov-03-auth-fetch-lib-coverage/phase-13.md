# Phase 13: PR 作成 — ut-web-cov-03-auth-fetch-lib-coverage

[実装区分: 実装仕様書]

判断根拠:
- 本タスクは Vitest unit test 実装の PR 作成を扱う。
- CONST_004（実態優先）に従い `implementation` として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-03-auth-fetch-lib-coverage |
| phase | 13 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

user approval を得た上で PR を作成し、CI 全 green を確認する。

## user approval gate（冒頭・必須）

- 本 Phase は **user approval が必須**。実装者は PR 作成前に user に作業内容と evidence path を提示し、明示的承認を取得すること。
- 承認取得後にのみ次の手順へ進む。

## 実行タスク

1. `git status --porcelain` で全変更を確認（test 追加 + helper + docs 更新のみ）。
2. `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` を最終実行し exit 0 を確認。
3. `mise exec -- pnpm --filter web test:coverage` を最終実行し coverage gate を再確認。
4. `gh pr create --base dev --title "test(ut-web-cov-03): auth/fetch/session lib coverage to ≥85%" --body "<生成>"`
   - body には以下を必ず含める:
     - AC マトリクス再掲（auth 4 ケース / fetch 5 ケース / me-types round-trip / regression なし / 数値閾値）
     - coverage before/after 数値表（Phase 11 実測値）
     - 変更ファイル一覧（test 7 + helper 1）
     - test 追加 line 数
     - CI gate 期待値（typecheck / lint / coverage 全 green）
     - Phase 12 implementation-guide.md への参照
5. `gh pr checks` で CI 全 green を確認（fail 時は Phase 9 へ戻して修正後 force-push なしで追加 commit）。

## base 選択

- `dev`（feature → dev → main フロー、CLAUDE.md ブランチ戦略に準拠）

## ロールバック方針

- 障害発生時は revert PR を作成（base=dev）。production 影響なしのため緊急度は低。

## 入出力（CONST_005）

- 入力: 実装ブランチ + 全成果物
- 出力: PR URL / CI green 確認 / `outputs/phase-13/main.md`（PR URL・採用 base・CI 結果記録）

## 参照資料

- 起票根拠: 2026-05-01 実測 apps/web coverage（lines=39.39%）
- docs/00-getting-started-manual/specs/02-auth.md
- docs/00-getting-started-manual/specs/13-mvp-auth.md
- `.claude/commands/ai/diff-to-pr.md`

## 実行手順

- 対象 directory: docs/30-workflows/ut-web-cov-03-auth-fetch-lib-coverage/
- 本仕様書作成タスクではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 05a-authjs-google-oauth-admin-gate, 05b-B-magic-link-callback-credentials-provider
- 関連 quality gate: 06b-A-me-api-authjs-session-resolver; release readiness handoff: 09b-A-observability-sentry-slack-runtime-smoke

## 多角的チェック観点

- #2 responseId/memberId separation
- #5 public/member/admin boundary
- #6 apps/web D1 direct access forbidden（fetch wrapper 経由のみ）
- 未実装/未実測を PASS と扱わない。
- placeholder と実測 evidence を分離する。

## サブタスク管理

- [ ] user approval を取得
- [ ] typecheck / lint / coverage を最終再実行
- [ ] `gh pr create --base dev` で PR 作成
- [ ] `gh pr checks` で全 green 確認
- [ ] outputs/phase-13/main.md に PR URL と CI 結果を記録

## 成果物

- outputs/phase-13/main.md

## 完了条件（DoD / CONST_005）

1. coverage 数値が AC を満たす
2. typecheck exit 0
3. lint exit 0
4. 既存 web test に regression なし
5. PR の CI 全 green

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装仕様書フェーズではコード実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

本仕様書作成タスクはここで完了する。実装・実測フェーズへ AC、blocker、evidence path、approval gate を引き渡す。
