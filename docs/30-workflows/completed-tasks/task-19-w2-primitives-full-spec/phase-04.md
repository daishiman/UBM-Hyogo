[実装区分: ドキュメントのみ]

# Phase 4: テスト作成（markdown 構造検証 / grep gate）

> 理由: task-19 の主成果物はドキュメント作成で完結する。review cycle で検出した隣接 apps/api diff は task-19 primary deliverable から分離して扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | primitives-full-spec |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト作成（markdown 構造検証 / grep gate） |
| 作成日 | 2026-05-07 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装：09c-primitives.md 執筆) |
| 状態 | completed |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| coverage AC | 適用外（pure-docs / NON_VISUAL タスクで実装テストが発生しないため） |

## 目的

本タスクのテストは **「コード単体テスト」ではなく「markdown 構造検証 + grep gate」** と位置づける。Phase 5 で執筆する `docs/00-getting-started-manual/specs/09c-primitives.md` が AC-1〜AC-17 と不変条件 1〜7 を満たすことを、決定論的・冪等な shell 検証で確認できる状態を整える。検証スクリプト `scripts/verify-09c-no-visual-values.sh` を作成し、grep / wc / lint コマンドを Phase 6（テスト実行）でそのまま流せる粒度に固定する。

## 実行タスク

- 検証スクリプト `scripts/verify-09c-no-visual-values.sh` の作成（視覚値混入禁止 grep gate）
- markdown 構造検証コマンド集の作成（19 見出し / §99 / JSX block / 6 サブセクション / 行数）
- markdown lint コマンドの確定（`pnpm lint:md docs/00-getting-started-manual/specs/09c-primitives.md`）
- JSX 一字一句転記の照合手順（`grep -F` による key 行の比較）
- a11y 必須ワード grep（`role="dialog"` / `aria-modal` / `aria-label` / `Esc` / `focus`）の検証コマンド
- §99 必須 3 件 grep（TweaksPanel / data-theme / AvatarStoreProvider）の確定
- link 必須 grep（`09a-prototype-map.md` / `09b-design-tokens.md` / `09e` / `09f` / `09g`）の確定
- outputs/phase-04/verify-scripts.md にコマンド集を記録

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC-1〜AC-17 |
| 必須 | outputs/phase-02/main.md | 19 セクション topology / a11y matrix / token 辞書 |
| 必須 | outputs/phase-03/main.md | Phase 13 blocked 条件 |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-19-w2-par-primitives-full-spec.md | §6 テスト方針 / §6.2 grep gate / §7 実行コマンド |
| 必須 | docs/00-getting-started-manual/claude-design-prototype/primitives.jsx | JSX 転記照合元 |

## 実行手順

### Step 1: scripts/verify-09c-no-visual-values.sh の作成

```bash
#!/usr/bin/env bash
# scripts/verify-09c-no-visual-values.sh
# 目的: 09c-primitives.md に視覚値（HEX / oklch / Npx / bg-[）が混入していないことを検証
# AC: AC-4 / AC-11 / 不変条件 3
set -euo pipefail

F="docs/00-getting-started-manual/specs/09c-primitives.md"
fail=0

if grep -nE '#[0-9a-fA-F]{3,8}\b' "$F"; then
  echo "[NG] HEX literal が混入しています" >&2
  fail=1
fi

if grep -nE 'oklch\(' "$F"; then
  echo "[NG] oklch() literal が混入しています" >&2
  fail=1
fi

if grep -nE '\b[0-9]+px\b' "$F"; then
  echo "[NG] Npx literal が混入しています" >&2
  fail=1
fi

if grep -nE '\bbg-\[' "$F"; then
  echo "[NG] bg-[#xxx] arbitrary value が混入しています" >&2
  fail=1
fi

if [ $fail -ne 0 ]; then
  echo "視覚値混入禁止 gate FAIL" >&2
  exit 1
fi

echo "OK: 視覚値混入なし"
```

- 配置先: `scripts/verify-09c-no-visual-values.sh`（実行権限 `chmod +x` 必須）
- 実行: `bash scripts/verify-09c-no-visual-values.sh`
- 期待: exit 0 / `OK: 視覚値混入なし`

### Step 2: markdown 構造検証コマンド集

| 検証 | コマンド | 期待値 |
| --- | --- | --- |
| 行数下限 | `wc -l docs/00-getting-started-manual/specs/09c-primitives.md` | 600 以上 |
| 行数上限 | `wc -l docs/00-getting-started-manual/specs/09c-primitives.md` | 1200 以下 |
| primitive 見出し数 | `grep -cE '^## [0-9]+\. ' docs/00-getting-started-manual/specs/09c-primitives.md` | 18 以上 |
| §99 存在 | `grep -c '^## 99\. ' docs/00-getting-started-manual/specs/09c-primitives.md` | 1 |
| JSX block 数 | `grep -c '^\`\`\`jsx$' docs/00-getting-started-manual/specs/09c-primitives.md` | 17 以上 |
| サブ § X.1 | `grep -cE '^### [0-9]+\.1 ' docs/00-getting-started-manual/specs/09c-primitives.md` | 17 以上 |
| サブ § X.2 | `grep -cE '^### [0-9]+\.2 ' docs/00-getting-started-manual/specs/09c-primitives.md` | 17 以上 |
| サブ § X.3 | `grep -cE '^### [0-9]+\.3 ' docs/00-getting-started-manual/specs/09c-primitives.md` | 17 以上 |
| サブ § X.4 | `grep -cE '^### [0-9]+\.4 ' docs/00-getting-started-manual/specs/09c-primitives.md` | 17 以上 |
| サブ § X.5 | `grep -cE '^### [0-9]+\.5 ' docs/00-getting-started-manual/specs/09c-primitives.md` | 17 以上 |
| サブ § X.6 | `grep -cE '^### [0-9]+\.6 ' docs/00-getting-started-manual/specs/09c-primitives.md` | 17 以上 |

### Step 3: a11y 必須ワード grep

| ワード | 必須出現箇所 | コマンド | 最低件数 |
| --- | --- | --- | --- |
| `role="dialog"` | §14 Drawer / §15 Modal | `grep -c 'role="dialog"' 09c-primitives.md` | 2 |
| `aria-modal="true"` | §14 / §15 | `grep -c 'aria-modal="true"' 09c-primitives.md` | 2 |
| `aria-label` | §1 Button (icon-only) ほか | `grep -c 'aria-label' 09c-primitives.md` | 3 |
| Esc close | §14 / §15 | `grep -ciE '\bEsc\b' 09c-primitives.md` | 2 |
| focus trap | §14 / §15 | `grep -ci 'focus trap' 09c-primitives.md` | 2 |

### Step 4: §99 必須 3 件 grep

| キーワード | コマンド | 期待 |
| --- | --- | --- |
| TweaksPanel | `grep -c 'TweaksPanel' 09c-primitives.md` | 1 以上 |
| data-theme | `grep -c 'data-theme' 09c-primitives.md` | 1 以上 |
| AvatarStoreProvider | `grep -c 'AvatarStoreProvider' 09c-primitives.md` | 1 以上 |

### Step 5: link 必須 grep

| link 先 | コマンド | 期待 |
| --- | --- | --- |
| 09a | `grep -c '09a-prototype-map' 09c-primitives.md` | 17 以上（全 primitive） |
| 09b | `grep -c '09b-design-tokens' 09c-primitives.md` | 17 以上 |
| 採用例 | `grep -cE '09[efg]' 09c-primitives.md` | 17 以上 |

### Step 6: JSX 一字一句転記の照合（spot check）

```bash
# primitives.jsx の const/function 宣言と JSX block 数を抽出し 09c に存在するか確認
P=docs/00-getting-started-manual/claude-design-prototype/primitives.jsx
F=docs/00-getting-started-manual/specs/09c-primitives.md

# 例: Button 関数宣言行
grep -F 'function Button(' "$P" | head -1
grep -F 'function Button(' "$F"

# 例: Drawer の role 属性
grep -F 'role=' "$P" | head -5
```

- spot check 対象: `function Button` / `function Switch` / `function Segmented` / `function Field` / `function Drawer` / `function Modal` / `function Toast` / `function KVList` / `function LinkPills`
- 各行が 09c 内に同一文字列で存在することを目視 + grep -F で確認

### Step 7: markdown lint

```bash
mise exec -- pnpm lint:md docs/00-getting-started-manual/specs/09c-primitives.md
```

- 期待: error 0 / warning は許容
- lint 設定が存在しない場合は `markdownlint-cli2 docs/00-getting-started-manual/specs/09c-primitives.md` で代替

### Step 8: primitives.jsx 改変検出

```bash
git diff --quiet docs/00-getting-started-manual/claude-design-prototype/primitives.jsx
# exit 0 を要求（改変なし = 不変条件 1）
```

### Step 9: outputs/phase-04/main.md / verify-scripts.md への記録

- `outputs/phase-04/main.md`: テスト方針 / Phase 6 実行手順サマリ / blocker
- `outputs/phase-04/verify-scripts.md`: Step 1〜8 のコマンドをコピペ可能形式で集約

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | 執筆中に Step 1〜8 を逐次実行して self-check 可能 |
| Phase 6 | 本 Phase の verify-scripts.md をそのまま実行する |
| Phase 7 | AC-1〜AC-17 の検証コマンド対応表として参照 |
| Phase 9 | 品質保証で再実行 |
| Phase 10 | 最終レビュー時に exit 0 を必須化 |

## 多角的チェック観点（AIが判断）

- 価値性: 9 つの Step を回せば AC-1〜AC-17 が全て機械検証できるか
- 実現性: 全コマンドが追加依存なし（grep / wc / git / pnpm のみ）で動くか
- 整合性: §6.2 grep gate が不変条件 3（token 値 0 件）と AC-4 / AC-11 を同時に支えるか
- 運用性: スクリプトが pre-commit / CI で再実行可能な冪等性を保つか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | scripts/verify-09c-no-visual-values.sh 作成 | 4 | spec_created | Step 1 |
| 2 | markdown 構造検証コマンド集 | 4 | spec_created | Step 2 |
| 3 | a11y 必須ワード grep 確定 | 4 | spec_created | Step 3 |
| 4 | §99 必須 3 件 grep 確定 | 4 | spec_created | Step 4 |
| 5 | link 必須 grep 確定 | 4 | spec_created | Step 5 |
| 6 | JSX 転記照合手順 | 4 | spec_created | Step 6 |
| 7 | markdown lint 確定 | 4 | spec_created | Step 7 |
| 8 | primitives.jsx 改変検出 | 4 | spec_created | Step 8 |
| 9 | outputs/phase-04 記録 | 4 | spec_created | Step 9 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | テスト方針 / 実行手順サマリ |
| ドキュメント | outputs/phase-04/verify-scripts.md | Step 1〜8 のコマンド集（コピペ実行可能） |
| 検証スクリプト | scripts/verify-09c-no-visual-values.sh | 視覚値混入禁止 grep gate（実行権限付き） |
| メタ | artifacts.json | Phase 状態 |

## 完了条件

- [ ] `scripts/verify-09c-no-visual-values.sh` が作成され実行権限付与済（`bash` で動作確認）
- [ ] markdown 構造検証コマンド 11 種が verify-scripts.md に記載
- [ ] a11y 必須ワード grep 5 種が記載
- [ ] §99 必須 3 件 grep が記載
- [ ] link 必須 grep 3 種が記載
- [ ] JSX 一字一句転記の spot check 対象 9 件以上が記載
- [ ] markdown lint コマンドが記載
- [ ] primitives.jsx 改変検出コマンドが記載
- [ ] outputs/phase-04/main.md / verify-scripts.md が成果物として配置
- [ ] coverage AC は適用外（pure-docs）であることが main.md に明記
- [ ] 本 Phase 内の全タスクを 100% 実行完了

## タスク100%実行確認【必須】

- [ ] 全実行タスクが spec_created
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] 異常系（grep が gnu/bsd で挙動差 / wc -l 末尾改行差 / lint 設定欠落 / primitives.jsx 一時改変）の検討済み
- [ ] 次 Phase への引き継ぎ事項を記述
- [ ] artifacts.json の該当 phase を spec_created に更新

## 次 Phase

Phase 5: 実装（09c-primitives.md の執筆 / 19 セクション × 6 サブセクション展開 / verify scripts による self-check）
