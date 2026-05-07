# Phase 11: 実装 smoke / 代替 evidence 取得

> 実装区分: 実装仕様書（CONST_004 デフォルト適用）
> 元タスク: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-02-w2-par-wrangler-env-injection.md`
> Phase 11 種別判定: **NON_VISUAL（runtime / config / platform）**
> 出力先ベース: `docs/30-workflows/task-02-w2-wrangler-env-injection/outputs/phase-11/`

---

## 0. タスク種別判定

| 判定軸 | 値 | 根拠 |
|--------|----|----|
| `taskType` | `implementation` | wrangler.toml / env.ts の実コード変更を含む |
| `visualEvidence` | `NON_VISUAL` | UI 描画差分なし。プラットフォーム/設定整備のみ |
| `ui_routes` | `[]` | renderer / route の追加・変更なし |
| 採用テンプレ | API/Platform smoke evidence + docs-only NON_VISUAL 縮約テンプレ | phase-template-phase11.md §`docs-only / NON_VISUAL 縮約テンプレ` |

> **screenshot は生成禁止**（false green 防止）。代替 evidence として 5 種類の runtime/build ログを取得する。

---

## 1. screenshot N/A 理由表

| screenshot 不要理由 | 詳細 |
|---------------------|------|
| UI コンポーネント追加・変更なし | `apps/web/src/app/**/page.tsx` / `layout.tsx` を変更しない |
| renderer 描画パスへの影響なし | `getEnv()` は server-side only、client bundle には `getPublicEnv()` の `NEXT_PUBLIC_*` 経由のみ露出 |
| Tailwind / OKLch token 非関連 | task-08 / task-09 のスコープ外 |
| ユーザ可視振る舞いの変更なし | env 切替によりリンク先 URL は変わるが、UI レンダリング自体は変わらない |

---

## 2. 必須 outputs（NON_VISUAL 縮約テンプレ準拠）

| ファイル | 役割 | 必須最小内容 |
|---------|------|-------------|
| `outputs/phase-11/main.md` | Phase 11 トップ index | テスト方式（NON_VISUAL）/ 状態語彙 / 必須 outputs 一覧 / 状態語彙適用根拠 |
| `outputs/phase-11/manual-smoke-log.md` | smoke 実行記録 | 実行コマンド / 期待結果 / 実測 / PASS or FAIL を表形式で |
| `outputs/phase-11/link-checklist.md` | 仕様書 → 実装 / fixture / 後続 task 参照リンクの整合性 | 参照元 → 参照先 / 状態（OK / Broken）の表 |

### 状態語彙

`main.md` 冒頭に次のいずれかを明記する:

- **`PASS_RUNTIME_SYNCED`**: §3 の 5 種類 evidence が全て取得済み（local 起動 / dry-run / build / vitest / grep zero）
- **`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`**: 仕様書 contract 完了、staging dry-run のみ未取得（user 承認 gate 後段に持ち越し）

`PASS` 単独表記は禁止。

---

## 3. 代替 evidence 5 種類（取得手順）

### 3.1 `outputs/phase-11/evidence/wrangler-dev-log.txt`

ローカル `wrangler dev` 起動時の env 注入ログ抜粋。

```bash
# 事前準備: .dev.vars を 1Password 参照から実体化
cp apps/web/.dev.vars.example apps/web/.dev.vars
op inject -i apps/web/.dev.vars -o apps/web/.dev.vars

# 起動（30秒程度で打ち切り、ログを抜粋して保存）
bash scripts/cf.sh dev --config apps/web/wrangler.toml \
  2>&1 | tee outputs/phase-11/evidence/wrangler-dev-log.txt
```

期待行（最低限 1 件以上含むこと）:

- `Using vars defined in .dev.vars`
- `NEXT_PUBLIC_API_BASE_URL`（値は redact 可）
- `ENVIRONMENT = "local"`

> **redact ルール**: `SENTRY_DSN_WEB` / `AUTH_SECRET` の値は必ず `***REDACTED***` に置換して保存する。

### 3.2 `outputs/phase-11/evidence/staging-dry-run.txt`

staging deploy の dry-run 出力。

```bash
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run \
  2>&1 | tee outputs/phase-11/evidence/staging-dry-run.txt
```

期待: exit 0 / `[env.staging.vars]` セクションのキーが `--dry-run` 出力に列挙される / Cloudflare API への実 PUT は発生しない。

### 3.3 `outputs/phase-11/evidence/build-output.txt`

OpenNext for Cloudflare ビルドの抜粋。

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build \
  2>&1 | tee outputs/phase-11/evidence/build-output.txt
```

期待: `▲ Next.js` のビルド完了 / `@opennextjs/cloudflare` の bundling 完了 / `NEXT_PUBLIC_API_BASE_URL` の hard-coded fallback `127.0.0.1:8888` が含まれない。

### 3.4 `outputs/phase-11/evidence/env-test-output.txt`

vitest による `env.test.ts` の実行ログ。

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test src/lib/__tests__/env.test.ts --run \
  2>&1 | tee outputs/phase-11/evidence/env-test-output.txt
```

期待ケース（元タスク §9.1 を再掲）:

| # | ケース | 期待 |
|---|--------|------|
| 1 | `getEnv` が必須キーを正しく解釈する | PASS |
| 2 | `NEXT_PUBLIC_API_BASE_URL` が URL 形式でないと throw | `ZodError` |
| 3 | `SENTRY_TRACES_SAMPLE_RATE` が 0..1 範囲外で throw | `ZodError` |
| 4 | secret 欠落でも非 secret は parse 通る | PASS |

vitest 件数を `manual-smoke-log.md` に主証跡として記載（例: `4/4 PASS`）。

### 3.5 `outputs/phase-11/evidence/grep-fallback-zero.txt`

ビルド時 fallback `127.0.0.1:8888` の撲滅証跡。

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec rg '127\.0\.0\.1:8888' \
  apps/web/src apps/web/next.config.ts apps/web/wrangler.toml \
  > outputs/phase-11/evidence/grep-fallback-zero.txt 2>&1 \
  || echo "GREP_ZERO_HITS" >> outputs/phase-11/evidence/grep-fallback-zero.txt
```

期待: 出力末尾に `GREP_ZERO_HITS` が記録され、検出件数 0 が証明される。

---

## 4. `manual-smoke-log.md` 必須メタ

- 証跡の主ソース: 上記 §3.4 vitest 件数（例: `4/4 PASS`）
- screenshot 不在理由: `NON_VISUAL`（platform/runtime config タスク）
- 実行日時 / 実行者（worktree branch 名）
- 各 evidence ファイルへの相対 path

実行表テンプレ:

| # | 確認項目 | 実行コマンド | 期待 | 実測 | PASS/FAIL | evidence path |
|---|----------|--------------|------|------|-----------|---------------|
| 1 | wrangler dev で env 注入確認 | `bash scripts/cf.sh dev ...` | local キーが注入される | （実値） | PASS | `evidence/wrangler-dev-log.txt` |
| 2 | staging dry-run 通過 | `bash scripts/cf.sh deploy --env staging --dry-run` | exit 0 | （実値） | PASS | `evidence/staging-dry-run.txt` |
| 3 | build 通過 | `pnpm --filter @ubm-hyogo/web build` | exit 0 | （実値） | PASS | `evidence/build-output.txt` |
| 4 | env vitest 全 pass | `pnpm --filter @ubm-hyogo/web test ... --run` | 4/4 PASS | （実値） | PASS | `evidence/env-test-output.txt` |
| 5 | fallback 焼き込み 0 件 | `rg '127\.0\.0\.1:8888'` | 0 hits | （実値） | PASS | `evidence/grep-fallback-zero.txt` |

---

## 5. `link-checklist.md` 必須項目

| 参照元 | 参照先 | 状態 |
|--------|--------|------|
| 元タスク §3 変更対象ファイル表 | `apps/web/wrangler.toml` 実体 | OK / Broken |
| 元タスク §7 関数シグネチャ | `apps/web/src/lib/env.ts` 実体の `getEnv` export | OK / Broken |
| 元タスク §9.1 テスト表 | `apps/web/src/lib/__tests__/env.test.ts` テストケース | OK / Broken |
| 本 phase-11 §3.1-3.5 | `outputs/phase-11/evidence/*.txt` 5 ファイル | OK / Broken |
| 後続 task-04 / task-05 / task-11 | `getEnv()` 公開 API（`apps/web/src/lib/env.ts` export） | OK / Broken |
| CLAUDE.md `scripts/cf.sh` 経由ルール | §3 全コマンドが `bash scripts/cf.sh` 経由であること | OK / Broken |

---

## 6. 完了条件（Phase 11 close 条件）

- [ ] `outputs/phase-11/main.md` 作成済（状態語彙明記）
- [ ] `outputs/phase-11/manual-smoke-log.md` 作成済（5 行 PASS）
- [ ] `outputs/phase-11/link-checklist.md` 作成済（全行 OK）
- [ ] `outputs/phase-11/evidence/` 配下に 5 ファイル存在
- [ ] secret 値は redact 済（`SENTRY_DSN_WEB` / `AUTH_SECRET` の実値が evidence に含まれない）
- [ ] screenshot 系ファイル（`screenshot-plan.json` / `*.png`）を **生成していない**

> Phase 11 は Phase 12 ドキュメント更新の前段。本 phase 完了後に Phase 12 へ進む。
