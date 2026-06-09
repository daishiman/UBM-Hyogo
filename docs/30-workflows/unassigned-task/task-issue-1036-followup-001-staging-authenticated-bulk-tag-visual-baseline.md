# Issue #1036 follow-up 001: staging authenticated bulk tag visual baseline - タスク指示書

## メタ情報

```yaml
issue_number: 1077
remaining_scope_issue: 1125
task_id: task-issue-1036-followup-001-staging-authenticated-bulk-tag-visual-baseline
task_name: Issue #1036 bulk tag UI の staging 認証付き visual baseline 取得
category: 改善
target_feature: apps/web /admin/members BulkActionBar tag bulk UI
priority: 中
scale: 小規模
status: consumed_by_issue_1077_and_issue_1125
source_phase: issue-1036-bulk-member-tag-assign Phase 11/12 user-gated visual evidence
created_date: 2026-06-01
dependencies: [issue-1036-bulk-member-tag-assign]
```

| 項目 | 内容 |
| --- | --- |
| タスクID | `task-issue-1036-followup-001-staging-authenticated-bulk-tag-visual-baseline` |
| タスク名 | Issue #1036 bulk tag UI の staging 認証付き visual baseline 取得 |
| 分類 | follow-up / visual evidence |
| 対象機能 | `apps/web` `/admin/members` BulkActionBar tag bulk UI |
| 優先度 | 中 |
| 見積もり規模 | 小規模 |
| ステータス | `consumed_by_issue_1077_and_issue_1125` |
| 残スコープ追跡 Issue | #1125（result 2 状態の認証付き staging mutation baseline） |
| 発見元 | issue-1036-bulk-member-tag-assign Phase 11/12 user-gated visual evidence |
| 発見日 | 2026-06-01 |
| 親 workflow | `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/` |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

Issue #1036 では local fixture による `BulkActionBar` tag bulk UI の 4 baseline は取得済みだが、staging 認証付き `/admin/members` 実機 baseline は user-gated として残っていた。

2026-06-03 の `docs/30-workflows/completed-tasks/issue-1077-bulk-tag-authenticated-staging-visual/` で、このうち **picker 2 状態**（assign / unassign）は read-only authenticated staging Playwright spec として実装済みになった。2026-06-06 の `docs/30-workflows/completed-tasks/issue-1125-bulk-tag-result-staging-mutation-visual-baseline/` で、残スコープだった **result 2 状態**（all-success / partial-failure）は mutation interaction-gated authenticated staging spec + seed/cleanup runner として実コード追加済みになった。

### 1.2 問題点・課題

残スコープだった、実 `POST /admin/members/tags/bulk` mutation を要する **result 2 状態**（all-success / partial-failure）の runtime baseline 取得基盤は、issue-1125 workflow で実装済みである。共有 staging D1 への副作用があるため、実 staging seed / mutation / baseline 生成 / cleanup は user-gated pending として分離する。

### 1.3 放置した場合の影響

- issue-1125 実装前は、staging の Auth.js session、Cloudflare Workers runtime、実 D1 mutation 後の result summary まで含む visual evidence が未取得のまま残るリスクがあった。
- 現在は Playwright spec / seed SQL / cleanup SQL / trap cleanup runner / runner shell test が追加済みで、runtime baseline 生成だけが user-gated pending として残る。
- partial-failure は退会済み member による `skipped_deleted` を主シナリオに固定した。未登録 tag の `notFound` は UI 操作で自然発生しないため、親 local fixture + component spec で代替担保する。

---

## 2. 何を達成するか（What）

### 2.1 目的

staging 環境で admin 認証を通した実 UI を開き、bulk tag mutation 後の result summary 2 状態を保存できる基盤を issue-1125 で実装済みにし、Issue #1036 / #1077 系の runtime visual evidence hole を user-gated 実行待ちまで収束させる。

### 2.2 最終ゴール

- `bulk-tag-result-all-success.png` / `bulk-tag-result-partial-failure.png` 相当の結果表示を staging で取得できる runner / spec を持つ。
- screenshot path / canonical 名が Phase 11 / implementation-guide / artifacts ledger と一致する。
- 実行ログに admin 認証、対象 URL、capture command、保存先、mutation 対象、cleanup 結果を残せる。
- staging 専用 test member / test tag だけを使い、共有データへの恒久副作用を残さない。

### 2.3 スコープ

#### 含むもの

- staging 認証付き `/admin/members` の result summary screenshot capture。
- result 2 状態を取得する場合の staging 専用 test member / test tag の投入、bulk mutation 実行、cleanup、実行ログ保存。
- Phase 11 evidence ledger / implementation-guide の screenshot path 同期。
- capture command / URL / auth method / cleanup 結果の記録。

#### 含まないもの

- Issue #1036 本体実装の変更。
- picker 2 状態の read-only spec 実装（issue-1077 で実装済み）。
- production 環境での bulk tag mutation。
- commit / push / PR 作成。

### 2.4 成果物

- issue-1125 workflow root: `docs/30-workflows/completed-tasks/issue-1125-bulk-tag-result-staging-mutation-visual-baseline/`
- result summary 2 状態の authenticated staging Playwright spec。
- staging seed / cleanup SQL。
- seed → capture → cleanup → residual-zero 検証 runner。
- Phase 11 / Phase 12 evidence path 同期差分。

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- issue-1077 の picker 2 状態 read-only spec が存在する。
- staging admin storageState を mint できる。
- staging 専用 test member / test tag を用意できる。
- cleanup 手順と対象 ID が実行前に確定している。

### 3.2 依存タスク

- 親 workflow: `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/`
- 部分消化 workflow: `docs/30-workflows/completed-tasks/issue-1077-bulk-tag-authenticated-staging-visual/`

### 3.3 必要な知識

- `BulkActionBar` の picker / mode / result summary DOM。
- `POST /admin/members/tags/bulk` の request / response shape。
- staging D1 test data の投入と後始末。
- Playwright authenticated staging project の storageState minting。

### 3.4 推奨アプローチ

read-only picker capture と mutation result capture を分離する。result capture では専用 test data を投入し、all-success と partial-failure を撮影した直後に cleanup を実行する。実行ログには mutation 対象 ID と cleanup 確認を残す。

---

## 4. 実行手順

### Phase構成

1. staging test data 設計。
2. authenticated staging result capture 実装 / 実行。
3. cleanup と evidence 同期。

### Phase 1: staging test data 設計

#### 目的

all-success / partial-failure を再現する staging 専用データを決める。

#### 手順

1. test member / test tag の投入方法を決める。
2. partial-failure 用の退会済み member + 未登録 tag 条件を決める。
3. cleanup 対象 ID と確認クエリを記録する。

#### 成果物

- test data plan。
- cleanup plan。

#### 完了条件

- 共有 staging データへ恒久副作用を残さない手順が確定している。

### Phase 2: authenticated staging result capture

#### 目的

result summary 2 状態を runtime screenshot として取得する。

#### 手順

1. admin storageState を mint する。
2. `/admin/members` で対象 member を選択する。
3. all-success mutation を実行し screenshot を取得する。
4. partial-failure mutation を実行し screenshot を取得する。
5. command / URL / storageState / screenshot path をログへ記録する。

#### 成果物

- `bulk-tag-result-all-success` screenshot。
- `bulk-tag-result-partial-failure` screenshot。
- execution log。

#### 完了条件

- 2 screenshot と execution log が Phase 11 evidence に保存されている。

### Phase 3: cleanup と evidence 同期

#### 目的

staging test data を後始末し、Phase 11 / 12 の参照を同期する。

#### 手順

1. test data cleanup を実行する。
2. cleanup 結果をログへ保存する。
3. Phase 11 / implementation-guide / artifacts ledger の screenshot path を同期する。

#### 成果物

- cleanup log。
- Phase 11 / 12 docs 差分。

#### 完了条件

- cleanup 確認済みで、evidence path が全ドキュメントで一致している。

---

## 5. 完了条件チェックリスト

### 機能要件

- [x] `bulk-tag-result-all-success.png` 相当の staging result screenshot を取得する spec / runner が実装されている（runtime baseline 生成は user-gated pending）。
- [x] `bulk-tag-result-partial-failure.png` 相当の staging result screenshot を取得する spec / runner が実装されている（runtime baseline 生成は user-gated pending）。
- [x] admin 認証・対象 URL・capture command・保存先を実行ログに残す runner が実装されている。

### 品質要件

- [x] staging 専用 test data のみを mutation 対象にしている。
- [x] cleanup が成功/失敗/中断いずれでも走り、後始末結果をログに残す runner が実装されている。
- [x] result summary の描画は `BulkActionBar.spec.tsx` TC-BAB-TAG-03 と矛盾していない。

### ドキュメント要件

- [x] Phase 11 evidence ledger に screenshot / log path が記録されている。
- [x] implementation-guide / artifacts ledger と canonical 名が一致している。
- [x] issue-1077 で picker 2 状態が partially consumed 済みであることを維持し、issue-1125 で result 2 状態を consumed として同期している。

---

## 6. 検証方法

### テストケース

- all-success: 選択 member 全員に tag mutation が成功し、成功 summary が表示される。
- partial-failure: 一部 member または tag 条件が失敗し、partial failure summary が表示される。
- cleanup: mutation 後の staging test data が後始末されている。

### 検証手順

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx
```

期待: BulkActionBar の tag picker / mode toggle / result summary component spec が PASS。

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| staging admin 認証 cookie が取得できず screenshot が撮れない | 中 | 中 | 既存 authenticated Playwright storageState / admin login fixture を再利用し、手動認証が必要な場合は user-gated evidence として明記する |
| staging D1 の実データに削除済み member が無く部分失敗状態を再現できない | 中 | 中 | staging 専用 `e2e_test_*` データを user 承認後に投入する |
| local fixture 名と staging 実機名が混在して ledger が drift する | 低 | 中 | canonical 名を Phase 11 / implementation-guide / artifacts ledger で同一 wave 同期する |
| bulk assign 実行が実データへ副作用を残す | 高 | 中 | 操作対象は staging 専用 test member / test tag に限定し、cleanup 手順を command log に残す |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/phase-11-manual-test.md`
- `docs/30-workflows/completed-tasks/issue-1077-bulk-tag-authenticated-staging-visual/`

### 参考資料

- `apps/web/playwright/tests/issue1036-bulk-member-tags.spec.ts`
- `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts`
- `apps/web/src/features/admin/components/_members/BulkActionBar.tsx`

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| ---- | ---- |
| 症状 | 現行 screenshot は `page.setContent()` の local fixture で UI 状態を再現しており、staging の Auth.js session、Cloudflare Workers runtime、`GET /admin/tags` 実レスポンス、実 member selection state までは証明していない |
| 原因 | read-only picker evidence と mutation result evidence の副作用境界が同じ未タスク内で混在していた |
| 対応 | issue-1077 で picker 2 状態を read-only spec として partially consumed し、本ファイルの残スコープを result 2 状態へ絞った。その後 issue-1125 で mutation interaction-gated spec + seed/cleanup runner を追加し、残スコープを user-gated runtime pending まで消化した |
| 再発防止 | visual baseline は mutation 副作用の有無で scope split し、残スコープを未タスク指示書に明記する |

### レビュー指摘の原文（該当する場合）

```text
issue-1077 review: result 2 状態（all-success / partial-failure）の認証付き staging mutation baseline は、共有 staging D1 への副作用があるため picker 2 状態と同一サイクルで完了しない。既存未タスクへ trace し、残スコープとして保持する。
```

### 補足事項

issue #1077 / #1125 は CLOSED 維持。staging seed / mutation / baseline 生成 / cleanup、commit / push / PR 作成はユーザー指示があるまで実行しない。
