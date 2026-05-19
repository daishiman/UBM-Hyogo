# Phase 12: ドキュメント更新

> 実装区分: **実装仕様書**
> Source issue: [#266](https://github.com/daishiman/UBM-Hyogo/issues/266)
> task-specification-creator skill 規約に従い、中学生レベル概念説明セクションを含む。

---

## 1. 中学生レベル概念説明（必須）

### 1.1 なぜ Zod schema で型を定義するのか

TypeScript の「型」は、コードを書いている最中に「この変数は数字だよ」「この変数は文字列だよ」と教えてくれる仕組みです。でも実は、プログラムが動き始めた後（runtime）には、TypeScript の型はもう存在しません。コンパイル時に消えてしまうんです。

たとえば D1 データベースから読み込んできた値が、本当に `"running"` か `"success"` か `"failed"` か `"skipped"` のどれかである保証は、TypeScript の型だけでは取れません。型は「だろう」と仮定しているだけです。

そこで **Zod** という道具を使います。Zod は「ランタイム（実行中）にも型を確認できる」仕組みを提供します。

```ts
const SyncLogStatusZ = z.enum(["running", "success", "failed", "skipped"]);
// 「この値は必ず 4 つの文字列のどれか」というルール
```

このルールを `safeParse` という関数に通すと、本当にその値がルール通りかをその場でチェックしてくれます。違ったら「ダメだよ」と教えてくれる。これで「DB から読んだ値が想定外だった」というバグを runtime 段階で検出できます。

しかも便利なことに、Zod のルールから自動的に TypeScript の型を作れます（`z.infer`）。だから「型の定義」と「実行時のチェック」が **同じ 1 つの真実** から作られて、ズレが構造的に発生しません。これが本タスクで shared に Zod schema を置く理由です。

### 1.2 canonical 値とは何か / なぜ実 DB 値に合わせるのか

「canonical（カノニカル）」は「正本」「公式」という意味です。同じものを表す書き方が複数あるとき、「これが正式な書き方ね」と 1 つを決めるのが canonical です。

このプロジェクトには、同期ジョブの「きっかけ（trigger）」を表す値が、過去の経緯で 3 種類存在していました:

| どこの値か | 値の集合 |
|---------|---------|
| 実物の DB（D1）に書き込まれている値 | `cron` / `admin` / `backfill` |
| TypeScript コードが宣言していた値 | `manual` / `scheduled` / `backfill` |
| 元仕様書が想定していた値 | `manual` / `cron` / `backfill` |

3 つもあると、新しい開発者は「どれが本物？」と混乱します。コードの中では `lockTriggerOf()` という変換関数で「TS の `manual` を DB の `admin` に翻訳する」処理が走っていて、これ自体が「ズレを runtime で吸収している証拠」でした。

このタスクでは「**実物の DB に書き込まれている値を正本にする**」と決めました。理由は単純で、

1. DB の値を変えるには migration（DB の構造変更）が必要で、すでに動いている production / staging の DB をいじるのは怖い
2. TypeScript の値を変えるのは、コードを書き換えるだけで安全
3. ユーザーから見える挙動も変わらない

つまり「変えるなら安い方を変える」という判断です。そして変えた後は「TS = shared schema = DB」の 3 つが完全に一致するので、もう変換関数も要らないし、迷うこともなくなります。

### 1.3 なぜ shared パッケージに置くのか

`apps/api`（バックエンド）と `apps/web`（フロントエンド）は別々の Cloudflare Workers として動きますが、やり取りするデータの形は共通です。たとえば「同期ログの 1 行」は API が DB から読んで JSON で返し、web が受け取って画面に出します。

このとき API と web が **別々に** 型を定義すると、片方を直し忘れたときに不整合（drift）が起きます。だから「型の定義を 1 箇所だけに置いて、両方から import して使う」のが理想です。その置き場所が `packages/shared` です。

今回は `packages/shared/src/zod/sync-log.ts` に「同期ログの形」を 1 回だけ書き、API も将来の web もそこから取ってくる、というルールにします。

---

## 2. 変更点サマリ（実装者向け）

| 項目 | 改修前 | 改修後 |
|------|------|------|
| shared に sync schema | なし | `packages/shared/src/zod/sync-log.ts` |
| TS `SyncTrigger` | `"manual" \| "scheduled" \| "backfill"` | shared `SyncTriggerType` re-export |
| TS `AuditStatus` | 独立 literal union | shared `SyncLogStatus` re-export |
| `lockTriggerOf` 変換関数 | あり | 削除 |
| `withSyncMutex` 引数 | `"manual"` / `"scheduled"` | `"admin"` / `"cron"` |
| `scheduled.ts` cursor IN 句 | `('manual','scheduled','admin','cron')` | `('cron','admin','backfill','manual','scheduled')` を staging distinct evidence 取得まで維持 |

---

## 3. implementation-guide.md（PR 本文ソース）

実装者が読んで「PR に必要な変更」を一発で適用できるガイドを別ファイルに分離する:

- `outputs/phase-12/implementation-guide.md`（本ファイルとは別。Phase 5 の再構成）

`.claude/commands/ai/diff-to-pr.md` が `outputs/phase-12/implementation-guide.md` を参照する設計のため、PR 作成時はそのファイルが PR 本文ソースとして使われる。

---

## 4. CLAUDE.md 不変条件への追加候補

以下を CLAUDE.md の「重要な不変条件」セクションに追加候補として記録（本 PR では追加しない。後続 governance task で追加）:

```markdown
10. sync 契約型（SyncTrigger / SyncLogStatus / SyncTriggerType / SyncLogRecord）は `@ubm-hyogo/shared` の `sync-log.ts` を唯一の正本とし、`apps/api` / `apps/web` 内で独立 literal union 宣言を禁止する（issue #266）。
```

### 4.1 追加しない理由

- CLAUDE.md の不変条件追加は monorepo governance を変えるため、本 PR の SRP を超える
- 同等の効果は `packages/shared/src/zod/sync-log.ts` の docstring + grep gate で達成可能

---

## 5. aiworkflow-requirements skill に反映すべき箇所

`.claude/skills/aiworkflow-requirements/` に「sync 契約の SSOT は shared」を同一 wave で反映する:

| ファイル | 追加内容 |
|---------|---------|
| `references/api-design.md`（存在すれば） | sync 契約 schema 一覧に `SyncLogRecordZ` を追加 |
| `indexes/topic-map.md` | topic `sync-canonical` を追加し本 workflow path を紐付け |
| `indexes/keywords.json` | keyword `SyncLogStatus` / `SyncTriggerType` / `SyncLogRecord` / `sync canonical` を追加 |

### 5.1 反映結果

- `indexes/quick-reference.md` / `indexes/resource-map.md` / `references/task-workflow-active.md` / `LOGS/_legacy.md` / `changelog/20260518-issue266-shared-sync-zod-contract.md` へ同一 wave で反映する。
- `system-spec-update-summary.md` と `phase12-task-spec-compliance-check.md` に sync 対象・no-op 対象・user-gated 境界を記録する。
- `topic-map.md` / `keywords.json` は大規模自動生成物のため、本 wave では generator 実行可否を検証ログへ記録し、手編集しない。

---

## 6. 後続 task として起票候補（YAGNI 分離）

| 候補 task | 起票タイミング | 理由 |
|----------|--------------|------|
| sync 契約 lint 強化（ESLint custom rule） | issue #266 実装 PR merge 後 | 構造的封じ込めを ESLint で恒久化 |
| `apps/web` admin/audit 画面の shared schema 適用 | issue #266 実装 PR merge 後 | UI ↔ API 境界で `safeParse` 適用 |
| `sync_jobs`（#195）契約の shared 化 | #195 着手時 | `sync-job.ts` として分離 |
| `sync_job_logs` 物理 rename（U-7） | U-7 タイミング | migration + データ移行 |
| staging D1 の旧 trigger 値 cleanup（fallback retirement） | Phase 11 で旧値 row 検出時のみ | hybrid IN 句の整理 |

---

## 7. 関連ドキュメント更新

| ドキュメント | 更新内容 |
|------------|---------|
| `docs/30-workflows/unassigned-task/U-UT01-10-shared-sync-contract-zod.md` | 「本 issue #266 で formalize された」と冒頭注記を追加（原典の値集合は historical context として保持） |
| `docs/30-workflows/unassigned-task/U-UT01-08-sync-enum-canonicalization.md` | 「物理 canonical 採用により issue #266 で実装吸収」と注記 |
| `docs/30-workflows/LOGS.md` | 本 workflow の completed 移動エントリを `pnpm sync:resolve` 時に union merge で追加（merge=union 設定で自動） |

---

## 8. Phase 12 DoD

- [ ] §1 中学生レベル概念説明 3 セクションが存在
- [ ] §3 `outputs/phase-12/implementation-guide.md` が作成済み
- [ ] §6 後続 task 候補が一覧化
- [ ] §7 関連 unassigned-task 2 件の冒頭注記が完了（本 PR で同時 commit）
