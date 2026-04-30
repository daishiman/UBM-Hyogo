# Phase 8: DRY 化

## 重複検査

| 観点 | 結果 |
| --- | --- |
| state transition SQL の共通化 | `markResolved` / `markRejected` で `WHERE request_status='pending'` ガードは共通だが、UPDATE 列が異なるため inline で十分（過剰抽象化を避ける） |
| `SELECT_COLS` 拡張 | 既存パターンを踏襲し、新列 3 つを連結追加。重複なし |
| Row interface | `AdminMemberNoteRow` を 1 ヶ所で拡張、callers は `import type` で再利用 |
| テストフィクスチャ | 既存 `seedAdminNotes` は `note_type` カラムを INSERT に含めず DEFAULT 'general' に依存。今後 admin queue 系の追加 fixture が必要になった時点で再評価（現時点では不要） |

## 結論

不要な抽象化は導入しない。`pending` ガードは inline のまま。helper 3 種は各々 6〜10 行で
意図が明示されており、共通化のリターンより読み手コストを優先。
