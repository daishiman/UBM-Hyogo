# Phase 7: カバレッジ — root error.tsx h1 自動 focus

**[実装区分: 実装仕様書]**

## 1. 対象ファイルのカバレッジ目標

| ファイル | 種別 | 目標 |
|---|---|---|
| `apps/web/app/error.tsx` | UI component | Statements / Branches / Lines / Functions ≥ 既存 baseline、追加 4 行は全 covered |

## 2. 取得コマンド

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" test:coverage \
  -- --run error.component
```

または web 全体 coverage:

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" test:coverage
```

## 3. 想定 coverage 差分

| 行 | 追加 covered |
|---|---|
| `const headingRef = useRef<HTMLHeadingElement>(null);` | ✅ TC-U-09a〜c |
| `headingRef.current?.focus({ preventScroll: true });` | ✅ TC-U-09a/c |
| `ref={headingRef}` / `tabIndex={-1}` | ✅ TC-U-09b |

Branch `headingRef.current?.` の null 側は本実装で常に bind されるため hit しない（許容: ref が常に non-null である React の保証）。

## 4. coverage-guard hook（CLAUDE.md「sync-merge 時の hook 挙動」）

- 本タスクは sync-merge ではないため `coverage-guard` がフル稼働する
- 既存 baseline を下回らないこと
- 下がる場合は: 追加した TC で expect 漏れがないか、不要な実装行が混入していないか確認

## 5. 既存 baseline 取得

実装前後で以下を比較:

```bash
# before
mise exec -- pnpm -F "@ubm-hyogo/web" test:coverage -- --run error.component 2>&1 | grep -E "error.tsx"
# 実装後
# 同上コマンドで before / after の Statements / Branches を比較
```

## 6. 完了条件

- error.tsx の追加 4 行が全て covered
- web 全体 coverage が既存 baseline を維持
