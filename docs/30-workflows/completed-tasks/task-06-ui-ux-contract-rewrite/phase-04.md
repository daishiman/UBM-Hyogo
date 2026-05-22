# Phase 4: テスト戦略

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ui-ux-contract-rewrite |
| Wave | 2 |
| 実行種別 | parallel |
| Phase 番号 | 4 / 13 |
| 作成日 | 2026-05-07 |
| 上流 Phase | 3 (設計レビュー) |
| 下流 Phase | 5 (実装ランブック) |
| 状態 | completed |

## 目的

Phase 5 の書き換え作業に対する検証スイート（grep gate / 構造検証 / markdown lint / trace check / 19 行 checklist / a11y 契約整合）を「先に」設計する。本タスクは markdown 単一ファイルの書き換えであるため、verify suite は「決定論的な静的検証」に限定する（unit test / e2e は対象外）。AC-1〜AC-14 を 1 つ以上の検証コマンド or 目視レビュー項目に紐付ける。

## 実行タスク

1. verify suite 5 種を確定（grep gate / 構造検証 / markdown lint / trace check / a11y 契約整合）
2. §6.2 grep gate（HEX / oklch / px / `bg-[#...]`）の検出スクリプトを確定
3. 構造検証（`grep -c '^## '` = 10 / `grep -c '^### 2\\.'` ≥ 19）を確定
4. markdown lint command（`pnpm lint:md`）を確定
5. trace check（phase-3.md §2 と新 §2 の API 列の routes × endpoint × method 3 タプル完全一致）の手順を確定
6. §4.5 prototype 由来契約 19 行の checklist 検証手順を確定
7. AC-1〜AC-14 と検証項目の対応表を作成
8. outputs/phase-04/verify-matrix.md を生成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | 設計（章立て / 列構成） |
| 必須 | outputs/phase-03/main.md | 採用案 B、漏れチェック checklist |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-06-w2-par-ui-ux-contract-rewrite.md | 元仕様書 §6 テスト方針 |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md | trace check 比較対象 |

## 実行手順

### ステップ 1: verify suite の項目確定

| # | 検証種別 | 自動 / 目視 | 実行時点 |
|---|---------|------------|---------|
| 1 | grep gate（視覚詳細混入） | 自動 | 書き換え後・PR 前 |
| 2 | 構造検証（章立て / routes 数） | 自動 | 書き換え後・PR 前 |
| 3 | markdown lint | 自動 | 書き換え後・PR 前 |
| 4 | trace check（API 列 vs phase-3.md §2） | 目視 | Phase 5 完了時 / Phase 9 |
| 5 | a11y 契約整合（WAI-ARIA Authoring Practices） | 目視 | Phase 9 |

### ステップ 2: §6.2 grep gate スクリプト

```bash
F=docs/00-getting-started-manual/specs/09-ui-ux.md
grep -nE '#[0-9a-fA-F]{3,8}\b' "$F" && { echo "HEX 検出"; exit 1; } || true
grep -nE 'oklch\(' "$F" && { echo "oklch 値直書き検出"; exit 1; } || true
grep -nE '\b[0-9]+px\b' "$F" && { echo "px 値直書き検出"; exit 1; } || true
grep -nE '\bbg-\[' "$F" && { echo "Tailwind arbitrary 値検出"; exit 1; } || true
echo OK
```

CI 組み込みは task-18 の `verify-design-tokens.ts` の規範範囲を `apps/web/src` に限定するため、本タスクでは **手動 / pre-commit で実行** する位置付け。

### ステップ 3: 構造検証

```bash
F=docs/00-getting-started-manual/specs/09-ui-ux.md
test "$(grep -c '^## ' "$F")" = "10" || { echo "## 見出しが 10 個でない"; exit 1; }
test "$(grep -c '^### 2\.' "$F")" -ge "19" || { echo "### 2.x が 19 個未満"; exit 1; }
echo OK
```

### ステップ 4: markdown lint

```bash
mise exec -- pnpm lint:md docs/00-getting-started-manual/specs/09-ui-ux.md
# error 0 を期待
```

### ステップ 5: trace check 手順（目視）

1. `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md` §2 を opened buffer A に
2. 新 09-ui-ux.md §2 を opened buffer B に
3. routes × endpoint × method の 3 タプルを 19 routes 分突合
4. 不一致 0 件で PASS

### ステップ 6: §4.5 19 行 checklist 検証

`outputs/phase-03/main.md` の漏れチェック C（L01〜L19）を 19 行全て [x] にできること。 `grep` で取り込み先見出し（§3.1 Badge 等）の存在確認を併用。

```bash
F=docs/00-getting-started-manual/specs/09-ui-ux.md
for s in "Badge" "Button" "Switch" "Segmented" "Field" "Drawer" "Modal" "Toast" "KVList" "LinkPills"; do
  grep -q "^#### .* $s" "$F" || echo "missing primitive heading: $s"
done
```

## §6.4 trace check 詳細

| route | phase-3.md §2 endpoint | 期待 method | 新 §2 配置 |
|-------|----------------------|------------|------------|
| `/` | `/public/stats`, `/public/members`, `/public/form-preview`, `/public/meetings` | GET | §2.1.1 |
| `/(public)/members` | `/public/members` | GET | §2.1.2 |
| `/(public)/members/[id]` | `/public/members/:id` | GET | §2.1.3 |
| `/login` | `/auth/magic-link/request`, `/auth/magic-link/verify` | POST | §2.2.1 |
| `/profile` | `/me/profile`, `/me/visibility`, `/me/visibility-requests`, `/me/delete-requests` | GET / PATCH / POST | §2.2.2 |
| `/(admin)/admin` | `/admin/kpi` | GET | §2.3.1 |
| `/(admin)/admin/members` | `/admin/members`, `/admin/members/:id` | GET / PATCH | §2.3.2 |
| `/(admin)/admin/tags` | `/admin/tags`, `/admin/tags/:id/{approve,reject}` | GET / POST | §2.3.3 |
| `/(admin)/admin/meetings` | `/admin/meetings` | GET / POST | §2.3.4 |
| `/(admin)/admin/schema` | `/admin/schema/diff`, `/admin/schema/apply` | GET / POST | §2.3.5 |
| `/(admin)/admin/requests` | `/admin/requests`, `/admin/requests/:id/{approve,reject}` | GET / POST | §2.3.6 |
| `/(admin)/admin/identity-conflicts` | `/admin/identity-conflicts`, `/admin/identity-conflicts/:id/resolve` | GET / POST | §2.3.7 |
| `/(admin)/admin/audit` | `/admin/audit` | GET | §2.3.8 |

3 タプルが行レベルで一致することを Phase 9 で目視確認。

## a11y 契約整合（目視レビュー観点）

- WAI-ARIA Authoring Practices の **dialog** パターンに合致: `role="dialog" + aria-modal="true" + focus trap + Esc close + scrim click close` が §5.2 に必ず記述されているか
- WAI-ARIA Authoring Practices の **tabs** / **table** パターンに合致: §3.1 Tabs / Table / DataTable で `role="tablist"` / `role="grid"` 等の記述があるか
- form / input: `<label htmlFor>` ↔ `<input id>` / `aria-describedby` / `aria-invalid` / `aria-required` が §5.3 にあるか
- live region: `role="status"` / `role="alert"` の使い分けが §5.4 にあるか

## AC ↔ 検証項目 対応表

| AC | 検証項目 | 検証コマンド or 手順 |
| --- | --- | --- |
| AC-1（300〜420 行） | 行数チェック | `wc -l` で 300〜420 |
| AC-2（19 routes 表） | 構造検証 | `grep -c '^### 2\.'` ≥ 19 |
| AC-3（13 primitives + feature components 表） | 構造検証 | `grep -c '^#### 3\.1\.'` = 13 |
| AC-4（login 5 状態） | grep | `grep -E 'input.*sent.*unregistered.*deleted.*error'` 同セクション |
| AC-5（a11y 契約） | 目視 + grep | §5.2 で `role="dialog"` `aria-modal="true"` `focus trap` `Esc close` 全て出現 |
| AC-6（token prefix 規則） | grep | `--ubm-color-` `--ubm-radius-` `--ubm-shadow-` `--ubm-space-` `--ubm-text-` `--ubm-font-` `--ubm-dur-` `--ubm-ease-` 全て出現 |
| AC-7（Storybook 正本主義） | grep | §7 内に「Storybook」「正本」「VRT」が出現 |
| AC-8（grep gate 0 件） | §6.2 スクリプト | HEX / oklch / px / `bg-[` 全て 0 件 |
| AC-9（19 行取り込み） | checklist | outputs/phase-03 の C 19 行が全 [x] |
| AC-10（不採用 4 項目） | grep | tweaks / photo store / data-theme / gas-prototype 全て出現 |
| AC-11（trace check） | 目視 | phase-3.md §2 と新 §2 が 3 タプル完全一致 |
| AC-12（markdown lint） | lint コマンド | `pnpm lint:md` で error 0 |
| AC-13（09a..09h index 表） | grep | `09a-prototype-map.md` 〜 `09h-shell-and-fixtures.md` 全 8 path 出現 |
| AC-14（## = 10 / ### 2. ≥ 19） | 構造検証 | 上記コマンドで pass |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | runbook で書き換え後の verify 実行ステップとして組み込み |
| Phase 7 | AC マトリクスの test 列に転記 |
| Phase 8 | DRY 化対象（verify スクリプトの共通化） |
| Phase 9 | 品質保証で全 verify を実行 |

## 多角的チェック観点（不変条件参照）

- **#2**: §2.1.4 / §2.2.2 で consent キー出現を grep 確認（`publicConsent` / `rulesConsent`）
- **#3**: §2.2.2 / §2.3.2 で `responseEmail` 出現を grep 確認
- **#5**: §2 全 API 列で `D1` 直接記述が 0 件（grep gate）
- **#6**: §4.6 / §8 で `gas-prototype` 出現を grep 確認
- **a11y**: §5.2 dialog / drawer 仕様の grep 確認

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | verify suite 5 種確定 | 4 | completed | grep / 構造 / lint / trace / a11y |
| 2 | grep gate スクリプト確定 | 4 | completed | HEX / oklch / px / `bg-[` |
| 3 | 構造検証 command 確定 | 4 | completed | `## ` = 10 / `### 2.` ≥ 19 |
| 4 | markdown lint command 確定 | 4 | completed | `pnpm lint:md` |
| 5 | trace check 手順確定 | 4 | completed | phase-3.md §2 vs 新 §2 |
| 6 | §4.5 19 行 checklist 検証 | 4 | completed | grep + 目視 |
| 7 | AC ↔ 検証項目 対応表 | 4 | completed | 14 行 |
| 8 | verify-matrix.md 作成 | 4 | completed | outputs/phase-04/ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | テスト戦略総合 |
| ドキュメント | outputs/phase-04/verify-matrix.md | AC × 検証項目 対応表 |
| メタ | artifacts.json | Phase 4 を completed |

## 完了条件

- [ ] verify suite 5 種すべての command / 手順が確定
- [ ] AC-1〜AC-14 が 1 つ以上の検証項目に紐付いている
- [ ] §6.2 grep gate スクリプトが記述済み（HEX / oklch / px / `bg-[` 全て検出）
- [ ] §6.4 trace check 手順が記述済み（phase-3.md §2 と新 §2 の routes × endpoint × method 3 タプル完全一致）
- [ ] §4.5 19 行 checklist の検証手順が記述済み
- [ ] a11y 契約整合の目視レビュー観点が記述済み

## タスク 100% 実行確認【必須】

- [ ] 全 8 サブタスク completed
- [ ] outputs/phase-04/main.md と verify-matrix.md 配置済み
- [ ] 全 AC が検証項目紐付け済み
- [ ] artifacts.json 更新

## 次 Phase

- 次: Phase 5（実装ランブック）
- 引き継ぎ事項: verify suite 5 種を runbook の「書き換え後実行」ステップに組み込み
- ブロック条件: AC ↔ 検証項目 対応表が未完成
