# Phase 11 出力: main.md
# 手動 smoke test

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | architecture-and-scope-baseline |
| Phase | 11 / 13 (手動 smoke test) |
| 作成日 | 2026-04-23 |
| 状態 | completed |
| 入力 | outputs/phase-10/main.md (最終レビュー / Phase 11 進行 GO) |

---

## 1. 手動 smoke test 実施概要

| 項目 | 内容 |
| --- | --- |
| 実施日 | 2026-04-23 |
| 実施者 | daishiman |
| 実施目的 | Phase 1〜10 で作成した全ドキュメントが整合性を持ち、ナビゲーション可能な状態にあることを最終確認する |
| 実施方法 | 手動でファイルの存在と内容を確認。詳細は `manual-smoke-log.md` に記録 |
| 結果 | PASS |

---

## 2. テスト観点

### 観点 1: README → index → 13 Phase のナビゲーション確認

| チェック項目 | 確認内容 | 結果 |
| --- | --- | --- |
| task root の index.md 存在 | `doc/00-serial-architecture-and-scope-baseline/index.md` が存在すること | PASS |
| phase-XX.md の存在 (Phase 1〜13) | `phase-01.md` 〜 `phase-13.md` が全て存在すること | PASS |
| outputs/phase-12 outputs の存在 (Phase 12) | `outputs/phase-12/implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md` が全て存在すること | PASS |
| artifacts.json の存在 | `artifacts.json` が task root に存在すること | PASS |

### 観点 2: branch/env/data ownership/secret placement の説明確認

| チェック項目 | 確認ファイル | 確認内容 | 結果 |
| --- | --- | --- | --- |
| branch 対応表の存在 | `outputs/phase-02/canonical-baseline.md` セクション2 | `feature/*→dev→main` と `local→staging→production` の対応表が存在する | PASS |
| data ownership の分離 | `outputs/phase-02/canonical-baseline.md` セクション3 | `Sheets = 入力源 (non-canonical)` / `D1 = canonical` が責務定義に明記されている | PASS |
| secret placement の分離 | `outputs/phase-02/canonical-baseline.md` セクション4 | Cloudflare Secrets / GitHub Secrets / 1Password の3分離が表で示されている | PASS |
| 判断根拠の存在 | `outputs/phase-02/decision-log.md` | DL-01〜DL-06 の採用理由と NA-01〜NA-03 の非採用理由が記録されている | PASS |
| scope 外の分離 | `outputs/phase-02/decision-log.md` セクション3 | OOS-01〜OOS-08 のスコープ外決定が記録されている | PASS |
| 4条件 PASS の記録 | `outputs/phase-03/main.md` セクション1 | 価値性/実現性/整合性/運用性が全て PASS と判定されている | PASS |

---

## 3. 失敗時の戻り先逆引き表

| 問題 | 戻り先 Phase | 対処内容 |
| --- | --- | --- |
| outputs/phase-XX/main.md が存在しない | Phase XX を再実行 | 欠如したファイルを作成し、内容が Phase 仕様を満たしているか確認する |
| branch 対応表が `develop` / `master` で記述されている | Phase 8 | DRY 化手順を参照し、`dev` / `main` に修正する |
| Sheets が canonical と記述されている | Phase 2 | canonical-baseline.md セクション3 の責務定義を修正し、decision-log.md NA-01 の根拠を参照する |
| secret 配置が混線している (runtime が GitHub Secrets 等) | Phase 5 / Phase 8 | canonical-baseline.md セクション4 のシークレット配置マトリクスを修正する |
| scope 外サービス (通知基盤等) が設計に混入している | Phase 6 / Phase 8 | 混入サービスを削除し、decision-log.md OOS リストに追加する |
| AC が PASS でない | Phase 3 | 該当 AC の充足ファイルを確認し、不足内容を補完する |
| 実値のシークレットが含まれている | 即時修正 (Phase 9) | 実値を `<PLACEHOLDER>` に置換し、git 履歴を確認する |
| artifacts.json の task_path が古いパスになっている場合 | artifacts.json 更新 | `task_path` を `doc/00-serial-architecture-and-scope-baseline` に修正する |

---

## 4. Phase 12 への引き継ぎ

### Blockers

なし。手動 smoke test の全観点が PASS。Phase 12 (ドキュメント更新) に進行可能。

### Open Questions

なし。

### Phase 12 実行時の注意事項

- Phase 12 では以下の6ファイルを全て作成すること:
  1. `outputs/phase-12/implementation-guide.md`
  2. `outputs/phase-12/system-spec-update-summary.md`
  3. `outputs/phase-12/documentation-changelog.md`
  4. `outputs/phase-12/unassigned-task-detection.md`
  5. `outputs/phase-12/skill-feedback-report.md`
  6. `outputs/phase-12/phase12-task-spec-compliance-check.md`
- Phase 12 完了時点で artifacts.json の `task_path` と Phase 1〜12 の `status` が更新済みであることを確認すること

---

## 完了確認

- [x] 手動 smoke test 実施概要記載済み
- [x] テスト観点 (観点1: ナビゲーション / 観点2: 説明確認) 記載済み
- [x] 失敗時の戻り先逆引き表作成済み (8件)
- [x] Phase 12 への引き継ぎ記載済み (blockers なし)
- [x] `manual-smoke-log.md` 作成済み (別ファイル)
- [x] `link-checklist.md` 作成済み (別ファイル)
