---
task_id: issue-908-staging-rollback-notification-runtime-smoke
governance_mutation_user_gate: true
---

# Phase 8: リファクタリング — タスク仕様書

| Phase | 8 | Phase名 | リファクタリング |
| --- | --- | --- | --- |

---

## 検討事項

| 項目 | 採否 | 理由 |
| --- | --- | --- |
| `redact()` を `scripts/runtime-smoke/_lib/redact.sh` 共通化 | 見送り | 現状 helper 1ファイルのみ。横展開発生時に切り出す（YAGNI） |
| `--dry-run` を default に | 見送り | 本来用途が runtime evidence 取得であり、default no-op は誤用助長 |
| evidence MD 雛形を `scripts/runtime-smoke/_templates/staging-smoke.md.tmpl` 化 | 見送り | 親タスク固有内容（AC 表など）が多く、テンプレ抽象化メリット小 |

---

## 結論

リファクタリング対象なし（最小実装維持）。

---

## 次Phase

`phase-9-qa.md`
