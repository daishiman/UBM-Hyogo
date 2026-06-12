# Phase 12: システム仕様更新サマリ

## メタ情報
正本: `outputs/phase-12/system-spec-update-summary.md` / 上位 SSOT: `../../_shared-context.md`

| 項目 | 値 |
|------|------|
| taskType | NON_VISUAL |
| workflow_state | `implemented_local_evidence_captured` |

## 目的
新規インターフェース（`ApiTransportDescriptor` / `getEnvironmentResolution` / `ApiTransportError` / `ApiTransportEnv.environmentExplicit`）の追加が正本システム仕様（`docs/00-getting-started-manual/specs/*.md`）への更新を要するかを Step1-A/1-B/1-C/Step2 で判定し、実コードと同一 wave で正本仕様へ反映した。

## Step 判定

### Step1-A: 既存正本仕様の該当箇所特定

| 正本仕様 | 該当 | 内容 |
|----------|------|------|
| `docs/00-getting-started-manual/specs/01-api-schema.md` | 非該当 | `/me` の path・shape・status 体系は不変（AC-9）。API schema 変更なし |
| `docs/00-getting-started-manual/specs/02-auth.md` | 更新済み | Profile session transport fail-closed contract を追加し、`getEnvironmentResolution` / `environmentExplicit` / diagnostic error / `server_fetch_failed` ログ shape を記録 |
| `docs/00-getting-started-manual/specs/13-mvp-auth.md` | 更新済み | `/profile` session transport observability を追加し、実機 staging での `transportKind` / `baseHost` / `status` 切り分け契約を記録 |
| `docs/00-getting-started-manual/specs/08-free-database.md` | 非該当 | D1 構成不変（不変条件 #5） |

### Step1-B: 新規インターフェースの仕様化要否

| 新規インターフェース | 仕様化要否 | 理由 |
|---------------------|-----------|------|
| `ApiTransportDescriptor` / `describeTransport` | 内部実装（要・軽微） | 診断ラベルの内部型。公開 API surface ではないが、observability 契約（ログ shape）として 02-auth / 13-mvp-auth の観測性節に記述し得る |
| `getEnvironmentResolution` | 要（軽微） | env 解決の明示判定。env アクセサ不変条件（CLAUDE.md `apps/web` env アクセス）に sibling として追記し得る |
| `ApiTransportError` | 内部実装（要・軽微） | transport 接続失敗の診断付き error。エラー分類体系の記述対象 |
| `ApiTransportEnv.environmentExplicit` | 要（軽微） | fail-closed の入力フラグ。02-auth の fail-closed 方針に紐づく |
| `server_fetch_failed` ログ `transportKind`/`baseHost` | 要（軽微） | observability 契約。ログ shape を仕様に明記し得る |

### Step1-C: 影響範囲

- 影響は `apps/web` の fetch/transport/env 層に閉じる。`apps/api` 非接触（AC-9）。
- 公開 API endpoint surface（`/me`）・D1 schema・Google Form 仕様に影響なし。
- 既存シグネチャは後方互換（optional フィールド・optional constructor 引数・新規 export のみ）。

### Step2: 正本仕様更新の要否判定

**判定: 要（実施済み）。**

- 新規インターフェース（`ApiTransportDescriptor` / `getEnvironmentResolution` / `ApiTransportError` / `environmentExplicit`）と observability 契約（`server_fetch_failed` のログ shape 拡張）を、`02-auth.md` / `13-mvp-auth.md` の観測性・fail-closed 節へ追記した。
- 公開 `/me` contract、apps/api、D1、Google Form は不変のため `01-api-schema.md` / `08-free-database.md` は更新不要。

## 実施記録

| 項目 | 値 |
|------|------|
| Step2 判定 | 要（同 wave 実施済み） |
| 更新対象 | `docs/00-getting-started-manual/specs/02-auth.md`（fail-closed 節）/ `13-mvp-auth.md`（観測性節） |
| 本 Phase での実施 | 正本仕様へ追記済み |
| 実施タイミング | 実コード・focused tests と同一 wave |

## 完了条件
- [x] Step1-A/1-B/1-C/Step2 の判定を記録した。
- [x] Step2「要」に基づき正本仕様を同一 wave で更新した。

## 成果物
- `outputs/phase-12/system-spec-update-summary.md`（本ファイル）

## 参照資料
- `../../_shared-context.md` §5（シグネチャ）/ §6（不変条件）
- `docs/00-getting-started-manual/specs/02-auth.md` / `13-mvp-auth.md` / `01-api-schema.md`

## 統合テスト連携
正本仕様更新は本タスクの observability 契約（ログ shape）と fail-closed 方針を反映済み。実機検証（Phase 11 MT-A〜MT-D）と整合させる。
