# タスク仕様書: Issue #630 — Authenticated /profile Lighthouse a11y measurement

[実装区分: 実装仕様書]

判定根拠: 本タスクは LHCI に authenticated `/profile` の a11y 計測ジョブを増設するために、
(1) LHCI 用 storageState / session cookie を生成する script、
(2) LHCI puppeteer pre-launch script、
(3) 新規 `lighthouserc.authenticated.json`、
(4) `.github/workflows/lighthouse.yml` の二段実行化、
(5) 既存 `lighthouserc.json` 側 `/profile` の扱い整理（Q-02 決定を踏まえた除外）
の 5 系統のコード変更を伴う。CONST_004 のデフォルトに従い実装仕様書として作成する。

Issue #630 は CLOSED（closedAt: 2026-05-12T06:26:21Z、2026-05-13 再確認）。
本 workflow は「CLOSED issue の未同期仕様を正本化し、同一 wave で local implementation まで進める successor」として扱い、PR 本文は `Refs #630` を使用する。
過去調査: `docs/30-workflows/completed-tasks/3a-lighthouse-ci/outputs/phase-12/unassigned-task-detection.md` で EXT-X1 が unassigned として明示されていた。2026-05-13 時点では Issue #630 が CLOSED 済みのため、本 root は issue を reopen せず local implementation + runtime pending として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-630-authenticated-profile-lhci-a11y |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/630 |
| 親タスク | `docs/30-workflows/completed-tasks/3a-lighthouse-ci/` |
| 関連 | `docs/30-workflows/e2e-quality-uplift/backlog.md` (EXT-X1)、`docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/` |
| 配置先 | `docs/30-workflows/issue-630-authenticated-profile-lhci-a11y/` |
| 作成日 | 2026-05-12 |
| 状態 | implemented-local-runtime-pending（CLOSED issue reconciliation / local implementation complete / CI runtime pending） |
| taskType | implementation |
| visualEvidence | NON_VISUAL（LHCI HTML report は artifact upload で代替） |
| 優先度 | MID（issue label `priority:medium`） |
| Wave | Stage 4 follow-up（3a Lighthouse CI 派生） |
| 想定 PR 数 | 1（本サイクル: storageState 生成 + mock API + 認証付き LHCI 設定 + workflow 二段化 + Q-02 整理 + SSOT 同期） |
| coverage AC | 適用外（`apps/web/scripts/`, `.github/workflows/`, `lighthouserc*.json`, `apps/web/lhci/` 配下。focused unit test を 1 件追加） |
| refsPolicy | `Refs #630` を PR 本文に記載する（Issue は既に CLOSED のため `Closes` 禁止） |

## スコープ

### 含む（scope in）

- 新規 script `apps/web/scripts/lhci-auth-storage.ts` —
  `signSessionJwt`（`@ubm-hyogo/shared`）で session JWT を生成し、`authjs.session-token` cookie を
  含む `storageState.json` を `apps/web/.lhci/storage-state.json` に書き出す。
- 新規 puppeteer pre-script `apps/web/lhci/lhci-auth.cjs` —
  LHCI の `puppeteerScript` に渡し、`storage-state.json` を読み込んで対象ページ context に
  cookie をセットし、`/profile` final URL pre-check で `/login` redirect を検出する。
- 新規 mock API `apps/web/scripts/lhci-profile-mock-api.ts` —
  CI の Next Server Component が `/me` / `/me/profile` / `/me/attendance` を取得できるよう、
  `INTERNAL_API_BASE_URL=http://127.0.0.1:8787` に deterministic response を返す。
- 新規 `lighthouserc.authenticated.json` — `/profile` のみを対象とし、`puppeteerScript`、
  `chromePath` 経由で authenticated 計測を行う。assertion は accessibility >= 0.90 を hard gate。
- 既存 `lighthouserc.json` から `/profile` を除外（Q-02 決定の正式反映）。
- `.github/workflows/lighthouse.yml` — 既存 unauth ジョブの後段に authenticated LHCI ステップを追加。
  `apps/web/scripts/lhci-auth-storage.ts` を実行 → mock API 起動と ready check → `lhci autorun --config=../../lighthouserc.authenticated.json` を実行。
  artifact upload と env (`AUTH_SECRET`, `INTERNAL_API_BASE_URL`) の引き渡しを行う。
- 新規 focused test `apps/web/scripts/__tests__/lhci-auth-storage.spec.ts` —
  生成された storageState が `authjs.session-token` cookie を含み、署名 JWT が `signSessionJwt`
  によって verify 可能であることを確認する unit test。
- `.gitignore` — `apps/web/.lhci/`, `apps/web/.lighthouseci/`, `apps/web/.lighthouseci-authenticated/` を追加。
- SSOT 同期: `docs/00-getting-started-manual/specs/02-auth.md`（test session JWT の LHCI 利用追記）、
  `docs/30-workflows/e2e-quality-uplift/backlog.md`（EXT-X1 を `closed-by-issue #630 / implemented-local-runtime-pending successor` として更新）。

### 含まない（scope out）

- 本番環境への production LHCI 拡張（authenticated LHCI は PR / dev gate のみ）
- Magic Link / Google OAuth 経由の実 login fixture（test 用 signed JWT で代替）
- 全管理画面（`/admin/*`）の authenticated 計測（priority:medium 範囲外、別 follow-up issue 化）
- D1 schema 変更、Auth.js provider 変更

## 不変条件

1. AUTH_SECRET の実値はコード・ドキュメントに書かない。CI では GitHub Secrets、ローカルでは 1Password op 参照のみ。
2. LHCI 用 storageState は `apps/web/.lhci/` 配下のみに出力し commit しない（`.gitignore`）。
3. authenticated LHCI の対象 origin は `http://localhost:3000` のみ。staging / production への session cookie 注入を禁止する。
4. test session JWT の TTL は 60 分上限。LHCI 1 run 完了時に context は破棄。
5. `signSessionJwt` の入力は test 専用 member（role=member、ID は固定 dummy）に限定し、admin / 実 member を流用しない。
6. authenticated LHCI の失敗は `dev` への PR を gate する（accessibility < 0.90 で job fail）。

## 完了条件（DoD）

- `pnpm typecheck` / `pnpm lint` / focused test が pass する。
- `lighthouserc.authenticated.json` が `/profile` の authenticated 計測で accessibility >= 0.90 を満たし、
  LHCI workflow が緑になっている（PR runtime evidence は `outputs/phase-11/` に格納）。
- `lighthouserc.json` から `/profile` が除外され、unauth side は redirect 計測を行わない構成に整理されている。
- SSOT (02-auth.md / backlog.md) が更新済み。
- PR 本文に `Refs #630` が含まれる。

## 苦戦想定箇所

- LHCI の `puppeteerScript` は同一 origin かつ cookie domain の整合が必要。`localhost` と `127.0.0.1` の混在で
  cookie が無視される事故を防ぐため、`http://localhost:3000` に統一する。
- Auth.js v5 の session cookie 名は `authjs.session-token`（http）または `__Secure-authjs.session-token`（https）。
  LHCI ジョブは localhost http なので前者で固定する。
- `next start` が CI で起動後 ready になるまでの wait は既存 60 秒ループで足りるが、authenticated 計測前に
  `/api/me/profile` の 200 確認を入れて session 注入が有効か pre-check する。

## Phase 一覧

| Phase | 内容 |
| --- | --- |
| 1 | 要件定義・前提整理 |
| 2 | 影響範囲調査・既存 LHCI / auth fixture 構造分析 |
| 3 | 設計（モジュール構造・auth フロー・LHCI 二段化） |
| 4 | 詳細設計（関数シグネチャ・型・I/O） |
| 5 | テスト設計 |
| 6 | リスク・rollback 設計 |
| 7 | 実装計画（ファイル単位・diff 方針） |
| 8 | 依存関係・順序確認 |
| 9 | 実装手順（コード変更ステップ） |
| 10 | レビュー観点 |
| 11 | ローカル / CI 検証手順 |
| 12 | SSOT 同期・compliance check |
| 13 | PR 作成・runtime evidence 取得 |
