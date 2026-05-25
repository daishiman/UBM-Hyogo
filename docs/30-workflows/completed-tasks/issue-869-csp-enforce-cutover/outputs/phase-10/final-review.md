# Phase 10: 最終レビュー

`[実装区分: 最終レビュー仕様書]` `[task_id: TASK-AWSHH-FU-001-CSP-ENFORCE-CUTOVER]` `[spec_created]`

> 本 phase は「実施済みレビュー結果」ではなく、**実装完了後に判定する受入条件チェックリストと Phase 11 進入判定**を定義する仕様書である。

---

## 受入条件（Acceptance Criteria）チェックリスト

実装完了後に以下をすべて確認してからチェックを入れること。

### AC-01: CSP_MODE schema

- [ ] `EnvSchema` に `CSP_MODE: z.enum(["report-only","enforce"]).default("report-only")` が追加されていること
- [ ] `SecurityHeaderEnvSchema` が `EnvSchema.pick({ NEXT_PUBLIC_API_BASE_URL: true, CSP_MODE: true })` で定義されていること
- [ ] `getSecurityHeaderEnv` が `export function` として `env.ts` に追加されていること
- [ ] TC-01（default report-only）が green であること
- [ ] TC-02（enforce）が green であること
- [ ] TC-03（apiBaseUrl 伝播）が green であること
- [ ] TC-04（不正値 throw）が green であること

### AC-02: middleware ハードコード除去

- [ ] `middleware.ts` の `cspMode: "report-only"` ハードコードが除去されていること
- [ ] `buildSecurityHeaderConfig` が `getSecurityHeaderEnv()` を呼び出していること
- [ ] `getPublicEnv` の import が `middleware.ts` から削除されていること
- [ ] `cspMode: env.cspMode` / `apiBaseUrl: env.apiBaseUrl` に置き換わっていること

### AC-03: wrangler.toml 設定

- [ ] `[vars]` に `CSP_MODE = "report-only"` が追加されていること
- [ ] `[env.staging.vars]` に `CSP_MODE = "enforce"` が追加されていること
- [ ] `[env.production.vars]` に `CSP_MODE = "report-only"` が追加されていること

### AC-04: playwright smoke

- [ ] `security-headers.spec.ts` に `cspHeaderName` / `oppositeHeaderName` 導出ロジックが追加されていること
- [ ] 全テストケースの固定 `content-security-policy-report-only` 読み出しが `headers[cspHeaderName]` に置換されていること
- [ ] 各テストに `expect(headers[oppositeHeaderName]).toBeUndefined()` が追加されていること
- [ ] connect-src テスト（TC-08）が `headers[cspHeaderName]` を参照していること
- [ ] report-only モードで playwright 全テスト PASS であること
- [ ] `CSP_MODE=enforce` 注入で playwright 全テスト PASS であること

### AC-05: 品質ゲート（Phase 8）

- [ ] G-01 typecheck PASS
- [ ] G-02 lint PASS
- [ ] G-03 web vitest PASS
- [ ] G-04 playwright security-headers PASS（両モード）
- [ ] G-05 build PASS
- [ ] G-06 127.0.0.1:8888 焼き込み 0 件
- [ ] G-07 env access 不変条件（process.env 直接参照新規追加なし）
- [ ] G-08 lib API 不変（security-headers.ts 変更なし）
- [ ] G-09 design-token gate 非該当（NON_VISUAL）
- [ ] G-10 verify-pr-ready PASS

---

## blocker 判定

実装完了後、以下のいずれかに該当する場合は **Phase 11 への進入を禁止**し、実装を修正する。

| blocker 条件 | 対応 |
|-------------|------|
| TC-01〜TC-04 のいずれかが FAIL | `env.ts` の `CSP_MODE` schema / `getSecurityHeaderEnv` 実装を修正 |
| middleware.ts に `cspMode: "report-only"` ハードコードが残存 | 差替漏れを修正 |
| playwright TC-07 の `oppositeHeaderName` が undefined にならない | `buildSecurityHeaders` が両ヘッダを同時出力していないか確認。lib API の変更がないか確認 |
| G-01 typecheck FAIL | 型エラーを修正してから再実行 |
| G-05 build FAIL | OpenNext bundle エラーを修正 |
| G-06 8888 焼き込みが 1 件以上 | 即時修正必須（CI gate fail 原因） |
| G-10 verify-pr-ready FAIL | `pr-pre-flight-ci-gate-checklist.md` §1〜§5 を参照し修正 |

---

## MINOR 指摘（未タスク化方針）

以下は本タスクのスコープ外であり、Phase 11 完了後に別途 Issue / タスクとして扱う。blocker ではない。

| 指摘内容 | 関連 Issue / タスク | 方針 |
|---------|-------------------|------|
| report-to ディレクティブ（違反レポート集約先の明示） | issue #868 CSP Reporting-Endpoints | 別タスクで実装済みまたは予定。本タスクでは report-to を追加しない |
| production の enforce 実切替 | Phase 12 ops runbook（config-only） | `[env.production.vars]` の `CSP_MODE` を `"report-only"` から `"enforce"` へ変更する ops 手順として文書化する |
| CSP nonce 化（`'unsafe-inline'` 排除） | 将来タスク | report-only 観測期間後に別タスクで検討 |
| `apps/api` 側の同等セキュリティヘッダ追加 | 将来タスク | 本タスクは `apps/web` のみスコープ |
| `authOrigin` のハードコード（"https://accounts.google.com"） | 将来タスク | 本タスクスコープ外。env 化は別タスクで検討 |

---

## Phase 11 進入判定

以下をすべて満たすとき、Phase 11（スクリーンショット / evidence 収集）へ進入できる。

| 判定項目 | 合否 |
|---------|------|
| AC-01〜AC-05 の全チェック項目が checked | - |
| blocker 該当項目が 0 件 | - |
| MINOR 指摘の未タスク化方針が明確 | 上記テーブルに記録済み |

**NON_VISUAL タスクのため Phase 11 では以下の evidence を収集する**:

- `pnpm typecheck` / `pnpm lint` の実行ログ（exit code 0 確認）
- `pnpm --filter web test` の出力（TC-01〜TC-04 + 既存 security-headers PASS）
- playwright security-headers（report-only モード）実行ログ
- playwright security-headers（enforce モード `CSP_MODE=enforce`）実行ログ
- `pnpm build` 実行ログ（OpenNext bundle 生成成功）
- `bash scripts/verify-pr-ready.sh` 実行ログ（PASS）

スクリーンショット画像は収集しない（NON_VISUAL のため）。

---

## 30 種思考法 compact evidence

| カテゴリ | 適用した思考法 | 結論 |
|---------|--------------|------|
| 論理分析系 | 批判的・演繹・帰納 | middleware の `cspMode: "report-only"` ハードコードを除去し、env.ts 単一責務で管理する設計の正当性を確認 |
| 構造分解系 | 要素分解・MECE | 変更 1〜5 の依存順序を整理し、env.ts → middleware.ts → wrangler.toml → spec の順で実施することを確定 |
| メタ・抽象系 | ダブルループ | 「test 名に report-only が固定」という既存 playwright spec の問題を抽象化し、mode 追従ロジックで解決 |
| 発想・拡張系 | 水平思考 | `PLAYWRIGHT_TEST=1` の既存 `process.env` override ロジックを再利用し、新規 env injection 機構を追加しない |
| システム系 | 因果関係 | wrangler.toml → readRawEnv → getSecurityHeaderEnv → middleware → lib → HTTP response のデータフローを完全追跡 |
| 戦略・価値系 | トレードオン | staging = enforce / production = report-only とすることで、enforce の影響を staging で継続観測しながら production を安全に保つ |
| 問題解決系 | why | production enforce 実切替を「ops runbook（Phase 12）」として分離し、本タスクのコードレビュー対象から除外 |

---

## 4 条件チェック（実装後に記入）

| 条件 | 判定 |
|------|------|
| 矛盾なし（仕様間・コード間に矛盾がないこと） | - |
| 漏れなし（AC-01〜AC-05 が全変更ファイルをカバーしていること） | - |
| 整合性あり（env.ts / middleware.ts / wrangler.toml / spec の設計が一貫していること） | - |
| 依存関係整合（lib API 不変・D1 直接アクセスなし・process.env 直接参照なし） | - |
