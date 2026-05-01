# Implementation Guide

## Part 1: 初学者向け

なぜ必要か。公開前の練習場所で一度全部を試しておくと、本番で止まりにくくなる。たとえば文化祭の本番前に体育館で通し練習をするイメージで、受付、案内、係の動き、困った時の連絡先を先に確認しておく。

何をするか。09a はその通し練習の手順書である。画面が開けるか、ログインできるか、管理画面に入ってはいけない人が入れないか、フォームから来た情報が試し用の保存場所に入るかを確認する。

### 今回作ったもの

- 13 Phase の実行仕様書
- Phase 11 の証跡受け入れ契約
- Phase 12 の 7 成果物
- Phase 13 の承認待ち PR テンプレート

## Part 2: 技術者向け

### Evidence Types

```ts
type EvidenceStatus = "PASS" | "FAIL" | "BLOCKED" | "NOT_EXECUTED";

interface StagingSmokeEvidence {
  checkId: string;
  sourceTask: string;
  commandOrUrl: string;
  expected: string;
  actual: string;
  status: EvidenceStatus;
  artifactPath: string;
}
```

### APIシグネチャ

```bash
curl -X POST "$STAGING_API/admin/sync/schema" -H "Authorization: Bearer <redacted>"
curl -X POST "$STAGING_API/admin/sync/responses" -H "Authorization: Bearer <redacted>"
curl "$STAGING_API/admin/sync/audit"
```

### 使用例

```bash
STAGING_API="https://api-staging.example.invalid"
curl "$STAGING_API/health"
curl -X POST "$STAGING_API/admin/sync/schema" -H "Authorization: Bearer <redacted>"
```

### エラーハンドリング

401/403 are auth blockers, 409 indicates an in-flight sync and must be retried or investigated, and 5xx is a production blocker until root cause is assigned to 03a/03b/U-04.

### エッジケース

| Case | Handling |
| --- | --- |
| skipped Playwright spec | Keep `NOT_EXECUTED`; never mark PASS |
| missing staging secret | Block Phase 11 execution |
| sync already running | Record 409 and retry after checking `sync_jobs` |

### 設定項目と定数一覧

| Name | Meaning |
| --- | --- |
| `STAGING_WEB` | staging web origin |
| `STAGING_API` | staging API origin |
| `SYNC_ADMIN_TOKEN` | redacted admin sync token |
| `visualEvidence` | `VISUAL` for real execution |

### テスト構成

| Layer | Evidence |
| --- | --- |
| spec validation | `verify-all-specs.js` |
| phase output validation | `validate-phase-output.js` |
| staging execution | Phase 11 screenshots, sync dump, Playwright report |
