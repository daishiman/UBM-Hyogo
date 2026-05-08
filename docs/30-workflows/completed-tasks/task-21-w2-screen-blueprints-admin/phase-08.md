# Phase 8: 実装-本体3（§7 requests / §8 identity-conflicts / §9 audit / §99 不採用）

[実装区分: ドキュメントのみ]
判定根拠: 09g への記述追加のみ。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-21-w2-screen-blueprints-admin |
| Phase 番号 | 8 / 13 |
| Phase 名称 | 実装-本体3（requests / identity-conflicts / audit / §99） |
| Wave | W2 (parallel) |
| Mode | sequential / docs-only / NON_VISUAL |
| 作成日 | 2026-05-07 |
| 前 Phase | 7（§4 / §5 / §6 完成） |
| 次 Phase | 9（リファクタ・最適化） |
| 状態 | completed |

## 目的

09g の §7 requests / §8 identity-conflicts / §9 audit を phase-3 §3 §5.3 / §5.6 / §5.7 派生ルール正本転記で完成させ、§99 不採用要素を 3 件記述する。
本 Phase 完了時点で §1〜§9 + §99 全 10 セクションが揃い、AC-3 / AC-4 / AC-9 が pass する。

## 主要意思決定

- **決定 1**: §7 requests は phase-3 §3 §5.3 admin queue 派生（左 list + 右 detail + approve/reject confirm）。
- **決定 2**: §8 identity-conflicts は phase-3 §3 §5.6 admin compare 派生（2-column compare + resolve）。
- **決定 3**: §9 audit は phase-3 §3 §5.7 admin timeline 派生（TimelineList + AuditFilterBar）。
- **決定 4**: §99 不採用は task-21 §4.6 から TweaksPanel / theme switcher / data-theme の 3 件を理由付きで列挙。

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流 | Phase 7 | §4〜§6 完成 | §7〜§9 着手 baseline |
| 上流 | phase-3 §3 §5.3 / §5.6 / §5.7 | 派生ルール正本 | §7 / §8 / §9 |
| 上流 | phase-3 §2 | API 表 | §7.4 / §8.4 / §9.4 |

## 変更対象ファイル（C/R/M/D）

| 区分 | path | 用途 |
| --- | --- | --- |
| M | `09g-screen-blueprints-admin.md` | §7 / §8 / §9 / §99 埋め |
| C | `outputs/phase-08/main.md` | Phase 8 主成果物 |
| C | `outputs/phase-08/check-log.txt` | 検証 |

## §7 / §8 / §9 / §99 必須記述

### §7 /(admin)/admin/requests（派生 phase-3 §3 §5.3）

冒頭注記: `> 派生元: phase-3 §3 §5.3 admin queue`

| サブ § | 必須内容 |
| --- | --- |
| 7.1 | phase-3 §5.3 派生ルール正本転記（左 list + 右 detail） |
| 7.2 | コピー原文（queue label / detail field / approve-reject confirm 文言） |
| 7.3 | mermaid: idle → loading → success → confirming → success / error |
| 7.4 | `GET /admin/requests` / `POST /admin/requests/:id/approve` / `POST /admin/requests/:id/reject` |
| 7.5 | requests / selectedRequestId / detailRequest / confirmAction |
| 7.6 | confirm Modal a11y 4 文字列 |
| 7.7 | 1. queue 表示 → 2. 行選択 → 3. detail 表示 → 4. approve / reject → 5. confirm Modal → 6. 確定 → API → 7. toast + 再取得 |
| 7.8 | 参照 |

### §8 /(admin)/admin/identity-conflicts（派生 phase-3 §3 §5.6）

冒頭注記: `> 派生元: phase-3 §3 §5.6 admin compare`

| サブ § | 必須内容 |
| --- | --- |
| 8.1 | phase-3 §5.6 派生ルール正本転記（2-column compare） |
| 8.2 | コピー原文（compare label / resolve 文言） |
| 8.3 | mermaid: idle → loading → success → confirming（resolve）→ success / error |
| 8.4 | `GET /admin/identity-conflicts` / `POST /admin/identity-conflicts/:id/resolve` |
| 8.5 | conflicts / selectedConflictId / resolveStrategy |
| 8.6 | resolve confirm Modal a11y 4 文字列 |
| 8.7 | 1. conflict 一覧 → 2. 選択 → 3. 2-column compare 表示 → 4. resolve strategy 選択 → 5. confirm Modal → 6. POST → 7. toast |
| 8.8 | 参照 |

### §9 /(admin)/admin/audit（派生 phase-3 §3 §5.7）

冒頭注記: `> 派生元: phase-3 §3 §5.7 admin timeline`

| サブ § | 必須内容 |
| --- | --- |
| 9.1 | phase-3 §5.7 派生ルール正本転記（TimelineList + AuditFilterBar） |
| 9.2 | コピー原文（filter label / timeline entry format） |
| 9.3 | mermaid: idle → loading → success / empty / error |
| 9.4 | `GET /admin/audit` |
| 9.5 | audits / filter / cursor |
| 9.6 | filter combobox a11y / live region for timeline append |
| 9.7 | 1. filter 適用 → 2. timeline 表示 → 3. cursor 末尾で次ページ取得 |
| 9.8 | 参照 |

### §99 不採用要素

```markdown
## 99. 不採用要素

| 要素 | 由来 | 理由 |
| --- | --- | --- |
| TweaksPanel | app.jsx L213-L251 | EDITMODE 専用（本番 admin に不要） |
| theme switcher | app.jsx | dark mode は MVP 非対応 |
| data-theme="warm" / "cool" | app.jsx | dark mode 同上 |
```

## テスト方針

```bash
F=docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md
# §7〜§9 サブセクション 24 件
[ "$(grep -cE '^### [7-9]\.[1-8] ' "$F")" = "24" ] && echo PASS || echo FAIL
# 派生元注記 4 件（§5 §7 §8 §9）
[ "$(grep -c '^> 派生元: phase-3' "$F")" = "4" ] && echo PASS || echo FAIL
# §99 不採用 3 件
awk '/^## 99\. / {flag=1; next} /^## / {flag=0} flag' "$F" \
  | grep -cE 'TweaksPanel|theme switcher|data-theme'  # 期待: 3
# §7.6 / §8.6 a11y 4 文字列
awk '/^### [78]\.6 / {flag=1; next} /^### [78]\.7 / {flag=0} flag' "$F" \
  | grep -cE 'role="dialog"|aria-modal="true"|focus trap|Esc close'  # 期待: >= 8
# 全画面 §X.4 endpoint
grep -cE '/admin/(requests|identity-conflicts|audit)' "$F"  # 期待: >= 5
# 視覚値 0 件
! grep -nE '#[0-9a-fA-F]{3,8}\b|oklch\(|\b[0-9]+px\b|\bbg-\[' "$F"
# 全画面 8 サブセクション 64 件
[ "$(grep -cE '^### [2-9]\.[1-8] ' "$F")" = "64" ] && echo PASS || echo FAIL
```

## 実行タスク

- §7 requests / §8 identity-conflicts / §9 audit / §99 不採用要素を 09g に反映する。
- 実行結果は `outputs/phase-08/` 配下へ保存し、root `artifacts.json` の Phase 8 status と整合させる。
- docs-only / NON_VISUAL のため、`apps/` / `packages/` の実装コードは本 Phase では変更しない。

## 統合テスト連携

N/A。pure docs-only / NON_VISUAL workflow のため、実装統合テストは発生しない。代替として本 Phase の grep / diff / lint / file-existence evidence を Phase 11 と Phase 12 compliance check に連携する。

## 成果物

- `outputs/phase-08/main.md`
- `outputs/phase-08/check-log.txt`
- root `artifacts.json` の phase status 更新

## 実行コマンド

```bash
mkdir -p docs/30-workflows/task-21-w2-screen-blueprints-admin/outputs/phase-08
$EDITOR docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md
```

## DoD

- [ ] §7 requests: 8 サブセクション + 派生元注記 + a11y 4 文字列
- [ ] §8 identity-conflicts: 8 サブセクション + 派生元注記 + a11y 4 文字列
- [ ] §9 audit: 8 サブセクション + 派生元注記
- [ ] §99 不採用 3 件
- [ ] 派生元注記 4 件（§5 §7 §8 §9）
- [ ] 視覚値 0 件
- [ ] §X.1〜X.8 合計 64 サブセクション pass

## 完了条件チェック

- [ ] outputs/phase-08/main.md / check-log.txt 配置
- [ ] artifacts.json の phase 8 を completed
- [ ] 次 Phase 引き継ぎ事項記述

## 参照資料

- phase-3 §3 §5.3 / §5.6 / §5.7
- task-21 §4.5（派生ルール表）/ §4.6（§99）
- task-21 §0.5 不変条件 8（新規 primitive 生成禁止）

## 実行手順

### ステップ 1: §7 requests（queue 派生）
phase-3 §5.3 を 09g §7 に正本転記、approve / reject confirm を §7.7 に明文化。

### ステップ 2: §8 identity-conflicts（compare 派生）
phase-3 §5.6 を §8 に転記、resolve confirm を §8.6 / §8.7 に明文化。

### ステップ 3: §9 audit（timeline 派生）
phase-3 §5.7 を §9 に転記、filter + cursor pagination を §9.7 に明文化。

### ステップ 4: §99 不採用
task-21 §4.6 の 3 件を表形式で列挙。

### ステップ 5: 全体検証
§X.1〜X.8 合計 64 / 派生元 4 件 / §99 3 件 / 視覚値 0 件を確認。

## 次 Phase

- 次: Phase 9（リファクタ・最適化）
- 引き継ぎ: 09g 全 10 セクション完成版（重複・行数調整は Phase 9 で実施）
- ブロック条件: §X.1〜X.8 合計 64 件未達なら Phase 9 不可。
