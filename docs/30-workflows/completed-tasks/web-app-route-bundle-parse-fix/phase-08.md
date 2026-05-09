# Phase 8: エラーハンドリング

## 目的

ビルダ切替で起こり得る失敗パターンを列挙し、各々に対する対処と rollback 経路を確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented-local |

## エラーパターン一覧

| # | 段階 | エラー | 検出 | ハンドリング |
| --- | --- | --- | --- | --- |
| E-1 | local pre-flight | `pnpm typecheck` exit ≠ 0 | DoD-T01-3 | 修正コミット前なので `apps/web/package.json` の `--webpack` 追加を戻し、Phase 3 へ戻る |
| E-2 | local pre-flight | `pnpm lint` exit ≠ 0 | DoD-T01-4 | 同上 |
| E-3 | local build | `pnpm --filter @ubm-hyogo/web build:cloudflare` exit ≠ 0 | DoD-T01-2 | webpack 経路特有のエラー（loader / config 不整合）を確認。`next.config.ts` を読み返し原因を切り分け |
| E-4 | local build | `.open-next/worker.js` 未生成 | DoD-T01-2 | E-3 と同様に再現。`open-next.config.ts` の buildCommand 出力を tail で確認 |
| E-5 | staging deploy | `bash scripts/cf.sh deploy --env staging` が 1Password resolution で fail | deploy ログ | `op signin` を再取得し再試行（NFR-3 に従い `wrangler` 直接実行は禁止） |
| E-6 | staging deploy | deploy 自体は成功するが Worker 起動時 5xx | smoke 5.2 | rollback（§9）→ Phase 1 へ戻る |
| E-7 | staging runtime | `/api/auth/error` が依然 500 | smoke 5.2 / tail 5.3 | tail 内の error メッセージを採取し真因を再評価。`Could not parse module` が消えていない場合は webpack 切替が効いていないため `pnpm build` 出力を確認 |
| E-8 | staging runtime | Server Component (`/`, `/members`) が回帰し 5xx | smoke 5.2 | rollback。FR-2 違反のため production deploy 進行禁止 |
| E-9 | production deploy | staging PASS 後 production で deploy fail | deploy ログ | rollback gate に従い production rollback を即実行 |
| E-10 | production runtime | production smoke 5.4 で staging と異なる挙動 | smoke 5.4 | production rollback → 差分原因（env 値、secret）を `apps/web/wrangler.toml` `[env.production.vars]` で照合 |

## fail-fast / 縮退の方針

- Phase 5.1〜5.3（staging）の **いずれか 1 件でも fail したら production deploy へ進まない**（gate）。
- production rollback の判断は smoke 5.4 で 1 URL でも 5xx を返した時点で実行する（§9 ロールバック手順）。
- ビルド成果物が再生成されている限り、`apps/web/package.json` の `--webpack` 追加を戻せば local 編集は完全に元へ戻せる（cap=worktree）。

## 完了条件

- [x] E-1〜E-10 を列挙
- [x] fail-fast 条件と rollback 起点を明示

## 出力

- `phase-08.md`

## 参照資料

- `outputs/phase-04/task-01-switch-next-build-to-webpack.md` §5 / §8
- `phase-03.md`
