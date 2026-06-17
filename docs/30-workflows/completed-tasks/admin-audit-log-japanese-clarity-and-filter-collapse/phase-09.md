[実装区分: 実装仕様書]

# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-audit-log-japanese-clarity-and-filter-collapse |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 実行種別 | serial |
| 作成日 | 2026-06-11 |
| 上流 | Phase 8（リファクタリング） |
| 下流 | Phase 10（最終レビュー） |
| 状態 | completed |
| タスク種別 | implementation（VISUAL） |

## 目的

実装・リファクタ完了状態に対し、**型 / lint / token / diff / line budget / link / a11y を一括判定**し、AC-8（OKLch トークン）/ AC-9（apps/api・packages/shared diff ゼロ）/ AC-10（新規 primitive ゼロ）/ AC-11（アクセシビリティ）を**具体コマンド付きの機械検証**で確定する。ローカル検証コマンド（typecheck / lint / verify:tokens / vitest 対象限定）を一覧化し、各検証の期待結果（PASS 条件）を明示する。本 Phase は実装仕様書として AC-8/9/10/11 の機械検証手順を曖昧さなく定義する。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | line budget / link / a11y / 型 / lint / vitest 一括判定方針 + コマンド一覧 |
| ドキュメント | outputs/phase-09/token-audit.md | AC-8 token 監査（grep + gate）/ AC-9 / AC-10 / a11y 機械検証手順 |
| メタ | artifacts.json | Phase 9 を completed に維持 |

## 実行タスク

1. **型 / lint / vitest の一括判定方針**: `typecheck` / `lint` / 対象限定 `vitest` のコマンドと PASS 条件を `outputs/phase-09/main.md` に定義する。
2. **AC-8 token-audit**: 追加 CSS が全て `var(--ubm-*)` 経由であり、HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` がゼロであることの grep コマンドと期待結果（0 件=PASS）、CI gate `verify-design-tokens`（`pnpm verify:tokens`）対応を `outputs/phase-09/token-audit.md` に定義する。
3. **AC-9 diff ゼロ確認**: `git diff --name-only -- apps/api packages/shared` が空であること、`<input name>` / query param キーが不変であることの確認コマンドを定義する。
4. **AC-10 新規 primitive ゼロ確認**: `apps/web/src/components/ui/` に新規ファイル追加が無いことの確認コマンドを定義する。
5. **AC-11 a11y チェック**: `FormField` の label 関連付け（`htmlFor` / `aria-describedby`）、`<details>`/`<summary>` のキーボード操作（Enter / Space で開閉）、適用フィルタ `aria-label="現在の絞り込み条件"` 維持、WCAG 2 AA コントラストの確認手順を定義する。
6. **line budget / link チェック**: docs / CSS の line budget・リンク健全性の判定方針を記す。
7. **削除確認の基準（[FB-UI-02-1]）**: 本タスクは削除ファイルなし。`git status` に `D`（deleted）が無いこと、不要になったコードは git delete（コメントアウト stub を残さない）を基準として記載する。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-07/ac-matrix.md | AC-8/9/10/11 の GATE 担保区分 |
| 必須 | outputs/phase-08/before-after.md | 整理後の `globals.css`（token-audit 対象） |
| 必須 | _shared-context.md §9 | ローカル検証コマンド正本 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| テスト/実装パターン | `.claude/skills/task-specification-creator/references/patterns-testing-and-implementation.md` | 品質ゲート判定パターン |
| アクセシビリティ | `.claude/skills/aiworkflow-requirements/references/testing-accessibility.md` | FormField label / details キーボード操作 / コントラスト |
| アーキテクチャ境界 | `.claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md` | apps/web → apps/api 境界（AC-9 裏取り） |

### 実コード anchor / gate（参照のみ）

| 種別 | パス | 用途 |
| --- | --- | --- |
| gate 本体 | `scripts/verify-design-tokens.ts` | HEX literal 検査ロジック |
| gate workflow | `.github/workflows/verify-design-tokens.yml`（job `verify-design-tokens`） | CI 実行（`pnpm verify:tokens`） |
| token 正本 | `apps/web/src/styles/tokens.css` | `var(--ubm-*)` 参照先 |

## 実行手順

### ステップ 1: 型 / lint / vitest の一括実行

```bash
# 1) 型チェック
mise exec -- pnpm typecheck
# 2) lint
mise exec -- pnpm lint
# 3) vitest（監査ログ component の変更ファイルに限定）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/auditGlossary.spec.ts \
  apps/web/src/components/admin/__tests__/auditAppliedFilters.spec.ts \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \
  apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx
```

- PASS 条件: 1〜3 すべて exit 0。型エラー / lint 違反 / テスト FAIL が 0 件。

### ステップ 2: AC-8 token-audit

```bash
# 専用 gate（HEX / arbitrary color 0 件）
mise exec -- pnpm verify:tokens
# 追加 CSS ブロックに HEX / arbitrary color が無いことの grep（0 件=PASS）
grep -nE "#[0-9a-fA-F]{3,8}\b|bg-\[#|text-\[#" apps/web/src/styles/globals.css | grep -iE "chip-row|admin-audit"
```

- `outputs/phase-09/token-audit.md` の grep コマンドを実行し、追加分の HEX / `bg-[#` / `text-[#` が 0 件であることを確認する。CI gate `verify-design-tokens` をローカル実行し PASS を確認する。

### ステップ 3: AC-9 / AC-10 / a11y 機械確認

```bash
# AC-9: apps/api / packages/shared の diff ゼロ
git diff --name-only -- apps/api packages/shared      # 空であること
# AC-9: query param キー（input name）の英語維持（buildAuditHref のキー名不変）
grep -nE 'name="(action|actorEmail|targetType|targetId|from|to|batchId|limit)"' apps/web/src/components/admin/AuditLogPanel.tsx
# AC-10: 新規 primitive ゼロ
git status --porcelain apps/web/src/components/ui/    # 新規ファイルが無いこと
```

- a11y: `FormField` の label 関連付け（既存 component が `htmlFor` を付与）、`<details>`/`<summary>` がネイティブでキーボード操作可能、`aria-label="現在の絞り込み条件"` 維持を `outputs/phase-09/token-audit.md` のチェックリストで確認する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | カバレッジ済み TC を vitest 一括判定で再実行 |
| Phase 8 | 整理後の `globals.css` を token-audit 対象にする |
| Phase 10 | 品質保証 全 PASS を最終レビュー（GO/NO-GO）の必須入力にする |
| Phase 11 | 型/lint PASS を screenshot 取得の前提にする |

## 多角的チェック観点（AIが判断）

| 観点 | AC / 不変条件 | 確認内容 |
| --- | --- | --- |
| 型整合 | — | `typecheck` exit 0。新規 helper の型が解決する |
| lint 整合 | #9 / no-inline-style | `lint` exit 0。inline style / boundary 違反なし |
| OKLch トークン | AC-8 | 追加 CSS の HEX / `bg-[#` / `text-[#` が 0 件。`verify-design-tokens` PASS |
| diff ゼロ | AC-9 | `apps/api` / `packages/shared` の diff 0 件。`<input name>` 不変 |
| 新規 primitive ゼロ | AC-10 | `apps/web/src/components/ui/` 新規ファイル 0 件 |
| a11y 維持 | AC-11 | FormField label 関連付け / details キーボード操作 / aria-label 維持 / AA コントラスト |
| 削除 stub なし | [FB-UI-02-1] | 不要コードは git delete。コメントアウト stub を残さない（本タスクは削除なし） |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 型/lint/vitest 一括判定方針 | 9 | completed | main.md コマンド一覧 |
| 2 | line budget / link 判定 | 9 | completed | main.md |
| 3 | AC-8 token-audit（grep + gate） | 9 | completed | token-audit.md |
| 4 | AC-9 diff ゼロ / name 不変確認 | 9 | completed | token-audit.md |
| 5 | AC-10 新規 primitive ゼロ確認 | 9 | completed | token-audit.md |
| 6 | AC-11 a11y チェック | 9 | completed | token-audit.md |

## 完了条件

- [ ] `outputs/phase-09/main.md` に typecheck / lint / vitest（対象限定）のコマンドと PASS 条件が書かれている
- [ ] line budget / link の判定方針が記されている
- [ ] `outputs/phase-09/token-audit.md` に AC-8 の grep コマンド（HEX / `bg-[#` / `text-[#`）と期待結果（0 件=PASS）がある
- [ ] CI gate `verify-design-tokens`（`pnpm verify:tokens`）との対応が記されている
- [ ] 追加 CSS が `var(--ubm-color-*)` / `var(--ubm-space-*)` / `var(--ubm-radius-*)` 経由であることのチェックリストがある
- [ ] AC-9（apps/api・packages/shared diff ゼロ + `<input name>` 不変）の確認コマンドがある
- [ ] AC-10（新規 primitive ゼロ）の確認コマンドがある
- [ ] AC-11（FormField label / details キーボード操作 / aria-label / コントラスト）のチェックリストがある
- [ ] 削除確認の基準（[FB-UI-02-1]: git delete or stub。本タスクは削除なし）が記載されている

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜6 が完了している
- [ ] `outputs/phase-09/{main,token-audit}.md` が配置済み
- [ ] AC-8/9/10/11 が具体コマンド付きの機械検証手順として定義されている
- [ ] token-audit の grep 対象が `globals.css` の `.chip-row` / `.admin-audit-*` 追加ブロックを含む
- [ ] artifacts.json の Phase 9 ステータスが completed に整合している

## 次Phase

- 次: Phase 10（最終レビュー / GO・NO-GO 判定）
- 引き継ぎ事項: 品質保証 全 PASS（型/lint/token/diff/a11y）/ token-audit 0 件
- ブロック条件: typecheck / lint / token-audit / diff のいずれかが FAIL の場合は Phase 5/8 に戻る
