# Lessons Learned: Issue #626 RB-01 Share Build Output (2026-05)

| Meta | Value |
| --- | --- |
| Workflow root | `docs/30-workflows/completed-tasks/issue-626-rb01-share-build-output-lighthouse-pr-build/` |
| Date | 2026-05-12 |
| State | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / implementation / NON_VISUAL` |
| Scope | `.github/workflows/pr-build-test.yml` への `lighthouse-ci` 統合 + `.github/workflows/lighthouse.yml` 削除 + `apps/web/.next` artifact 共有 |
| Issue | #626 CLOSED / parent #608 CLOSED（PR 文脈は `Refs #626, #608` のみ） |

## L-ISSUE626-001: workflow 統合時の branch protection context 名 continuity

- **苦戦**: `lighthouse.yml` を `pr-build-test.yml` に統合する際、branch protection の required status check として登録済みの context 名 `lighthouse-ci` を維持できないと、`dev` / `main` の保護が drift する。
- **原因**: GitHub branch protection の required check は workflow file 単位ではなく job 単位（`<workflow>.<job-name>` または `<job-name>`）で名前解決される。workflow file 名を変えても job 名 `lighthouse-ci` が同一なら required check は壊れないが、job 名を改名すると即時 break する。
- **解決パターン**: 統合先 workflow の job 名を `lighthouse-ci` に固定し、`needs: build-test` で順序のみ追加する。`if: github.base_ref == 'dev'` は dev-base PR 限定の発火境界として継続。merge-time に branch protection JSON の before/after diff を Phase 11 evidence に保存する。
- **適用条件**: CI workflow file の統合・分割・rename を伴う全タスクで、変更前に `gh api repos/{owner}/{repo}/branches/{branch}/protection` の required check 名を snapshot し、job 名を維持または同一 wave で protection 側も update する。

## L-ISSUE626-002: artifact 共有における trust boundary 設計

- **苦戦**: `build-test` が生成した `.next` を `lighthouse-ci` で再利用するため artifact upload/download を導入したが、`pull_request` event で fork PR からの artifact 注入 / secret 漏洩のリスクをどう遮断するかの判断。
- **解決パターン**: artifact 名を `next-build-${{ github.sha }}` で固定して同一 PR commit に scope 限定、`permissions: {}` で write 権限を job レベルで剥奪、secrets 注入なし、retention 1 day（build artifact）/ 7 days（lhci report）の最小保持期間とした。`actions/upload-artifact@ea165f...` (v4.6.2) / `actions/download-artifact@d3f86a...` (v4.1.8) を UT-GOV-007 準拠で初回 SHA pin した（リポジトリ既存 pin がなかったため公式 release を採用）。
- **適用条件**: 同一 PR 内で job 間 build 成果物を共有する全 workflow で、artifact 名は SHA scope、`permissions: {}`、SHA-pinned action、minimum retention の 4 点を満たす。

## L-ISSUE626-003: secret-grep false-positive の境界判定

- **苦戦**: `apps/web/.next/` を artifact upload する前段の安全性検証で `grep -rE "(CLOUDFLARE_API_TOKEN|AUTH_SECRET|GITHUB_TOKEN|SENTRY_AUTH_TOKEN)"` を実行したところ 9 ファイル hit したが、すべて embedding ではなく `process.env.*` の code symbol 参照だった。値の embedding と symbol 参照を grep だけで区別できないため、安全宣言の根拠付けに迷った。
- **解決パターン**: hit した 9 ファイルそれぞれを目視で確認し `process.env.X` 形式のみであることを示す snippet を `outputs/phase-11/evidence/next-secret-grep.txt` に保存。token 名 (symbol) と token value (secret) の区別を evidence に明文化する。
- **適用条件**: build 出力 / artifact / bundle を外部公開（artifact upload を含む）する前の secret scan で、token 名一致を fail と即断せず、`process.env.NAME` / 定数比較式 / NEXT_PUBLIC_* のホワイトリスト除外 / 実値 base64/hex pattern 検出 を併用する。
