[実装区分: 実装仕様書]

# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-06-ui-ux-contract-rewrite |
| Wave | 2 |
| 実行種別 | parallel |
| Phase 番号 | 9 / 13 |
| 作成日 | 2026-05-07 |
| 上流 Phase | 8（DRY 化） |
| 下流 Phase | 10（最終レビュー） |
| 状態 | completed |
| 区分 | implementation / NON_VISUAL |

## 目的

`09-ui-ux.md` 書き換えの品質を以下 4 軸で確定する:

1. §6.2 grep gate スクリプトの確定（視覚詳細値の混入禁止）
2. markdown lint（章立て / heading 階層 / 表構造）
3. link 健全性（09a / 09b / phase-3.md / prototype 各 jsx への相対 link 解決）
4. trace check（phase-3.md §2 と新 §2 API 列の完全一致を自動化）

本タスクは markdown 書き換えのため、無料枠消費・ランタイム secret は 0 件。a11y は契約の文書整合性として
Phase 6 / Phase 7 でカバー済みであり、本 Phase は **検証スクリプトの確定**を中心とする。

## 実行タスク

1. §6.2 grep gate を `scripts/verify-09-ui-ux-contract-only.sh` として確定
2. 構造検証（章数 / routes 数 / primitives 数）を同スクリプトに統合
3. markdown lint コマンド確定（`mise exec -- pnpm lint:md`）
4. link 健全性チェック方針確定（markdown link checker 等）
5. trace check（phase-3 §2 ↔ 09-ui-ux §2 API 列）の自動化方針確定
6. 無料枠 / secret hygiene は 0 件記録
7. outputs/phase-09/main.md 作成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | 元仕様書 §6.2（grep gate）/ §6.4（trace check）/ §7（実行コマンド） | 検証正本 |
| 必須 | `outputs/phase-06/main.md` | failure case → 検出条件 |
| 必須 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md` §2 | API trace 比較対象 |
| 必須 | CLAUDE.md | secret 管理ポリシー |

## 実行手順

### ステップ 1: §6.2 grep gate スクリプト案の確定

`scripts/verify-09-ui-ux-contract-only.sh`（新規 or 既存追記）として以下を確定:

```bash
#!/usr/bin/env bash
set -euo pipefail
F=docs/00-getting-started-manual/specs/09-ui-ux.md

# --- 視覚詳細混入禁止（§6.2） ---
fail=0
if grep -nE '#[0-9a-fA-F]{3,8}\b' "$F"; then echo "HEX 検出"; fail=1; fi
if grep -nE 'oklch\(' "$F"; then echo "oklch 値直書き検出"; fail=1; fi
if grep -nE '\b[0-9]+px\b' "$F"; then echo "px 値直書き検出"; fail=1; fi
if grep -nE '\bbg-\[' "$F"; then echo "Tailwind arbitrary 値検出"; fail=1; fi

# --- 構造検証 ---
chapters=$(grep -c '^## ' "$F")
routes=$(grep -c '^### 2\.' "$F")
primitives=$(grep -c '^#### 3\.1\.' "$F")
[ "$chapters" -eq 10 ] || { echo "章数 != 10 (got $chapters)"; fail=1; }
[ "$routes" -ge 19 ] || { echo "routes section < 19 (got $routes)"; fail=1; }
[ "$primitives" -ge 13 ] || { echo "primitives < 13 (got $primitives)"; fail=1; }

# --- 必須見出し存在確認（§0.7） ---
for h in \
  '## 1\. 位置づけと正本主義' \
  '## 2\. 19 routes 全画面の契約一覧' \
  '## 3\. component 契約一覧' \
  '## 4\. 状態列挙の規範' \
  '## 5\. アクセシビリティ契約' \
  '## 6\. token 参照規則' \
  '## 7\. Storybook 正本主義' \
  '## 8\. 不採用画面・不採用パターン' \
  '## 9\. 用語集' \
  '## 10\. 改訂履歴'; do
  grep -qE "^$h" "$F" || { echo "missing heading: $h"; fail=1; }
done

# --- 状態列挙（login 5 状態） ---
for s in input sent unregistered deleted error; do
  grep -qE "\b$s\b" "$F" || { echo "missing login state: $s"; fail=1; }
done

# --- 不採用 4 項目 ---
for kw in 'tweaks' 'AvatarStoreProvider\|photo store\|localStorage' 'data-theme' 'gas-prototype'; do
  grep -qE "$kw" "$F" || { echo "missing 不採用記述: $kw"; fail=1; }
done

[ "$fail" -eq 0 ] && echo OK || exit 1
```

### ステップ 2: markdown lint

```bash
mise exec -- pnpm lint:md docs/00-getting-started-manual/specs/09-ui-ux.md
```

heading 階層（## → ### → ####）/ table 整列 / trailing whitespace / line length（緩め）を検証。

### ステップ 3: link 健全性

`markdown-link-check`（または同等）で相対 link を解決:
- `09a-prototype-map.md` / `09b-design-tokens.md` は task-07 / task-08 完了後に解決
- prototype jsx への link（`../claude-design-prototype/*.jsx`）は本 worktree で解決可
- phase-3.md への link は `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md` で解決可

未解決 link は warning として許容（task-07 / task-08 完了で resolve）するが、path 文字列の typo は error。

### ステップ 4: trace check 自動化方針

phase-3.md §2 から `routes × endpoint × method` の 3 タプルを抽出し、新 09-ui-ux.md §2 の API 列の
3 タプルと **行レベル diff** を取る:

```bash
# 擬似スクリプト（task-09 で本実装）
extract_endpoints() {
  # phase-3.md §2 の表から `| GET /public/stats |` 等の行を抽出
  awk '/^### 2\./,/^### [^2]/' "$1" | grep -oE '(GET|POST|PATCH|DELETE) /[^ ]+' | sort -u
}
diff <(extract_endpoints docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md) \
     <(extract_endpoints docs/00-getting-started-manual/specs/09-ui-ux.md)
```

差分 0 行を期待。

### ステップ 5: 無料枠 / secret hygiene 確認

本タスクは markdown 書き換えのみで、Cloudflare secret / GitHub secret / `.env` 生成 0 件、無料枠消費 0 件。

### ステップ 6: outputs/phase-09/main.md 作成

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO/NO-GO の根拠（4 軸全 PASS） |
| Phase 11 | manual smoke で grep gate を実行 |

## 多角的チェック観点（不変条件参照）

- **#1**: grep gate で視覚詳細値 0 件
- **#5**: trace check で「apps/web から D1 直接アクセス」記述が混入していないか確認（API trace 経由のみ）
- **#6**: §8 不採用記述に gas-prototype が含まれる grep 確認
- **#7**: §5.2 dialog/drawer に `aria-modal` `focus trap` `Esc` が grep 1 件以上

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | grep gate スクリプト確定 | 9 | completed | §6.2 拡張版 |
| 2 | 構造検証統合 | 9 | completed | 章数 / routes / primitives |
| 3 | markdown lint コマンド確定 | 9 | completed | pnpm lint:md |
| 4 | link 健全性方針 | 9 | completed | markdown-link-check |
| 5 | trace check 自動化 | 9 | completed | phase-3 §2 ↔ §2 |
| 6 | 無料枠 / secret hygiene 記録 | 9 | completed | 0 件 |
| 7 | outputs 作成 | 9 | completed | outputs/phase-09/main.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-09/main.md` | 品質保証レポート |
| スクリプト案 | `scripts/verify-09-ui-ux-contract-only.sh`（任意・本 task 内提案） | grep gate + 構造検証 |
| メタ | `artifacts.json` | Phase 9 を completed |

## 完了条件

- [ ] grep gate スクリプトの全項目（HEX / oklch / px / `bg-[` / 章数 / routes / primitives / 必須見出し / login 5 状態 / 不採用 4 項目）が定義
- [ ] markdown lint コマンドが確定
- [ ] link 健全性方針が確定
- [ ] trace check 自動化方針が確定
- [ ] 無料枠 0 件 / secret 0 件が記録
- [ ] 4 軸（grep gate / lint / link / trace）が全 PASS

## タスク 100% 実行確認【必須】

- [ ] 全 7 サブタスク completed
- [ ] outputs/phase-09/main.md 配置済み
- [ ] artifacts.json 更新

## 次 Phase

- 次: Phase 10（最終レビュー）
- 引き継ぎ事項: 4 軸 PASS の根拠 → GO 判定
- ブロック条件: いずれかの軸が NG

## 無料枠見積もり

| サービス | 上限/日 | このタスク消費 | 余裕 |
| --- | --- | --- | --- |
| D1 reads | 500,000 | 0 | 100% |
| D1 writes | 100,000 | 0 | 100% |
| Workers req | 100,000 | 0 | 100% |
| Pages build | 制限なし | 0 | 100% |

本タスクは markdown 書き換えのみ。後続 task-09..17 で実体化。

## Secret Hygiene チェックリスト

| 項目 | 結果 |
| --- | --- |
| このタスクで導入する Cloudflare Secret | 0 件 |
| このタスクで導入する GitHub Secret | 0 件 |
| `.env` を生成しているか | NO |
| `wrangler.toml` 編集 | なし |
| ドキュメントに API key / token 値を埋め込んでいるか | NO |

## 4 軸検証マトリクス

| 軸 | コマンド | 期待 |
| --- | --- | --- |
| grep gate | `bash scripts/verify-09-ui-ux-contract-only.sh` | exit 0 / `OK` 出力 |
| markdown lint | `mise exec -- pnpm lint:md docs/00-getting-started-manual/specs/09-ui-ux.md` | error 0 |
| link 健全性 | `markdown-link-check docs/00-getting-started-manual/specs/09-ui-ux.md` | typo 0（task-07/08 未完の link は warning 許容） |
| trace check | `diff <(extract_endpoints phase-3.md) <(extract_endpoints 09-ui-ux.md)` | 差分 0 行 |
