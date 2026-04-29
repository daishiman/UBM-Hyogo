# Phase 13 索引 — coverage-80-enforcement

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 / 13 |
| 名称 | PR 作成 / ユーザー承認後 3 段階適用 |
| 状態 | pending |
| **user_approval_required** | **true** |
| 実行ステータス | **NOT EXECUTED — awaiting user approval** |
| 作成日 | 2026-04-29 |

## 目的

Phase 1〜12 で固定された仕様書群を 3 段階の PR（PR① soft gate / PR② package 別テスト追加 / PR③ hard gate 化 + 正本同期 + branch protection contexts 登録）として user 明示承認後に適用する。

## 段階性

```
       ┌──────────┐      user 承認①        ┌──────────┐
       │  PR①     │ ─────────────────────▶│  PR①     │
       │ soft     │       (作成)            │ merge    │
       │ gate +   │                          │          │
       │ tooling  │                          └────┬─────┘
       └──────────┘                               │ user 承認②
                                                  ▼
                          ┌──────────────────────────┐
                          │ PR② sub PRs (package 別)  │
                          │  shared / integrations / │
                          │  apps/api / apps/web     │
                          │  各 sub PR で warning消す │
                          └────────┬─────────────────┘
                                   │ 全 sub merge 完了
                                   │ + UT-GOV-004 completed 再確認
                                   ▼
                          ┌──────────────────────────┐
                          │ PR③                      │
                          │  hard gate 化 +           │
                          │  lefthook 統合 +          │
                          │  aiworkflow-requirements  │
                          │  / coverage-standards 同期 │
                          └────────┬─────────────────┘
                                   │ user 承認③ (merge)
                                   │ user 承認④ (contexts 登録)
                                   │ user 承認⑤ (indexes:rebuild)
                                   ▼
                          ┌──────────────────────────┐
                          │ branch protection PUT    │
                          │  + pnpm indexes:rebuild  │
                          │  + drift 検証             │
                          └──────────────────────────┘
```

## 成果物一覧

| 成果物 | パス | 役割 |
| --- | --- | --- |
| 索引 | outputs/phase-13/main.md | 本ファイル |
| PR① runbook | outputs/phase-13/pr1-runbook.md | soft gate + tooling 投入 |
| PR② runbook | outputs/phase-13/pr2-runbook.md | package 別テスト追加（複数 sub PR） |
| PR③ runbook | outputs/phase-13/pr3-runbook.md | hard gate + lefthook + 正本同期 + contexts 登録 |

## 完了判定

- [ ] PR① / PR② sub PRs / PR③ がそれぞれ user 承認後に作成・merge される
- [ ] PR③ merge 後、`gh api .../branches/{dev,main}/protection` で `coverage-gate` が contexts に登録される
- [ ] `mise exec -- pnpm indexes:rebuild` 実行後、aiworkflow-requirements indexes に drift なし
- [ ] CLAUDE.md ↔ vitest.config.ts ↔ codecov.yml ↔ aiworkflow-requirements の 4 系正本一致
- [ ] artifacts.json の Phase 13 = `completed`

## 関連

- Phase 12 documentation-changelog: 各 PR の変更ファイル一覧の根拠
- Phase 12 implementation-guide Part 2: 各 PR の YAML / コマンド例の正本
- UT-GOV-001: PR③ contexts 登録の連携先
- UT-GOV-004: contexts 同期の上流前提（5 重明記）
