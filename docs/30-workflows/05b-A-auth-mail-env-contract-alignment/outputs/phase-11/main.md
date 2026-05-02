# Output Phase 11: NON_VISUAL readiness evidence

## NON_VISUAL 宣言

- visualEvidence: NON_VISUAL
- 適用条件: UI 差分なし / コード差分なし / staging 実投入が user 承認待ち
- 代替 evidence: `env-name-grep.md` / `secret-list-check.md` / `magic-link-smoke-readiness.md`

## NON_VISUAL 適用階層

| 階層 | 適用 | 内容 |
| --- | --- | --- |
| L1: 型 | 対象外 | TS 差分なし、`pnpm typecheck` 不要 |
| L2: lint / boundary | 対象外 | コード差分なし |
| L3: in-memory test | 対象外 | Magic Link send 振る舞いは 05b 本体の責務 |
| L4: grep / config snapshot | 必須 | 旧名残存ゼロ / 正本参照 / Cloudflare name 集合 |

## 補助 evidence 3 ファイル

| ファイル | 役割 |
| --- | --- |
| `env-name-grep.md` | 旧 env 名 (`RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `SITE_URL`) が正本契約ファイルに残存しないことを rg で確認するテンプレ |
| `secret-list-check.md` | Cloudflare Secrets / Variables の **key 名のみ**確認するテンプレ。値・rotation 日時・hash を記録しない |
| `magic-link-smoke-readiness.md` | staging 実送信前の readiness 判定（secret name + Variable name の揃いのみ確認） |

## 代替 evidence 差分表

| シナリオ | 元前提 | 代替手段 | カバー範囲 | 申し送り先 |
| --- | --- | --- | --- | --- |
| S-1 旧名残存ゼロ確認 | 正本契約ファイル grep | env-name-grep.md の rg 結果 | 仕様整流の構造的整合 | 09a CI gate |
| S-2 Cloudflare secret 配置確認 | wrangler secret list 実行 | secret-list-check.md の key 名集合 | name parity（値非確認） | 09a / 09c |
| S-3 staging Magic Link smoke | 実送信 200 + 受信 | magic-link-smoke-readiness.md（readiness のみ） | 実送信前の env 揃い | 09a 実送信 smoke |

## 保証範囲と保証外

- 保証する: 仕様整流方針の整合 / Cloudflare secret name parity 手順 / readiness 判定手順
- 保証しない（下流委譲）: 実 secret 値の正しさ / 実送信成功 / 受信トレイ到達 / production deploy

## 境界宣言

> Phase 11 output completed = **readiness template only; smoke not run**. This is **not production 実測 PASS**.

本 workflow は deploy / Cloudflare secret 操作 / `POST /auth/magic-link` 実行 / 受信トレイ確認 / provider ダッシュボード確認 / commit / push / PR を実行していない。

## 自走禁止操作

- Cloudflare Secrets / Variables への実値投入（user 承認後・下流 09a / 09c）
- `bash scripts/cf.sh secret put` 実行
- `op read` 出力を evidence / shell history に残す
- `POST /auth/magic-link` を staging / production に対して実行
- 旧名 secret の `secret delete` 実行（検出時の rollback 計画は Phase 5 runbook 参照）

## 申し送り

- **09a-A-staging-deploy-smoke-execution**: secret 実投入後の `POST /auth/magic-link` 200 + 受信トレイ到達を実測
- **09c-A-production-deploy-execution**: production secret 投入後の fail-closed 検証（未投入時 502 `MAIL_FAILED`）

## 次 Phase への引き渡し

- 補助 3 ファイル構成 / 「手順記述完了 ≠ production 実測 PASS」境界文言
- 申し送り対象（09a / 09c）と内容
- key 名・op:// 参照のみで構成する記録ルール
