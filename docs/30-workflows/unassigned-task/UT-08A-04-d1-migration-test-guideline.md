# UT-08A-04: 新規 D1 migration 追加時の test 化ガイドライン

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | UT-08A-04 |
| タスク名 | 新規 D1 migration 追加時の test 化ガイドライン |
| 分類 | governance / NON_VISUAL |
| 対象機能 | `apps/api/migrations` / D1 schema |
| 優先度 | 中 |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | 08a Phase 12 unassigned-task-detection §4 |
| 発見日 | 2026-04-30 |
| 検出元ファイル | `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/outputs/phase-12/unassigned-task-detection.md` |
| 推奨割当 | 09b release runbook |

## 概要

UT-04 / 02b で初期 migration test は完了済みである一方、**今後の migration 追加時に test 化責任が誰にあるか・どの粒度でテストするか**が未割当のため、09b runbook にガイドラインを記載し、未来の migration PR で blocker にならないようにする。

## 背景

02b の miniflare D1 integration test は initial schema に対してのみ存在し、新規 migration が追加された場合のテスト責任が運用ルールとして明文化されていない。08a の contract test は schema 互換を前提とするため、migration ドリフトが入ると authz/contract 全体が同時に倒れる。テスト化の最低基準（migration が forward / rollback で D1 binding 経由で適用可能であること）を明示する必要がある。

## 受入条件

- 09b runbook に「新規 migration 追加時の test 最低基準」セクションを追加する。
- 最低基準として以下を記載する: (a) `wrangler d1 migrations apply` がローカル / preview で green、(b) 既存 contract test suite が pass、(c) schema 変更点に対する 1 件以上の repository / use-case test 追加。
- pre-commit / CI で migrations 配下に変更があった場合に runbook 参照を促すリマインダ（comment）を仕込む。

## 苦戦箇所【記入必須】

- 対象: `apps/api/migrations` の test 責任境界
- 症状: 02b では migration test を miniflare 経由で実装したが、これは「初期 schema に対する」もので、後続 migration が追加された際にどこにテストを置くか（02b の suite を拡張するのか / 各 task で個別に書くのか）が決められていない。08a 実装中、新 migration が混入していた場合にどの suite が gate になるかが曖昧で、レビュー観点が散らばる懸念があった。
- 参照: `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/outputs/phase-12/unassigned-task-detection.md` §4

## リスクと対策

| リスク | 対策 |
| --- | --- |
| ガイドラインが守られず migration drift が CI を倒す | CI で migrations 配下変更検知時に runbook link を comment する step を追加 |
| ガイドラインが過剰で migration 追加コストが上がる | 「最低基準」3 項目に絞り、それ以上は個別 task の判断に委ねる |
| 02b suite との責任分担が不透明 | runbook で「02b は initial schema 専用 / 以降は task 個別」と明記する |

## 検証方法

### 要件検証

```bash
ls apps/api/migrations 2>/dev/null
rg "migrations" docs/30-workflows/02b-* docs/30-workflows/completed-tasks 2>/dev/null
```

期待: 既存 migration test suite が確認でき、09b runbook に追加すべき差分が特定できる。

### CI フック確認

```bash
rg "migrations" .github/workflows
```

期待: 現行 CI に migration 専用 gate が無いことを確認し、必要なら本タスクで追加する。

## スコープ

### 含む

- 09b runbook への「migration 追加時 test 最低基準」追記
- migrations path 変更時の CI リマインダ
- 02b suite の責任範囲明記

### 含まない

- 既存 migration の test 拡張（02b 完了済み）
- schema design の見直し（個別 task で対応）

## 関連

- `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/unassigned-task/02b-followup-003-miniflare-d1-integration-test.md`
- `docs/30-workflows/unassigned-task/UT-04-d1-schema-design.md`
