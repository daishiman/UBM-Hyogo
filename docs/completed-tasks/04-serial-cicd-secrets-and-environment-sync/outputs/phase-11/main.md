# Phase 11: 手動 smoke テスト結果書

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | cicd-secrets-and-environment-sync |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke test |
| 作成日 | 2026-04-26 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | pending |

---

## smoke テスト実施項目

### S-01: index → phase ナビゲーション確認

| # | 確認内容 | 期待結果 |
| --- | --- | --- |
| S-01-1 | `index.md` の Phase 一覧から各 `phase-XX.md` へのリンクが機能する | 全リンクが有効なパスを指している |
| S-01-2 | 各 `phase-XX.md` の「前 Phase」「次 Phase」記載が連番で連続している | Phase 番号の断絶がない |
| S-01-3 | `outputs/phase-XX/main.md` が index.md の主成果物欄と一致する | パスと成果物名が一致 |

### S-02: AC 説明可能性テスト

実施者が口頭または書面で以下の各 AC の意味・根拠・実装場所を説明できることを確認する。

| # | AC | 説明確認ポイント |
| --- | --- | --- |
| S-02-1 | AC-1: secret placement が一意 | runtime / deploy / public の3分類の定義場所（Phase 2 matrix）を指せるか |
| S-02-2 | AC-2: trigger が branch strategy と一致 | dev→staging / main→production の対応が workflow topology にあるか |
| S-02-3 | AC-3: 1Password Environments が local canonical | 平文 .env をリポジトリに置かない理由と代替手段を説明できるか |
| S-02-4 | AC-4: web と api の deploy path が分離 | `web-cd` と `backend deploy workflow` が独立していることを示せるか |
| S-02-5 | AC-5: runbook の存在 | rotation / revoke / rollback の手順書パスを即答できるか |

### S-03: 重点確認項目

| # | 確認内容 | 期待結果 |
| --- | --- | --- |
| S-03-1 | リポジトリに平文 `.env` ファイルが存在しない | `.env` ファイルが git 管理下にない |
| S-03-2 | `outputs/phase-06/` に rotation / revoke / rollback 手順が存在する | runbook ファイルが確認できる |
| S-03-3 | `outputs/phase-02/secrets-placement-matrix.md` が存在し内容がある | 空ファイルでない |

---

## テスト結果記録フォーマット

実施者は `outputs/phase-11/manual-smoke-log.md` に以下のフォーマットで記録すること。

```
## smoke テスト実施記録

| 実施日時 | [YYYY-MM-DD HH:MM] |
| 実施者 | [氏名またはハンドル] |
| 環境 | [local / staging / production] |

| テストID | 結果 | 備考 |
| --- | --- | --- |
| S-01-1 | PASS / FAIL / SKIP | |
| S-01-2 | PASS / FAIL / SKIP | |
| ... | | |
```

---

## 失敗時の戻り先フロー

```
smoke test FAIL
  ├─ S-01 系（ナビゲーション）が FAIL
  │     → Phase 12 で index.md / phase-*.md のリンクを修正して再テスト
  │
  ├─ S-02 系（AC 説明可能性）が FAIL
  │     ├─ AC の根拠ドキュメントが未作成 → Phase 2 / 6 / 8 に差し戻し
  │     └─ ドキュメントは存在するが内容が不十分 → Phase 12 で補記して再テスト
  │
  └─ S-03 系（重点確認）が FAIL
        ├─ 平文 .env がリポジトリに存在する → .gitignore 修正 + git rm → Phase 9 再実施
        └─ outputs ファイルが存在しない → 対応 Phase に差し戻し
```

---

## 完了条件

- 全テスト項目が PASS または SKIP（スキップには理由を記載）
- `manual-smoke-log.md` に実施者・日時・全項目の結果が記録されている
- FAIL 項目がある場合は戻り先フローに従い解消済みであること

---

## 次 Phase への handoff

- smoke test 完了後、Phase 12 でドキュメント更新と正本仕様への同期を実施する。
- SKIP した項目とその理由を Phase 12 の `unassigned-task-detection.md` に記録すること。
