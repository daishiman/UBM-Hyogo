# Phase 3: テスト戦略

[実装区分: ドキュメントのみ]
判定根拠: 検証スクリプトの仕様化のみ。スクリプト実体は Phase 4 / 11 で実行・evidence 保存。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-21-w2-screen-blueprints-admin |
| Phase 番号 | 3 / 13 |
| Phase 名称 | テスト戦略 |
| Wave | W2 (parallel) |
| Mode | sequential / docs-only / NON_VISUAL |
| 作成日 | 2026-05-07 |
| 前 Phase | 2（設計） |
| 次 Phase | 4（TDD RED） |
| 状態 | completed |

## 目的

`09g-screen-blueprints-admin.md` の品質ゲートを 3 軸（markdown 構造検証 / grep 規制 / API trace check）で定義し、Phase 4 RED と Phase 11 evidence 出力で再現可能な検証コマンドセットを確定する。

## 主要意思決定

- **決定 1**: 検証は外部依存なしの `grep` / `wc` / `awk` / `diff` のみで構成し、CI 統合（task-18 verify-design-tokens）と整合させる。
- **決定 2**: API trace check は phase-3 §2.3 管理層の API table だけを抽出し、09g §X.4 の `method + endpoint` 列と `sort -u` 後に `diff` で完全一致確認。`/admin/page.tsx` など route file path を拾う広域 grep は禁止。
- **決定 3**: 視覚値 grep は task-21 §6.2 を 4 パターン（HEX / oklch / px / `bg-[`）固定で採用。

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流 | Phase 2 | 章立て / シグネチャ / 転記マップ | 検証対象構造 |
| 下流 | Phase 4 | RED 用検証スクリプト | 09g 不在時 fail |
| 下流 | Phase 11 | evidence ファイル | grep gate / structure log / api parity log |

## 変更対象ファイル（C/R/M/D）

| 区分 | path | 用途 |
| --- | --- | --- |
| C | `outputs/phase-03/main.md` | テスト戦略主文書 |
| C | `outputs/phase-03/check-commands.md` | コマンド完全形 |
| C | `outputs/phase-03/api-trace-spec.md` | API 完全一致仕様 |

## テスト方針

### 3.1 markdown 構造検証

| 検証項目 | コマンド | 期待値 |
| --- | --- | --- |
| トップセクション数 | `grep -cE '^## [0-9]+\. ' specs/09g-screen-blueprints-admin.md` | **10**（§1〜§9 + §99） |
| §1 AdminSidebar 集約 | `grep -c '^## 1\. AdminSidebar' specs/09g-...` | **1** |
| §X.1〜X.8 各サブセクション数 | `grep -cE '^### [2-9]\.[1-8] ' specs/09g-...` | **64**（8 画面 × 8） |
| §1 1.1〜1.4 サブセクション | `grep -cE '^### 1\.[1-4] ' specs/09g-...` | **4** |
| mermaid block 数 | `grep -c '^\`\`\`mermaid$' specs/09g-...` | **8 以上** |
| 派生ルール注記 | `grep -c '^> 派生元: phase-3' specs/09g-...` | **4**（§5/§7/§8/§9） |
| Sidebar 参照リンク | `grep -c 'Sidebar は §1 を参照' specs/09g-...` | **8**（§2〜§9 各冒頭） |
| 行数 | `wc -l specs/09g-...` | **700〜1200** |

### 3.2 視覚値 grep 規制（AC-5）

```bash
F=docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md
grep -nE '#[0-9a-fA-F]{3,8}\b' "$F" && echo FAIL || echo PASS  # HEX 0 件
grep -nE 'oklch\(' "$F" && echo FAIL || echo PASS              # oklch 0 件
grep -nE '\b[0-9]+px\b' "$F" && echo FAIL || echo PASS         # px 0 件
grep -nE '\bbg-\[' "$F" && echo FAIL || echo PASS              # bg-[ 0 件
```

> 例外: code fence（jsx）内の Tailwind utility class（`bg-white` 等の primitive class）は許可。`bg-[#xxx]` のような直書きのみ禁止。

### 3.3 API trace check（AC-6）

```bash
# phase-3 §2.3 管理層 API table から method + endpoint だけを抽出
P3=docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md
F=docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md
awk '/^### 2\.3 管理層/{flag=1; next} /^### 3\./{if(flag) exit} flag' "$P3" \
  | awk -F'|' '$0 ~ /^\|/ && $4 ~ /(GET|POST|PATCH|DELETE)/ {gsub(/`| /,"",$3); gsub(/ /,"",$4); print $4" "$3}' \
  | sort -u > /tmp/p3-admin-endpoints.txt
awk '/^### [2-9]\.4 /{flag=1; next} /^### [2-9]\.5 /{flag=0} flag' "$F" \
  | awk -F'|' '$0 ~ /^\|/ && $4 ~ /(GET|POST|PATCH|DELETE)/ {gsub(/`| /,"",$3); gsub(/ /,"",$4); print $4" "$3}' \
  | sort -u > /tmp/09g-admin-endpoints.txt
diff /tmp/p3-admin-endpoints.txt /tmp/09g-admin-endpoints.txt
# 期待: diff 0 行
```

### 3.4 a11y 必須文字列（AC-7）

```bash
F=docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md
# bulk-action / approve-reject / schema-apply に該当する画面（§3 §4 §5 §6 §7 §8）の §X.6 で 4 文字列必須
grep -c 'role="dialog"' "$F"        # >= 6
grep -c 'aria-modal="true"' "$F"    # >= 6
grep -c 'focus trap' "$F"           # >= 6
grep -c 'Esc close' "$F"            # >= 6
```

### 3.5 schema-apply 二段確認（AC-8）

```bash
F=docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md
awk '/^### 6\.3 / {flag=1; next} /^### 6\.4 / {flag=0} flag' "$F" \
  | grep -E '(diff|confirming|applied)' | wc -l
# 期待: >= 3（diff / confirming / applied 各 1 以上）
```

### 3.6 §99 不採用 3 件（AC-9）

```bash
F=docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md
awk '/^## 99\. / {flag=1; next} /^## / {flag=0} flag' "$F" \
  | grep -cE '(TweaksPanel|theme switcher|data-theme)'
# 期待: 3
```

## 実行タスク

- 本 Phase の目的に対応する文書作成・検証・記録を実行する。
- 実行結果は `outputs/phase-N/` 配下へ保存し、root `artifacts.json` の該当 Phase status と整合させる。
- docs-only / NON_VISUAL のため、`apps/` / `packages/` の実装コードは本 Phase では変更しない。

## 統合テスト連携

N/A。pure docs-only / NON_VISUAL workflow のため、実装統合テストは発生しない。代替として本 Phase の grep / diff / lint / file-existence evidence を Phase 11 と Phase 12 compliance check に連携する。

## 成果物

- 本 Phase の `outputs/phase-N/main.md` または同等の phase evidence。
- 必要に応じた補助ログ・差分・チェック結果。
- root `artifacts.json` の phase status 更新。

## 入力 / 出力

- 入力: Phase 2 outputs（章立て / 転記マップ / 8 サブセクション仕様）
- 出力: `outputs/phase-03/main.md` + `check-commands.md` + `api-trace-spec.md`

## 実行コマンド

```bash
mkdir -p docs/30-workflows/task-21-w2-screen-blueprints-admin/outputs/phase-03
# 仕様書未作成段階での dry-run（Phase 4 RED で fail を確認）
F=docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md
[ -f "$F" ] || echo "RED: file not yet created (expected)"
```

## DoD

- [ ] 3.1〜3.6 の検証コマンドが copy-paste 可能な形で記述
- [ ] 各検証の期待値（件数 / 行数）が明記
- [ ] api-trace-spec.md に phase-3 §2 と §X.4 の対応表
- [ ] check-commands.md が Phase 11 evidence 出力で再利用可能

## 完了条件チェック

- [ ] outputs/phase-03/main.md / check-commands.md / api-trace-spec.md 配置
- [ ] artifacts.json の phase 3 を completed
- [ ] 次 Phase 引き継ぎ事項記述

## 参照資料

- task-21 §6.1〜§6.4（テスト方針）
- task-21 §0.5（不変条件）
- phase-3 §2（API surface）

## 実行手順

### ステップ 1: 検証コマンド一覧化
3.1〜3.6 を check-commands.md に集約。

### ステップ 2: API trace 仕様化
phase-3 §2 と §X.4 の対応を api-trace-spec.md に行レベルで定義。

### ステップ 3: 期待値固定
件数・行数の閾値を AC-1〜9 と整合させる。

### ステップ 4: Phase 4 RED 連携
09g 未作成状態で structure check が fail することを Phase 4 で確認する旨を明記。

## 次 Phase

- 次: Phase 4（TDD RED）
- 引き継ぎ: check-commands.md / api-trace-spec.md / 期待値テーブル
- ブロック条件: 検証コマンドが期待値と紐づかない場合は Phase 4 不可。
