# Implementation Guide

## Part 1: 中学生レベルの説明

Cloudflare の API token はクラウド操作用の鍵です。古い大きな鍵を残したままにすると、もし漏れた時に影響範囲が広くなります。
このタスクは、バックエンドの鍵を用途別の小さい鍵へ切り替えたうえで、古い鍵を人間の承認後に無効化するための手順です。
鍵の値、ID、末尾、アカウント ID は記録しません。記録するのは「どの手順を実施したか」と「成功したか」だけです。
この実行サイクルでは、バックエンド用の鍵の名前を切り替え、戻りを防ぐテストを追加しました。古い鍵を本当に無効化する操作、GitHub Secrets の変更、1Password の変更は、人間の承認後にだけ行います。

| 用語 | 中学生向け説明 |
| --- | --- |
| Cloudflare | Web サイトやデータベースを動かすクラウドサービス |
| API token | クラウドを操作するための鍵 |
| D1 | Cloudflare のデータベース |
| Workers | Cloudflare 上で動くバックエンドプログラム |
| revoke | 鍵を使えない状態にする操作 |
| GitHub Secrets | GitHub Actions が使う秘密の設定置き場 |

## Part 2: 技術者向け要約

`backend-ci.yml` は正本既存の `CF_TOKEN_D1_*` / `CF_TOKEN_WORKERS_*` に切替済み。`web-cd.yml` は current runtime 名 `CLOUDFLARE_API_TOKEN` を維持し、legacy value ではないことを operator-only evidence で確認する。
`CLOUDFLARE_API_TOKEN_DEPLOY_*` は導入しない。正本に既存 `CF_TOKEN_*` family があるため、第3の命名体系を増やすと drift になる。
Cloudflare revoke / GitHub secret mutation / 1Password mutation は Gate C として分離し、承認 marker の保存後だけ実行する。

## Part 3: 実装ステップ

1. Phase 1 で read-only inventory を取得し、backend / web / script / docs 参照を分類する。
2. Phase 5 で backend-ci の D1 / Workers deploy step を exact mapping で `CF_TOKEN_*` へ切り替える。
3. Phase 6 で `workflow-env-scope.test.sh` に backend step/env exact gate を追加し、負例試験を記録する。
4. Phase 9-11 で runtime green と operator approval を確認し、Gate C 後に legacy token を revoke する。

## Part 4: 検証コマンド

```bash
jq . docs/30-workflows/issue-718-legacy-cf-token-revocation/artifacts.json
jq . docs/30-workflows/issue-718-legacy-cf-token-revocation/outputs/artifacts.json
find docs/30-workflows/issue-718-legacy-cf-token-revocation/outputs/phase-12 -maxdepth 1 -type f | sort
rg -n 'DEPLOY_|placeholder-date|token identifier' docs/30-workflows/issue-718-legacy-cf-token-revocation
```

## Part 5: 既知制限

この wave では Cloudflare token revoke、GitHub Secrets mutation、1Password mutation、commit、push、PR を実行していない。
web-cd の current runtime 名 `CLOUDFLARE_API_TOKEN` は正本上維持されるため、名前だけで legacy 判定はできない。
legacy value の確認は operator-only で、値・URI・hash は evidence に記録しない。
