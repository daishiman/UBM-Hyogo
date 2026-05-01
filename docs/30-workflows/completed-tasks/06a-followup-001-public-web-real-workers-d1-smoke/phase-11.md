# Phase 11: 手動 smoke

## 目的

04a public API 実体 + Cloudflare D1 binding を経由した local smoke と staging smoke を **`scripts/cf.sh` 経由**で実施し、curl evidence と staging screenshot を `outputs/phase-11/evidence/` に保存する。AC-1〜7 を実観測で裏付ける phase。

> 本タスクは NON_VISUAL タスクであり、UI Visual regression は scope out。staging screenshot は 1 枚のみ（`/members` トップ等の正常応答証跡）に留める。

## 前提

- Phase 1〜10 が `spec_created` 状態で完了している
- `docs/30-workflows/completed-tasks/06a-parallel-public-landing-directory-and-registration-pages/outputs/phase-11/` が存在する（追記対象）
- 1Password (`.env` の `op://...` 参照) が解決可能
- 04a public API 実装、02b D1 migration が apply 済み
- 本タスクは Issue #273（CLOSED）の再オープンを伴わない

## 実行ステップ

### Step 1: local smoke（apps/api 実体起動）

1. ターミナル A で API を `scripts/cf.sh` 経由で起動する。
   ```bash
   bash scripts/cf.sh dev --config apps/api/wrangler.toml --local
   ```
2. `Listening on http://127.0.0.1:8787` を観測したらターミナル B で web を起動する。
   ```bash
   PUBLIC_API_BASE_URL=http://localhost:8787 mise exec -- pnpm --filter @ubm-hyogo/web dev
   ```
3. ターミナル C で curl を順次実行し、`outputs/phase-11/evidence/local-curl.log` に追記する。
   - `/`, `/members`, `/register` → `200`
   - `/members/{seeded-id}` → `200`（seeded ID は API 側 `GET /public/members` から取得）
   - `/members/UNKNOWN` → `404`
4. API 側 `GET /public/members` の `items.length >= 1` と web `/members/{seeded-id}` の `200` で AC-3（実 D1 経路）を観測する。

> `wrangler` を直接呼ばない。CLAUDE.md のルールに従い `bash scripts/cf.sh` ラッパー経由のみ。

### Step 2: staging smoke

1. `apps/web` / `apps/api` の staging URL を Cloudflare deployed vars から確認する。現状 `apps/web/wrangler.toml` に `PUBLIC_API_BASE_URL` は未定義のため補助確認に留める。
2. staging 側の `PUBLIC_API_BASE_URL` を `bash scripts/cf.sh` 経由で確認し、localhost fallback していないことを `outputs/phase-11/evidence/staging-curl.log` 冒頭にメモする（値の実体は記録しない、設定済みの旨のみ）。未設定なら Phase 11 は NO-GO。
3. 同 4 route family / 5 smoke cases に curl を実行し、`200` / `404` を観測してログに追記する。
4. staging 環境の `/members` を実ブラウザで開き、screenshot を `outputs/phase-11/evidence/staging-screenshot.png` として 1 枚保存する。

### Step 3: 06a 親タスクの evidence 追記

1. `docs/30-workflows/completed-tasks/06a-parallel-public-landing-directory-and-registration-pages/outputs/phase-11/` に本タスクの evidence へリンクする追記コメントを残す（追記であって実コピーは不要、trace を保つ）。
2. AC-6 の trace を `outputs/phase-11/main.md` の evidence 一覧に明記する。

## evidence 保存ルール

| ファイル | 内容 | サイズ目安 |
| --- | --- | --- |
| `evidence/local-curl.log` | local 4 route family / 5 smoke cases の curl 出力（status / headers / body 抜粋） | < 50KB |
| `evidence/staging-curl.log` | staging 4 route family / 5 smoke cases の curl 出力 | < 50KB |
| `evidence/staging-screenshot.png` | staging `/members` の正常応答 screenshot 1 枚のみ | < 500KB |

### 機微情報の取り扱い

- `CLOUDFLARE_API_TOKEN`、staging URL のうち D1 ID を含む内部 host、Auth.js secret などは **ログ・screenshot に絶対に含めない**。
- curl 実行時は `--header` の値を echo しない。`-H "Authorization: ..."` は public smoke では不要なので使わない。
- staging URL がホスト名のみで内部 ID を含まないことを保存前に目視確認する。

## NON_VISUAL 縮約テンプレ

- ターゲット: HTTP 応答コード + 最小限の構造観測（seed member 件数）
- screenshot: 1 枚のみ（証跡として「画面が表示できた」事実が分かる程度で十分）
- visual regression: 取らない（08b / OGP followup の責務）

## 完了条件

- [ ] 既存の完了条件を満たす

- AC-1（esbuild mismatch 非再現）が 2 回連続 fresh 起動で観測済み
- AC-2 / AC-4 の curl 結果が 4 route family / 5 smoke cases × 2 環境で揃っている
- AC-3 が `/members` レスポンスの seed 観測で裏付け済み
- AC-5 が staging `PUBLIC_API_BASE_URL` 確認で裏付け済み
- AC-6 が 06a 親 evidence への追記 trace で達成
- AC-7 が `apps/web/app` / `apps/web/src` の実アプリコードにおける `D1Database|env.DB` 0 件で再確認

## 失敗時のフォールバック

- esbuild mismatch が再発した場合: `scripts/cf.sh` の `ESBUILD_BINARY_PATH` 解決ロジックを Phase 6 異常系手順で診断
- staging で 5xx が出た場合: smoke 中断、Phase 6 fallback に従い `bash scripts/cf.sh d1 migrations list` 等で binding 状態確認
- いずれの場合も Issue #273 は再オープンしない（新規 followup spec として別タスク化）

## メタ情報

- workflow: `06a-followup-001-public-web-real-workers-d1-smoke`
- phase: 11
- status: `spec_created / pending`
- taskType: `implementation`
- visualEvidence: `NON_VISUAL`

## 実行タスク

- local smoke を実行して evidence を保存する
- staging smoke と補助 screenshot を保存する
- 06a 親 workflow へ evidence trace を追記する

## 参照資料

- `docs/30-workflows/completed-tasks/task-06a-followup-001-real-workers-d1-smoke.md`
- `CLAUDE.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`

## 成果物

- `outputs/phase-11/main.md`

## 統合テスト連携

- Phase 11 の local / staging curl smoke と AC trace に接続する。
- UI regression ではなく NON_VISUAL の HTTP / D1 binding evidence を正本にする。
