# 未タスク検出レポート

| 項目 | 値 |
| --- | --- |
| タスク | issue-1146 `verify-no-localhost-bake` を dev/main の required status check に登録 |
| ステータス | `implemented_local_runtime_pending` |
| CONST_007 | 1 サイクル完了スコープ・先送り分離なし |

本レポートは **0 件でも出力必須**。`current`（今回サイクルで起票すべき未タスク）と `baseline`（既存潜在 gap・記録のみ）を分離する。

---

## current（今回サイクルで起票すべき未タスク）

**0 件。**

本タスクは「yml の paths 除去 + dev/main 個別 governance PUT で `verify-no-localhost-bake` を required 化する」という単一責務に閉じており、
CONST_007（1 サイクル完了・先送り分離なし）を充足する。
paths-filter footgun は AC-1 で同サイクル内に解消され、context 追加は dev/main 個別 PUT で完結するため、
分割すべき未タスクは発生しない。

---

## baseline（既存潜在 gap・起票せず記録のみ）

以下は本タスクのスコープ外の既存差分であり、今回サイクルの破綻理由にはならない。**記録のみ**で起票しない。

| ID | 内容 | 扱い理由 |
| --- | --- | --- |
| B-1 | `lighthouse-ci` が `lighthouse.yml` の `pull_request.branches:[dev]` のみ起動だが、`main` の required check にも `lighthouse-ci` が含まれる既存潜在 gap（main PR で本来 lighthouse が走らない可能性） | 本タスク非スコープ。required 化対象は `verify-no-localhost-bake` のみ。lighthouse の trigger 整合は独立した governance 判断として別途観察 |
| B-2 | `pr-build-test.yml` の `build-test` context が dev/main の required check に未登録の既存差分 | 本タスクは `verify-no-localhost-bake` の登録のみ。`build-test` の required 化要否は別判断 |
| B-3 | `verify-no-localhost-bake` を required 化した後の CI 実行時間最適化（`dorny/paths-filter` 等で web 無関係 PR は grep のみ即 pass する分岐） | YAGNI。常時実行でも gate は軽量（pnpm install + vitest 1 spec + grep）。実測で問題化してから検討 |

---

## 関連タスク差分確認（重複起票防止）

| 確認項目 | 結果 |
| --- | --- |
| `git log --all --grep="localhost-bake"` | gate 実装 commit（8f7d4faca / 6aee9fcba）のみ。required 化 commit / PR は不在 → 重複なし |
| open issue（required status check 系） | `verify-no-localhost-bake` の required 化を扱う別 open issue なし |
| 親 workflow `staging-api-url-and-session-recovery` の残 MINOR | M-2（本 followup の発見元）は本タスクで消費済。他に未消費の required-check 系 MINOR なし |
| 消費元 proto-spec | consumed pointer 追記対象。重複する未タスク化 spec は存在しない |

**結論: current 0 件 / baseline B-1〜B-3（記録のみ）。重複起票なし。**
