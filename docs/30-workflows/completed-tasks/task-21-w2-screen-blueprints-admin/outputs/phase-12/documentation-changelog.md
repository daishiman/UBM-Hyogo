# documentation-changelog.md

## 09g-screen-blueprints-admin.md repair（2026-05-07）

| 項目 | before（P50） | after | 根拠 |
| --- | --- | --- | --- |
| 行数 | 1779 | 906 | AC-1（700〜1200） |
| AdminSidebar | 各画面に散在 | §1 集約 + §2〜§9 から 8 件 back-link | AC-2 / 不変条件 5 |
| 視覚値（HEX / OKLch 直値 / ピクセル値 / 任意値クラス記法） | 残存 | 0 件 | AC-5 / 不変条件 3 |
| §99 不採用 | 無 | TweaksPanel / theme switcher / data-theme の 3 件 | AC-9 |
| 派生注記（§5/§7/§8/§9） | 不揃い | `> 派生元: phase-3 §3 §5.x` で 4 件統一 | 不変条件 8 |
| API trace（§X.4） | drift | existing admin API endpoint surface に一致 | AC-6 |
| confirm Modal a11y 4 文字列 | 不揃い | 該当 7 画面で各 7 件揃う | AC-7 / 不変条件 6 |
| schema 二段確認 mermaid | 不在 | §6.3 に diff→confirming→applied | AC-8 / 不変条件 7 |
| mermaid blocks | 不揃い | 8 ブロック（各画面 §X.3 + §6 二段） | AC-4 補助 |

## 親 workflow 完了通知

- 親: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/`
- 本タスクの完了により task-15 / task-16 / task-17 の blueprint 正本が確定
- 次の動作: 親 workflow の進捗表で task-21 を completed に更新（実施は親側責務）

## 追加リンク候補（任意・本 PR 範囲外）

- `09-ui-ux.md` 末尾に「admin 詳細は 09g」リンク
- `09c-primitives.md` 末尾に「admin での primitive 組合せ用例は 09g 各 §X.2 / §X.6」リンク
- `09d-icons.md` / `09h-shell-and-fixtures.md` から 09g への逆参照

## 影響を受けないこと

- D1 schema（変更なし）
- Google Form 仕様（変更なし）
- API endpoint surface（変更なし、§X.4 は既存 endpoint を参照のみ）
- pages-admin.jsx（凍結正本のため改変なし）

## evidence 出典

`outputs/phase-11/evidence/{structure.json, visual-grep.log, api-parity.diff, a11y-strings.log, schema-two-stage.log, lint.log}` 全 PASS。
