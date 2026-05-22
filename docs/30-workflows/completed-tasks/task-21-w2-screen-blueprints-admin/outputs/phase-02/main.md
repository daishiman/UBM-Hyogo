# Phase 2 — 設計（main.md）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | task-21-w2-screen-blueprints-admin |
| Phase | 2 / 13 |
| 種別 | docs-only / NON_VISUAL |
| 状態 | completed |
| 完了日 | 2026-05-07 |

## 入力

- Phase 1 出力（AC-1〜9 / 5 論点 / 4 条件評価）
- pages-admin.jsx L1-L658
- phase-3 §2 §3 §5.3〜§5.7

## 出力サマリ

- 09g 章立て骨格を確定
- §X.1〜X.8 サブセクション規約を確定
- 派生ルール正本転記計画を確定
- §X.4 API 表のテンプレート確定

## 09g 章立て骨格（最終確定）

| セクション | タイトル | 由来 | サブセクション |
| --- | --- | --- | --- |
| §1 | AdminSidebar | 凍結 prototype 構造 | 1.1 JSX / 1.2 nav 表 / 1.3 active state / 1.4 token 参照 |
| §2 | dashboard | 凍結 prototype 構造 | 2.1〜2.8 |
| §3 | members | 凍結 prototype 構造 | 3.1〜3.8 |
| §4 | tags | 凍結 prototype 構造 | 4.1〜4.8 |
| §5 | meetings | 派生（phase-3 §5.3） | 5.1〜5.8 |
| §6 | schema | 凍結 prototype 構造 | 6.1〜6.8（6.3 に二段確認 mermaid） |
| §7 | requests | 派生（phase-3 §5.4） | 7.1〜7.8 |
| §8 | identity-conflicts | 派生（phase-3 §5.5） | 8.1〜8.8 |
| §9 | audit | 派生（phase-3 §5.7） | 9.1〜9.8 |
| §99 | 不採用要素 | 元 task-21 §0.6 | TweaksPanel / theme switcher / data-theme |

## §X.1〜X.8 サブセクション規約

| ID | 名称 | 内容 |
| --- | --- | --- |
| X.1 | route / 概要 | App Router path、画面意図、想定ユーザー |
| X.2 | layout / JSX | 凍結 prototype 構造 一字一句または派生構造の図解 |
| X.3 | 状態遷移 | mermaid stateDiagram（各画面 1 ブロック） |
| X.4 | API 表 | method / endpoint / 用途 / status（phase-3 §2 と完全一致） |
| X.5 | データ表示 | 列・空状態・loading・error のフォールバック |
| X.6 | a11y | confirm Modal の `role="dialog"` `aria-modal="true"` focus trap Esc close（該当画面） |
| X.7 | 操作手順 | bulk-action / approve-reject / schema-apply 二段確認 |
| X.8 | 参照リンク | 09c / 09b / 09d / 09a への back link（必須 4 件） |

## 派生ルール正本転記計画

未掲載 4 画面（meetings / requests / identity-conflicts / audit）は phase-3 §5.x を 09g に転記し、各 § 冒頭に下記注記を必須付与:

```
> 派生元: phase-3 §3 §5.x（new primitive 生成禁止・09c 組合せのみ）
```

新規 primitive は生成しない。既存 09c primitive（task-19）の組合せのみで構成する。

## §X.4 API 表テンプレート

| method | endpoint | 用途 | status |
| --- | --- | --- | --- |

phase-3 §2 admin block（10 endpoint）を 19 行（method/endpoint 列のみで cross-screen 重複なし）として §X.4 に分配。

## confirm Modal 共通仕様（参照源）

各画面 §X.6 で次を必須記述（最低 7 画面で 7 件ずつ出現する見込み）:
- `role="dialog"`
- `aria-modal="true"`
- focus trap（初期フォーカス → 末尾 → 巡回）
- Esc close（オーバーレイクリック挙動含む）

## schema-apply 二段確認設計

§6.3 mermaid（必須キー）:

```
diff --> confirming: apply requested
confirming --> applied: apply success
applied --> loading: refresh
```

§6.7 操作手順:
1. 差分プレビュー表示
2. apply ボタン押下 → confirm Modal
3. 確定 → applied → 再 fetch loading

## DoD 充足 evidence

- 章立て確定: 上記表
- §X.1〜X.8 規約: 上記表
- 派生ルール正本転記計画: 上記
- §X.4 API 表テンプレート: 上記
- mermaid 8 ブロック計画: 各画面 §X.3 + §6 二段（合計 8 が AC 整合）

## Phase 3 への引き継ぎ

- markdown structure check の grep pattern
- API trace check の diff 手順
- 視覚値 grep gate（HEX / OKLch 直値 / ピクセル値 / 任意値クラス記法）の正規表現
- mermaid count gate（8 ブロック）

## 次 Phase

Phase 3（テスト戦略）— grep / diff / lint の検証スクリプト方針を確定。
