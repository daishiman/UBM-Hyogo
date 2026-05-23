# Phase 12: ドキュメント（中学生レベル概念説明含む）

## 1. 中学生レベルでの概念説明

### 監査ログ（audit log）って何？

学校で例えるなら「先生用の出席簿」のようなものです。Web サービスでも、admin（管理者）が「誰の情報をいつ書き換えたか」を、あとから見返せるように記録しておく台帳があります。これを **監査ログ**（audit log）といいます。

UBM 兵庫支部会の admin が会員情報の項目（例: 「住所」「電話番号」）の名前合わせ（後述の stableKey）を確定するたびに、「誰が」「いつ」「何を」「何に」変更したのかが自動で記録されます。今回作る画面は、**この台帳を画面から見える形にする** ものです。

なぜ必要？

- 間違って違う項目に確定してしまったとき、「あ、5 日前の操作が原因か」と原因を追える
- 個人情報保護のルール上、「誰が情報に触ったか」を後から確認できる体制を持っていることが求められる
- あとで「やっぱり戻したい」となったとき、戻す対象（過去のどの操作）を選ぶ画面が必要になる（次のタスク followup-004 rollback の前提）

### stableKey って何？

Google Form の質問文は変わることがあります。「お名前」が「氏名」に変わったり、誤字修正されたりする。でも、私たちのデータベース（D1）の中では「同じ項目」として扱いたい。

そこで、質問文の見た目とは別に、**ずっと変わらない ID 札**をつけておきます。これが **stableKey**（安定キー）です。たとえば質問文が「お名前」でも「氏名」でも、stableKey は `member_name` のように変わらない。これで「Form の表記が変わってもデータがブレない」状態にできます。

「diff resolve」というのは、Form の質問が変わったときに「この新しい質問は、過去のどの stableKey に当てはまるか？」を admin が手で確定する操作のこと。今回の画面は、**この確定操作の履歴**を見るものです。

### cursor pagination はなぜ offset より良いの？

たくさんあるデータを 1 ページずつ見せる仕組みを **pagination**（ページ送り）といいます。やり方は大きく 2 つ:

#### offset 方式（古いやり方）

「上から数えて 51 番目から 100 番目までちょうだい」と頼む方式。

問題点:

1. **遅い**: 「上から 5000 番目から」と頼むと、サーバーは 5000 行ぶん数えてから返さないといけない。データが増えるほど遅くなる
2. **ずれる**: ページを見ている間に新しい行が増えると、「2 ページ目の先頭が、さっき見た 1 ページ目の末尾と同じ行」というダブり表示が起きる

#### cursor 方式（新しいやり方）

「さっき見た最後の行（の目印）の次から、50 件ちょうだい」と頼む方式。**目印（cursor）** をサーバーがエンコードして返してくれる。

良い点:

1. **常に速い**: 目印を使うので、何ページ目でも一定の速度
2. **ずれない**: 「あの行の次」と指定するので、新しい行が増えてもダブらない
3. **巨大データに強い**: 履歴は使い続けるほど増えていく（→ offset だと将来必ず遅くなる）

監査ログは **永遠に増え続ける** ので、最初から cursor 方式で作るのが正しい設計です。

### Breadcrumb（パンくず）って何？

童話の「ヘンゼルとグレーテル」で、森で迷わないようにパンくずを落としていきました。Web でも同じで、今いる場所が深い階層のとき、たどってきた道を上部に表示します。今回の画面なら `admin > schema > history` のようになっていて、`schema` をクリックすれば一つ戻れる。これがあると、admin が迷子になりません。

### EmptyState（からっぽ表示）って何？

データが 0 件のとき、真っ白な画面ではなく「該当する履歴がありません」と親切に伝える専用パーツです。「壊れているのかな？」と admin を不安にさせないための気配りです。プロジェクトでは parallel-09 タスクが共通パーツとして用意してくれているので、それを再利用します。

## 2. ドキュメント更新リスト

| ファイル | 更新内容 |
|---|---|
| `docs/00-getting-started-manual/specs/11-admin-management.md` | 「履歴閲覧 UI（schema diff resolve history）」セクションを追記（§ 構成、表示項目、filter 仕様、pagination 仕様、a11y 要件） |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | 案 A 採用のため新規 endpoint 追加は無し。`/admin/audit?action=schema_diff.alias_assigned` の用途解説を 1 段落追記（既存 endpoint の利用例として） |
| `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-12/unassigned-task-detection.md` | §3「diff history view（resolve 履歴の閲覧 UI）」を `pending` → `consumed` に更新し、本タスク workflow pointer（`docs/30-workflows/issue-777-schema-diff-resolve-history-view/`）を追記 |
| `docs/30-workflows/unassigned-task/serial-05-step-03-followup-003-schema-diff-history-view.md` | header の状態語彙を `pending` → `consumed`、canonical workflow pointer を追記（削除はしない、履歴参照を保存） |
| `docs/30-workflows/LOGS.md` | 1 行追記: `2026-05-19 | issue-777 | admin schema diff resolve history view 仕様書 + 実装（案 A 採用 / 独立 route）` |

### `11-admin-management.md` 追記内容（draft）

```markdown
### 履歴閲覧 UI（schema diff resolve history）

- route: `/(admin)/admin/schema/history`（独立 page、案 α 採用）
- data source: `/admin/audit?action=schema_diff.alias_assigned`（既存 audit endpoint、案 A 採用）
- 表示項目: 操作日時 (ISO) / 操作者 email / before stableKey / after stableKey / question text
- filter: 操作者 email / 期間 (from/to) / question text 部分一致
- pagination: cursor base、50 件 / page、既存 audit endpoint の `encodeAuditCursor` を踏襲
- 空状態: shared `EmptyState` primitive で「該当する履歴がありません」
- a11y: landmark role + FormField 既定 label / aria-label、OKLch token のみ
- 各行に `data-audit-id` 属性を保持（followup-004 rollback 起動 anchor）
```

## 3. Phase 12 strict 7 outputs 構造

`outputs/phase-12/` 配下に以下 7 ファイルを配置する（issue-770 と同等構造）:

| ファイル | 役割 |
|---|---|
| `main.md` | Phase 12 の入口・全体サマリ・他 6 ファイルへの索引 |
| `implementation-guide.md` | 実装ガイド（実装手順・採用案・参照ファイル一覧）。PR 本文の主要見出し source |
| `unassigned-task-detection.md` | 後続候補・consumed 状態の管理。本タスクからは「履歴 CSV export」「bulk badge 表示」「rollback 起動導線」を新規後続候補として記載 |
| `system-spec-update-summary.md` | `11-admin-management.md` 追記の diff サマリ |
| `documentation-changelog.md` | ドキュメント更新一覧（本ファイル §2 と整合） |
| `phase12-task-spec-compliance-check.md` | canonical 9 headings / Phase 11 evidence 表 / workflow root scan 適合確認 |
| `skill-feedback-report.md` | task-specification-creator / github-issue-manager 両 skill への feedback |

## 4. user 向け影響

- admin が「誰がいつどの alias を resolve したか」を画面から確認可能に（従来は D1 直接 query 必須）
- 誤 resolve の発見 → 原因追跡 → 次の rollback タスク（followup-004）へ繋がる導線が貼れる
- D1 schema 変更なし、新規 endpoint なし（案 A 採用）のため runtime 性能影響なし

## 5. 開発者向け申し送り

- followup-004（rollback）着手時は本 panel の `data-audit-id` を action 起動 anchor として利用
- 共通行 component の抽出は merge 後の別 PR 検討（重複 3 箇所以上発生時）
- audit log payload に bulk 識別 flag が追加された場合は `<Badge variant="info">bulk</Badge>` 追加候補
- cursor encoding は opaque string として扱い、UI 側で内部構造に依存する処理を入れない
