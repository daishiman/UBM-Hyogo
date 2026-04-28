# Phase 13: PR 作成（user 承認必須）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-identity-status-and-response-repository |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | Phase 12 (ドキュメント更新) |
| 下流 | （タスク完了） |
| 状態 | pending |
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
| L-1 | typecheck | `pnpm --filter apps/api typecheck` | 0 error |
| L-2 | lint | `pnpm --filter apps/api lint` | 0 error |
| L-3 | unit test | `pnpm --filter apps/api test repository` | 全 pass |
| L-4 | depcruise | `pnpm depcruise apps/api` | 0 violation |
| L-5 | bundle size | `pnpm --filter apps/api build && du -sh dist/` | < 1MB |
| L-6 | git diff scope | `git diff --stat main..HEAD` | `apps/api/src/repository/*` + `packages/shared/*` + `docs/30-workflows/02a-*` のみ |
| L-7 | secret scan | `git diff main..HEAD \| grep -E '(BEGIN PRIVATE|sk-|GOOGLE_PRIVATE)'` | 0 hit |

結果は `outputs/phase-13/local-check-result.md` に表で記録。

## change summary

```markdown
## このタスクが追加するもの

- docs/30-workflows/02a-parallel-member-identity-status-and-response-repository/
  - index.md, artifacts.json
  - phase-01.md 〜 phase-13.md（13 files）
  - outputs/phase-{01..13}/* （Phase ごとの成果物）

## このタスクが触らないもの

- apps/api/src/route/* （04* タスクが担当）
- apps/api/src/sync/* （03* タスクが担当）
- packages/shared/* （branded type / view model 型は本ブランチの実装対象）
- D1 migration（01a タスクが担当）

## 不変条件への影響

- #4 本人本文 immutable: responses.ts に partial update API を作らない（仕様）
- #5 D1 boundary: dep-cruiser ルール案を 02c に提供
- #7 型混同防止: branded type 設計を確定
- #11 admin 本文編集禁止: admin setter を `setPublishState` / `setDeleted` に限定（仕様）
- #12 adminNotes 分離: builder 戻り値型で分離（仕様）
- #10 無料枠: D1 reads 0.47% / writes 1.21% 想定
```

## PR template

```markdown
## Summary

implementation PR: 会員ドメインの D1 repository（table repository + builder + shared branded/view model types）と Phase 1〜13 仕様書を追加。
後続 03b / 04a / 04b / 04c / 08a タスクの並列着手用 contract と実装基盤。

## Scope

- apps/api/src/repository/ 配下 repository 実装
- packages/shared/src/types / zod / branded 関連
- docs/30-workflows/02a-parallel-member-identity-status-and-response-repository/ 配下成果物
- 不変条件 #4 / #5 / #7 / #11 / #12 / #10 を構造で守る設計

## Test plan

- [ ] doc 構造: 15 files が phase-template-app.md 準拠
- [ ] 不変条件マッピングが Phase 1, 4, 6, 7, 9 で一貫
- [ ] AC matrix が 8 AC × 4 軸でトレース完全
- [ ] dep-cruiser ルール案が 02c に引き渡し可能
- [ ] implementation-guide が 03b / 04* / 08a の入口になる

## Out of scope

- API endpoint（04* 別 PR）
- D1 migration（01a 別 PR）
- Forms sync（03* 別 PR）

## 関連

- 上流: 01a (D1 schema), 01b (zod / view model)
- 並列: 02b, 02c
- 下流: 03b, 04a, 04b, 04c, 08a

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 実行手順（承認後のみ）

```bash
# 1. branch 作成（既に feature/02a-... なら skip）
git checkout -b feature/02a-member-identity-status-and-response-repository

# 2. add only this task's files
git add apps/api/src/repository packages/shared/src docs/30-workflows/02a-parallel-member-identity-status-and-response-repository docs/30-workflows/unassigned-task/UT-02A-*.md

# 3. commit
git commit -m "$(cat <<'EOF'
feat(02a): member identity status and response repository

repository implementation and Phase 1-13 docs
- 不変条件 #4 / #5 / #7 / #11 / #12 / #10 を構造で守る
- 03b / 04a / 04b / 04c / 08a 並列着手用 contract

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# 4. push
git push -u origin feature/02a-member-identity-status-and-response-repository

# 5. PR 作成
gh pr create --base dev --title "feat(02a): member identity status and response repository" --body "$(cat outputs/phase-13/pr-template.md)"
```

## 実行タスク

1. local check L-1〜L-7 を **事前** 実行、結果を `outputs/phase-13/local-check-result.md` に記録
2. change summary を `outputs/phase-13/change-summary.md` に記録
3. PR template を `outputs/phase-13/pr-template.md` に記録
4. **user に承認を求める**
5. 承認後、上記実行手順を順次実施
6. PR URL を `outputs/phase-13/main.md` に記録

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 12 implementation-guide.md | PR description の base |
| 必須 | CLAUDE.md ブランチ戦略 | feature/* → dev → main |
| 必須 | doc/01-infrastructure-setup/01a-... | branch 命名 / governance |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| 03b / 04* / 08a | この PR がマージされ次第着手 |
| 09a (staging) | この PR の実装が反映された後に smoke |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| approval gate | — | user 承認なしには PR を絶対に作らない |
| secret hygiene | — | L-7 が 0 hit |
| scope 限定 | — | L-6 で他タスク領域への漏れがゼロ |
| branch 戦略 | — | feature/* → dev、main 直 PR は禁止 |
| implementation | — | このタスクは repository / shared type 実装を含む |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | local check L-1〜L-7 | 13 | pending | 承認前 |
| 2 | change summary | 13 | pending | 承認前 |
| 3 | PR template | 13 | pending | 承認前 |
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
| ドキュメント | outputs/phase-13/pr-template.md | PR description |

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
- 後続: 03b, 04a, 04b, 04c, 08a が本 PR マージ後に並列着手
