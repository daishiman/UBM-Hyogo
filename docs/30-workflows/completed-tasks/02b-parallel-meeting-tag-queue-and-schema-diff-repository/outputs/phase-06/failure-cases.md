# Phase 6: failure-cases

## ケース別期待ふるまい

### E-1: attendance 重複登録
- 1 回目 `addAttendance(m1, s1)` → `{ ok: true }`
- 2 回目 `addAttendance(m1, s1)` → `{ ok: false, reason: "duplicate" }` （D1 の UNIQUE 制約 throw を捕捉）

### E-4: tag queue unidirectional
| from \\ to | queued | reviewing | resolved |
| --- | --- | --- | --- |
| queued | ✗ | ✓ | ✗ throw |
| reviewing | ✗ throw | ✗ | ✓ |
| resolved | ✗ throw | ✗ throw | ✗ |

### E-7: schemaVersions
- form_id="f1" の全 row state="superseded" → `getLatestVersion` → `null`
- 04c admin UI 側は null を「同期待ち」表示にマップする責務（このタスクの範囲外）

## 副次的な制約
- INSERT OR REPLACE で active が衝突した場合は呼び出し側 (03a) が事前に `supersede` を呼ぶ約束（本 repo 層では制約しない）
