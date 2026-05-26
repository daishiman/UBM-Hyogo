# Phase 10: 最終レビュー — issue-870-apps-api-security-headers

> 実装区分: 実装仕様書 / NON_VISUAL / implementation_mode: new / 状態: implemented_local_evidence_captured
> 前 Phase: [phase-9-qa.md](phase-9-qa.md) / 次 Phase: [phase-11-manual-test.md](phase-11-manual-test.md)

## 目的

Phase 9 QA 合格後に acceptance criteria を DoD と照合し、BLOCKER の有無を判定する。
MINOR 指摘は Phase 12 で未タスク検出として形式化するが、本 Phase では BLOCKER 判定のみ行う。

---

## 10-1. 受入チェックリスト（acceptance criteria × DoD 対応付け）

### セキュリティヘッダ付与

| # | 受入基準 | 対応 DoD | 確認方法 |
|---|----------|----------|----------|
| AC-01 | `X-Content-Type-Options: nosniff` が全 route に付与される | TC-01 PASS | vitest + curl -I |
| AC-02 | `Strict-Transport-Security: max-age=31536000; includeSubDomains` が全 route に付与される | TC-01 PASS | vitest + curl -I |
| AC-03 | `Referrer-Policy: no-referrer` が全 route に付与される | TC-01 PASS | vitest + curl -I |
| AC-04 | 認証必要 route（`/me`, `/auth`, `/admin`, `/internal`）に `Cache-Control: no-store` が付与される | TC-06 / TC-07 PASS | vitest |
| AC-05 | 既存 `Cache-Control` が設定済みの route（`form-preview`, `stats`）は middleware が上書きしない | TC-08 / D1 lane 回帰 PASS | vitest + D1 lane |

### CORS

| # | 受入基準 | 対応 DoD | 確認方法 |
|---|----------|----------|----------|
| AC-06 | `ALLOWED_ORIGINS` allowlist の origin には `Access-Control-Allow-Origin` が付与される | TC-02 / TC-03 PASS | vitest + curl -H "Origin: ..." |
| AC-07 | allowlist 外 origin の preflight は拒否される（CORS ヘッダが付かない） | TC-04 PASS | vitest + curl preflight |
| AC-08 | `ALLOWED_ORIGINS` 未設定時は deny-by-default（いかなる origin も許可しない） | TC-05 PASS | vitest |

### env 分離

| # | 受入基準 | 対応 DoD | 確認方法 |
|---|----------|----------|----------|
| AC-09 | staging / production で `ALLOWED_ORIGINS` を個別に設定できる | wrangler.toml の `[env.staging.vars]` / `[env.production.vars]` に `ALLOWED_ORIGINS` が追加されている | cat / grep |
| AC-10 | `ALLOWED_ORIGINS` は `apps/api/src/env.ts` の `Env` 型として定義されている | typecheck PASS + grep | typecheck + grep |

### 後退（regression）なし

| # | 受入基準 | 対応 DoD | 確認方法 |
|---|----------|----------|----------|
| AC-11 | 既存 endpoint の I/O shape に変化なし | D1 lane 回帰 PASS | D1 lane vitest |
| AC-12 | `apps/web/src` への変更 0 件 | git diff --name-only に web/src 無し | git diff |
| AC-13 | `*.test.ts` suffix を使用したテストファイルが追加されていない | `find apps/api/src -name "*.test.ts"` が 0 件 | find |

---

## 10-2. BLOCKER 判定基準

以下のいずれかが未達の場合、Phase 11 以降に進まず **Phase 5（実装）に差し戻す**。

| 種別 | BLOCKER 条件 |
|------|-------------|
| 型安全 | typecheck エラーが 1 件以上 |
| コード品質 | lint エラーが 1 件以上 |
| 機能要件 | TC-01〜TC-10 のうち 1 件でも FAIL |
| 後退防止 | D1 lane の Cache-Control 回帰が 1 件以上 |
| スコープ違反 | `apps/web/src` または D1 schema に変更あり |
| suffix 違反 | `*.test.ts` ファイルが存在する |

---

## 10-3. MINOR 指摘の扱い（未タスク化フロー）

BLOCKER に該当しない指摘（コメントスタイル・変数名の好み・将来の拡張余地等）は
**本 Phase では却下せず記録する**。Phase 12 の `outputs/phase-12/unassigned-task-detection.md` に
「MINOR 指摘」として列挙し、次サイクルの任意タスクとして管理する。

> 本タスクの実装スコープが小さく（新規ファイル 1 本 + 修正 3 ファイル）、
> MINOR 指摘が発生する可能性は低いが、検出報告は **0 件でも必須**。

---

## 10-4. Gate-B 判定（implementation_review）

Phase 10 の受入チェックリストが全 AC グリーンになった時点で、`artifacts.json` の `Gate-B` を以下に更新する（実装サイクル完了後の作業）。

```json
{
  "gate_id": "Gate-B",
  "status": "passed",
  "passed_at": "<実施日時 ISO8601>",
  "evidence_path": "docs/30-workflows/completed-tasks/issue-870-apps-api-security-headers/phase-11-manual-test.md",
  "approver": "daishiman",
  "notes": "implementation_review: AC-01〜AC-13 全件グリーン。TC-01〜TC-10 PASS。D1 lane 回帰 PASS。"
}
```

---

## 10-5. DoD（Definition of Done）

- [ ] AC-01〜AC-13 全件グリーン
- [ ] BLOCKER 判定: なし（差し戻しなし）
- [ ] MINOR 指摘: Phase 12 `unassigned-task-detection.md` に記録予定（0 件の場合も「0 件」と明記）
- [ ] Gate-B 更新準備完了（実施は Phase 11 完了後）
