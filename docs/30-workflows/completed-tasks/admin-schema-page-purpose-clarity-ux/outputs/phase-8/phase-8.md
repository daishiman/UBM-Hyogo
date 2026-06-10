# Phase 8 — リファクタリング

> SSOT: [`../../_shared-context.md`](../../_shared-context.md)。リファクタは **インターフェース不変**の範囲に限定する（FB RT-03: `対象/Before/After/理由` テーブル形式）。
> 不変条件: API/D1/Form 非接触・`useAdminMutation` 本体不改変・新規プリミティブ0・既存 `SchemaDiffPanel` の handler/fetch/state 不変。

## 8.1 リファクタ方針（インターフェース不変）

本タスクの主目的は表現層の説明導線追加であり、リファクタは「**用語の重複定義を 1 箇所に集約**」「**インラインコピーの glossary 参照寄せ**」「**ナビゲーション/用語ドリフトの削減**」の 3 観点に限定する。シグネチャ・props・export・API 呼び出しは変えない。

## 8.2 リファクタ表（対象 / Before / After / 理由）

| # | 対象 | Before | After | 理由 |
| --- | --- | --- | --- | --- |
| RT-1 | `page.tsx` header description | `"Googleフォームの設問変更を照合し、stableKey の割り当てと履歴確認を行います。"`（1文・技術名直書き） | `schemaGlossary` の `SCHEMA_OUTCOME_SUMMARY` / リード文を参照、または流れ・成果が伝わる文へ更新（やさしい日本語主・技術名併記） | RC-1 解消。用語文言を glossary に寄せ重複定義を排除（DDD ユビキタス言語の単一語彙化） |
| RT-2 | `page.tsx` `SchemaDiffStatsGrid` の label/hint インライン文字列（`"Unresolved"`/`"stableKey 未割当"` 等） | 各 `AdminStat` に文字列直書き（4 箇所） | `describeStat(key)` の戻り値（`{label, hint}`）を参照 | RC-3 解消＋用語ドリフト削減。統計の語彙が glossary 経由で 1 元管理。`AdminStat` の props（label/value/hint/tone）は不変 |
| RT-3 | `page.tsx` `RevisionAndAliasHistory` の見出し（`"紐付け履歴"` / `"ALIAS HISTORY"`） | インライン文字列 | `SCHEMA_GLOSSARY.resolve`/alias 用語の plainLabel（「対応づけ履歴」主）＋ technicalName 併記 | RC-2 解消。`page.spec.tsx` 既存 assert（`"紐付け履歴"`）は新文言へ更新（Phase 6 §6.4 で追従済） |
| RT-4 | diff type の表示語彙の二重定義 | `SchemaDiffPanel.tsx` `TYPE_LABELS`（added=追加…）と新 `describeDiffType` が別々に存在しうる | `describeDiffType` を SSOT とし、Panel の**説明文（meaning/action）**はそこから取得。既存 `TYPE_LABELS`（短ラベル）は表示互換のため残すが、説明系の重複は作らない | 用語 SSOT 化（SSOT §5「`schemaGlossary` を import 限定の SSOT」）。`TYPE_LABELS` を即時撤去するとロジック/aria に影響するため、説明追加分のみ glossary 参照に寄せる（インターフェース不変優先） |
| RT-5 | empty / zero 状態コピー | 各ペイン `EmptyState title="なし"` のみ（全体 0 件の良い状態説明なし） | 全体 0 件時の説明文を `schemaGlossary` 由来文言（例「差分はありません。フォームとDBが一致した良い状態です」）で 1 箇所定義し Panel から参照 | RC-5 解消。コピーを glossary 集約しナビゲーション/状態説明のドリフトを防ぐ |
| RT-6 | explainer 配置に伴うコピー重複 | header description と explainer リード文が別々に同義文を持つ恐れ | リード文は `SchemaPurposeExplainer` 内（glossary 参照）に一本化、header は要約 1 文に留める | 重複コピー削減。同義文の二重メンテを防ぐ |

## 8.3 用語集約の SSOT 動線（重複定義の根絶）

```
schemaGlossary.ts （唯一の用語/コピー定義元・Lane A 作成）
  ├─ SchemaPurposeExplainer.tsx  → import（リード文・流れ・結果・用語集）
  ├─ page.tsx                    → import（describeStat / 履歴見出し / SCHEMA_OUTCOME_SUMMARY）
  └─ SchemaDiffPanel.tsx         → import（describeDiffType / empty コピー / アウトカム）
```

- いずれのコンポーネントも**用語・説明文を自前で文字列リテラル定義しない**（glossary 参照へ寄せる）。これが RT-1..6 の共通原則。
- 例外: `SchemaDiffPanel` の `TYPE_LABELS` / `STATUS_LABELS` など**既存ロジック/aria に結合した短ラベル**は撤去せず温存（撤去はインターフェース変更リスク）。説明・hint・アウトカムの**新規追加分のみ** glossary 化する。

## 8.4 やらないリファクタ（スコープ外・将来検討）

| 候補 | 判断 |
| --- | --- |
| `SchemaDiffPanel.tsx` の巨大コンポーネント分割（HistoryPane/RollbackModal 抽出など） | OOS。インターフェース不変原則を超える大改修でロジック回帰リスク。本タスクは表示追加に限定 |
| `TYPE_LABELS`/`STATUS_LABELS` の glossary 完全統合 | OOS。aria/ロジック結合のため撤去は別タスク。今回は説明系の重複だけ排除 |
| `page.tsx` のセクションコンポーネント外部ファイル化 | OOS。現行ファイル内クローズドで十分・差分最小を優先 |

## 完了条件

- [x] `対象/Before/After/理由` テーブルで 6 リファクタを定義
- [x] 用語/コピーの重複定義を `schemaGlossary.ts` へ集約（B/C は import のみ）する動線を固定
- [x] page.tsx インラインコピーの glossary 参照寄せ候補（RT-1/2/3）を明示
- [x] duplicate / ナビゲーション・用語ドリフト削減（RT-4/5/6）を明示
- [x] インターフェース不変の範囲に限定（既存 props/export/API/aria 結合ラベルは温存）し、スコープ外リファクタを明記
