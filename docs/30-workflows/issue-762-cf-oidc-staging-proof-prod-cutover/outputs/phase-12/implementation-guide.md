# Implementation Guide

## Part 1: 中学生レベルの説明

OIDC は、長く使えるマスターキーではなく、短い時間だけ使える入館証のようなものです。今は Cloudflare が GitHub Actions から Workers をデプロイするためのその入館証ルートを公式に説明していないため、実際の切替はまだしません。

subject claim pin は、入館証に「どのリポジトリ」「どのブランチ」「どの環境」「どのイベント」から来たかを書くルールです。`verify-claim-pin.sh` は、その4つが期待通りかを実トークンなしで確認します。

observation window は、切替後に古いマスターキー経路が誤って使われていないか見る期間です。このサイクルでは、将来その確認を走らせるための manual workflow だけを置きます。

## Part 2: 技術手順

1. `scripts/oidc/verify-claim-pin.sh` を追加し、`repository=daishiman/UBM-Hyogo`、`ref/environment` ペア、`event_name=push` を dry-run で検証する。
2. `scripts/oidc/__tests__/verify-claim-pin.spec.sh` で PASS / mismatch / argument error の8ケースを固定する。
3. `scripts/redaction-check.sh` に JWT-like token regex と `cloudflare-aud` literal check を追加する。
4. `scripts/__tests__/redaction-check.test.sh` に JWT / `cloudflare-aud` / integrity false-positive 回避ケースを追加する。
5. `.github/workflows/oidc-observation-window.yml` を `workflow_dispatch` only / `contents: read` only で追加する。
6. `.github/workflows/web-cd.yml` の staging / production deploy step 直前に current safe baseline comment を追加する。
7. `deployment-secrets-management.md` に Issue #762 G1-G4 gate を同期する。

## Verification

```bash
bash scripts/oidc/__tests__/verify-claim-pin.spec.sh
bash scripts/__tests__/redaction-check.test.sh
grep -c "NOTE(issue-762)" .github/workflows/web-cd.yml
grep -n "id-token" .github/workflows/web-cd.yml .github/workflows/oidc-observation-window.yml
pnpm indexes:rebuild
```
