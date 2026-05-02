# Phase 8: DRY 化 — 06a-A-public-web-real-workers-d1-smoke-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06a-A-public-web-real-workers-d1-smoke-execution |
| phase | 8 / 13 |
| wave | 6a-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 4 の curl matrix と Phase 5 の runbook、Phase 11 の手動 smoke 手順に分散している
「同じ curl コマンド片」「同じ evidence 命名揺らぎ」を一元化する。
本タスクは smoke が中心で実装ファイルを増やさないため、DRY 化の対象は
**(1) curl 実行ロジック / (2) evidence ファイル命名規則 / (3) runbook と異常系の重複** の 3 領域に閉じる。

参考実装は `docs/30-workflows/completed-tasks/06a-followup-001-public-web-real-workers-d1-smoke/phase-08.md` を踏襲する。

---

## DRY 対象 1: curl helper の共通スクリプト化

### Before（重複の現状）

- Phase 4 curl matrix: 4 route family × 5 smoke cases × 2 環境 = 計 10 セルそれぞれに
  `curl -s -o /dev/null -w "%{http_code}\n" <URL>` をベタ書き
- Phase 5 runbook: 同じ 10 行を local 用 / staging 用に再掲
- Phase 11 手動 smoke: 実施者が再度 10 行を入力する

### After（共通スクリプトへ切り出す案）

実装ファイルを増やさない原則は維持しつつ、Phase 11 実施者の判断で **任意に 1 ファイル化** できるよう、
仕様書としては「擬似形式の関数定義 + 切り出し先 path」を提示する。

#### 切り出し先（提案）

```
scripts/smoke/public-web-real-workers-d1.sh
```

> ⚠️ このスクリプトの **実装は本タスクの scope out**。
> 仕様書としては「切り出し先 path」と「インターフェース」だけを固定し、Phase 11 実施者が必要に応じて作成する。

#### インターフェース（擬似形式）

```bash
# scripts/smoke/public-web-real-workers-d1.sh （擬似コード — 実装は scope out）
#
# 使い方:
#   bash scripts/smoke/public-web-real-workers-d1.sh <BASE_URL> <ENV_LABEL> <SEEDED_ID>
#
# 例:
#   bash scripts/smoke/public-web-real-workers-d1.sh http://127.0.0.1:8788 local <seeded-id>
#   bash scripts/smoke/public-web-real-workers-d1.sh "$STAGING_URL" staging <seeded-id>

smoke_routes() {
  local base="$1"      # http://127.0.0.1:8788 / staging URL
  local label="$2"     # local / staging
  local seeded="$3"    # 既存 seed の member id
  local ts
  ts="$(date +%Y%m%dT%H%M%SZ)"

  for path in "/" "/members" "/members/${seeded}" "/members/UNKNOWN" "/register"; do
    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" "${base}${path}")
    printf "%s\t%s\t%s\t%s\n" "${ts}" "${label}" "${path}" "${code}"
  done
}
```

#### 効果

- curl 行の重複が 10 → 1（関数定義 1 箇所 + 呼び出し 2 箇所）
- 期待値の差分（`/members/UNKNOWN` が 404）が 1 箇所で表現される
- secret hygiene: staging URL を引数化することで runbook 本文に staging URL ハードコードを残さない
- Phase 11 実施者が同一スクリプトを 2 環境で呼ぶだけで evidence の取り方が一意になる

---

## DRY 対象 2: evidence ファイル命名規則

### Before（暗黙の揺らぎ）

`curl.log`, `smoke.log`, `smoke-local.log`, `smoke-prod.log` 等が phase 11 evidence 配下に混在する余地。

### After（命名規則の固定）

evidence ファイル名は以下の **2 系統** で固定する。

#### 系統 A: 4 route family を一括叩く curl ログ（基本セット）

| 用途 | ファイル名 | 配置 |
| --- | --- | --- |
| local 4 route family + 起動ログ + AC-7 rg 結果 | `local-curl.log` | `outputs/phase-11/evidence/` |
| staging 4 route family + AC-5 vars 確認コメント | `staging-curl.log` | 同上 |
| staging 1 ルート（`/` または `/members`）の画面 | `staging-screenshot.png` | 同上 |

> 系統 A の 3 ファイルは **必須**。これ以外は基本セットに含めない。

#### 系統 B: 個別 route ごとの追加 curl ログ（必要時のみ）

詳細 evidence が必要な場合は **`<route>-<env>-<timestamp>.curl.log`** 形式に統一する。

```
# 命名規則: <route>-<env>-<timestamp>.curl.log
#   <route>     : root / members / members-id / members-unknown / register
#   <env>       : local / staging
#   <timestamp> : YYYYMMDDTHHMMSSZ (UTC, ISO 8601 basic)

# 例
members-local-20260502T031500Z.curl.log
members-id-staging-20260502T031530Z.curl.log
register-staging-20260502T031600Z.curl.log
```

##### 命名規則の不変条件

- `<route>` は path から `/` を除き、`/members/[id]` は `members-id`、`/members/UNKNOWN` は `members-unknown` と表記する
- `<env>` は `local` / `staging` のいずれかのみ。production は本タスクの scope out
- `<timestamp>` は UTC、basic format（コロンなし）で書く
- 拡張子は `.curl.log` 固定（`.log` / `.txt` 禁止）

##### 派生形

| 用途 | 派生命名 |
| --- | --- |
| HTTP body も保存したい場合 | `<route>-<env>-<timestamp>.curl.body.txt` |
| HTTP header dump を保存したい場合 | `<route>-<env>-<timestamp>.curl.headers.txt` |
| AC-7 の rg 結果 | `ac7-rg-<env>-<timestamp>.log` |

3 ファイル基本セット（系統 A）でカバーできる範囲を超えたとき限定で系統 B を使う。
普段は系統 A のみで Phase 7 AC マトリクスを満たす。

---

## DRY 対象 3: Phase 5 runbook と Phase 6 異常系の重複削減

### Before

- Phase 5 runbook: 「正常系コマンド」を列挙
- Phase 6 異常系: 「失敗時のリカバリコマンド」を列挙
- esbuild mismatch 対応コマンドが両方に重複する余地

### After

- **Phase 5 runbook**: 正常系 + 起動前提（`scripts/cf.sh` 経由 / migration list 確認）のみ
- **Phase 6 異常系**: 失敗パターンと「Phase 5 runbook のどのステップから再開するか」だけを書き、コマンド自体は Phase 5 を参照
- esbuild mismatch 解消は `scripts/cf.sh` 経由起動という単一手段のみで担保

---

## DRY 化で生じない重複（許容する重複）

| 項目 | 理由 |
| --- | --- |
| AC-2 と AC-4 で同じルートを叩く | local / staging という観点軸が異なるため別 AC に分離する正当性がある |
| Phase 7 AC マトリクスと Phase 4 curl matrix | 切り口が「AC × evidence」と「route × env」で異なる |
| 不変条件 #5 の Phase 1 / Phase 3 / Phase 7 言及 | フェーズごとの責務（要件 / 設計 / 検証）として必要な再確認 |

---

## 実行タスク

1. 参照資料と親タスクの状態を確認する。完了条件: 未実装・未実測の境界が記録される。
2. 上記 DRY 対象 1〜3 を `outputs/phase-08/main.md` に Before / After 表で転記する。完了条件: 表が 3 つ揃う。
3. evidence 命名規則（系統 A / B）を Phase 7 / Phase 11 から参照可能な箇所として明記する。完了条件: Phase 7 と Phase 11 双方の参照リンクが書かれている。
4. user approval または上流 gate が必要な操作を分離する。完了条件: 自走禁止操作（実スクリプトのコミット等）が明記される。

## 参照資料

- docs/30-workflows/completed-tasks/06a-followup-001-public-web-real-workers-d1-smoke/phase-08.md
- docs/30-workflows/completed-tasks/06a-parallel-public-landing-directory-and-registration-pages/
- docs/00-getting-started-manual/specs/05-pages.md
- docs/00-getting-started-manual/specs/09-ui-ux.md
- docs/00-getting-started-manual/specs/12-search-tags.md
- docs/00-getting-started-manual/specs/15-infrastructure-runbook.md
- CLAUDE.md（`scripts/cf.sh` 経由実行ルール）

## 実行手順

- 対象 directory: docs/30-workflows/06a-A-public-web-real-workers-d1-smoke-execution/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- `scripts/smoke/public-web-real-workers-d1.sh` の実体作成は **scope out**（Phase 11 実施者の任意）。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 04a public API, 06a public web implementation, Cloudflare D1 binding
- 下流: 09a staging deploy smoke, 08b Playwright E2E
- Phase 11 の local / staging curl smoke と AC trace に接続する。

## 多角的チェック観点

- #5 public/member/admin boundary
- #6 apps/web から D1 直接アクセス禁止
- #8 localStorage/GAS prototype を正本にしない
- #14 Cloudflare free-tier
- 未実装/未実測を PASS と扱わない。
- placeholder と実測 evidence を分離する。
- evidence ファイル命名揺らぎを発生させない（系統 A / B 厳守）。

## 副作用 / リスク

- runbook 内擬似 shell 関数の引数順序が変わると Phase 11 実施者の手作業に揺らぎが出る → 関数定義は Phase 5 内 1 箇所のみに固定し、本 Phase 8 が source of truth
- evidence 3 ファイル固定により、追加の curl 結果（例: D1 query log）は `local-curl.log` の末尾セクションに追記する形で吸収するか、系統 B の派生命名で別ファイル化する
- `scripts/smoke/...` を実装する場合、CLAUDE.md ルール（`scripts/cf.sh` 経由）と整合させる

## サブタスク管理

- [ ] refs を確認する
- [ ] AC と evidence path（系統 A / B）を対応付ける
- [ ] blocker / approval gate を明記する
- [ ] curl helper 切り出し先（`scripts/smoke/public-web-real-workers-d1.sh`）の擬似形式を runbook に記載する
- [ ] evidence 命名規則 `<route>-<env>-<timestamp>.curl.log` を Phase 7 / Phase 11 から参照させる
- [ ] outputs/phase-08/main.md を作成する

## 成果物

- outputs/phase-08/main.md（Before / After 表 3 種、evidence 命名規則、curl helper 擬似形式を含む）

## 完了条件

- local real Workers/D1 smoke の curl log が保存されている（系統 A: `local-curl.log`）
- staging real Workers/D1 smoke の curl log が保存されている（系統 A: `staging-curl.log`）
- 少なくとも公開4 route family の screenshot または HTML evidence が保存されている
- mock API ではなく apps/web -> apps/api -> D1 経路であることが evidence に明記されている
- `outputs/phase-08/main.md` に DRY 化 Before / After 表が 3 つ記録されている
- Phase 4 curl matrix と Phase 5 runbook の curl 行が「1 箇所定義 + 参照」構造に整理されている
- evidence ファイル基本 3 種（系統 A）と派生命名規則（系統 B）が Phase 7 / Phase 11 双方で参照されている

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない
- [ ] curl helper 切り出し案・evidence 命名規則・runbook/異常系の重複削減の 3 観点がすべて記述されている
- [ ] `scripts/smoke/public-web-real-workers-d1.sh` の実体作成が scope out として明記されている
- [ ] evidence 命名 `<route>-<env>-<timestamp>.curl.log` が定義されている

## 次 Phase への引き渡し

Phase 9 へ、AC、blocker、evidence path（系統 A / B）、approval gate、curl helper 擬似形式を渡す。
