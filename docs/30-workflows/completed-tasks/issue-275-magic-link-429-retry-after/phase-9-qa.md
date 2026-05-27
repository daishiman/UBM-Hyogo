# Phase 9: QA

> 実装区分: **実装完了仕様書**（local deterministic QA 完了。実 API/browser smoke は user-gated）

## 1. 機能 QA チェックリスト

- [x] `POST /api/auth/magic-link` の 429 contract は API middleware spec で既存確認済み。実 API 連打 smoke は外部メール送信を伴うため user-gated
- [x] 429 typed error 受信時に UI button が disabled + countdown ラベル表示（component spec）
- [x] countdown が 0 まで進むと button が再 enable（既存 cooldown component spec）
- [x] `Retry-After` ヘッダー値が UI 表示 cooldown と一致（client spec header precedence + component spec retryAfterSec）
- [x] 429 受信時 URL は `/login` のまま（`replaceLoginState` / `router.refresh` 不呼び出しを component spec で検証）
- [x] 200 OK 経路は regression なし（state=sent / 60s 固定 cooldown）
- [x] 4xx / 5xx（非 429）は既存通り `?state=error&error=...` に遷移

## 2. 非機能 QA

- [x] `pnpm typecheck` PASS
- [x] `pnpm lint` PASS
- [x] `pnpm --filter @ubm-hyogo/web test` PASS（既存 + 新規）
- [x] `pnpm --filter @ubm-hyogo/web build` PASS（`next build --webpack`）
- [x] `apps/web/.open-next/` bundle は build PASS 境界で確認。追加の bundle grep は Phase 13 pre-flight 側で再確認
- [x] coverage delta ≥ 0（focused specs 追加で対象範囲の branch を増強）
- [x] `bash scripts/verify-pr-ready.sh` 実行済み。`verify:phase12-compliance` / `gate-metadata:validate` は PASS。`indexes:rebuild drift` は再生成済み index が未コミットのため FAIL（commit 禁止境界により Phase 13 user approval 後に解消）

## 3. セキュリティ QA

- [x] `Retry-After` ヘッダー値の Number(...) 解釈で `Infinity` / 巨大値が UI に渡らない（`Number.isFinite + Number.isInteger + n >= 1` でガード）
- [x] body parse 失敗時に raw response を `replaceLoginState("error", ..., { error })` 経由で URL に漏らさない（429 は早期 return）
- [x] `MagicLinkRateLimitedError.message` が PII（メールアドレス等）を含まない（コンストラクタで `"rate_limited"` 固定）

## 4. レビュー観点

- [x] `MagicLinkRateLimitedError extends MagicLinkRequestError` の継承関係が維持されている
- [x] catch 早期 return で `setSubmitting(false)` が `finally` 経由でリセットされている
- [x] テストファイルは `*.spec.{ts,tsx}` で配置（不変条件 #8）
- [x] `process.env.*` 直参照を追加していない（不変条件: env.ts 経由のみ）
