# Lessons Learned - Issue #900 workflow permissions least-privilege audit (2026-05)

## L-WFPERM-001: top-level permissions 不在は構造的脆弱性

top-level `permissions:` を宣言しない workflow は GitHub の default token 権限に依存する。default 値が縮退した瞬間、`actions/checkout` の credential が落ち、最初の step で exit 128 を起こす再現経路がある（`ci.yml:15-16` の checkout 失敗で観測済み）。observation 待ちにせず、全 workflow で top-level 宣言を必須化する。

## L-WFPERM-002: least-privilege は 2 階層で組む

top-level に「全 job が共通で必要な最小権限」を、job-level で「その job だけが必要な write 権限」を上書きする。両方を併記する場合、top と job が矛盾しないように top は最小値（多くは `contents: read` のみ）に固定する。job-level write はそのまま温存して回帰を避ける。

## L-WFPERM-003: actionlint 1.7.7 を最終ゲートに、push 前は grep で自己検証

ローカル actionlint の matrix 再現が困難な環境では、`.github/workflows/ci.yml` に組み込まれた actionlint step を最終 gate として扱い、push 前は `awk` / `grep` で「top-level permissions block の有無」を機械検査する。本タスクでは `scripts/verify-workflow-top-level-permissions.sh` をその検査として ci.yml に組み込み、回帰を防ぐ。

## L-WFPERM-004: 防御的 hardening は失敗観測を待たず先回り適用

transient な runner 障害と構造的弱点（default token 縮退）は観測のみでは切り分けできない。無害な防御策（top-level permissions の明示宣言）は再現を待たず一斉適用する。観測 evidence は Phase 11 の local diff + verify script 出力で local 完結し、runtime evidence は user-gated boundary に切り出す。
