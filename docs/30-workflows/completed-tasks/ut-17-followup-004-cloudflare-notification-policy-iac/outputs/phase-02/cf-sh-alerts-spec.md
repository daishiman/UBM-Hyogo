# Phase 2 成果物: `cf.sh alerts` 仕様

## サブコマンド

| サブコマンド | 役割 | exit code |
| --- | --- | --- |
| list | expected と actual を一覧 | 0 |
| diff | drift 検知 | 0 (一致) / 2 (drift) / 78 (--ci 設定欠落) / 64 (usage) |
| plan | diff と同じ判定だが常に 0 | 0 |
| apply | webhook → policy 順に冪等適用 (dry-run by default) | 0 |

## フラグ

| flag | 説明 |
| --- | --- |
| `--json` | 出力を JSON 配列にする (diff / plan) |
| `--yes` | apply の実適用 (なしは dry-run) |
| `--ci` | op run をスキップし `CLOUDFLARE_ALERTS_TOKEN_READ` を直接利用 |

## 実装

`scripts/cf.sh` 内に `[ "$1" = "alerts" ]` 分岐を追加。
`infra/cloudflare-alerts/lib/cli.ts` を `mise exec -- pnpm exec tsx` で起動する。
`set_tsx_esbuild_binary_path` で esbuild バイナリパスを fix する。

詳細は phase-02.md / phase-08.md §8-7 を参照。
