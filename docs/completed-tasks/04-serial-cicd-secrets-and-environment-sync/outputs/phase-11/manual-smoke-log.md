# 手動 smoke テスト 確認ログ

> このファイルは実施者が直接記入するテンプレートです。
> 実施前に `outputs/phase-11/main.md` のテスト項目を必ず確認してください。

---

## 実施情報

| 項目 | 記入欄 |
| --- | --- |
| 実施日時 | YYYY-MM-DD HH:MM |
| 実施者 | （氏名またはハンドル） |
| 環境 | local / staging / production |
| 対象ブランチ | （例: feature/cicd-secrets-sync） |
| 参照コミット | （git commit hash） |

---

## S-01: index → phase ナビゲーション確認

| テストID | 確認内容 | 結果 | 備考 |
| --- | --- | --- | --- |
| S-01-1 | index.md から各 phase-XX.md へのリンクが有効 | PASS / FAIL / SKIP | |
| S-01-2 | 前 Phase / 次 Phase の連番が連続している | PASS / FAIL / SKIP | |
| S-01-3 | outputs/phase-XX/main.md が index.md 記載と一致 | PASS / FAIL / SKIP | |

---

## S-02: AC 説明可能性テスト

| テストID | AC | 結果 | 根拠ドキュメントパス | 備考 |
| --- | --- | --- | --- | --- |
| S-02-1 | AC-1: secret placement が一意 | PASS / FAIL / SKIP | outputs/phase-02/secrets-placement-matrix.md | |
| S-02-2 | AC-2: trigger が branch strategy と一致 | PASS / FAIL / SKIP | outputs/phase-02/workflow-topology.md | |
| S-02-3 | AC-3: 1Password Environments が local canonical | PASS / FAIL / SKIP | Phase 1 要件定義 / Phase 3 レビュー | |
| S-02-4 | AC-4: web と api の deploy path が分離 | PASS / FAIL / SKIP | outputs/phase-02/workflow-topology.md | |
| S-02-5 | AC-5: runbook の存在 | PASS / FAIL / SKIP | outputs/phase-06/ | |

---

## S-03: 重点確認項目

| テストID | 確認内容 | 結果 | 備考 |
| --- | --- | --- | --- |
| S-03-1 | リポジトリに平文 .env が存在しない | PASS / FAIL / SKIP | |
| S-03-2 | outputs/phase-06/ に runbook が存在する | PASS / FAIL / SKIP | |
| S-03-3 | outputs/phase-02/secrets-placement-matrix.md が存在し内容がある | PASS / FAIL / SKIP | |

---

## 総合判定

| 項目 | 記入欄 |
| --- | --- |
| 総合判定 | PASS / FAIL |
| FAIL 項目数 | 0 |
| SKIP 項目数 | 0 |
| 次フェーズへの申し送り | |

---

## FAIL / SKIP 詳細記録

> FAIL または SKIP があった項目のみ以下に記載してください。

| テストID | 結果 | 原因・理由 | 戻り先 Phase |
| --- | --- | --- | --- |
| （例: S-02-1） | FAIL | outputs/phase-02/secrets-placement-matrix.md が空 | Phase 2 |

---

## 実施者コメント

（自由記述）
