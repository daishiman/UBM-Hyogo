# Phase 6: 実装-本体1（§2 dashboard / §3 members）

[実装区分: ドキュメントのみ]
判定根拠: `09g-screen-blueprints-admin.md` への記述追加のみ。コード変更なし。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-21-w2-screen-blueprints-admin |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 実装-本体1（dashboard / members） |
| Wave | W2 (parallel) |
| Mode | sequential / docs-only / NON_VISUAL |
| 作成日 | 2026-05-07 |
| 前 Phase | 5（GREEN §1） |
| 次 Phase | 7（実装-本体2） |
| 状態 | completed |

## 目的

09g の §2 `/(admin)/admin`（Dashboard）と §3 `/(admin)/admin/members` を、プロトタイプ 構造 contract 転記 + 8 サブセクション完成形で埋める。
本 Phase 完了時点で 2 画面分（合計 16 サブセクション）が AC-4 に整合する。

## 主要意思決定

- **決定 1**: §2 dashboard は AdminDashboardPage（L4-L161）を JSX block として §2.1 に転記し、KpiGrid / ZoneChart / StatusChart / RecentActions の各 primitive を §2.5 props/state で列挙する。
- **決定 2**: §3 members は AdminMembersPage（L162-L368）を §3.1 に転記し、DataTable + MemberDrawer + bulk-action confirm Modal の操作手順を §3.7 に明文化する。
- **決定 3**: §2 / §3 の API 表は phase-3 §2 から `GET /admin/kpi` / `GET /admin/members` / `PATCH /admin/members/:id` を §X.4 に転記する。

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流 | Phase 5 | 09g §1 + §2〜§9 スケルトン | §2 / §3 完成版 |
| 上流 | pages-admin.jsx L4-L368 | JSX 正本 | §2.1 / §3.1 転記内容 |
| 上流 | phase-3 §2 | API 表 | §2.4 / §3.4 |

## 変更対象ファイル（C/R/M/D）

| 区分 | path | 用途 |
| --- | --- | --- |
| M | `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` | §2 / §3 本文埋め |
| C | `outputs/phase-06/main.md` | Phase 6 主成果物 |
| C | `outputs/phase-06/check-log.txt` | 検証結果 |

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

- 入力: pages-admin.jsx L4-L368 / phase-3 §2 / Phase 2 section-signature.md
- 出力: 09g §2 / §3 完成、check-log.txt

## §2 / §3 の必須記述

### §2 /(admin)/admin (Dashboard)

| サブ § | 必須内容 |
| --- | --- |
| 2.1 prototype 由来 | AdminDashboardPage L4-L161 JSX 一字一句 |
| 2.2 コピー原文 | KPI title / button label / placeholder |
| 2.3 状態遷移 | mermaid: idle → loading → success / error / empty |
| 2.4 API 表 | `GET /admin/kpi` |
| 2.5 props / state | KpiGrid items / ZoneChart series / StatusChart series / RecentActions list |
| 2.6 a11y | live region (status) for KPI 更新 |
| 2.7 操作手順 | 初期 load → KPI render → RecentActions click で詳細遷移 |
| 2.8 参照 | 09c §（KpiGrid / ZoneChart 等）/ 09b §（token）/ 09d §（icon）/ 09a §（mapping） |

### §3 /(admin)/admin/members

| サブ § | 必須内容 |
| --- | --- |
| 3.1 prototype 由来 | AdminMembersPage L162-L368 JSX 一字一句 |
| 3.2 コピー原文 | column header / drawer field / confirm dialog 文言 |
| 3.3 状態遷移 | idle → loading → success → confirming（bulk-action）→ success / error |
| 3.4 API 表 | `GET /admin/members` / `PATCH /admin/members/:id` |
| 3.5 props / state | DataTable rows / selectedIds / drawerOpen / drawerMember |
| 3.6 a11y | DataTable row keyboard / bulk-action confirm Modal `role="dialog"` + `aria-modal="true"` + focus trap + Esc close / live region (alert) for toast |
| 3.7 操作手順 | 1. 行選択 → 2. bulk-action button enable → 3. confirm Modal → 4. 確認押下 → API → 5. 成功 toast + 再取得 / 失敗 error toast |
| 3.8 参照 | 09c §DataTable / §Drawer / §Modal、09b token、09d icon、09a mapping |

## テスト方針

```bash
F=docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md
# §2 / §3 の §X.1〜X.8 が揃う
[ "$(grep -cE '^### [23]\.[1-8] ' "$F")" = "16" ] && echo PASS || echo FAIL
# §3.6 a11y 文字列
awk '/^### 3\.6 / {flag=1; next} /^### 3\.7 / {flag=0} flag' "$F" \
  | grep -E 'role="dialog"|aria-modal="true"|focus trap|Esc close' | wc -l
# 期待: >= 4
# §2.4 / §3.4 endpoint
grep -E '/admin/kpi|/admin/members' "$F" | wc -l  # 期待: >= 3
# 視覚値 0 件
! grep -nE '#[0-9a-fA-F]{3,8}\b|oklch\(|\b[0-9]+px\b|\bbg-\[' "$F"
```

## 実行コマンド

```bash
mkdir -p docs/30-workflows/task-21-w2-screen-blueprints-admin/outputs/phase-06
sed -n '4,161p' docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx > /tmp/dashboard-jsx.txt
sed -n '162,368p' docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx > /tmp/members-jsx.txt
$EDITOR docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md
```

## DoD

- [ ] §2 X.1〜X.8 完成（dashboard）
- [ ] §3 X.1〜X.8 完成（members）
- [ ] §2.1 / §3.1 が 構造 contract 転記
- [ ] §3.6 に a11y 4 文字列出現（dialog / aria-modal / focus trap / Esc close）
- [ ] §3.3 mermaid に confirming 状態を含む
- [ ] 視覚値 grep 0 件
- [ ] check-log.txt に検証結果保存

## 完了条件チェック

- [ ] outputs/phase-06/main.md / check-log.txt 配置
- [ ] artifacts.json の phase 6 を completed
- [ ] 次 Phase 引き継ぎ事項記述

## 参照資料

- pages-admin.jsx L4-L368
- phase-3 §2（admin API）
- task-21 §4.2（§X 8 サブセクション）

## 実行手順

### ステップ 1: §2 dashboard 完成
構造 contract 転記 → コピー原文 → mermaid → API → props/state → a11y → 手順 → 参照。

### ステップ 2: §3 members 完成
DataTable + bulk-action confirm Modal の §3.6 / §3.7 を特に丁寧に記述。

### ステップ 3: 検証
Phase 3 check-commands を走らせ pass を確認。

## 次 Phase

- 次: Phase 7（実装-本体2: §4 tags / §5 meetings / §6 schema）
- 引き継ぎ: §2 / §3 完成版
- ブロック条件: §2 / §3 のサブセクション 16 件未達なら Phase 7 不可。
