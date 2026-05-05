# Phase 11 出力 — 手動 smoke / 実測 evidence

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 08a-B-public-search-filter-coverage |
| phase | 11 / 13 |
| wave | 08a-fu |
| mode | parallel |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| 配置先 root | `docs/30-workflows/08a-B-public-search-filter-coverage/outputs/phase-11/` |

## 実装区分宣言

`[実装区分: 実装仕様書]`。本ファイルは **手動 smoke の実行手順と evidence の取得仕様**を記述する。仕様書スコープのため、本タスク内で screenshot / curl ログ / a11y レポートの**実取得は行わない**。実測は 08b（Playwright E2E）/ 09a（staging smoke）/ 該当する後続実装タスクの実行者が、本書の手順に従って `outputs/phase-11/screenshots/` / `outputs/phase-11/curl-logs/` / `outputs/phase-11/a11y-report.{html,json}` に成果物を配置する。

## 目的

`/members?q=&zone=&status=&tag=&sort=&density=` の 6 query parameter について、最低 9 種の screenshot、6 種の curl scenario、axe-core a11y レポートを実測 evidence として取得する手順を固定する。AC × evidence の 1:1 対応、PASS / FAIL 判定基準、未実装 / 未実測を PASS としない宣言を含む。

## 前提

- リポジトリ root で `mise install` 完了済
- `mise exec -- pnpm install` 完了済
- 1Password 経由で `.env` 参照解決済（`scripts/with-env.sh` / `scripts/cf.sh` 経由でのみ Cloudflare 系 CLI を実行）
- D1（local）に最低 1 件の公開 member（`publish_state='public'` / `public_consent='consented'` / `is_deleted=0`）と複数 tag 付き member が seed されている

## 実行手順

### Step 1: dev server 起動

```bash
# Terminal A: API（hono on workers）
mise exec -- pnpm --filter @ubm-hyogo/api dev

# Terminal B: Web（Next.js App Router on workers）
mise exec -- pnpm --filter @ubm-hyogo/web dev
```

- API base: `http://127.0.0.1:8787`
- Web base: `http://127.0.0.1:3000`
- 経路: Web から `fetchPublic("/public/...")` を呼び、service binding または `PUBLIC_API_BASE_URL` 経由で API に到達する

### Step 2: curl での API 確認（6 param × scenario）

各 curl は `outputs/phase-11/curl-logs/<param>.log` に保存する（stdout + status code + headers）。

```bash
OUT=docs/30-workflows/08a-B-public-search-filter-coverage/outputs/phase-11/curl-logs

mkdir -p "$OUT"

# q: 部分一致
curl -sS -D - 'http://127.0.0.1:8787/public/members?q=ふじた&limit=24' > "$OUT/q.log"

# zone: enum 一致
curl -sS -D - 'http://127.0.0.1:8787/public/members?zone=1_to_10&limit=24' > "$OUT/zone.log"

# status: 公開のみ（enum: member）
curl -sS -D - 'http://127.0.0.1:8787/public/members?status=member&limit=24' > "$OUT/status.log"

# tag: 複数 AND（repeated）
curl -sS -D - 'http://127.0.0.1:8787/public/members?tag=ai&tag=marketing&limit=24' > "$OUT/tag.log"

# sort: name 切替
curl -sS -D - 'http://127.0.0.1:8787/public/members?sort=name&limit=24' > "$OUT/sort.log"

# density: dense 切替（API は appliedQuery にエコー）
curl -sS -D - 'http://127.0.0.1:8787/public/members?density=dense&limit=24' > "$OUT/density.log"
```

各 log に以下を確認:

- HTTP status `200`（不正値も 500 を返さない）
- `Cache-Control: no-store`
- response body の `appliedQuery` が入力値と一致（`density` を含む全 6 param）
- `items[]` に admin-only field（`responseEmail` / `publicConsent` / `rulesConsent` / `publishState` / `isDeleted` / `internalNote` 等）が **存在しない**

### Step 3: Playwright で screenshot 取得（9 種以上）

```bash
SHOT=docs/30-workflows/08a-B-public-search-filter-coverage/outputs/phase-11/screenshots
mkdir -p "$SHOT"

# 推奨: apps/web 配下に Playwright を一時 spec として配置するか、手動で headed Playwright + page.screenshot()
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright codegen http://127.0.0.1:3000/members
```

screenshot は viewport `1280x800` 固定、`fullPage: true`、フォントロード後に取得する。

| # | scenario | URL | 配置先 |
| --- | --- | --- | --- |
| 1 | q 入力時 | `/members?q=ふじた` | `screenshots/members-q-hit.png` |
| 2 | zone 選択時 | `/members?zone=1_to_10` | `screenshots/members-zone.png` |
| 3 | status 公開のみ | `/members?status=member` | `screenshots/members-status-member.png` |
| 4 | tag 複数選択（AND） | `/members?tag=ai&tag=marketing` | `screenshots/members-tag-and.png` |
| 5 | sort 切替 | `/members?sort=name` | `screenshots/members-sort-name.png` |
| 6 | density 切替 | `/members?density=dense` | `screenshots/members-density-dense.png` |
| 7 | 空結果 | `/members?q=不在キーワードxyz` | `screenshots/members-empty.png` |
| 8 | 不正値 fallback | `/members?zone=invalid&status=__bad__&sort=zzz` | `screenshots/members-invalid-fallback.png` |
| 9 | 大量ヒット | `/members?limit=24`（200 件以上母集団） | `screenshots/members-large-hit.png` |

オプション（推奨）:
- 10: density=list `/members?density=list` → `screenshots/members-density-list.png`
- 11: 初期表示 `/members` → `screenshots/members-default.png`

### Step 4: axe-core で a11y 計測

```bash
A11Y=docs/30-workflows/08a-B-public-search-filter-coverage/outputs/phase-11

# axe-core CLI もしくは @axe-core/playwright で取得
mise exec -- npx @axe-core/cli http://127.0.0.1:3000/members \
  --save "$A11Y/a11y-report.json" \
  --reporter html > "$A11Y/a11y-report.html"
```

計測対象:

- `/members`（初期）
- `/members?q=foo`（filter 操作後）
- `/members?tag=ai&tag=marketing`（chip 表示時）

`a11y-report.json` の `violations[]` を確認し、`critical` / `serious` の violation が 0 件であること。

## evidence 配置先（最終形）

```
outputs/phase-11/
├─ main.md                          # 本ファイル
├─ screenshots/
│  ├─ members-q-hit.png
│  ├─ members-zone.png
│  ├─ members-status-member.png
│  ├─ members-tag-and.png
│  ├─ members-sort-name.png
│  ├─ members-density-dense.png
│  ├─ members-empty.png
│  ├─ members-invalid-fallback.png
│  └─ members-large-hit.png
├─ curl-logs/
│  ├─ q.log
│  ├─ zone.log
│  ├─ status.log
│  ├─ tag.log
│  ├─ sort.log
│  └─ density.log
├─ a11y-report.html
└─ a11y-report.json
```

## evidence と AC の対応表

| AC ID | 対象 | 検証 evidence | PASS 条件 |
| --- | --- | --- | --- |
| AC-Q1 | q 部分一致 | `screenshots/members-q-hit.png` + `curl-logs/q.log` | UI に hit 件数 > 0、log の `items[].fullName` 等に query が含まれる |
| AC-Q2 | q 正規化（trim / 連続空白 / 200 字 truncate） | `curl-logs/q.log` 拡張 + 別 curl `?q=<201 文字>` | response の `appliedQuery.q` が 200 字以内に正規化 |
| AC-Q3 | q 制御文字 / SQL escape | 別 curl `?q=%27%20OR%201%3D1` | HTTP 200 / 結果はその文字列の部分一致のみ |
| AC-Z1 | zone 4 値 | `screenshots/members-zone.png` + `curl-logs/zone.log` | 各 enum で UI/log とも `appliedQuery.zone` 一致 |
| AC-S1 | status 4 値 | `screenshots/members-status-member.png` + `curl-logs/status.log` | 同上 |
| AC-T1 | tag AND | `screenshots/members-tag-and.png` + `curl-logs/tag.log` | 全 tag を持つ member のみ表示 |
| AC-T2 | tag 5 件超切捨 | 別 curl `?tag=a&tag=b&tag=c&tag=d&tag=e&tag=f` | `appliedQuery.tags.length === 5` |
| AC-T3 | tag dedup | 別 curl `?tag=a&tag=a&tag=b` | `appliedQuery.tags` が `["a","b"]` |
| AC-O1 | sort=name | `screenshots/members-sort-name.png` + `curl-logs/sort.log` | items 順序が氏名順（同名時 member_id ASC） |
| AC-D1 | density echo | `screenshots/members-density-dense.png` + `curl-logs/density.log` | UI 密度切替 / `appliedQuery.density==="dense"` |
| AC-E1 | 空結果 | `screenshots/members-empty.png` | EmptyState + `絞り込みをクリア`（href=`/members`） 表示 |
| AC-V1 | 不正値 fallback | `screenshots/members-invalid-fallback.png` + 不正値 curl | HTTP 200 / `appliedQuery` が default に正規化 |
| AC-L1 | 大量ヒット | `screenshots/members-large-hit.png` + ブラウザ Performance | first paint < 1s、pagination meta 整合 |
| AC-A1 | a11y label / keyboard | `a11y-report.json` + 手動 keyboard 操作 | 全 filter input が role / label / Tab 到達 |
| AC-A2 | a11y live region | `a11y-report.json` + 手動 SR | `role=status` `aria-live=polite` 領域あり |
| AC-INV4 | 公開状態フィルタ正確性 | 全 curl-logs | `items[]` に非公開 / `is_deleted=1` / 同意なし member が混入しない |
| AC-INV5 | public boundary | コードレビュー（`apps/web` から `D1Database` import なし） | grep で 0 件 |
| AC-INV6 | admin-only field 非露出 | 全 curl-logs の JSON key 検査 | `responseEmail` / `publicConsent` / `rulesConsent` / `publishState` / `isDeleted` / `internalNote` が key として存在しない |

## placeholder と実測 evidence の分離規則

| 種別 | 状態 | 扱い |
| --- | --- | --- |
| placeholder | 本仕様書（Phase 11 main.md）の path 記述のみ | spec 状態。PASS とみなさない |
| 未取得 | 該当 path にファイルが存在しない | FAIL 扱い、後続 wave で再取得 |
| 取得済 | 実ファイルが配置され、上表 PASS 条件を満たす | PASS |
| 取得済だが PASS 条件未達 | 実ファイルあり / 条件不一致 | FAIL。Issue 化または再実測 |

実取得 evidence と placeholder は **同一 path に置かない**。本タスクの spec 完了時点では `screenshots/` / `curl-logs/` / `a11y-report.*` は未配置（placeholder のみ）。

## PASS / FAIL 判定基準

PASS は以下すべてを満たす場合に限る:

1. screenshots/ に最低 9 種の実 PNG が配置されている
2. curl-logs/ に 6 param 全 log が配置され、HTTP status が 200、`appliedQuery` echo が想定通り
3. a11y-report.json の `violations[]` に `critical` / `serious` 0 件
4. AC × evidence 対応表のすべての行で PASS 条件を満たす
5. 不変条件 #4 / #5 / #6 のテスト or curl 検証が通過している
6. 性能（AC-L1 1s 以内）のブラウザ Performance ログを確認、または Phase 9 QA で実測済

いずれか 1 つでも未達の場合 FAIL とし、再実測または scope 調整 issue を作成する。

## 未実装 / 未実測を PASS と扱わない明示宣言

- 本タスクは **仕様書スコープ**。spec のみで「PASS」と判定しない
- screenshot / curl / axe レポートが未取得の状態を「省略可」「後続で対応」と緩めない
- 仕様書段階での placeholder path 記述だけで evidence として申告しない
- 大量ヒット 200 件母集団が未 seed の環境では AC-L1 を **未検証** とマークし、PASS と書かない
- 上記が守られない場合、本 Phase 11 を yarn-back（差し戻し）として扱う

## 自走禁止操作

本タスク（spec）では以下を行わない:

- アプリケーションコード（`apps/api/src/` / `apps/web/app/`）の実改変
- staging / production への deploy（`scripts/cf.sh deploy ...`）
- `git commit` / `git push` / PR 作成
- D1 production / staging への migration apply
- secret 追加 / Cloudflare binding 変更
- screenshot / curl ログ / a11y レポートの実取得（実測は後続実装タスク or 08b / 09a で行う）

## DoD（Phase 11）

| ID | 内容 | 確認方法 | 結果 |
| --- | --- | --- | --- |
| DoD11-1 | dev server 起動手順（API + Web）が記述されている | 本ファイル Step 1 | ✅ |
| DoD11-2 | curl 6 param scenario と log 配置先が記述されている | 本ファイル Step 2 / curl-logs/ | ✅ |
| DoD11-3 | screenshot 9 種以上の取得対象と配置先が記述されている | 本ファイル Step 3 / screenshots/ | ✅ |
| DoD11-4 | axe-core a11y レポート取得手順と配置先が記述されている | 本ファイル Step 4 / a11y-report.{html,json} | ✅ |
| DoD11-5 | AC × evidence 対応表が完備（AC-Q*/Z*/S*/T*/O*/D*/E1/V1/L1/A1/A2/INV4/5/6） | 本ファイル対応表 | ✅ |
| DoD11-6 | placeholder と実測 evidence の分離規則が明記 | 本ファイル分離規則 | ✅ |
| DoD11-7 | PASS / FAIL 判定基準が明記 | 本ファイル PASS/FAIL 節 | ✅ |
| DoD11-8 | 未実装 / 未実測を PASS と扱わない宣言 | 本ファイル明示宣言 | ✅ |
| DoD11-9 | 自走禁止操作が明記され、本タスク内で実取得していない | 本ファイル自走禁止節 / `screenshots/` 等が空 | ✅ |

## 次 Phase への引き渡し

Phase 12 へ以下を渡す:

- manual evidence path（`outputs/phase-11/screenshots/` / `curl-logs/` / `a11y-report.{html,json}`）
- AC × evidence の対応表
- PASS / FAIL 判定基準
- 残課題 R-1〜R-6（Phase 10 から継承）のうち、ドキュメント注記対象（R-1 / R-2 / R-3）
- 後続 08b（Playwright E2E）/ 09a（staging smoke）への scenario 雛形
