# Phase 12 — ドキュメント同期インデックス

> task: `ci-green-recovery-smoke-coverage-shard`
> status: `implemented_local_evidence_captured`（implementation / NON_VISUAL / runtime_ci_pending）
> base: `dev`

3 lane（A=runtime-smoke admin 401 を CI 実行時 mint で解消 / B=coverage-gate MISSING 誤検知 / C=coverage-gate-shard checkout 失敗）の CI 修復タスクのドキュメント同期成果物インデックス。コード・CI config・runbook は実装済みで、remote CI 観測は user-gated。

---

## strict 7 成果物

| # | ファイル | 役割 | 状態 |
|---|---|---|---|
| 1 | [main.md](main.md) | 本インデックス | present |
| 2 | [implementation-guide.md](implementation-guide.md) | 2 パート構成（中学生レベル概念 + 開発者技術詳細）+ 視覚証跡 | present |
| 3 | [system-spec-update-summary.md](system-spec-update-summary.md) | spec 反映要否判定 + same-wave sync | present |
| 4 | [documentation-changelog.md](documentation-changelog.md) | ドキュメント変更ログ | present |
| 5 | [unassigned-task-detection.md](unassigned-task-detection.md) | スコープ外項目の未タスク候補（0 件でも出力） | present |
| 6 | [skill-feedback-report.md](skill-feedback-report.md) | skill 改善点（なしでも出力） | present |
| 7 | [phase12-task-spec-compliance-check.md](phase12-task-spec-compliance-check.md) | canonical 9 headings / Phase 11 evidence / workflow root scan compliance | present |

---

## タスク要約

| Lane | 失敗 | 戦略 | depends_on |
|---|---|---|---|
| A | `runtime-smoke-staging / smoke` admin-list http=401 | CI 実行時 mint（短命 JWT 発行）+ 後方互換 fallback | — |
| B | `ci / coverage-gate` MISSING packages 誤検知 | step 順序入れ替え + 診断メッセージ強化（C の下流） | C |
| C | `ci / coverage-gate-shard` checkout `could not read Username` | re-run 確認 + permissions/token hardening + shard 失敗診断 | — |

## 視覚区分

- **NON_VISUAL**。UI/UX 変更なし。Phase 11 スクリーンショット不要。
- 代替証跡: CI 実行ログ・mint parity test 結果・summary.json `reason` フィールド（`outputs/phase-11/manual-test-result.md`）。

## ユーザー gated 境界

- commit / push / PR（Phase 13）
- staging secret 5 種の実投入（`STAGING_AUTH_SECRET` ほか）
- 即時運用の静的 bearer 再発行
- remote GitHub Actions での runtime-smoke / coverage-gate 緑化観測
