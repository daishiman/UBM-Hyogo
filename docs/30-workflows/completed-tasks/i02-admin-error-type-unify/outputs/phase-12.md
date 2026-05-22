[実装区分: 実装仕様書]

# Phase 12: ドキュメント・知識化

## メタ情報

| 項目 | 値 |
|------|----|
| タスク ID | i02-admin-error-type-unify |
| Phase | 12 / 13 |
| 区分 | NON_VISUAL / code-change / docs-update |
| 前提状態 | `implemented_local_evidence_captured`（Phase 11 完了） |

## 目的

`useAdminMutation` の error class 統合という「型レベルでは小さいが、認証 redirect の挙動境界を変える」変更を、
将来この hook を触る実装者・レビュアー・AI エージェントが**誤読しない**よう、概念レベルから technical reference まで整理する。

## 実行タスク

1. **中学生レベル概念説明**（後段セクション）の整備
2. `implementation-guide.md`（概要・Part 1 概念 / Part 2 技術詳細）の作成
3. `aiworkflow-requirements` skill との整合更新方針の明示
4. ドキュメント変更履歴 / 未タスク検出 / skill feedback の strict 7 files 整理

## 参照資料

- ソース発注書: `parallel-i02-admin-error-type-unify/spec.md`
- 既存 error class 設計: `apps/web/src/lib/fetch/authed.ts`
- p-10 redirect logic（並列）: `parallel-10-*` spec（base path）
- aiworkflow-requirements skill: `.claude/skills/aiworkflow-requirements/`

---

## 中学生レベル概念説明【必須セクション】

### 1. 「error class」って何？

プログラムを動かしていると、たまに「うまくいかなかったよ」という出来事が起こります。
たとえば「ログインしてないからこの画面は見せられない」「サーバーが混んでいて応答できない」など、
**理由がちがう失敗** がいくつもあります。

「error class」は、それぞれの失敗に **名札（ラベル）** をつける仕組みです。
「これは “ログインしてない失敗” ですよ」「こっちは “サーバー側の都合の失敗” ですよ」と区別できるように、
失敗ごとに別の名前を付けた箱を用意しておくイメージです。

- たとえると： 学校で落とし物が見つかったとき、「体操服箱」「教科書箱」「給食袋箱」と分けておくと、
  どの先生に渡せばいいかすぐ分かる。error class も「どの担当に処理を渡すか」を決めるための箱。

### 2. なぜ「統一」が必要？

このサイトには、もともと **似たような名札が 2 種類** ありました。

- 名札 A: `AuthRequiredError`（共通の「ログイン要求」名札・玄関ホールに置いてある）
- 名札 B: `AdminMutationHttpError`（管理画面の中だけで使っていた、自分用の名札）

管理画面で「ログインしてない失敗」が起こったとき、貼っていたのは **名札 B** でした。
ところが、「ログインしてない失敗を見つけたら自動でログイン画面に連れていく仕組み」は **名札 A だけを見ている** ので、
名札 B が貼られた失敗は **拾ってもらえません**。

そこで、管理画面でも **名札 A を貼るように直す**。
すると、自動でログイン画面に連れていく仕組みが、管理画面の失敗も拾えるようになります。
名札を 1 種類にそろえる、というのが「統一」です。

### 3. 「instanceof」って何？

`instanceof` は「この箱は、A という名前の箱ですか？」と聞くための言葉です。
日本語にすると `e instanceof AuthRequiredError` は **「e は AuthRequiredError 箱ですか？」** という質問になります。
「はい（true）」なら、ログイン画面に連れていく処理を起動します。

### 4. 「redirect（リダイレクト）」って何？

`redirect` は「いまいる URL から、別の URL に **自動で連れていく**」動きです。
たとえば「`/admin/members` を開こうとしたけどログインしてない」ときに、
`/login?redirect=/admin/members` という URL に自動で飛ばす。
こうすると、ログイン後に **元いた場所** に戻してあげられます。
`?redirect=...` は「ログインしたらここに戻してね」というメモのようなものです。

### 5. なぜ今これを直すの？

名札を 2 種類のまま放っておくと：
- 管理画面でログイン切れになっても、ログイン画面に飛ばない（ユーザーが迷子）
- 直そうとした人が「どっちの名札を直せばいいの？」と混乱する
- テストも 2 種類書かないといけなくて、書き忘れが起きやすい

名札を 1 種類にすると、**動きが素直になり、コードも短くなる**。これがこの直しの目的です。

---

## 実装ガイド概要（implementation-guide.md の骨子）

`outputs/phase-12/implementation-guide.md`（別ファイル）に以下を記述する。

### Part 1: 中学生レベル概念説明
上記セクションをそのまま転記。

### Part 2: 技術者レベル詳細
- error class 構造図（`AuthRequiredError` / `FetchAuthedError` の継承関係）
- throw 切替の before/after（spec の「設計」セクション参照）
- `useAdminMutation` 内 instanceof 判定の置換ポイント（行 144 / 148）
- p-10 redirect logic との連携シーケンス
- `AdminMutationHttpError` 完全削除 vs `@deprecated` re-export 維持の判断記録（本 spec では完全削除採用）
- 検証コマンド一覧（Phase 11 と同一）

## aiworkflow-requirements との整合更新方針

| 観点 | 方針 |
|------|------|
| ledger | `.claude/skills/aiworkflow-requirements/references/` の error handling 関連 ledger に **「admin mutation も `AuthRequiredError` を throw する」** 1 行を追記 |
| indexes | `indexes/keywords.json` に変更影響なし（既存 keyword で hit） |
| API/IPC 契約 | 公開 API surface 不変のため契約 doc 更新なし |
| 再生成 | 追記後 `mise exec -- pnpm indexes:rebuild` を実行し drift を解消 |

## ドキュメント変更履歴 / 未タスク検出 / skill feedback

| 項目 | 状態 |
|------|------|
| documentation-changelog | `useAdminMutation` JSDoc に「401 throw は AuthRequiredError、403/5xx は FetchAuthedError」を 1 行追記 |
| unassigned-task-detection | 残課題なし（p-10 redirect 動作検証は p-10 spec 側の責務として明示済み） |
| skill-feedback-report | `task-specification-creator` への追加変更不要、`aiworkflow-requirements` は ledger 追記のみ |
| phase12-task-spec-compliance-check | 中学生レベル概念説明セクション含む（本ファイル） |

## 統合テスト連携

`useAdminMutation` 経由の 401 で `/login?redirect=...` が観測されることを focused unit test で追加済み。

## 多角的チェック観点（AIが判断）

| 観点 | 判定方法 |
|------|---------|
| 知識化粒度 | 中学生レベル説明が比喩を含み、専門用語に依存していない |
| 技術整合 | implementation-guide.md の before/after が spec の「設計」セクションと 1:1 一致 |
| skill 整合 | aiworkflow-requirements ledger に redirect 経路の追記が反映 |
| 未タスク漏れ | p-10 責務との境界が明示され、本タスクに redirect 動作検証が紛れ込まない |

## サブタスク管理

- [ ] implementation-guide.md（Part 1 / Part 2）作成
- [ ] aiworkflow-requirements ledger 追記
- [ ] documentation-changelog 記録
- [ ] unassigned-task-detection 記録
- [ ] skill-feedback-report 記録
- [ ] phase12-task-spec-compliance-check 記録

## 成果物

```
outputs/phase-12/main.md (= 本ファイル)
outputs/phase-12/implementation-guide.md
outputs/phase-12/system-spec-update-summary.md
outputs/phase-12/documentation-changelog.md
outputs/phase-12/unassigned-task-detection.md
outputs/phase-12/skill-feedback-report.md
outputs/phase-12/phase12-task-spec-compliance-check.md
```

## 完了条件

- 中学生レベル概念説明セクションが本ファイルおよび implementation-guide.md に存在
- aiworkflow-requirements への追記方針が明文化
- strict 7 files に該当する 7 ファイルが揃う
- Phase 12 validator（`pnpm verify:phase12-compliance` 相当）が exit 0

## タスク100%実行確認【必須】

- [ ] 「error class とは何か」を中学生にも分かる比喩で説明済み
- [x] 「instanceof」「redirect」「?redirect=...」を平易な言葉で説明済み
- [ ] 「なぜ統一が必要か」の理由が 3 点以上列挙
- [ ] aiworkflow-requirements 整合更新方針が明示
- [ ] p-10 との責務境界が明文化

## 次Phase

Phase 13（コミット・PR）。**ユーザー明示承認後** のみ commit / push / PR を実行する。
