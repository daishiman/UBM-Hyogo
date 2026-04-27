# Phase 13: PR 作成（user 承認必須）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | meeting-tag-queue-and-schema-diff-repository |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | Phase 12 (ドキュメント更新) |
| 下流 | （タスク完了） |
| 状態 | approval_required |
| user_approval_required | true |

## 目的

Phase 1〜12 の成果物を feature branch にまとめ、`feature/* → dev` の PR を作成する。**user 承認なしには絶対に実行しない**。

## approval gate

```text
[BLOCKED] Phase 13 は user 承認必須
  ↓
[USER ASKS] "PR 作成を開始してよい？"
  ↓
[USER APPROVES] yes
  ↓
[GO] Phase 13 実行
```

承認なしで本 Phase を進めた場合 → 即座に rollback。

## 事前 local check（承認前に証跡として残す）

| # | 項目 | コマンド | 期待 |
| --- | --- | --- | --- |
| L-1 | typecheck | `pnpm --filter @ubm-hyogo/api typecheck` | 0 error |
| L-2 | lint | `pnpm --filter @ubm-hyogo/api lint` | 0 error |
| L-3 | unit test | `pnpm vitest run apps/api/src/repository` | 全 pass |
| L-4 | depcruise | `pnpm depcruise apps/api` | 0 violation（特に 02a / 02c との相互 import 0） |
| L-5 | bundle size | `pnpm --filter @ubm-hyogo/api build && du -sh dist/` | < 1MB |
| L-6 | git diff scope | `git diff --stat main..HEAD` | 02b docs + `apps/api/src/repository/` + same-wave spec/log updates のみ |
| L-7 | secret scan | `git diff main..HEAD \| grep -E '(BEGIN PRIVATE\|sk-\|GOOGLE_PRIVATE)'` | 0 hit |

結果は `outputs/phase-13/local-check-result.md` に表で記録。

## change summary

```markdown
## このタスクが追加するもの

- docs/30-workflows/02b-parallel-meeting-tag-queue-and-schema-diff-repository/
  - index.md, artifacts.json
  - phase-01.md 〜 phase-13.md（13 files）
  - outputs/phase-{01..13}/* （Phase ごとの成果物）
- apps/api/src/repository/
  - 7 repository + `_shared/` helper + unit tests

## このタスクが触らないもの

- apps/api/src/route/* （04c タスクが担当）
- apps/api/src/sync/* （03a タスクが担当）
- apps/api/src/workflow/* （07a/b/c タスクが担当）
- packages/shared/* （01b タスクが担当）
- D1 migration（01a タスクが担当）

## 不変条件への影響

- #5 D1 boundary: dep-cruiser ルール案を 02c に提供
- #13 tag 直接編集禁止: tagDefinitions に write API を作らない（仕様）、tag_assignment_queue 経由のみ
- #14 schema 集約: schemaDiffQueue / schemaVersions / schemaQuestions が schema 系の単一 source
- #15 attendance 重複/削除済み: PK 制約で重複阻止 + listAttendableMembers JOIN で削除済み除外
- #10 無料枠: D1 reads 0.24% / writes 0.11% 想定
```

## PR template

```markdown
## Summary

implementation PR: 会議 / タグ queue / schema diff queue ドメインの D1 repository（7 ファイル）と Phase 1〜13 仕様書を追加。
後続 03a / 04c / 07a/b/c / 08a タスクの並列着手用 contract。

## Scope

- docs/30-workflows/02b-parallel-meeting-tag-queue-and-schema-diff-repository/ 配下 Phase 1-13 docs
- apps/api/src/repository/ 配下 repository implementation + tests
- 不変条件 #5 / #13 / #14 / #15 / #10 を構造で守る設計

## Test plan

- [ ] docs 構造: phase-template-app.md 準拠
- [ ] `pnpm --filter @ubm-hyogo/api typecheck`
- [ ] `pnpm vitest run apps/api/src/repository`
- [ ] 不変条件マッピングが Phase 1, 4, 6, 7, 9 で一貫
- [ ] AC matrix が 9 AC × 4 軸でトレース完全
- [ ] 状態遷移 ALLOWED_TRANSITIONS が Phase 2 / 5 / 6 で一貫
- [ ] attendance PK 制約が 01a 側で宣言される前提（blocker B-1 確認）
- [ ] dep-cruiser ルール案が 02c に引き渡し可能
- [ ] implementation-guide が 03a / 04c / 07a/b/c / 08a の入口になる

## Out of scope

- D1 migration（01a 別 PR）
- API endpoint（04c 別 PR）
- Forms sync（03a 別 PR）
- Workflow（07a/b/c 別 PR）

## 関連

- 上流: 01a (D1 schema + tag seed), 01b (zod / view model)
- 並列: 02a, 02c
- 下流: 03a, 04c, 07a, 07b, 07c, 08a

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 実行手順（承認後のみ）

```bash
# 1. branch 作成（既に feature/02b-... なら skip）
git checkout -b feature/02b-meeting-tag-queue-and-schema-diff-repository

# 2. add only this task's files
git add docs/30-workflows/02b-parallel-meeting-tag-queue-and-schema-diff-repository/ apps/api/src/repository/ .claude/skills/aiworkflow-requirements/ .claude/skills/task-specification-creator/LOGS.md

# 3. commit
git commit -m "$(cat <<'EOF'
feat(api): add meeting tag queue schema diff repositories

- apps/api/src/repository 7 repository + tests
- docs/30-workflows/02b-parallel-meeting-tag-queue-and-schema-diff-repository Phase 1-13
- 不変条件 #5 / #13 / #14 / #15 / #10 を構造で守る
- attendance PK 制約 + tag queue unidirectional 状態遷移
- 03a / 04c / 07a/b/c / 08a 並列着手用 contract

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# 4. push
git push -u origin feature/02b-meeting-tag-queue-and-schema-diff-repository

# 5. PR 作成
gh pr create --base dev --title "feat(api): add meeting tag queue schema diff repositories" --body "$(cat outputs/phase-13/pr-body.md)"
```

## 実行タスク

1. local check L-1〜L-7 を **事前** 実行、結果を `outputs/phase-13/local-check-result.md` に記録
2. change summary を `outputs/phase-13/change-summary.md` に記録
3. PR body を `outputs/phase-13/pr-body.md` に記録
4. **user に承認を求める**
5. 承認後、上記実行手順を順次実施
6. PR URL を `outputs/phase-13/main.md` に記録

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 12 implementation-guide.md | PR description の base |
| 必須 | CLAUDE.md ブランチ戦略 | feature/* → dev → main |
| 必須 | docs/01-infrastructure-setup/01a-... | branch 命名 / governance |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| 03a / 04c / 07a/b/c / 08a | この PR がマージされ次第着手 |
| 09a (staging) | この PR の実装が反映された後に smoke |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| approval gate | — | user 承認なしには PR を絶対に作らない |
| secret hygiene | — | L-7 が 0 hit |
| scope 限定 | — | L-6 で他タスク領域への漏れがゼロ |
| branch 戦略 | — | feature/* → dev、main 直 PR は禁止 |
| implementation | — | このタスクは repository code + docs + system spec sync |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | local check L-1〜L-7 | 13 | pending | 承認前 |
| 2 | change summary | 13 | pending | 承認前 |
| 3 | PR body | 13 | pending | 承認前 |
| 4 | user 承認 | 13 | pending | **必須** |
| 5 | branch / commit / push | 13 | blocked | 承認後 |
| 6 | gh pr create | 13 | blocked | 承認後 |
| 7 | PR URL 記録 | 13 | blocked | 承認後 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | PR URL + 完了報告 |
| ドキュメント | outputs/phase-13/local-check-result.md | L-1〜L-7 結果 |
| ドキュメント | outputs/phase-13/change-summary.md | scope と不変条件影響 |
| ドキュメント | outputs/phase-13/pr-body.md | PR description |

## 完了条件

- [ ] L-1〜L-7 全て pass
- [ ] user 承認取得
- [ ] PR 作成完了
- [ ] artifacts.json の Phase 13 が completed

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜3 を承認前に完了
- [ ] user 承認取得
- [ ] サブタスク 5〜7 を承認後に完了
- [ ] outputs/phase-13/* 配置済み
- [ ] artifacts.json の Phase 13 を completed に更新（PR URL 含む）

## 次 Phase

- なし（タスク完了）
- 後続: 03a, 04c, 07a, 07b, 07c, 08a が本 PR マージ後に並列着手
