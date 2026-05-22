# Phase 6: 異常系検証

## 1. 異常ケース一覧

| ID | ケース | 期待挙動 | 検証手段 |
| --- | --- | --- | --- |
| EX-1 | `SENTRY_DSN_WEB` 未投入で staging deploy | `instrumentation.ts` の `register()` が `getEnv().SENTRY_DSN` 不在を判定し silent skip。staging 起動成功・curl 200 だが Sentry event 0 件 | secret list 確認 → curl 200 → dashboard 0 件確認 |
| EX-2 | `SENTRY_DSN_WEB` に malformed URL | `EnvSchema.parse()` が throw → `error.tsx` で 500 レスポンス | 単体テスト + staging では予防的に投入前 `op read` で URL 妥当性確認 |
| EX-3 | `NEXT_PUBLIC_SENTRY_DSN` 未投入 | client SDK init skip。browser event 0 件、server event のみ受信 | dashboard browser event 0 件確認後、secret 追加投入で復旧 |
| EX-4 | server / browser 双方の二重 init 発生（regression） | 親 task-03 の `__ubmSentryInitialized__` ガードが破綻 | dashboard で同 release 内に同一 init log の event 2 件以上検出 → regression として親 task-03 へ戻す |
| EX-5 | `.open-next/worker.js` に `requestIdleCallback` が再混入 | grep gate FAIL | bundle 解析（next.config の `serverExternalPackages` / `experimental.serverComponentsExternalPackages`）→ 親 task-03 へ regression |
| EX-6 | 一時 throw route `force_error=1` が staging に残置 | production 反映時に観測 noise を発生させる | `rg 'force_error' apps/web/src` を Step 9 直前に必須実行、0 件確認 |
| EX-7 | secret 値が PR body / commit message / log にコピペされた | NFR-1 違反 | `rg 'https://.*@.*[.]ingest[.]sentry[.]io'` を Phase 13 直前に必須実行 |
| EX-8 | staging Sentry project と production Sentry project の DSN を取り違え | 環境ラベル混入 | 1Password item 名で staging / production を分離（NFR-2）+ dashboard 受信 event の `environment` tag 確認 |
| EX-9 | staging deploy 成功するが SSR で 500 | 親 task-03 の SDK 分離崩れ。`apps/web/src/app/error.tsx` が補足するが運用上 NG | curl が 200 でない場合、deploy log + Workers tail で stack trace 取得 → 親 task-03 へ regression |
| EX-10 | `cf.sh secret put` で TTY 経由のクリップボード漏洩 | 値がローカル shell history に残る | stdin pipe（`op read | cf.sh secret put`）に統一、`history -d` 不要にする |

## 2. 異常系テスト追加

| テスト | ファイル | ケース |
| --- | --- | --- |
| EX-2 単体 | `apps/web/src/lib/__tests__/env.test.ts` | malformed URL で throw（phase-04 §2.1 既掲載） |
| EX-1 ランタイム | Phase 11 manual | DSN 未投入時に `/` 200 を返す（degraded 動作） |

## 3. recovery / rollback 手順

| 異常 | 復旧手順 |
| --- | --- |
| staging deploy 失敗 | `bash scripts/cf.sh rollback <prev_version_id> --config apps/web/wrangler.toml --env staging` |
| secret 誤投入 | `bash scripts/cf.sh secret delete <name> --env <env>` → 正値で再 put |
| 一時 throw route 残置 | 該当 commit を revert → staging 再 deploy → grep 確認 |
| dashboard で誤環境 event 混入 | Sentry project 設定で event 削除（または期間外として扱う）+ 1Password item 分離を再確認 |

## 4. 監視 / 検知

- staging deploy 後 30 分の Sentry dashboard 観測ウィンドウを設定
- ウィンドウ内で server / browser event が観測できなければ EX-1 / EX-3 / EX-9 を逐次切り分け
- production secret は投入のみ（deploy なし）のため、production dashboard には event が出ないことが正常
