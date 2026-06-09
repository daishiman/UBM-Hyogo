# Phase 8: リファクタリング

**[実装区分: 実装仕様書]** / **task_classification: NON_VISUAL** / **implementation_mode: new**
**対象 Issue: #1146 [FU-SASR-002]（CLOSED 維持・`Refs #1146` のみ）**

## 1. リファクタリング対象（Before / After / 理由）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `verify-no-localhost-bake.yml` の `on.pull_request` | `branches:[main,dev]` + `paths:`（6 glob） | `branches:[main,dev]` のみ（paths 除去） | required check は paths フィルタで非該当 PR を非起動にすると `Expected — Waiting` で永久 merge ブロックする。除去で常時実行へ |
| trigger 規約 | paths-filtered（このワークフローのみ独自） | no-paths（ci / Validate Build / e2e-tests / lighthouse と同一規約） | required-check 群の trigger 一貫性向上・drift 削減 |

## 2. 主眼: required-check 群との trigger 一貫性

既存 required check 全 workflow（`ci.yml` 等）は `on.pull_request` に `paths` を持たず常時実行である。
`verify-no-localhost-bake.yml` も paths を除去することで、**required-check 群の trigger 規約が揃う**。

| workflow | required context | paths フィルタ |
| --- | --- | --- |
| ci.yml | ci | なし（no-paths） |
| （Validate Build 系） | Validate Build | なし |
| （e2e 系） | e2e-tests-coverage-gate | なし |
| （lighthouse 系） | lighthouse-ci | なし |
| verify-no-localhost-bake.yml | verify-no-localhost-bake（**本タスクで追加予定**） | **Before: あり → After: なし** |

> 「required check は no-paths でなければならない」という暗黙規約を明文化し、本ワークフローを同規約へ収束させる。
> これは重複（規約の例外）の削減であり、将来の required 追加時の drift（再び paths 付きで required 化して stuck する事故）を予防する。

## 3. 新規リファクタは最小

本タスクのリファクタは yml の `pull_request.paths` ブロック除去 1 箇所に限定する。

| 項目 | 方針 |
| --- | --- |
| jobs 構造 | 不変（self-test step / source grep gate step を保持） |
| `scripts/verify-no-localhost-bake.sh` | grep LOGIC を一切触らない |
| concurrency / permissions | 不変 |
| その他の workflow 整理 | 本タスクスコープ外（YAGNI・CONST_007 で 1 サイクル内に閉じる） |

## 4. 検証コマンド

```bash
./actionlint -color .github/workflows/verify-no-localhost-bake.yml
grep -nE '^[[:space:]]*paths:' .github/workflows/verify-no-localhost-bake.yml || echo "OK: no paths"
```

## 完了条件（Phase 8）

- [x] 対象 / Before / After / 理由を表形式で記載した（RT-03）
- [x] paths 除去で required-check 群の no-paths 規約へ揃う旨（trigger 一貫性向上・drift 削減）を記載した
- [x] 新規リファクタは yml 1 ブロック除去のみ・jobs / `.sh` 不変であることを明記した
