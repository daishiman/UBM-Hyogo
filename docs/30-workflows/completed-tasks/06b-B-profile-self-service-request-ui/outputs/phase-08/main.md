# Phase 8 成果物 — 重複分析報告（06b-B-profile-self-service-request-ui）

作成日: 2026-05-02
status: implemented-local

## 1. DRY 候補と 3 occurrence rule 判定

| ID | 内容 | occurrence | 判定 | 理由 |
| --- | --- | --- | --- | --- |
| DRY-1 | confirm dialog state machine（open/submitting/error/accepted） | 2（Visibility / Delete） | **据置** | 単段と二段で形状が異なり、共通化で prop ドリリングが増える |
| DRY-2 | error code → 日本語文言 dict | 3+（2 dialog + RequestErrorMessage） | **抽出** | dict を `_components/requestErrorMessages.ts` に集約 |
| DRY-3 | client helper 内の status → RequestErrorCode 変換 | 2（visibility / delete 関数） | **抽出（module-private）** | `mapErrorToCode()` を 1 つに集約。export はしない |
| DRY-4 | shared schema 型の client 側 export point | 2 | **抽出** | `me-requests.types.ts` に集約 |

## 2. 抽出 3 件のリファクタ手順サマリ

### DRY-2: error mapping 辞書集約

- 新規: `apps/web/app/profile/_components/requestErrorMessages.ts`（`Record<RequestErrorCode, string>`）
- `RequestErrorMessage.tsx` のみが辞書を参照
- 各 dialog は `<RequestErrorMessage code={...} retry={...}/>` に統一
- 追加 unit: `RequestErrorMessage.test.tsx::all-codes-mapped`（union 全網羅）

### DRY-3: client helper の status → code 変換共通化

- module-private `mapErrorToCode(err): RequestErrorCode` を `me-requests.ts` 内に追加
- 401 / 403 / 409 / 422 / 429 / 5xx / network → code を 1 関数に集約
- 両 export 関数は thin wrapper 化
- 追加 unit: `me-requests.test.ts::map-error-to-code::*`

### DRY-4: 型の単一 export point

- 新規: `apps/web/src/lib/api/me-requests.types.ts`
- `VisibilityRequestInput` / `DeleteRequestInput` / `QueueAccepted` / `RequestErrorCode` / `RequestResult` を集約
- dialog / panel / helper すべて `me-requests.types` 経由で import

## 3. 不採用候補と理由

| 不採用候補 | 理由 |
| --- | --- |
| `useRequestSubmit<T>` Hook | 利用 2 箇所 + 形状差。Hook 化で可読性低下 |
| 汎用 `<ConfirmDialog>` | UI library 採用方針未確定。後段で書き直しのリスク |
| 楽観的更新ユーティリティ | Phase 2 で不採用決定済み |
| 汎用 `apiClient` | `fetchAuthed` で十分。本タスク範囲外 |
| reason 文字数 shared util | API zod が SSOT。client 側で別 util 不要 |

## 4. 回帰テスト保証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm/web test -- me-requests RequestErrorMessage
mise exec -- pnpm --filter @ubm/web test -- VisibilityRequestDialog DeleteRequestDialog
mise exec -- pnpm --filter @ubm/web test:coverage
mise exec -- pnpm --filter @ubm/web test:e2e -- profile.visibility-request profile.delete-request
```

## 5. coverage しきい値変動の許容

- 重複削減で line coverage 上昇は許容
- 80% 未達は Phase 6 戻り（coverage-standards.md の loop）
- 大規模ファイル（500 行超）には該当しない。新規追加コードは line / branch 80% 必須

## 6. 注記

このファイルはタスク仕様書整備時点の重複分析であり、リファクタ実行は Phase 8 実装フェーズで行う（本仕様書整備タスク自体では行わない）。
