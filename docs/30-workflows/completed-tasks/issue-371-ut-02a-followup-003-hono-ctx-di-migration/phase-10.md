# Phase 10: リスク再評価

実装区分: 実装仕様書

## 10.1 リスクと対策（起票元 §5 を踏襲・強化）

| # | リスク | 影響 | 対策 | 残留 |
| --- | --- | --- | --- | --- |
| RK-1 | 全 call site 一括改修で merge conflict 多発 | 中 | Phase 5 の漸進移行（middleware 先行 → builder 後段切替）で各 step 単体 PR 化可能な構造に分離 | 低 |
| RK-2 | `c.var` 型拡張による global 汚染 | 中 | `RepositoryProviderVariables` を route 単位の `Variables` 交差型でのみ合成。app root には貼らない | 低 |
| RK-3 | 暗黙 fallback の復活 | 高 | `fetchAttendanceFor` で **throw** に変更し、Phase 9 G4 grep gate で再発検知 | 低 |
| RK-4 | middleware 結線漏れによる runtime 500 | 中 | route テスト T9/T10 で middleware 経由動作を担保。さらに本番デプロイ前の wrangler dev smoke で確認 | 低 |
| RK-5 | `DbCtx` narrow による既存 builder（public profile 等）の破壊 | 中 | public profile builder（`buildPublicMemberProfile`）は `var.attendanceProvider` を要求しない別型 `DbCtxBase` に分離。Phase 5 Step 5 で型を 2 分する | 低 |
| RK-6 | テストでの mock provider 設定漏れ | 低 | mock helper を共通化し、test fixture middleware を `apps/api/src/test-utils/` に配置（任意） | 低 |
| RK-7 | esbuild / wrangler bundle サイズ変動 | 低 | middleware 1 ファイル追加のみ、影響軽微。`pnpm build` の bundle size 出力で監視 | 低 |
| RK-8 | 02b/02c が同パターンを採用しない | 中 | ADR で標準パターン化。02b/02c 起票時に ADR 参照を必須化 | 中（ガバナンスで吸収） |

## 10.2 ロールバック計画

- Step 単位コミット → 問題発生 step を `git revert`
- 全体 revert: PR を revert し、Issue #371 へ comment で経緯記録（Issue は closed のままだが trace を残す）

## 10.3 デプロイリスク

本タスクは behavioral change なし（routing / response shape 不変）。
ただし throw 化で middleware 結線漏れ時に 500 が出るため、staging / production の最初のヘルスチェックで `/me/profile` / `/admin/members/:mid` を必ず叩く。
これは 09a / 09b 既存 smoke の対象に含まれているため追加作業は不要。

## 10.4 完了条件

- RK-1〜RK-8 の対策が Phase 5 / 6 / 8 / 9 の各成果物に反映されている
- 残留リスク「中」以上の項目（RK-8）は Phase 12 unassigned-task-detection に転記する候補とする
