# Phase 10 — 単体テスト（rerun スクリプト自体の smoke test）

## 目的

`scripts/api-coverage-rerun.sh` を採用した場合、スクリプト自体の最低限の smoke test を Phase 10 で固定する。no-code verification close-out 時はスキップ。

## 入力 / 前提

- Phase 6 で実装された helper script
- 既存 Vitest runner が利用可能であること（`mise exec -- pnpm exec vitest --version`）

## 想定変更ファイル

| パス | 変更種別 | 役割 |
| --- | --- | --- |
| `scripts/__tests__/api-coverage-rerun.test.ts` | 新規（条件付） | helper の引数 parse / log path / exit code 伝播 smoke test |

## 手順

1. Vitest または shell smoke の test ケース:
   - `baseline --count=0` は no-op で exit 0
   - `baseline --count=1` は log file を 1 件書き出す（vitest 実行は `VITEST_DRY_RUN=1` で mock 可能なら mock）
   - `matrix --axis=B --value=maxWorkers=1` は対応する log path を書き出す
   - 不正な subcommand は exit 2 で usage を stderr 出力
2. shellcheck / Vitest smoke を CI に組み込むかは Phase 7 と整合（採用優先度低なら local 実行のみ）。

## 成果物

- `outputs/phase-10/main.md`（smoke test ケース表 + 採用判断）

## 検証コマンド

```bash
shellcheck scripts/api-coverage-rerun.sh
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts scripts/__tests__/api-coverage-rerun.test.ts
```

## 完了条件（DoD）

- [ ] smoke test ケースが 4 件以上記述されている。
- [ ] shellcheck clean。
- [ ] Vitest smoke または shell smoke が green（採用時）。
