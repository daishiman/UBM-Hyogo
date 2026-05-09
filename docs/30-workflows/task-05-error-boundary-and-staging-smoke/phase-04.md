# Phase 4: テスト戦略

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 4 |
| task | task-05-error-boundary-and-staging-smoke |
| state | implemented-local / implementation / runtime evidence pending_user_approval |

## 目的

この Phase で task-05 の実装仕様、検証条件、または close-out 条件を固定する。

## 実行タスク

- [ ] 本 Phase の本文に記載された設計・検証・ドキュメント作業を実施する
- [ ] runtime evidence が必要な項目は user-gated として false-green にしない

## 参照資料

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-05-w4-par-error-boundary-and-staging-smoke.md`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/specs/staging-smoke-checklist.md`
- `.claude/skills/task-specification-creator/references/quality-gates.md`

## 成果物

- `outputs/phase-04/main.md`

## 統合テスト連携

`apps/web/tests/e2e/staging-smoke.spec.ts` は `staging-smoke-checklist.md` の 19 routes を正本として実装サイクルで接続する。

## テスト pyramid

| 層 | フレームワーク | 対象 |
| --- | --- | --- |
| 単体 | Vitest + React Testing Library | `error.tsx` の dev/prod 分岐・digest 表示・reset 呼び出し・logger 呼び出し |
| 統合 | （本 task 範囲外） | — |
| E2E smoke | Playwright | 19 routes の HTTP 応答 / 404 文言 / error boundary 表示 |

## 単体テスト仕様

ファイル: `apps/web/app/__tests__/error.test.tsx`

| ケース ID | ケース | 入力 | 期待 |
| --- | --- | --- | --- |
| TC-U-01 | dev mode で stack を表示する | `process.env.NODE_ENV="development"` / `error.stack="..."` | `<pre>` element が存在し stack を含む |
| TC-U-02 | prod mode で stack を表示しない | `process.env.NODE_ENV="production"` | `<pre>` element が存在しない |
| TC-U-03 | digest が存在すれば表示する | `error.digest="abc123"` | `エラーID:` テキストと `abc123` が表示 |
| TC-U-04 | digest が undefined なら表示しない | `error.digest=undefined` | `エラーID:` テキストが存在しない |
| TC-U-05 | reset ボタンクリックで reset prop が呼ばれる | `userEvent.click("再試行する")` | spy 1 回呼び出し |
| TC-U-06 | mount 時に logger.error が 1 回呼ばれる | `vi.spyOn(logger, "error")` | spy 1 回 / `event="error.boundary.caught"` を含む引数 |
| TC-U-07 | 同 error の再 render では logger.error が 2 回呼ばれない | rerender 同 props | spy 1 回のまま |

mock 方針:

```ts
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));
```

## E2E smoke 仕様

ファイル: `apps/web/tests/e2e/staging-smoke.spec.ts`

対象 route は `docs/30-workflows/ui-prototype-alignment-mvp-recovery/specs/staging-smoke-checklist.md` の 19 行を正本とする。

`describe` ブロック:
1. `staging smoke / public` — 公開 routes は `[200, 301, 302, 307]` のいずれか
2. `staging smoke / auth-protected` — 会員/管理 routes（unauth）は `[200, 302, 307, 401, 403]` のいずれか
3. `staging smoke / 404` — `/__nonexistent__` は `404` かつ「ページが見つかりません」テキスト visible
4. `staging smoke / error boundary` — error injection fixture (`/(public)/members/__broken__`) で `role="alert"` visible

production 流入 guard:

```ts
test.beforeAll(() => {
  if (!BASE || /production|prod/.test(BASE)) {
    throw new Error(`[staging-smoke] BASE URL must be staging: ${BASE}`);
  }
});
```

fixture guard:

```ts
test.beforeAll(() => {
  if (process.env.ENABLE_STAGING_SMOKE_FIXTURE !== "1") {
    throw new Error("[staging-smoke] ENABLE_STAGING_SMOKE_FIXTURE=1 is required");
  }
});
```

## カバレッジ目標

- `apps/web/app/error.tsx` — Statement / Branch 90% 以上（dev/prod 分岐両方を踏む）
- `apps/web/app/global-error.tsx` — Statement 80% 以上（fallback render のみ確認）
- `not-found.tsx` / `loading.tsx` — render snapshot のみ（Statement 80% 以上）

## 完了条件

- [ ] TC-U-01〜07 が `error.test.tsx` に reify されている
- [ ] staging smoke spec の 4 describe ブロックが定義されている
- [ ] production URL guard が spec 冒頭にある
- [ ] `ENABLE_STAGING_SMOKE_FIXTURE=1` guard が fixture route 使用前にある
- [ ] `test.describe.skip` / `test.skip(true)` / `it.skip` が staging smoke spec に無い
