[実装区分: 実装仕様書]

# Phase 11: 手動 smoke / 実測 evidence — issue-385-web-build-global-error-prerender-fix

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-385-web-build-global-error-prerender-fix |
| phase | 11 / 13 |
| wave | issue-385 |
| mode | serial |
| 作成日 | 2026-05-02 |
| 改訂日 | 2026-05-03 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_revised |

## NON_VISUAL 宣言

- visualEvidence: NON_VISUAL
- 適用条件: 本タスクは `apps/web` の `next-auth` top-level import が引き起こす build prerender 失敗の恒久解消であり、UI 画面差分は発生しない（lazy factory 化により build 成果物の振る舞いは runtime 等価）
- 代替 evidence: build-smoke.md / build-cloudflare-smoke.md / prerender-output-check.md / lazy-import-check.md（後述 4 種 + main.md）
- スクリーンショットを作らない理由: build 経路と route handler の lazy import 構造を構造的に確認する責務であり、UI 視覚要素の変化が責務対象ではないため
- 証跡の主ソース: 4 ゲート (typecheck / lint / test / build) + cloudflare build + grep / `ls` による静的構造確認

## 目的

Phase 5 で確定した Plan A（`auth.ts` の `getAuth()` lazy factory 化 + 4 route handler / `oauth-client.ts` の dynamic import 書き換え）を実コードに適用したのち、本 Phase で 9 段の実測手順を直列実行し、AC-1〜AC-9 を evidence で示す構成を定義する。本仕様書作成段階では実測値を取得しないため、すべての evidence ファイルに `evidence: PENDING_IMPLEMENTATION_FOLLOW_UP` を明記する。後続 implementation prompt が実走後に同ファイルを書き換える。

> **境界宣言**: 本 Phase の完了 = 「evidence 構成と PENDING テンプレ整備」。「実測 evidence 取得」は Phase 5 実装着手後に実走する。

## evidence ファイル構成（4 種 + main.md）

`outputs/phase-11/` 配下に以下 5 ファイルを配置する。

| ファイル | 内容 | 主要 AC |
| --- | --- | --- |
| `outputs/phase-11/main.md` | NON_VISUAL 宣言 / 代替 evidence 差分表 / 申し送り / 実測サマリ | — |
| `outputs/phase-11/build-smoke.md` | `pnpm build` 実行ログ抜粋と判定 | AC-1 / AC-3 |
| `outputs/phase-11/build-cloudflare-smoke.md` | `pnpm build:cloudflare` 実行ログ抜粋と判定 | AC-2 / AC-3 |
| `outputs/phase-11/prerender-output-check.md` | `apps/web/.open-next/worker.js` 等 build 成果物確認 | AC-2 |
| `outputs/phase-11/lazy-import-check.md` | `auth.ts` から next-auth top-level import が消えたことの grep 確認 | AC-6 / AC-7 / AC-8 |

## 実測 9 段手順（順序固定）

| # | 段 | コマンド | 取得 evidence | 判定 |
| - | --- | -------- | ------------- | ---- |
| 1 | 依存整合 | `mise exec -- pnpm install --force` | exit code を build-smoke.md の前提セクション | exit 0 |
| 2 | typecheck | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | build-smoke.md の前提セクション | AC-4 (exit 0) |
| 3 | lint | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | build-smoke.md の前提セクション | AC-5 (exit 0) |
| 4 | unit test | `mise exec -- pnpm --filter @ubm-hyogo/web test` | build-smoke.md の前提セクション | AC-9 (exit 0) |
| 5 | next build | `mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 \| tee outputs/phase-11/build-smoke.md` | build-smoke.md 本体 | AC-1 (exit 0) |
| 6 | cloudflare build | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare 2>&1 \| tee outputs/phase-11/build-cloudflare-smoke.md` | build-cloudflare-smoke.md 本体 | AC-2 (exit 0) |
| 7 | worker.js 生成確認 | `ls -la apps/web/.open-next/worker.js` | prerender-output-check.md | AC-2 (size > 0) |
| 8 | useContext null grep | `grep -c "Cannot read properties of null" outputs/phase-11/build-smoke.md outputs/phase-11/build-cloudflare-smoke.md` | 各 smoke ファイルの判定欄 | AC-3 (0 件) |
| 9 | top-level next-auth import grep | `rg -n '^import.*from "next-auth' apps/web/src/lib/auth.ts` | lazy-import-check.md | AC-6 (type-only 以外 0 件) |

> 段 1〜4 が FAIL した場合は段 5 以降を実走しない。段 5 / 6 が FAIL した場合は段 7 / 8 / 9 を実走するが PASS 判定しない。

## 1. `outputs/phase-11/build-smoke.md` テンプレ

```markdown
# build-smoke.md（PENDING_IMPLEMENTATION_FOLLOW_UP）

## 目的

実測 9 段手順の段 1〜5 結果を記録する。AC-1 / AC-3 / AC-4 / AC-5 / AC-9 の evidence。

## 前提（段 1〜4）

| 段 | コマンド | exit code | 判定 |
| - | -------- | --------- | ---- |
| 1 | `mise exec -- pnpm install --force` | (PENDING) | (PENDING) |
| 2 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | (PENDING) | AC-4 |
| 3 | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | (PENDING) | AC-5 |
| 4 | `mise exec -- pnpm --filter @ubm-hyogo/web test` | (PENDING) | AC-9 |

## 段 5: next build

\`\`\`bash
mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 | tee /tmp/web-build.log
echo "exit=$?"
grep -c "Cannot read properties of null" /tmp/web-build.log
\`\`\`

## 期待結果

- exit code: 0
- ログ末尾に `Compiled successfully` 系メッセージ
- route table に `/_global-error` / `/_not-found` が含まれ "✓" でマークされる
- `useContext` null grep: 0 件

## 実測（実装着手後に記入）

- evidence: PENDING_IMPLEMENTATION_FOLLOW_UP
- 実行日時 / 実行者 / ブランチ / commit:
- 採用方針: Plan A (lazy factory)
- exit code:
- ログ末尾抜粋（最後 30 行程度。secret 文字列は転記しない）:
- `useContext` null 検出件数:
- prerender route table 抜粋（`/_global-error` / `/_not-found` 行のみ）:

## 判定

- AC-1: PASS / FAIL（PASS = exit 0）
- AC-3: PASS / FAIL（PASS = `useContext` null 0 件）
- AC-4 / AC-5 / AC-9: PASS / FAIL（前提セクション参照）
```

## 2. `outputs/phase-11/build-cloudflare-smoke.md` テンプレ

```markdown
# build-cloudflare-smoke.md（PENDING_IMPLEMENTATION_FOLLOW_UP）

## 目的

実測 9 段手順の段 6 結果を記録する。AC-2 / AC-3 の evidence。

## 段 6: cloudflare build

\`\`\`bash
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare 2>&1 | tee /tmp/web-build-cf.log
echo "exit=$?"
grep -c "Cannot read properties of null" /tmp/web-build-cf.log
\`\`\`

## 期待結果

- exit code: 0
- `apps/web/.open-next/worker.js` が生成されている（段 7 で確認）
- `useContext` null grep: 0 件
- worker.js サイズが Cloudflare Workers 無料枠（gzip 後 1MB 等）の制約内であること（不変条件 #14）

## 実測（実装着手後に記入）

- evidence: PENDING_IMPLEMENTATION_FOLLOW_UP
- 実行日時 / 実行者 / ブランチ / commit:
- 採用方針: Plan A (lazy factory)
- exit code:
- ログ末尾抜粋（最後 30 行程度）:
- `useContext` null 検出件数:

## 判定

- AC-2: PASS / FAIL（PASS = exit 0）
- AC-3: PASS / FAIL
- 不変条件 #14: PASS / 要確認
```

## 3. `outputs/phase-11/prerender-output-check.md` テンプレ

```markdown
# prerender-output-check.md（PENDING_IMPLEMENTATION_FOLLOW_UP）

## 目的

段 7 として `apps/web/.open-next/worker.js` 生成確認と、参考として `apps/web/.next/server/app/` 配下の prerender 成果物を記録する。AC-2 の evidence。

## 段 7: worker.js 生成確認

\`\`\`bash
ls -la apps/web/.open-next/worker.js
find apps/web/.next/server/app -name "_global-error*" -o -name "_not-found*" 2>/dev/null
ls -la apps/web/.next/server/app/ | head -40
\`\`\`

## 期待結果

- `apps/web/.open-next/worker.js` が存在し size > 0
- `_global-error.html` / `_global-error.rsc` 等の prerender 出力が `.next/server/app/` 配下に存在
- `_not-found.html` 等の prerender 出力が同配下に存在

## 実測（実装着手後に記入）

- evidence: PENDING_IMPLEMENTATION_FOLLOW_UP
- 実行日時:
- `apps/web/.open-next/worker.js` size（bytes）:
- find 結果（ファイルパス一覧）:

## 判定

- AC-2 (worker.js 生成): PASS / FAIL
```

## 4. `outputs/phase-11/lazy-import-check.md` テンプレ

```markdown
# lazy-import-check.md（PENDING_IMPLEMENTATION_FOLLOW_UP）

## 目的

段 9 として `apps/web/src/lib/auth.ts` から `next-auth` top-level import が撤廃され lazy factory に移行したこと、`apps/web/src/lib/auth/oauth-client.ts` も同様に dynamic import 化されたことを構造的に確認する。AC-6 / AC-7 / AC-8 の evidence。

## 段 9: import 構造確認

\`\`\`bash
# auth.ts top-level import 検査（type-only は AC-6 上 OK）
rg -n '^import.*from "next-auth' apps/web/src/lib/auth.ts
rg -n '^import.*from "next-auth/providers' apps/web/src/lib/auth.ts
rg -n '^import.*from "next-auth/jwt' apps/web/src/lib/auth.ts

# oauth-client.ts top-level import 検査
rg -n '^import.*from "next-auth/react' apps/web/src/lib/auth/oauth-client.ts

# 4 route handler が getAuth() 経由で handlers / auth / signIn を取得しているか
rg -n 'await getAuth\(\)' apps/web/app/api/auth/\[\.\.\.nextauth\]/route.ts apps/web/app/api/auth/callback/email/route.ts 'apps/web/app/api/admin/[...path]/route.ts' 'apps/web/app/api/me/[...path]/route.ts'

# dependency 据置確認
rg -n '"next":|"react":|"react-dom":|"next-auth":' apps/web/package.json
\`\`\`

## 期待結果

- `auth.ts` の top-level value import: 0 件（`import type` のみ許容）
- `oauth-client.ts` の top-level `next-auth/react` value import: 0 件
- 4 route handler それぞれで `await getAuth()` が 1 件以上 hit
- `apps/web/package.json` の next / react / react-dom / next-auth は本タスク前と同一バージョン

## 実測（実装着手後に記入）

- evidence: PENDING_IMPLEMENTATION_FOLLOW_UP
- 実行日時:
- auth.ts top-level next-auth value import 検出件数:
- oauth-client.ts top-level next-auth/react value import 検出件数:
- 4 route handler の `await getAuth()` hit 件数（route 別）:
- next / react / react-dom / next-auth version diff（本タスク前後）:

## 判定

- AC-6: PASS / FAIL（PASS = top-level value import 0 件）
- AC-7: PASS / FAIL（PASS = 4 handler すべて lazy factory 経由 + typecheck PASS）
- AC-8: PASS / FAIL（PASS = 4 dependency version 不変）
```

## 5. `outputs/phase-11/main.md` テンプレ

```markdown
# Phase 11 main.md（PENDING_IMPLEMENTATION_FOLLOW_UP）

## NON_VISUAL 宣言

- visualEvidence: NON_VISUAL
- 適用条件: build 経路と route handler の lazy import 構造確認が責務。UI 視覚要素は変化しない
- 代替 evidence: build-smoke.md / build-cloudflare-smoke.md / prerender-output-check.md / lazy-import-check.md
- 証跡の主ソース: 4 ゲート stdout + cloudflare build stdout + `ls` / `grep` / `rg` の静的構造確認

## 代替 evidence 差分表

| シナリオ | 元前提 | 代替手段 | カバー範囲 | 申し送り先 |
| --- | --- | --- | --- | --- |
| S-1 build smoke | 画面再現 | build-smoke.md の stdout + `useContext` null grep | AC-1 / AC-3 / AC-4 / AC-5 / AC-9 | 09a / 09c deploy 経路 |
| S-2 cloudflare build smoke | 画面再現 | build-cloudflare-smoke.md の stdout | AC-2 / AC-3 | 09a / 09c deploy 経路 |
| S-3 worker.js 生成確認 | 画面再現 | prerender-output-check.md の `ls -la` 結果 | AC-2 | 09c production deploy |
| S-4 lazy factory 構造確認 | 画面再現 | lazy-import-check.md の `rg` 結果 | AC-6 / AC-7 / AC-8 | 将来の next-auth bump 時の regression 監視 |

## dev サーバ smoke（任意・推奨）

build PASS 後の追加保険として、`pnpm dev` 起動下で route handler の cold start 動作を 1 回だけ確認する。本 Phase の AC 判定には含めないが、lazy factory が runtime で正しく解決されることを確認する目的で実施推奨。

\`\`\`bash
mise exec -- pnpm --filter @ubm-hyogo/web dev
# 別ターミナルで
curl -i http://localhost:3000/api/auth/session
curl -i http://localhost:3000/api/admin/health   # 401 / 403 でも可（lazy factory が解決されればよい）
curl -i http://localhost:3000/api/me/profile     # 同上
\`\`\`

期待: 各 endpoint が 5xx で落ちず HTTP ステータス（200 / 401 / 403 / 404 等の妥当値）を返す。500 with `useContext` 系 stack trace が出た場合は Plan A の lazy factory 移行漏れを疑う。

## 保証範囲と保証外

- 保証する: 9 段 evidence による AC-1〜AC-9 の構造的証明、`useContext` null 非出現、worker.js 生成、auth.ts の top-level next-auth import 撤廃、dependency 据置
- 保証しない（下流委譲）: 実 deploy 成否 / runtime ユーザー体験 / Auth.js の OAuth callback 実走 / Magic Link メール送信実走

## 申し送り

- ブロック対象 follow-up（discovered-issues.md 参照）:
  - P11-PRD-003 fetchPublic service-binding 経路書き換え（本 build 緑化が前提）
  - P11-PRD-004 `/privacy` `/terms` ページ実装（本 build 緑化が前提）
  - `apps/web/wrangler.toml` の `PUBLIC_API_BASE_URL` / `INTERNAL_API_BASE_URL` 反映（本 build 緑化が前提）
- 09a-A-staging-deploy-smoke-execution: build 緑化後の staging deploy
- 09c-A-production-deploy-execution: build 緑化後の production deploy

## rollback 判断ポイント

| 失敗段 | 観測 | 判断 |
| - | --- | --- |
| 段 2 typecheck FAIL | `getAuth()` の戻り値型不整合 / route handler 側の型エラー | Plan A の auth.ts type 公開シグネチャを Phase 5 設計と突き合わせ、最小差分で修正。3 回失敗で実装中断・user 報告 |
| 段 5 next build FAIL & `useContext` null 残存 | 4 route handler のいずれかで top-level next-auth import が残っている | lazy-import-check.md の段 9 を先に実走して漏れ箇所を特定し、当該 handler を lazy factory 経由へ修正 |
| 段 5 next build FAIL & `useContext` null 非出現 | 別系統の build error（型 / lint 起因） | エラー種別を分離して個別対応。Plan A 自体の rollback 不要 |
| 段 6 cloudflare build FAIL のみ | `@opennextjs/cloudflare` 側の bundling 問題（ESM 解決）| ログを `outputs/phase-11/build-cloudflare-smoke.md` に保存し、Phase 12 unassigned-task に `@opennextjs/cloudflare` 周辺調査を follow-up 登録。Plan A 自体の rollback はしない |
| 段 9 lazy-import-check FAIL | 4 handler のいずれかで lazy 化漏れ | 該当 handler を Phase 5 ランブックに従い修正。3 回繰り返し失敗で Plan A 撤回・branch 破棄を user に提案 |

## 実測サマリ（実装着手後に記入）

- evidence: PENDING_IMPLEMENTATION_FOLLOW_UP
- AC-1 (build exit 0): PASS / FAIL
- AC-2 (build:cloudflare exit 0 + worker.js 生成): PASS / FAIL
- AC-3 (`useContext` null 非出現): PASS / FAIL
- AC-4 (typecheck exit 0): PASS / FAIL
- AC-5 (lint exit 0): PASS / FAIL
- AC-6 (auth.ts top-level next-auth import 0 件): PASS / FAIL
- AC-7 (4 handler が lazy factory 経由 + typecheck PASS): PASS / FAIL
- AC-8 (next / react / react-dom / next-auth version 不変): PASS / FAIL
- AC-9 (`pnpm test` exit 0): PASS / FAIL
- 採用方針確定: Plan A (lazy factory)
```

## discovered-issues.md（follow-up 申し送り）

`outputs/phase-11/` 直下に置かず、Phase 12 `unassigned-task-detection.md` の素材として本 Phase 11 main.md の「申し送り」セクションに集約する。Issue #385 ブロック対象は次の 5 件:

| follow-up ID | 内容 | 関連 |
| --- | --- | --- |
| FU-1 | P11-PRD-003 fetchPublic service-binding 経路書き換え | 本 build 緑化が前提 |
| FU-2 | P11-PRD-004 `/privacy` `/terms` ページ実装 | 本 build 緑化が前提 |
| FU-3 | `apps/web/wrangler.toml` の `PUBLIC_API_BASE_URL` / `INTERNAL_API_BASE_URL` 反映 | 本 build 緑化が前提 |
| FU-4 | （条件付き）段 6 のみ FAIL 時の `@opennextjs/cloudflare` bundling 調査 | 段 6 失敗時 |
| FU-5 | （監視）vercel/next.js #86178 / #84994 / #85668 / #87719 / nextauthjs/next-auth #13302 上流 fix 追跡と lazy factory revert 評価 | 長期 |

## 自走禁止操作 (approval gate)

- 本 Phase の仕様書作成では 9 段を実走しない
- 実走時の `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `pnpm test` / `pnpm build` / `pnpm build:cloudflare` は Phase 5 実装着手後（user 承認後）にのみ実行
- staging / production deploy は本タスクで実行しない（下流 09a / 09c）
- secret 文字列を build ログ抜粋に含めない（含まれていた場合は redact）
- commit / push / PR は実行しない

## 変更対象ファイル一覧

| ファイル | 本 Phase での変更 |
| --- | --- |
| 仕様書 | `outputs/phase-11/main.md` + 補助 4 ファイル（build-smoke.md / build-cloudflare-smoke.md / prerender-output-check.md / lazy-import-check.md）追加 |
| 実装ファイル | なし |

## 関数 / コンポーネントシグネチャ

本 Phase では新規関数を定義しない。Phase 5 で確定する `getAuth()` の戻り値型 (`{ handlers, auth, signIn, signOut }` 等) を AC-7 / 段 9 で参照のみ行う。

## ローカル実行コマンド（実装着手後の実走時）

```bash
# 段 1: 依存整合
mise exec -- pnpm install --force

# 段 2-4: typecheck / lint / test
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm --filter @ubm-hyogo/web test

# 段 5: next build
mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 | tee outputs/phase-11/build-smoke.md
echo "exit=$?"

# 段 6: cloudflare build
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare 2>&1 | tee outputs/phase-11/build-cloudflare-smoke.md
echo "exit=$?"

# 段 7: worker.js 生成確認
ls -la apps/web/.open-next/worker.js | tee outputs/phase-11/prerender-output-check.md

# 段 8: useContext null grep
grep -c "Cannot read properties of null" outputs/phase-11/build-smoke.md outputs/phase-11/build-cloudflare-smoke.md

# 段 9: lazy import 構造確認
rg -n '^import.*from "next-auth' apps/web/src/lib/auth.ts | tee outputs/phase-11/lazy-import-check.md
rg -n '^import.*from "next-auth/react' apps/web/src/lib/auth/oauth-client.ts | tee -a outputs/phase-11/lazy-import-check.md
rg -n 'await getAuth\(\)' apps/web/app/api/auth/\[\.\.\.nextauth\]/route.ts apps/web/app/api/auth/callback/email/route.ts 'apps/web/app/api/admin/[...path]/route.ts' 'apps/web/app/api/me/[...path]/route.ts' | tee -a outputs/phase-11/lazy-import-check.md
```

## 実行タスク

1. NON_VISUAL 宣言を行い、スクリーンショットを作らない理由を明記する。完了条件: visualEvidence / 適用条件 / 代替 evidence / 主ソースが本 Phase に記載される。
2. 4 evidence ファイル + main.md のテンプレを定義する。完了条件: 各テンプレに「実行コマンド / 期待結果 / 実測欄 / 判定」が記載される。
3. すべての evidence ファイルに `evidence: PENDING_IMPLEMENTATION_FOLLOW_UP` を明記する。完了条件: 5 ファイルすべてに記載される。
4. follow-up FU-1〜FU-5 を main.md 申し送りセクションに集約する。完了条件: ブロック対象 3 件 + 条件付き 1 件 + 監視 1 件が列挙される。
5. 実装着手後の 9 段実走コマンド全体を記述する。完了条件: コピペ実行可能な block が揃う。
6. rollback 判断ポイント表を main.md に記述する。完了条件: 段 2 / 5 / 6 / 9 の失敗パターンと判断が揃う。

## 参照資料

- Phase 1（要件 / AC ↔ evidence path / approval gate）
- Phase 2（Plan A 採用 / fallback 不採用理由）
- Phase 5（実装ランブック / `getAuth()` シグネチャ）
- Phase 9（4 ゲート手順 / 失敗判定フロー）
- Phase 10（4 条件評価）
- `.claude/skills/task-specification-creator/references/phase-template-phase11.md`（NON_VISUAL 縮約テンプレ）
- CLAUDE.md § よく使うコマンド

## 実行手順

- 対象 directory: `docs/30-workflows/issue-385-web-build-global-error-prerender-fix/`
- 本仕様書作成では 9 段を実走しない
- アプリケーションコード変更、deploy、commit、push、PR、dependency 更新を本 Phase で実行しない
- secret 文字列を本 Phase の outputs に転記しない

## 統合テスト連携

- 上流: Phase 5（Plan A 実装ランブック）/ Phase 9（4 ゲート手順）/ Phase 10（残課題）
- 下流: Phase 12（implementation-guide.md / unassigned-task-detection.md / close-out 記録）/ follow-up（FU-1〜FU-5）/ 09a / 09c

## 多角的チェック観点

- 不変条件 #14: worker.js サイズを `ls -la` で確認し無料枠内であることを示す
- 不変条件 #5: build 経路のみで `apps/api` / D1 への副作用ゼロ
- 不変条件 #16: build ログ抜粋から secret 文字列を redact
- 未実装 / 未実測を PASS と扱わない: spec 段階の本 Phase は PENDING_IMPLEMENTATION_FOLLOW_UP を明示
- pre-existing バグの恒久解消: `useContext` null 非出現を grep で構造的に証明、加えて lazy-import-check.md で構造的退行防止を担保

## DoD（Definition of Done）

- NON_VISUAL 宣言が記載されている
- 4 evidence ファイル + main.md のテンプレが定義されている
- すべての evidence ファイルに `evidence: PENDING_IMPLEMENTATION_FOLLOW_UP` が明記されている
- follow-up FU-1〜FU-5 が main.md 申し送りに集約されている
- 実装着手後の 9 段実走コマンド全体が記述されている
- rollback 判断ポイントが段 2 / 5 / 6 / 9 ごとに記述されている

## サブタスク管理

- [ ] NON_VISUAL 宣言を記述した
- [ ] build-smoke.md テンプレを定義した
- [ ] build-cloudflare-smoke.md テンプレを定義した
- [ ] prerender-output-check.md テンプレを定義した
- [ ] lazy-import-check.md テンプレを定義した
- [ ] main.md に NON_VISUAL 宣言・申し送り・rollback 判断ポイントを記述した
- [ ] 全 evidence ファイルに PENDING_IMPLEMENTATION_FOLLOW_UP を明記した
- [ ] follow-up FU-1〜FU-5 を集約した
- [ ] 9 段実走コマンドを記述した

## 成果物

- outputs/phase-11/main.md（NON_VISUAL 宣言 / 代替 evidence 差分表 / dev smoke / 申し送り / rollback / 実測サマリ PENDING）
- outputs/phase-11/build-smoke.md（段 1〜5 evidence テンプレ PENDING）
- outputs/phase-11/build-cloudflare-smoke.md（段 6 evidence テンプレ PENDING）
- outputs/phase-11/prerender-output-check.md（段 7 evidence テンプレ PENDING）
- outputs/phase-11/lazy-import-check.md（段 9 evidence テンプレ PENDING）

## 完了条件

- evidence 構成（4 ファイル + main.md）が確定し、各テンプレに実行コマンド / 期待結果 / 実測欄 / 判定が揃っている
- すべての evidence ファイルに PENDING_IMPLEMENTATION_FOLLOW_UP が明記され、後続 implementation prompt が書き換える前提が示されている
- ブロック対象 follow-up（FU-1〜FU-5）が main.md 申し送りに集約され、Phase 12 unassigned-task-detection.md の素材になっている
- rollback 判断ポイントが段 2 / 5 / 6 / 9 のいずれかで Plan A の継続 / 撤回判断を可能にする粒度で記述されている

## タスク 100% 実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 9 段を実走していない
- [ ] 実装、deploy、commit、push、PR、dependency 更新を実行していない
- [ ] secret 値を記録していない

## 次 Phase への引き渡し

Phase 12（ドキュメント更新）へ次を渡す:

- evidence 構成（5 ファイル）と PENDING ステータス
- ブロック対象 follow-up FU-1〜FU-5（unassigned-task-detection.md 素材）
- NON_VISUAL 宣言と「手順記述完了 ≠ build 成功 PASS」の境界文言（implementation-guide.md と close-out 記録の双方に明記）
- Plan A (lazy factory) 確定方針と、9 段実走コマンド一式
- rollback 判断ポイント（Plan A 撤回トリガを含む）
