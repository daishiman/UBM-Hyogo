# system spec 更新サマリ

| 項目 | 値 |
|------|-----|
| taskId | TASK-MEMBERS-SEARCH-CLEAR-AND-SORT-UX-001 |
| workflow_state | implemented_local_runtime_pending |

## 新規・変更インターフェース

| インターフェース | 変更 | 層 |
|----------------|------|----|
| `SORT_VALUES` | recent / name → recent / oldest / name / name_desc（2→4 値） | apps/web `members-search.ts:9` |
| `SortZ` | enum を 4 値に拡張・DEFAULT=recent | apps/api `search-query-parser.ts:7` |
| `appliedQuery.sort` | enum を 4 値に拡張 | packages/shared `viewmodel.ts:158` |
| ORDER BY | recent/name の 2 分岐 → 4 分岐（oldest/name_desc 追加） | apps/api `publicMembers.ts` |

新規エンドポイント追加・D1 schema 変更・Google Form 仕様変更は行わない（AC-9）。既存 `/public/members` の sort 値拡張のみ。

---

## workflow-local spec sync

### Step 1-A: 既存 spec ファイルへの追記要否

判定: **該当あり（軽微）**。`docs/00-getting-started-manual/specs/01-api-schema.md` の `/public/members` クエリ仕様に sort 値（recent / oldest / name / name_desc）と各 ORDER BY を反映する。色値・schema・Form 構造は不変。

### Step 1-B: 新規 spec ファイル作成要否

判定: **該当なし**。新インターフェースは既存 spec の拡張で表現でき、新規 spec ファイルは不要。

### Step 1-C: design-tokens / プロトタイプ正本への影響

判定: **該当なし**。追加 CSS は `::-webkit-search-cancel-button` / `::-webkit-search-decoration` の抑止のみで色値を含まず、design-tokens（`tokens.css` / `design-tokens.md`）への影響はない。

### Step 2: 用語・命名の統一

判定: **該当あり**。sort value の正本表記を `recent` / `oldest` / `name` / `name_desc` に統一し、UI ラベルを `新しい順` / `古い順` / `名前順` / `名前の逆順` に固定する。「五十音順」という語は UI に使用せず、`name` / `name_desc` が Unicode 文字コード順である事実を index.md 脚注で明記する。

---

## aiworkflow-requirements global sync

判定: **該当時のみ**。本タスクは workflow-local spec sync で完結し、aiworkflow-requirements の global indexes（topic-map / keywords）へ新規概念を登録する必要は生じていない。global sync は別ブロックで管理し、本ウェーブでは global indexes に新規 L-ID を追加しない。
