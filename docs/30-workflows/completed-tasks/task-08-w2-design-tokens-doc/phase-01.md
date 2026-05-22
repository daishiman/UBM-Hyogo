# Phase 1: 要件定義

実装区分: ドキュメントのみ仕様書（CONST_004 — 主成果物は `docs/00-getting-started-manual/specs/09b-design-tokens.md` 新規作成 1 ファイル。Phase 12 正本同期成果物を同一 wave に含める。コード変更を伴わない）

## artifacts.json metadata

| 項目 | 値 |
| --- | --- |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created |

> Phase 1 完了条件として `taskType=docs-only` / `visualEvidence=NON_VISUAL` を `artifacts.json.metadata` に確定する（Phase 11 縮約テンプレ発火条件）。

## 真の論点

| # | 論点 | 決定方針 | 決定根拠 |
| --- | --- | --- | --- |
| Q1 | 値は新規に決めるか、プロトタイプから転記するか | **プロトタイプ `styles.css` L1-L70 をそのまま転記**。デザイン変更議論は本タスク外 | 元仕様 §0.5 不変条件 #1。task-08 完了時点で値は凍結 |
| Q2 | CSS 変数の prefix | **`--ubm-*` で統一**。旧プロトタイプの `--bg` `--text` `--accent` 素朴名は本ファイル正本化時に rename | 元仕様 §0.5 不変条件 #2 / 命名衝突回避 |
| Q3 | zone tokens (a..e) は独立色を持つか | **MVP では status tokens の alias**。将来拡張で独自 OKLch 値に置換可能な構造を確保 | 元仕様 §0.5 不変条件 #4 / phase-3 §3.3 |
| Q4 | dark mode の値を確定するか | **しない。`[data-theme="dark"]` placeholder structure のみ宣言**。値は別 workflow で確定 | 元仕様 §0.5 不変条件 #5 / 09-ui-ux.md §6 と整合 |
| Q5 | OKLch 非対応ブラウザの fallback | **`@supports not (color: oklch(0% 0 0))` ブロックで sRGB 近似値を提供**。近似値の正確な算出は task-09 適用タイミングで再計算 | 元仕様 §0.5 不変条件 #6 / §4.5 |
| Q6 | JSON 表現の構造 | **flat 構造 `<category>.<role>[.<variant>]` + 葉ノード `{ value, css }`**。Style Dictionary 互換 | 元仕様 §0.5 不変条件 #7 / §4.11 |
| Q7 | `@theme` か `@theme inline` か | **`@theme inline`**。bridge 先の値を `var()` 参照のまま保持し、`[data-theme]` cascade 上書きを効かせるため | 元仕様 §0.7 / Tailwind v4 仕様 |

## Acceptance Criteria（index.md の AC を本 Phase で確定）

AC-1〜AC-12（index.md 参照）。特に苦戦箇所として AC-3（3 テーマ全 token 値の転記漏れ防止）/ AC-5（JSON 健全性）/ AC-10（cross-check 欠落 0）を Phase 9 機械的検証ゲートに置く。

## 不変条件と本タスクの関係

| 不変条件 | 影響 | 守り方 |
| --- | --- | --- |
| プロトタイプ `styles.css` 値の不変 | 直接 | §3.4.1〜§3.4.3 の値は L1-L70 から転記、改変しない |
| `--ubm-*` prefix 統一 | 直接 | grep gate（Phase 9）で他 prefix を 0 件保証 |
| accent / status はテキスト用ではなく面積要素用 | 直接 | テキスト用は `-ink` variant を使う規範を §3.2 に明記 |
| zone は MVP では status alias | 直接 | §3.3 / §4.4 で alias 明示 |
| dark mode 値非確定 | 直接 | §11 placeholder のみ |
| 親 workflow scope 規律 | 直接 | diff scope は本 workflow dir + `09b-design-tokens.md` + overview / aiworkflow 正本同期差分のみ |

## エスカレーション条件

- プロトタイプ `styles.css` の値に矛盾や transcription 困難な箇所が見つかった場合、本タスクで値を新規決定せずユーザーに確認する
- task-09 / task-10 / task-18 の依存契約に齟齬が見つかった場合、その時点で正本を本ファイルとし、下流タスクが追従する形で escalate

## 完了条件

- [ ] `artifacts.json.metadata.taskType=docs-only` / `visualEvidence=NON_VISUAL` 確定
- [ ] AC-1〜AC-12 が index.md / 本 Phase に明記
- [ ] 真の論点 Q1〜Q7 の決定方針が記述済み
