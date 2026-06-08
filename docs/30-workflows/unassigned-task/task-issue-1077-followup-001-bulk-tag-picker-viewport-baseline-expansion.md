# Issue #1077 follow-up 001: bulk tag picker viewport baseline expansion - タスク指示書

## メタ情報

```yaml
issue_number: 1126
task_id: task-issue-1077-followup-001-bulk-tag-picker-viewport-baseline-expansion
task_name: bulk tag picker visual baseline の viewport 拡張（mobile / tablet / wide）
category: 改善
target_feature: apps/web /admin/members BulkActionBar tag picker visual baseline
priority: 低
scale: 小規模
status: consumed
source_phase: issue-1077-bulk-tag-authenticated-staging-visual Phase 10 MINOR-02 / Phase 12 detection B-1
created_date: 2026-06-03
dependencies: [issue-1077-bulk-tag-authenticated-staging-visual]
canonical_workflow: docs/30-workflows/completed-tasks/issue-1126-bulk-tag-picker-viewport-baseline-expansion/
consumed_date: 2026-06-06
```

> **consumed pointer（2026-06-06）**: 本未タスク指示書は Phase 1-13 の実装仕様書へ昇格した。
> 正本ワークフロー: [`docs/30-workflows/completed-tasks/issue-1126-bulk-tag-picker-viewport-baseline-expansion/`](../completed-tasks/issue-1126-bulk-tag-picker-viewport-baseline-expansion/index.md)
> issue #1126 は CLOSED のまま（`Refs #1126`・reopen しない）。本ファイルは backlink trace として維持する。

| 項目 | 内容 |
| --- | --- |
| タスクID | `task-issue-1077-followup-001-bulk-tag-picker-viewport-baseline-expansion` |
| タスク名 | bulk tag picker visual baseline の viewport 拡張（mobile / tablet / wide） |
| 分類 | 改善 / visual regression coverage |
| 対象機能 | `apps/web` `/admin/members` BulkActionBar tag picker visual baseline |
| 優先度 | 低 |
| 見積もり規模 | 小規模 |
| ステータス | `consumed` |
| 発見元 | issue-1077-bulk-tag-authenticated-staging-visual Phase 10 MINOR-02 / Phase 12 detection B-1 |
| 発見日 | 2026-06-03 |
| 親 workflow | `docs/30-workflows/completed-tasks/issue-1077-bulk-tag-authenticated-staging-visual/` |

---

## 苦戦箇所【記入必須】

- 初期仕様書は `spec_created` として閉じる前提だったが、実際には `viewports.ts` と authenticated staging Playwright spec の2ファイルを同一サイクルで安全に実装できたため、`implemented_local_runtime_pending` へ再分類した。
- screenshot evidence の出力先は親 issue-1077 completed root ではなく、本 issue-1126 workflow root の `outputs/phase-11/` に所有させる必要があった。

## リスクと対策【記入必須】

| リスク | 対策 |
| --- | --- |
| 既存 desktop baseline を壊す | desktop no-suffix snapshot を既存 test に残し、responsive snapshots は viewport suffix 付きの別 test に分離 |
| staging D1 mutation | apply button は押さず、`bulk-tag-result` count 0 を assert |
| baseline 未生成で通常実行が fail | 初回 `--update-snapshots` は user-gated として明示 |

## 検証方法【記入必須】

- `pnpm --filter @ubm-hyogo/web typecheck`
- `pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx`
- user-gated: `pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual-authenticated admin-members-bulk-tag-authenticated --update-snapshots`

## スコープ【記入必須】

| 含む | 含まない |
| --- | --- |
| `VIEWPORTS.wide` additive 追加、responsive 3 viewport × assign/unassign baseline assertion 追加、Phase 11/12 evidence ledger 同期 | result mutation baseline、API/D1/Google Form変更、production capture、commit/push/PR |

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

Issue #1077 では、authenticated staging 環境で `/admin/members` の bulk tag picker visual baseline を assign / unassign の 2 状態で取得した。実装は `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts` にあり、`staging-visual-authenticated` Playwright project・`mint-staging-storage-state.ts`・CI `playwright-staging-visual-authenticated.yml` の既存基盤上で動作する。

このとき安定性を優先し、baseline は **desktop 単一 viewport** のみで取得した。canonical screenshot 名は `bulk-tag-picker-assign-mode.png` / `bulk-tag-picker-unassign-mode.png` の 2 枚である。

### 1.2 問題点・課題

bulk tag picker は `apps/web/src/features/admin/components/_members/BulkActionBar.tsx` でレンダリングされ、レスポンシブに表示が変化しうる。現状の desktop 単一 baseline では、mobile / tablet / wide といった他の viewport でのレイアウト崩れ（picker のはみ出し・折り返し・ボタン重なりなど）を visual 回帰として検出できない。

### 1.3 放置した場合の影響

- mobile / tablet / wide でのみ発生する picker レイアウト崩れが CI の visual gate をすり抜ける。
- レスポンシブ調整を加えた際に、desktop だけ緑で他 viewport の劣化に気づけない。
- 後からレスポンシブ回帰が問題化した時点で、viewport 別 baseline を初めて整備することになり、回帰原因の切り分けコストが高くなる。

---

## 2. 何を達成するか（What）

### 2.1 目的

issue-1077 で取得した bulk tag picker の assign / unassign 2 状態 baseline を、mobile / tablet / wide の viewport へ拡張し、レスポンシブ picker の visual 回帰検出範囲を広げる。

### 2.2 最終ゴール

- assign / unassign の 2 状態を、desktop に加えて mobile / tablet / wide の各 viewport で baseline 取得する。
- viewport ごとに baseline を分離する（例: `-mobile` / `-tablet` / `-wide` suffix）命名規約を確定し、既存 desktop baseline と整合させる。
- 既存 `staging-visual-authenticated` project の枠組み・mint-staging-storage-state・CI workflow をそのまま流用し、viewport 拡張のみを additive に行う。
- read-only capture（mutation なし）を維持し、共有 staging D1 への副作用を残さない。

### 2.3 スコープ

#### 含むもの

- assign / unassign 2 状態 × mobile / tablet / wide viewport の baseline 取得。
- viewport 別 baseline の命名規約（suffix）と保存先の確定。
- Playwright project の viewport 設定拡張、または per-test viewport 指定のいずれを採るかの判断と適用。
- Phase 11 evidence ledger / implementation-guide の screenshot path 同期。

#### 含まないもの

- Issue #1077 本体実装（read-only picker spec）の挙動変更。
- result 2 状態（all-success / partial-failure）の mutation baseline 取得（別 follow-up が担当）。
- `BulkActionBar.tsx` 等の component 実装そのものの変更。
- production 環境での capture。
- commit / push / PR 作成。

### 2.4 成果物

- mobile / tablet / wide × assign / unassign の viewport 別 baseline screenshot。
- viewport 別命名規約を反映した spec 差分。
- capture command / URL / auth method / viewport 設定の実行ログ。
- Phase 11 / Phase 12 evidence path 同期差分。

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- issue-1077 の picker 2 状態 read-only spec が desktop で安定 land している。
- staging admin storageState を `mint-staging-storage-state.ts` で mint できる。
- `staging-visual-authenticated` Playwright project が CI / local で実行できる。
- 対象 capture が read-only（mutation なし）であることを維持できる。

### 3.2 依存タスク

- 親 workflow: `docs/30-workflows/completed-tasks/issue-1077-bulk-tag-authenticated-staging-visual/`

### 3.3 必要な知識

- `BulkActionBar` の picker / assign / unassign mode の DOM 構造とレスポンシブ表示。
- Playwright の viewport 設定（project レベル `use.viewport` と per-test `page.setViewportSize()`）。
- visual baseline の命名・保存・更新（`--update-snapshots`）フロー。
- `staging-visual-authenticated` project と storageState minting の前提。

### 3.4 推奨アプローチ

既存 desktop baseline を温存したまま additive に viewport を増やす。viewport 拡張の実装方式は次の 2 案を比較して決める。

- A 案: Playwright project を viewport 別に複製（または matrix 化）し、project ごとに baseline ディレクトリを分離する。
- B 案: 1 spec 内で `page.setViewportSize()` を切り替え、screenshot 名に `-mobile` / `-tablet` / `-wide` suffix を付けて baseline を分離する。

read-only capture を保ち、各 viewport の baseline 取得後に Phase 11 evidence path を同期する。

---

## 4. 実行手順

### Phase構成

1. viewport 拡張方式の決定。
2. viewport 別 baseline capture 実装 / 取得。
3. evidence 同期。

### Phase 1: viewport 拡張方式の決定

#### 目的

mobile / tablet / wide の viewport 値と baseline 分離方式（project 複製 / per-test viewport）を確定する。

#### 手順

1. mobile / tablet / wide の具体的な viewport サイズを決める。
2. project 設定方式（A 案 / B 案）を選定する。
3. viewport 別命名規約（`-mobile` / `-tablet` / `-wide` suffix）と保存先を確定する。

#### 成果物

- viewport 値の一覧。
- baseline 分離方式の決定記録。

#### 完了条件

- desktop 既存 baseline と衝突しない命名・保存先が確定している。

### Phase 2: viewport 別 baseline capture

#### 目的

assign / unassign 2 状態を mobile / tablet / wide で baseline 取得する。

#### 手順

1. admin storageState を mint する。
2. 各 viewport で assign mode picker を開き screenshot を取得する。
3. 各 viewport で unassign mode picker を開き screenshot を取得する。
4. `--update-snapshots` で viewport 別 baseline を確定する。
5. command / URL / storageState / viewport / screenshot path をログへ記録する。

#### 成果物

- assign / unassign × mobile / tablet / wide の baseline screenshot。
- execution log。

#### 完了条件

- 全 viewport 分の baseline が取得され、read-only（mutation 不在）を維持している。

### Phase 3: evidence 同期

#### 目的

Phase 11 / 12 の参照と baseline 命名を同期する。

#### 手順

1. Phase 11 evidence ledger に viewport 別 screenshot path を追記する。
2. implementation-guide / artifacts ledger の canonical 名を viewport suffix 込みで同期する。
3. 既存 desktop baseline が維持されていることを確認する。

#### 成果物

- Phase 11 / 12 docs 差分。

#### 完了条件

- viewport 別 evidence path が全ドキュメントで一致している。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] assign / unassign 2 状態が mobile / tablet / wide の各 viewport で baseline 取得されている。
- [ ] viewport 別 baseline が `-mobile` / `-tablet` / `-wide` suffix（または同等規約）で分離されている。
- [ ] 既存 desktop baseline（`bulk-tag-picker-assign-mode.png` / `bulk-tag-picker-unassign-mode.png`）が維持されている。

### 品質要件

- [ ] capture が read-only で、共有 staging D1 への副作用が無い。
- [ ] `staging-visual-authenticated` project / mint-staging-storage-state / CI workflow を additive に流用している。
- [ ] picker の描画は `BulkActionBar.spec.tsx` と矛盾していない。

### ドキュメント要件

- [ ] Phase 11 evidence ledger に viewport 別 screenshot / log path が記録されている。
- [ ] implementation-guide / artifacts ledger と canonical 名が一致している。
- [ ] issue-1077 の desktop baseline が引き続き有効であることを明記している。

---

## 6. 検証方法

### テストケース

- assign-mode（各 viewport）: assign mode picker のレイアウトが baseline と一致する。
- unassign-mode（各 viewport）: unassign mode picker のレイアウトが baseline と一致する。
- read-only: capture 実行後に staging データへ副作用が無い。

### 検証手順

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx
```

期待: BulkActionBar の tag picker / mode toggle component spec が PASS。

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| viewport 別 baseline 枚数が増えメンテコストが増大する | 中 | 中 | 取得対象を assign / unassign 2 状態に限定し、result 状態は別 follow-up として分離する |
| viewport suffix 規約が desktop 既存 baseline と衝突し ledger が drift する | 中 | 中 | desktop は無 suffix を維持し、追加分のみ `-mobile` / `-tablet` / `-wide` を付与して同一 wave で同期する |
| mobile viewport で picker の一部が画面外に出て安定撮影できない | 中 | 中 | viewport ごとに picker を開いた後の wait / scroll を spec へ明示し、flaky 化を防ぐ |
| project 複製方式で CI 実行時間が増える | 低 | 中 | per-test viewport 方式（B 案）も比較し、実行コストの小さい方を採用する |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/completed-tasks/issue-1077-bulk-tag-authenticated-staging-visual/`
- `docs/30-workflows/completed-tasks/issue-1077-bulk-tag-authenticated-staging-visual/outputs/phase-12/unassigned-task-detection.md`

### 参考資料

- `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts`
- `apps/web/src/features/admin/components/_members/BulkActionBar.tsx`
- `.github/workflows/playwright-staging-visual-authenticated.yml`
- `apps/web/playwright/mint-staging-storage-state.ts`

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| ---- | ---- |
| 症状 | issue-1077 の bulk tag picker visual baseline は desktop 単一 viewport のみで、mobile / tablet / wide のレスポンシブ崩れを検出できない |
| 原因 | viewport を増やすと baseline 枚数とメンテコストが増えるため、issue-1077 では安定性を優先して desktop 単一 viewport に絞った |
| 対応 | レスポンシブ回帰が問題化するまで本タスクを未タスク化して保留し、必要時に additive な viewport 拡張として着手する |
| 再発防止 | visual baseline は viewport 拡張をスコープ split し、保留分を未タスク指示書へ trace して desktop 単一の前提を明示する |

### レビュー指摘の原文（該当する場合）

```text
issue-1077 Phase 10 final review MINOR-02 / Phase 12 detection B-1: bulk tag picker visual baseline は desktop 単一 viewport で land した。mobile / tablet / wide への viewport 拡張は安定 land 後に着手する improvement として未タスク化し、レスポンシブ回帰検出範囲を後続で広げる。
```

### 補足事項

優先度は low（desktop 単一 baseline が安定 land した後に着手する候補）。本タスクは read-only capture のみで mutation を伴わない。commit / push / PR 作成はユーザー指示があるまで実行しない。
