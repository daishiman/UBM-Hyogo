# Phase 11 — 手動テスト総括

| 項目 | 値 |
| --- | --- |
| タスク | task-conflict-prevention-skill-state-redesign |
| Phase | 11 / 13 |
| 視覚証跡区分 | NON_VISUAL |
| ワークフロー | spec_created |
| 状態 | 手順固定済（実行は A-1〜B-1 実装タスク完了後） |

## 検証戦略サマリー

本タスクは docs-only / NON_VISUAL であり、実コードは A-1 〜 B-1 の後続実装タスクで投入される。
Phase 11 では「実装後に実行する」検証手順・証跡形式を **本仕様書段階で凍結**し、
実行可能な状態で後続タスクへ引き渡す。

### 検証範囲

| 観点 | 概要 | 主成果物 |
| --- | --- | --- |
| 仕様書間整合 | phase-01〜13 の参照リンク・ID の一貫性 | `link-checklist.md` |
| リンク健全性 | 内部 / 外部参照パスが実在するか | `link-checklist.md` |
| AC トレース | AC-1〜AC-9 が phase-XX outputs と紐づいているか | `link-checklist.md` |
| 4 worktree 並列衝突 0 件検証 | A-1〜B-1 適用後の手動 merge シミュレーション | `manual-smoke-log.md` |
| NON_VISUAL 代替証跡 | screenshot 不在の理由と代替（git stdout） | 本書 + `manual-smoke-log.md` |

## NON_VISUAL 区分の理由

- 本タスクは視覚 UI を含まない（仕様書 / `.gitignore` / `.gitattributes` / hook script のみ）
- primary evidence は `git status` / `git merge` / `git diff --name-only --diff-filter=U` の stdout
- placeholder 画像も生成しない（生成すると誤検知の元になる）

## AC-6 トレース

| AC | 要件 | 充足箇所 |
| --- | --- | --- |
| AC-6 | 4 worktree 並列マージで衝突 0 件を検証可能な手順と証跡形式 | `manual-smoke-log.md` 4-worktree 手順 + `evidence/<run-id>/` ディレクトリ規約 |

## 完了基準

- [ ] `manual-smoke-log.md` に 4 worktree 並列手順（wt1〜wt4）と TC-1〜TC-7 が固定
- [ ] `link-checklist.md` に index.md ↔ phase-XX.md ↔ outputs/ の双方向検証項目が並ぶ
- [ ] 衝突発生時のトリアージ手順が `manual-smoke-log.md` に記載
- [ ] placeholder-only の証跡を PASS 扱いしない方針が明記
- [ ] artifacts.json の Phase 11 status が更新される

## 未タスク候補（Phase 12 unassigned-task-detection.md へ引き継ぎ）

| # | 内容 |
| --- | --- |
| U-1 | A-1 / A-2 / A-3 / B-1 の各実装タスク 4 件を後続実装タスクとして formalize |
| U-2 | render script (`pnpm skill:logs:render`) は A-2 の subtask として formalize |
| U-3 | post-commit / post-merge hook は A-1 の subtask として formalize |
| U-4 | 既存 `LOGS.md` → `_legacy.md` データ移行は A-2 の subtask として formalize |

## 関連リンク

- 上流: `../../phase-10.md`
- 同 phase: `./manual-smoke-log.md` / `./link-checklist.md`
- 検証手順元: `../phase-4/parallel-commit-sim.md` / `../phase-4/merge-conflict-cases.md`
- 下流: `../../phase-12.md`
