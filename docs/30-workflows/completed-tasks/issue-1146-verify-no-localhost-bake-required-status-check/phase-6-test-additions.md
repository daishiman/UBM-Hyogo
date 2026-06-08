# Phase 6: テスト拡充

**[実装区分: 実装仕様書]** / **task_classification: NON_VISUAL** / **implementation_mode: new**
**対象 Issue: #1146 [FU-SASR-002]（CLOSED 維持・`Refs #1146` のみ）**

## 1. 方針: 追加テストは基本不要

本タスクの変更は yml trigger の `on.pull_request.paths` 除去 1 箇所のみであり、gate の grep LOGIC
（`scripts/verify-no-localhost-bake.sh`）は**無変更**。grep LOGIC をカバーする self-test
（`scripts/verify-no-localhost-bake.spec.ts` の TC-VNLB-01 / 02）は既存で十分であり、**新規テストコードの追加は不要**。

| 判断 | 根拠 |
| --- | --- |
| 補助テスト追加なし | 変更が CI trigger（GitHub Actions 設定）の 1 行群除去に限定され、ロジック分岐が増えていない |
| self-test 流用 | dirty / clean / allow の 3 fixture を既にカバー（fail path・allowlist path 双方を検証済み） |

## 2. fail path / 回帰 guard（確認観点）

新規テストは追加しないが、以下の観点を Phase 11/13 の runtime 検証で確認する。

| 観点 ID | 内容 | 確認方法 |
| --- | --- | --- |
| FAIL-01 | paths 除去後、非 web PR（docs-only / api-only）でも workflow が起動すること | required 登録後、該当 PR で `verify-no-localhost-bake` check が `Expected — Waiting` でなく実行され success すること（GitHub UI / `gh pr checks`） |
| FAIL-02 | `verify-no-localhost-bake.sh` の違反検出 fail path（exit 非0）が温存されていること | self-test TC-VNLB-01（dirty fixture で exit 1）が PASS のまま。`bash scripts/verify-no-localhost-bake.sh --self-test` が `self-test passed` |
| FAIL-03 | required 登録後、gate fail の PR が merge ブロックされること | 違反を含む PR（または意図的 dirty fixture を web src に置いた検証用 PR）で check が failure → merge ボタンがブロックされること（user 検証時のみ） |

> FAIL-03 の「違反 PR を作って merge ブロックを確認する」検証は本番運用への副作用が大きいため、
> 実施する場合は user 承認下で行う。基本は self-test（FAIL-02）で fail path 温存を担保すれば足りる。

## 3. 回帰 guard（既存テストの非退化）

| ID | 既存ケース | paths 除去後の期待 |
| --- | --- | --- |
| TC-VNLB-01 | dirty fixture で exit 1 / `localhost bake detected` | 不変（grep LOGIC 無変更）→ PASS |
| TC-VNLB-02 | allowlist コメント付き local fallback を許容し exit 0 | 不変 → PASS |

## 4. 検証コマンド

```bash
mise exec -- pnpm vitest run scripts/verify-no-localhost-bake.spec.ts   # TC-VNLB-01 / 02 PASS
bash scripts/verify-no-localhost-bake.sh --self-test                    # self-test passed
bash scripts/verify-no-localhost-bake.sh --src-only                     # 現 src 違反なし → exit 0
```

## 完了条件（Phase 6）

- [x] 追加テスト不要の判断と根拠（gate LOGIC 不変）を記載した
- [x] fail path / 回帰 guard 観点（FAIL-01〜03）を定義した
- [x] required 登録後の merge ブロック観点を user-gated として明記した
- [x] 既存 self-test ケースの非退化（PASS 期待）を記載した
