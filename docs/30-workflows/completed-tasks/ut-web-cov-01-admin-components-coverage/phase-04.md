[実装区分: 実装仕様書]

# Phase 4: テスト戦略 — ut-web-cov-01-admin-components-coverage

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-01-admin-components-coverage |
| phase | 4 / 13 |
| 作成日 | 2026-05-03 |
| taskType | implementation |

## 目的

Phase 2/3 の設計に基づき、vitest config 確認・coverage threshold ルート・共通 mock パターン・実行コマンドを実装可能粒度で確定する。

## 変更対象ファイル一覧

| パス | 変更種別 |
| --- | --- |
| `apps/web/vitest.config.ts` | 変更なし（既存 jsdom / globals=false / v8 provider / testTimeout=30s を確認） |
| `apps/web/src/components/admin/__tests__/*.test.tsx` | 編集（Phase 5 で追加 it 反映） |
| `apps/web/src/components/layout/__tests__/AdminSidebar.test.tsx` | 編集（Phase 5 で +1 任意） |

## vitest config 確認事項

- `environment: 'jsdom'`
- `globals: false`（`describe/it/expect/vi` はすべて `import { ... } from 'vitest'`）
- `coverage.provider: 'v8'`
- `coverage.include: ['apps/**/src/**/*.{ts,tsx}']`
- `coverage.exclude` に `**/page.tsx`, `**/layout.tsx`, `**/loading.tsx`, `**/error.tsx`, `**/middleware.ts` が含まれる
- `coverage.thresholds` は未設定。現行 CI は `.github/workflows/ci.yml` の `coverage-gate`（soft gate / `continue-on-error: true`）で 80% baseline を確認する。85/80 hard gate は本タスクのローカル Phase 11 evidence で担保し、CI hard gate 化は coverage enforcement PR3/3 に委譲する。

## coverage threshold ルート

- ローカル測定: `pnpm --filter @ubm-hyogo/web test:coverage`
- CI gate: `.github/workflows/ci.yml` の `coverage-gate` が `scripts/coverage-guard.sh` を実行する。ただし現状は soft gate のため、Stmts/Lines/Funcs ≥85% / Branches ≥80% の本タスク判定は `pnpm --filter @ubm-hyogo/web test:coverage` の Phase 11 ローカル実測で行う。

## 共通 mock パターン

### Pattern A: useRouter

```ts
import { vi } from "vitest";
const pushMock = vi.fn();
const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));
```

### Pattern B: lib/admin/api

```ts
vi.mock("../../../lib/admin/api", () => ({
  postMemberNote: vi.fn(),
  restoreMember: vi.fn(),
  hideMember: vi.fn(),
}));
import * as adminApi from "../../../lib/admin/api";
// 各 it で:
vi.mocked(adminApi.postMemberNote).mockResolvedValue({ ok: true });
vi.mocked(adminApi.postMemberNote).mockRejectedValueOnce(new Error("network"));
```

### Pattern C: fetch stub

```ts
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => ({
    ok: true,
    json: async () => ({ ok: true }),
  })));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
```

## 入出力・副作用の検証方法

- DOM: `screen.getByRole`, `screen.getByText`, `queryByRole` で存在/不在を assertion
- mock call: `expect(pushMock).toHaveBeenCalledWith('/admin/members?filter=hidden')`
- 非同期: `await waitFor(() => expect(...).toBeInTheDocument())`
- ユーザ入力: `await userEvent.click(...)`, `await userEvent.type(input, "memo")`

## 実行コマンド

```bash
# 単発実行
mise exec -- pnpm --filter @ubm-hyogo/web test

# 対象 file 限定
mise exec -- pnpm --filter @ubm-hyogo/web test src/components/admin/__tests__/MemberDrawer.test.tsx

# coverage 計測（Phase 11 evidence 用）
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage
```

## 完了条件 (DoD)

- vitest config が想定通りであることを確認済み
- 共通 mock パターン A/B/C が確定
- 実行コマンドが文書化
- Phase 5 runbook が前提なくスタート可能

## テスト方針

- 既存 web test の regression を起こさない（実行時間増 < 30%）
- 新規 it は既存 describe にまとめる（不要な describe block 増殖回避）

## サブタスク管理

- [x] vitest config 確認
- [x] mock パターン整理
- [x] 実行コマンド明記
- [ ] outputs/phase-04/main.md 作成

## 次 Phase への引き渡し

Phase 5 へ、ファイル着手順 / it ケース具体名 / 推定行数を引き渡す。

## Template Compliance Addendum

## 実行タスク

- 既存本文の目的、変更対象、テスト方針、ローカル実行コマンド、完了条件に従って本 Phase の作業を実行する。
- Phase completion は `artifacts.json` と `outputs/artifacts.json` の status、および該当 `outputs/phase-XX/main.md` で記録する。

## 参照資料

- `index.md`
- `artifacts.json`
- `outputs/phase-11/vitest-run.log`
- `outputs/phase-11/coverage-target-files.txt`

## 成果物/実行手順

- 成果物: `outputs/phase-04/main.md`
- 実行手順: 本 Phase の変更対象と検証コマンドを確認し、結果を outputs に記録する。

## 統合テスト連携

- 本タスクは apps/web component unit coverage hardening であり、外部 integration test は追加しない。
- 回帰確認は `pnpm --filter @ubm-hyogo/web test:coverage` の同一実行で担保する。
