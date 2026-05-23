[実装区分: 実装仕様書]

# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | UT-25-DERIV-01 |
| 前提 Phase | Phase 11（NON_VISUAL 代替証跡完了） |
| 次 Phase | Phase 13（PR 作成 / ユーザー承認必須） |

## 目的

Phase 12 必須 7 成果物を `outputs/phase-12/` 配下に作成し、本タスクのドキュメント整備を完了する。Part 1（中学生レベル例え話）と Part 2（技術詳細）を含む implementation-guide を作成する。

## 変更対象ファイル（実装時に作成）

| パス | 種別 | 概要 |
| --- | --- | --- |
| `outputs/phase-12/main.md` | 新規 | Phase 12 close-out summary |
| `outputs/phase-12/implementation-guide.md` | 新規 | Part 1 + Part 2（必須） |
| `outputs/phase-12/system-spec-update-summary.md` | 新規 | SSOT spec への影響まとめ |
| `outputs/phase-12/documentation-changelog.md` | 新規 | docs/ 配下の追加・更新一覧 |
| `outputs/phase-12/unassigned-task-detection.md` | 新規 | 0 件でも出力（明示） |
| `outputs/phase-12/skill-feedback-report.md` | 新規 | task-specification-creator skill へのフィードバック |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 新規 | canonical 9 headings / Phase 11 evidence 表 / workflow root scan 自己診断 |

## implementation-guide.md（Part 1 + Part 2）

### Part 1: 中学生レベル例え話（必須）

例え:
> 家の鍵（SA key）は定期的に作り直して、古い鍵はすぐ捨てずに 1〜2 日「念のため通用するまま」にしておく。それから「使えなくする（disable）」状態で 7 日待ち、家族（apps/api Workers）が古い鍵を使わなくなったことが確実になったら、ようやく鍵そのものを処分する。鍵の中身（実値）はメモ書きに残さず、「1Password の引き出しのどこにあるか（`op://...`）」と「指紋（fingerprint）の頭 16 文字」だけ記録する。新しい鍵を入れるときは、人が見える形でコピペせず、「自動の管（パイプ）」で渡し、シェルの履歴にも残さない。

「なぜ難しいか」:

- 新旧の鍵を切り替える瞬間に、すでに玄関で鍵を回している人（処理中のリクエスト）が転ばないように「60 秒だけ待つ」必要がある
- 鍵を作り直す手順を覚えるのは難しいので、紙の手順書（SOP）と、人がミスしても安全な道具（helper）の両方を用意する

### Part 2: 必須 5 項目チェック

| 項目 | 内容 |
| --- | --- |
| 1. アーキテクチャ概要 | helper（bash）→ `scripts/cf.sh` ラッパー → `wrangler secret put` の 3 層、SOP は人手手順 + 完了記録テンプレと連携 |
| 2. 主要な設計判断 | 独立 helper を採用（`cf.sh` の単一責務を保つ）。state guard で staging→production 順序を物理的に強制 |
| 3. リスクと緩和策 | 値漏洩リスク → stdin パイプ + HISTFILE=/dev/null。無停止性リスク → 60 秒待機 + UT-26 疎通テスト。順序ミスリスク → state file ガード |
| 4. 運用への影響 | 90 日に 1 回の固定運用、完了記録テンプレに沿って 8 フィールドを記入、UT-25-DERIV-02 へ fingerprint を連携 |
| 5. 今後の拡張 | 自動化（UT-25-DERIV-04 / GitHub Actions） / 60 秒固定の再評価（MINOR-01）/ DR backup（UT-25-DEFER-01）|

## system-spec-update-summary.md

- 本タスクは `apps/api` / `apps/web` の機能を変更しない（運用 SOP + helper のみ）
- 影響仕様: `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` に「関連 SOP」セクション 1 行追記
- D1 schema / API surface / UI route 変更なし

## documentation-changelog.md

| 追加 / 更新 | パス | 説明 |
| --- | --- | --- |
| 追加 | docs/30-workflows/runbooks/sa-key-rotation-sop.md | SOP 本体 |
| 追加 | docs/30-workflows/runbooks/sa-key-rotation-records/TEMPLATE.md | 完了記録テンプレ |
| 追加 | scripts/cf-rotate-sa-key.sh | helper |
| 追加 | scripts/__tests__/cf-rotate-sa-key.bats | bats テスト |
| 更新 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | SOP 逆参照 1 行 |

## unassigned-task-detection.md

| ID | 検出 | 重複チェック |
| --- | --- | --- |
| - | 本タスク完了時点で新規 unassigned-task 検出は **0 件** | UT-25-DERIV-02（SA key 失効監視 alert）/ UT-25-DEFER-01（CF Secrets DR backup）/ UT-25-DERIV-03（Secret audit log）/ UT-25-DERIV-04（自動ローテ）と本タスクのスコープに重複がないことを確認済み |
| 候補 1 | MINOR-01: `wrangler tail` 60 秒固定値の再評価 | 既存タスクなし。本タスク完了後 90 日運用知見が溜まった時点で起票 |

> 0 件でも本ファイルを出力する（Phase 12 spec 必須）。

## skill-feedback-report.md

- 良かった点: phase-template-audit-task.md と phase-11-non-visual-alternative-evidence.md の NON_VISUAL 縮約テンプレが bash CLI タスクにそのまま使える
- 改善提案: bash helper タスク向けの「カバレッジ表代替テンプレ」を `references/` に追加すると Phase 7 がさらに書きやすくなる
- 反映先候補: `.claude/skills/task-specification-creator/references/phase-template-bash-tooling.md`（新規候補）

## phase12-task-spec-compliance-check.md

| 項目 | 確認 |
| --- | --- |
| canonical 9 headings | index.md / phase-1〜13.md の見出し構造が SKILL canonical と一致 |
| Phase 11 evidence 表 | phase-11.md に 5 証跡 + 冒頭固定句が記載 |
| workflow root scan | `docs/30-workflows/ut-25-deriv-01-sa-key-rotation-sop/` に 15 ファイル存在 |
| artifacts.json 同期 | 親 artifacts.json と outputs/artifacts.json の phases status が一致 |
| 実装区分明記 | 全 phase-N.md 冒頭に `[実装区分: 実装仕様書]` |

## DoD

- [ ] 7 成果物すべて作成
- [ ] implementation-guide.md に Part 1（例え話）+ Part 2（5 項目）あり
- [ ] unassigned-task-detection.md が 0 件でも出力されている
- [ ] スコープ重複チェック（UT-25-DERIV-02 / DEFER-01）が実施されている
- [ ] phase12-compliance check が全 PASS

## 次 Phase

Phase 13（PR 作成 — ユーザー明示承認必須）
