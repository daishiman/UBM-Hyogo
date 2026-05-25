# Implementation Guide

## Part 1: 中学生レベルの説明

なぜ必要かというと、同じ操作ボタンを二回押したり、通信が不安定でブラウザが同じ送信をやり直したりすると、サーバーが同じ変更を二回実行してしまう可能性があるため。たとえば教室の名簿で同じ出席チェックを二回書き込むと集計が壊れるのと同じで、サーバー側にも「この操作はもう処理した」と覚える仕組みが必要だった。

何が変わるかというと、ブラウザから届いた `Idempotency-Key` を API Worker が受け取り、D1 の `idempotency_keys` テーブルへ保存する。最初のリクエストは通常通り処理し、成功した JSON レスポンスだけを保存する。次に同じ key / method / path / body が来たら、handler をもう一度実行せず、保存済みレスポンスを返す。

### 今回作ったもの

| 作ったもの | 役割 |
|---|---|
| `idempotency_keys` table | 処理中・処理済みの `Idempotency-Key` を覚える台帳 |
| repository | D1 台帳への insert / replay 判定 / 保存 / 削除を担当 |
| middleware | admin mutation の前後で key を見て、409 / 422 / replay / rollback を制御 |
| route wiring | 既存 handler を大きく変えずに admin mutation へ横断適用 |
| focused tests | 二重送信、body 不一致、失敗時 rollback、保存失敗 fallback を検証 |

## Part 2: 技術者向け詳細

### TypeScript 型定義

```ts
export interface IdempotencyScope {
  readonly key: string;
  readonly method: string;
  readonly path: string;
}

export type IdempotencyStatus = "in_flight" | "completed";

export interface IdempotencyRecord extends IdempotencyScope {
  readonly id: string;
  readonly requestFingerprint: string;
  readonly status: IdempotencyStatus;
  readonly responseStatus: number | null;
  readonly responseBody: string | null;
  readonly responseContentType: string | null;
  readonly createdAt: string;
  readonly completedAt: string | null;
  readonly expiresAt: string;
}
```

### APIシグネチャ

```ts
export const idempotency: () => MiddlewareHandler<{
  Bindings: {
    readonly DB: D1Database;
    readonly IDEMPOTENCY_TTL_SECONDS?: string;
  };
}>;

export const shouldReplay: (
  row: IdempotencyRecord,
  fingerprint: string,
  nowIso: string,
) => ReplayDecision;
```

| Layer | File | Responsibility |
|---|---|---|
| D1 schema | `apps/api/migrations/0021_idempotency_keys.sql` | `(idempotency_key, request_method, request_path)` UNIQUE、TTL index |
| Repository | `apps/api/src/repository/idempotency.repository.ts` | lazy GC、insert in-flight、replay decision、result save、rollback delete |
| Middleware | `apps/api/src/middleware/idempotency.ts` | header detection、SHA-256 fingerprint、409 / 422 / replay / 5xx rollback |
| Env contract | `apps/api/src/env.ts`, `apps/api/src/routes/admin/_shared.ts` | optional `IDEMPOTENCY_TTL_SECONDS` override。未設定・不正値は 24h |
| Route wiring | `apps/api/src/routes/admin/*.ts` | `requireAdmin` / `adminGate` 後の mutation route に横断適用 |
| Tests | `apps/api/src/middleware/__tests__/idempotency.spec.ts`, `apps/api/src/repository/__tests__/idempotency.repository.spec.ts` | focused contract / pure decision |

### 使用例

```bash
curl -sS -X POST "https://<api-host>/admin/members/m1/notes" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: note-m1-20260525-001" \
  --cookie "<admin-cookie>" \
  -d '{"body":"follow-up note"}'
```

同一 key / method / path / body の 2 回目は、保存済み JSON response を返し、`x-idempotency-replayed: true` header を付与する。

### エラーハンドリング

| 状態 | 応答 / 動作 |
|---|---|
| 同一 key が処理中 | `409 { ok: false, error: "idempotency_in_flight" }` |
| 同一 key で body が違う | `422 { ok: false, error: "idempotency_key_reused" }` |
| handler throw / 5xx | in-flight row を削除し、再送で再実行可能にする |
| non-JSON / 64KB 超過 | 保存せず in-flight row を削除する |
| response 保存失敗 | handler の成功レスポンスを維持し、in-flight row を削除する |

### エッジケース

- query string は scope から除外し、path / method / body fingerprint で判定する。
- expired row は lazy GC で削除し、同一 key を再利用できる。
- `Idempotency-Key` が無い request と `GET` は従来通り pass-through。
- D1 migration apply 前に deploy しない。apply / deploy は Gate-C user-gated。

### 設定項目と定数一覧

| 設定 / 定数 | 値 | 意味 |
|---|---:|---|
| `IDEMPOTENCY_TTL_SECONDS` | optional | TTL override。未設定・不正値は既定値 |
| `DEFAULT_TTL_MS` | `24 * 60 * 60 * 1000` | 既定 TTL 24h |
| `MAX_REPLAY_BODY_BYTES` | `64 * 1024` | replay 保存する JSON body 上限 |
| `IDEMPOTENT_METHODS` | `POST`, `PUT`, `PATCH`, `DELETE` | middleware 対象 method |

### テスト構成

| Test | Coverage |
|---|---|
| `apps/api/src/middleware/__tests__/idempotency.spec.ts` | pass-through / replay / in-flight 409 / expired fresh run / size skip / mismatch / 5xx rollback / save failure fallback |
| `apps/api/src/repository/__tests__/idempotency.repository.spec.ts` | `isExpired` と `shouldReplay` の pure decision |

## Boundaries

- `apps/web` は変更しない。client header 送出は issue-842 で完了済み。
- `GET` は対象外。`POST` / `PUT` / `PATCH` / `DELETE` のみ対象。
- JSON response だけを保存する。5xx / non-JSON / 64KB 超過 response は保存せず in-flight row を削除する。
- idempotency response 保存が失敗しても handler の成功レスポンスは維持し、in-flight row を削除して次回再実行に倒す。
- D1 migration apply、deploy、commit、push、PR は user-gated。

## Screenshot Reference

該当なし。`artifacts.json.visual_category = "NON_VISUAL"` のため、Phase 11 は screenshot ではなく `outputs/phase-11/idempotency-focused-tests.log` と `outputs/phase-11/manual-test-result.md` を証跡正本とする。
