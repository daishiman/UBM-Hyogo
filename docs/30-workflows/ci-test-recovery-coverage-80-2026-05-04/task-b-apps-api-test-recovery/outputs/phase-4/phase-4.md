# Phase 4: テスト戦略（既存 test 修復方針）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 / 13 |
| 名称 | テスト戦略 |
| status | spec_created |
| 入力 | `outputs/phase-2/main.md` / `outputs/phase-3/main.md` |
| 出力 | `outputs/phase-4/main.md` |

## 目的

Phase 5 実装前に、13 件 failure を GREEN にするための test 修復戦略を確定する。**新規 test 追加はしない**（coverage 補強は Task D 範囲）。

## 環境前提チェック（[FB-MSO-002]）

| チェック | コマンド | 期待 |
| --- | --- | --- |
| pnpm install 整合 | `mise exec -- pnpm install` | exit 0 |
| esbuild darwin binary mismatch | `mise exec -- pnpm --filter @ubm-hyogo/api exec node -e "require('esbuild')"` | error なし |
| Miniflare インストール確認 | `mise exec -- pnpm --filter @ubm-hyogo/api list miniflare` | バージョン表示 |

不一致がある場合は Phase 5 開始前に解消する。

## 実行タスク

### Step 1: targeted run コマンド一覧

13 件 failure それぞれに対する targeted run コマンドを列挙する（Phase 5 RED → GREEN 確認用）。

```bash
# 例
mise exec -- pnpm --filter @ubm-hyogo/api test apps/api/src/jobs/sync-forms-responses.test.ts
mise exec -- pnpm --filter @ubm-hyogo/api test apps/api/src/workflows/schemaAliasAssign.test.ts
mise exec -- pnpm --filter @ubm-hyogo/api test apps/api/src/routes/admin/attendance.test.ts
# ... 13 件分
```

### Step 2: 期待 RED → GREEN マトリクス

| # | test file | 修復前 | 修復後（期待） |
| --- | --- | --- | --- |
| 1 | ... | FAIL（assertion: ...） | PASS |
| ... | ... | ... | ... |

### Step 3: regression guard 戦略

修復後に既存 PASS test（baseline で `passed` 状態の N 件）が regression を起こしていないことを確認するため:

```bash
# Phase 6 で全件 run
mise exec -- pnpm --filter @ubm-hyogo/api test 2>&1 | tee outputs/phase-6/api-test-after-fix.log
```

期待: `Tests N passed (N)` で 13 件以上の追加 PASS、追加 FAIL = 0。

### Step 4: D1 binding / Miniflare test pattern

[FB-VSCPKR-02] / `int-test-skill` 参照に従い:

- `vi.stubGlobal("window", ...)` 等の global 置換は禁止
- D1 mock は `Object.defineProperty` または Miniflare 標準 binding 経由
- per-test D1 instance を使う場合は `beforeEach` で migration を適用、`afterEach` で破棄

### Step 5: hookTimeout / test isolation

- 既存の `hookTimeout: 30000` 設定（auth-routes.test.ts 等）は維持
- 新規 hookTimeout 追加は最小限。test isolation の問題なら setup 修正で解決を優先

### Step 6: private method / internal state テスト方針

[Feedback P0-09-U1] 適用:

- 該当する failure があれば `(handler as unknown as HandlerPrivate)` キャスト or public callback 経由のいずれかを採用
- 内部 state（middleware の context 等）は public 経路（response status / body）で検証

### Step 7: snapshot test 取り扱い

該当する failure に snapshot test が含まれる場合:

- 初回 `--updateSnapshot` 実行を Phase 5 で許可するかを Phase 5 ステップに明記
- 既存 snapshot との diff 確認を別ステップで実施（[FB-IPC-SNAP-002]）

## 完了条件

- [ ] `outputs/phase-4/main.md` に 13 件分の targeted run コマンドが記載
- [ ] 期待 RED → GREEN マトリクスが完成
- [ ] regression guard 戦略コマンドが明記
- [ ] D1 / Miniflare pattern が `int-test-skill` 準拠であることが宣言
- [ ] 環境前提チェック 3 項目全て PASS

## 多角的レビュー観点

- 整合性: test 修復のみで coverage threshold 80% を維持できるか（一部 impl 修正で coverage 増減のリスク）
- 運用性: 13 件 targeted run の合計実行時間が現実的か（30 秒/件 想定で 6.5 分以内）
