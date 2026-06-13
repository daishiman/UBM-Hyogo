# Phase 4: テスト作成

## メタ情報

| 項目 | 値 |
|------|-----|
| taskId | TASK-ADMIN-SCHEMA-TERMINOLOGY-CLARITY-001 |
| Phase | 4 / 13（テスト作成） |
| タスク種別 | UI task（VISUAL / implemented_local_evidence_captured） |
| 設計正本 | [shared-context.md](../../shared-context.md) |

## 目的

実装着手前に、用語リネームと revisionId 非表示を検証する失敗するテスト（TDD の Red）を先に定義する。[shared-context.md §4](../../shared-context.md) のテストファイル表 T1〜T6 ごとに追加・更新するテストケースを設計し、[phase-1.md](../phase-1/phase-1.md) の AC-1〜AC-11 を 1:1 でカバーするテストケース対応表を作る。検証対象が外部 prop か内部 state かを明記し、focused vitest の実行方法を確定する。

## 実行タスク

1. T1（`page.spec.tsx`）に「フォーム項目の対応づけ」「現在のフォーム構成」「フォーム構成の履歴」「対応づけの記録」の新文言存在 assert を追加する。eyebrow「ADMIN / SCHEMA」が「管理 / フォーム項目」に変わったことを assert する。
2. T1 に **生 revisionId が DOM に存在しないことの assert** を追加する。テストフィクスチャの `diff.items[0].revisionId` に既知の sentinel 値（例 `"000000aaaa"`）を入れ、レンダリング結果に `queryByText(/000000aaaa/)` が null であることを検証する。`hash` 生値も同様に非表示を assert する。
3. T1 に CURRENT REVISION カードの「最新版」「適用中」「取得: 2026年6月9日」表示 assert を追加する。`capturedAt` に有効 ISO を与えたとき日本語日付行が出ること、null を与えたとき「取得:」行が描画されないこと（fail-soft）を検証する。
4. T2（`SidebarNavItem.spec.tsx`）・T3（`shell-config.spec.tsx`）・T4（`SidebarShell.server.spec.tsx`）の label 期待値を「スキーマ」→「フォーム項目」へ更新する。あわせて href `/admin/schema` が不変であることを同テスト内で assert する。
5. T5（`SchemaDiffPanel.component.spec.tsx`）に新文言「まとめて対応づけ」「まとめて取り消し」「項目別の変更点」「対応づけの記録」の存在 assert と、旧英語「Bulk Resolve」「Bulk Rollback」「DIFF ITEMS」「resolve 履歴」の非存在 assert を追加する。
6. T6（`SchemaAlertCard.spec.tsx`）にダッシュボード文言「未対応のフォーム項目: N 件」「対応づけが必要なフォーム項目があります。」「フォーム項目の対応づけを開く →」の assert を追加する。testid `admin-kpi-card-schema` 不変も KpiGrid spec で確認する。
7. `formatJstDate` の単体テストを `datetime.ts` の既存 spec（同ディレクトリの `*.spec.ts`）に追加する: 有効 ISO（`2026-06-09T...`）→「2026年6月9日」、`null`/`undefined`/空文字/無効フォーマット→空文字、を検証する。
8. 各テストの検証対象が external prop か internal state かを明記する（本タスクは大半が server component 描画後の文字列 assert＝外部入力 prop からの描画検証であり、internal state 操作は SchemaDiffPanel のモーダル開閉ボタン文言のみ）。
9. private method テストは該当なしと明記する（変更対象は純粋関数 helper `formatJstDate` と描画文字列のみで、クラス private method は存在しない）。
10. focused vitest 実行コマンドを記載する（ルートからフルパス指定が必須な点を注記）。

## 参照資料

- [shared-context.md](../../shared-context.md) — §2 用語リネーム正本テーブル / §3 helper / §4 テストファイル表
- [phase-1.md](../phase-1/phase-1.md) — AC-1〜AC-11 定義
- [phase-2.md](../phase-2/phase-2.md) — DOM contract 保持・revisionId 非表示設計
- `apps/web/app/(admin)/admin/schema/page.spec.tsx` — T1 編集対象
- `apps/web/src/lib/format/datetime.ts` — `formatJstDate` 追加対象・既存 spec へケース追加

## 成果物

- T1〜T6 ごとの追加・更新テストケース一覧
- AC ↔ テストケース 1:1 対応表
- `formatJstDate` 単体テストケース表
- focused vitest 実行コマンド

### テストケース一覧（T1〜T6）

| ID | ファイル | 追加・更新するケース | 検証対象 |
|----|---------|---------------------|---------|
| T1-a | page.spec.tsx | ページ見出し「フォーム項目の対応づけ」存在 | 描画文字列（外部 prop） |
| T1-b | page.spec.tsx | eyebrow「管理 / フォーム項目」存在・「ADMIN / SCHEMA」非存在 | 描画文字列 |
| T1-c | page.spec.tsx | CURRENT REVISION に sentinel revisionId が**描画されない** | 描画文字列（非存在 assert） |
| T1-d | page.spec.tsx | hash 生値が描画されない | 描画文字列（非存在 assert） |
| T1-e | page.spec.tsx | 「最新版」「適用中」「現在のフォーム構成」存在 | 描画文字列 |
| T1-f | page.spec.tsx | `capturedAt` 有効時「取得: 2026年6月9日」存在 / null 時「取得:」行非描画 | 描画文字列（fail-soft 分岐） |
| T1-g | page.spec.tsx | REVISIONS「フォーム構成の履歴」/ ALIAS HISTORY「対応づけの記録」存在・英語 eyebrow 非存在 | 描画文字列 |
| T1-h | page.spec.tsx | `{diff.total} 件の変更点` 表示 | 描画文字列 |
| T2-a | SidebarNavItem.spec.tsx | label「フォーム項目」存在・「スキーマ」非存在 | 外部 prop（nav item） |
| T2-b | SidebarNavItem.spec.tsx | href `/admin/schema` 不変 | 外部 prop（不変 assert） |
| T3-a | shell-config.spec.tsx | nav config の label「フォーム項目」期待値 | 設定オブジェクト |
| T4-a | SidebarShell.server.spec.tsx | nav label「フォーム項目」描画・href/badge 不変 | server 描画 |
| T5-a | SchemaDiffPanel.component.spec.tsx | 「まとめて対応づけ」「まとめて取り消し」「項目別の変更点」「対応づけの記録」存在 | 描画文字列 |
| T5-b | SchemaDiffPanel.component.spec.tsx | 「Bulk Resolve」「Bulk Rollback」「DIFF ITEMS」「resolve 履歴」非存在 | 描画文字列（非存在 assert） |
| T6-a | SchemaAlertCard.spec.tsx | 「未対応のフォーム項目: N 件」存在 | 外部 prop（count） |
| T6-b | SchemaAlertCard.spec.tsx | 「対応づけが必要なフォーム項目があります。」「フォーム項目の対応づけを開く →」存在 | 描画文字列 |
| T6-c | KpiGrid spec | KPI label「未対応のフォーム項目」存在・testid `admin-kpi-card-schema` 不変 | 描画文字列 + testid 不変 |

### `formatJstDate` 単体テストケース表

| 入力 | 期待出力 |
|------|---------|
| `"2026-06-09T19:34:19+09:00"` | `"2026年6月9日"` |
| `"2026-01-01T00:00:00Z"`（JST 換算で 1月1日 9時） | `"2026年1月1日"` |
| `null` | `""` |
| `undefined` | `""` |
| `""` | `""` |
| `"not-a-date"` | `""` |
| `"   "`（スペースのみ） | `""` |

### AC ↔ テストケース 1:1 対応表

| AC | カバーするテストケース |
|----|---------------------|
| AC-1 | T2-a, T2-b, T3-a, T4-a |
| AC-2 | T1-a, T1-b |
| AC-3 | T1-c, T1-d, T1-e, T1-f |
| AC-4 | T1-g, T1-h |
| AC-5 | T5-a, T5-b |
| AC-6 | T5-a（モーダル見出し）, T1-g（記録セクション） |
| AC-7 | T1-g（history 系記録）, T5-b |
| AC-8 | T6-a, T6-b, T6-c |
| AC-9 | 用語集カード内技術名併記は据置のため、Phase 6 の grep gate（用語集ファイル除外）で間接担保 |
| AC-10 | `formatJstDate` 単体テスト 7 ケース |
| AC-11 | Phase 6 / 8 の `git diff --quiet -- apps/api` gate で担保 |

### focused vitest 実行コマンド

> vitest はワークツリールートからフルパス指定が必須（相対パスだと別 worktree の node_modules を引く事故が起きるため）。

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  "apps/web/app/(admin)/admin/schema/page.spec.tsx" \
  "apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx" \
  "apps/web/src/components/shell/__tests__/shell-config.spec.tsx" \
  "apps/web/src/components/shell/__tests__/SidebarShell.server.spec.tsx" \
  "apps/web/src/lib/format/datetime.spec.ts"
```

## 統合テスト連携

- 本 Phase で追加した assert は実装前は Red（失敗）であることを確認し、Phase 5 実装後に Green へ遷移させる。
- 非存在 assert（T1-c/T1-d/T5-b）は実装前に Green（誤通過）にならないよう、フィクスチャに sentinel 値を入れて旧表示が確実に出る状態から始める。
- `formatJstDate` 単体テストは描画テストと独立に純粋関数として実行でき、CI 高速化に寄与する。

## 完了条件

- [ ] T1〜T6 ごとの追加・更新テストケースが一覧化されている
- [ ] AC-1〜AC-11 とテストケースの 1:1 対応表が存在する
- [ ] 生 revisionId 非表示の非存在 assert（T1-c/T1-d）が設計されている
- [ ] `formatJstDate` の単体テスト 7 ケース（有効 ISO / null / undefined / 空 / 無効）が設計されている
- [ ] 各テストの検証対象が external prop か internal state かが明記されている
- [ ] private method テストは該当なしと明記されている
- [ ] focused vitest 実行コマンドがフルパス指定の注記つきで記載されている
