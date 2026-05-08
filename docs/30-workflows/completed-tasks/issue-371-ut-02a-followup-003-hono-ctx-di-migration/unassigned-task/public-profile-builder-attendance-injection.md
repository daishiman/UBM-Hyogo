# Consumed: `buildPublicMemberProfile` public attendance injection

Status: consumed_by_issue_533 / promoted_to_workflow

Canonical workflow:
`docs/30-workflows/completed-tasks/issue-533-public-profile-builder-attendance-injection/`

Issue #533 implemented the conditional requirement originally described here. Do not execute this source stub as an open task.

---

# Historical Source Stub: `buildPublicMemberProfile` に attendance 含める要件発生時の ctx 注入適用

## メタ情報

| 項目         | 内容                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------ |
| タスクID     | T-4-public-profile-builder-attendance-injection                                            |
| タスク名     | `buildPublicMemberProfile` に attendance 含める要件発生時の ctx 注入適用                   |
| 分類         | implementation / NON_VISUAL（API builder 拡張）                                            |
| 対象機能     | `apps/api/src/repository/_shared/builder.ts` の `buildPublicMemberProfile`                 |
| 優先度       | low（要件発生時。public visibility に attendance を含める仕様判断が確定してから着手）      |
| 見積もり規模 | 小〜中規模                                                                                 |
| ステータス   | consumed_by_issue_533 / promoted_to_workflow                                               |
| 発見元       | 親タスク `issue-371-ut-02a-followup-003-hono-ctx-di-migration` `index.md` scope out 末尾   |
| 発見日       | 2026-05-06                                                                                 |
| 親タスク     | `docs/30-workflows/issue-371-ut-02a-followup-003-hono-ctx-di-migration/`                   |

---

## 1. なぜこのタスクが必要だったか（Why）

### 1.1 背景

親タスク `issue-371-ut-02a-followup-003-hono-ctx-di-migration` は、attendance を含む member profile builder（例: `buildMemberProfile` / admin 系）に対して Hono context (`RepositoryProviderVariables`) 経由で attendance repository を DI する移行を完了した。

ただし `buildPublicMemberProfile` は **現状 attendance を含まない**ため、対象外として scope out している（親タスク `index.md` の scope out 末尾参照）。将来 public profile に attendance（出席履歴・出席数など）を含める仕様変更が発生した場合、本ビルダーに対しても同じ ctx 注入パターンを適用する必要があった。この条件は Issue #533 で発火し、canonical workflow に昇格済み。

### 1.2 問題点・課題

- `buildPublicMemberProfile` が attendance を含まないまま実装されているため、attendance を返す仕様が決まると **builder シグネチャと呼び出し側 route の middleware 結線**を同時に変更する必要がある
- 親タスクで導入した `RepositoryProviderVariables` の context 型と未注入時 throw が public 側ビルダーで未適用のため、混在状態が発生しやすい
- public visibility における attendance 公開の可否は **privacy review** が必要（誰が誰の出席履歴を見られるか）

### 1.3 放置した場合の影響

- public profile 側で attendance を含める要件が来たときに、親タスクの DI パターンを再学習せずアドホック実装してしまい、`builder.ts` 内に **2 種類の attendance 取得経路（直接 import / ctx 注入）** が混在する
- privacy review 不在のまま attendance を public 公開してしまう情報漏洩リスク

---

## 2. 何を達成するか（What）

### 2.1 目的

`buildPublicMemberProfile` の仕様変更で attendance が必要になった時点で、親タスクと同一の ctx 注入パターン（`RepositoryProviderVariables` 経由）を適用し、public route の middleware 結線まで含めて整合させる。

### 2.2 最終ゴール

- `buildPublicMemberProfile` が attendance repository を ctx (`c.var.attendanceRepository` 等) から取得する
- 該当 public route（`apps/api/src/routes/public/...` 配下）が attendance repository provider middleware を結線している
- 未注入時の throw メッセージ・エラーコードが親タスク導入の他ビルダーと統一されている
- privacy review の合意点（公開する attendance の粒度・項目）が `index.md` または `docs/00-getting-started-manual/specs/` に明記されている

### 2.3 スコープ

#### 含むもの

- `buildPublicMemberProfile` 仕様変更（attendance 追加）に伴う ctx 注入適用
- 対応する public route の middleware 結線（attendance repository provider）
- `RepositoryProviderVariables` 型の共有（親タスクで定義した型を再利用、必要なら拡張）
- 未注入時の throw 統一（メッセージ・エラーコードを親タスクと揃える）
- public 経路向け attendance 単体テスト追加（builder + route 両層）

#### 含まないもの

- 現時点での先行実装（要件未発生のため、本タスクは要件確定をトリガーに発火）
- 親タスクで完了済みの admin / me 系 builder の再修正
- attendance schema 変更（必要なら別タスクとして切り出す）
- privacy review そのもの（本タスク開始前に別途完了している前提。レビュー結果の参照のみ）

### 2.4 成果物

- `apps/api/src/repository/_shared/builder.ts` の `buildPublicMemberProfile` 改修 diff
- 対応する public route の middleware 結線 diff
- builder 単体テスト（未注入 throw / 注入時の正常系）
- route 統合テスト（middleware 経由で attendance が解決できること）
- privacy review 合意点を反映した spec 更新

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- public profile に attendance を含める仕様変更が承認されている（要件 / privacy review が完了）
- 親タスク `issue-371-ut-02a-followup-003-hono-ctx-di-migration` がマージ済みで、`RepositoryProviderVariables` 型と attendance provider middleware が存在する

### 3.2 実行手順

1. `RepositoryProviderVariables` 型と既存 attendance provider middleware を確認し、public 側に再利用可能か検証
2. `buildPublicMemberProfile` の引数を ctx ベースに変更（親タスク同等のシグネチャに揃える）
3. 未注入時 throw のメッセージ / エラーコードを既存ビルダーと統一
4. public route で attendance provider middleware を結線
5. builder 単体テストと route 統合テストを追加（red → green）
6. privacy review 合意項目（attendance の公開粒度）を spec / index.md に反映

### 3.3 受入条件 (AC)

- AC-1: `buildPublicMemberProfile` が attendance を ctx 経由で取得し、attendance を含む public profile を返す
- AC-2: attendance repository が ctx に未注入の場合、親タスクと同一形式のエラーで throw する
- AC-3: public route の middleware 結線が完了し、統合テストで attendance が解決される
- AC-4: privacy review の合意点（公開する attendance 項目）が spec に明記されている
- AC-5: `pnpm --filter @repo/api typecheck` / `lint` / `test` が全 PASS

---

## 4. 苦戦箇所【記入必須】

- 対象: `apps/api/src/repository/_shared/builder.ts`
- 症状（想定）: 同一 builder ファイル内に **attendance を ctx 注入するビルダー（親タスク導入分）** と **attendance を含まないビルダー（本ビルダー旧仕様）** が共存しており、本タスク適用時に「どのビルダーが ctx を要求するのか」が一見して分からなくなる。型 (`RepositoryProviderVariables`) を共有しないと未注入時 throw の形が分岐し、route 側の混在を招く
- 参照:
  - 親タスク: `docs/30-workflows/issue-371-ut-02a-followup-003-hono-ctx-di-migration/index.md`（scope out 末尾の本ビルダー除外記述）
  - 親タスク outputs: `docs/30-workflows/issue-371-ut-02a-followup-003-hono-ctx-di-migration/outputs/phase-12/implementation-guide.md`（ctx 注入パターン）
- 留意: public route で attendance を含める判断は **privacy review 必須**。public visibility における attendance 公開可否（公開粒度・公開対象 attendance の種別）が未確定のまま実装に着手すると、後工程で仕様巻き戻しが発生する

---

## 5. リスクと対策

| リスク                                                                                          | 影響 | 対策                                                                                                                              |
| ----------------------------------------------------------------------------------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------- |
| privacy review 未完了のまま attendance を public 公開し情報漏洩につながる                       | 高   | Phase 1 の前提条件として privacy review 合意ドキュメントの存在確認を必須化。未完了なら本タスクを着手させない                      |
| `builder.ts` 内で ctx 注入有 / 無のビルダーが混在し未注入時 throw 形式がドリフトする            | 中   | `RepositoryProviderVariables` 型と throw helper を共有化し、本タスクで public 側ビルダーに同一 helper を適用                      |
| public route の middleware 結線漏れにより runtime で undefined アクセスし 500 エラー            | 中   | route 統合テストで middleware 経由の attendance 解決を必須カバレッジにする。未注入時 throw のテストも red → green で固定          |
| attendance schema が public 公開仕様と齟齬を起こし、別途 schema 改修タスクが派生                | 低   | 着手前に attendance schema を確認し、改修が必要なら別タスクとして切り出す（本タスクスコープ外）                                   |

---

## 6. 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter @repo/api typecheck
mise exec -- pnpm --filter @repo/api lint
mise exec -- pnpm --filter @repo/api test -- builder
```

期待: `buildPublicMemberProfile` 単体テストが PASS。未注入時 throw が親タスクと同一エラーコードで投げられることを assertion で確認

### 統合検証

```bash
mise exec -- pnpm --filter @repo/api test -- routes/public
```

期待: public route 統合テストで middleware 経由の attendance 解決が成功し、attendance を含む public profile レスポンスが返る

### Drift 検査

```bash
# builder.ts 内で「直接 import で attendance repository を呼ぶ pattern」が残存していないか
grep -rn "attendanceRepository" apps/api/src/repository/_shared/builder.ts
```

期待: ctx 経由 (`c.var.` 等) の参照のみ。直接 import / module-scope シングルトン参照が残っていないこと

---

## 7. スコープ（再掲）

### 含む

- `buildPublicMemberProfile` への ctx 注入適用（attendance 取得経路を ctx 化）
- 対応する public route の middleware 結線
- `RepositoryProviderVariables` 型と未注入時 throw helper の共有
- 単体・統合テスト追加
- privacy review 合意点の spec 反映

### 含まない

- 要件確定前の先行実装（→ 本タスクは仕様確定をトリガーに着手）
- 親タスクで完了済み builder の再修正
- attendance schema の変更（→ 必要なら別タスクで切り出し）
- privacy review 自体の実施（→ 別系統のレビュー workflow）

---

## 8. 関連リソース

- 親タスク: `docs/30-workflows/issue-371-ut-02a-followup-003-hono-ctx-di-migration/index.md`
- 親タスク完了ドキュメント: `docs/30-workflows/completed-tasks/ut-02a-attendance-profile-integration/ut-02a-followup-003-hono-ctx-or-di-container-migration.md`
- 対象ファイル: `apps/api/src/repository/_shared/builder.ts`
- API schema spec: `docs/00-getting-started-manual/specs/01-api-schema.md`
- Auth / visibility spec: `docs/00-getting-started-manual/specs/06-member-auth.md`
