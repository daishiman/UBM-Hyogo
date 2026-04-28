# Phase 13: PR 作成（user 承認必須）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-notes-audit-sync-jobs-and-data-access-boundary |
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

Phase 1〜12 の成果物を feature branch にまとめ、`feature/* → dev` の PR を作成する。**user 承認なしには絶対に実行しない**。02c は `_shared/` 正本と boundary tooling 正本を含むため、02a / 02b との merge 順序にも注意する。

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
| L-2 | lint (apps/api) | `pnpm --filter apps/api lint` | 0 error |
| L-3 | lint (apps/web) | `pnpm --filter apps/web lint` | 0 error |
| L-4 | unit test | `pnpm --filter apps/api test repository` | 全 pass |
| L-5 | boundary lint | `node scripts/lint-boundaries.mjs` | 0 violation（dep-cruiser CI gate は 09a / Wave 2 統合へ申し送り） |
| L-6 | bundle size | `pnpm --filter apps/api build && du -sh dist/` | < 1MB |
| L-7 | git diff scope | `git diff --stat main..HEAD` | `docs/30-workflows/02c-*`、`apps/api/src/repository/**`、boundary tooling、正本仕様同期のみ |
| L-8 | secret scan | `git diff main..HEAD \| grep -E '(BEGIN PRIVATE\|sk-\|GOOGLE_PRIVATE\|MAGIC_LINK_HMAC)'` | 0 hit |

結果は `outputs/phase-13/local-check-result.md` に表で記録。

## change summary

```markdown
## このタスクが追加するもの

- docs/30-workflows/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary/
  - index.md, artifacts.json
  - phase-01.md 〜 phase-13.md（13 files）
  - outputs/phase-{01..13}/* （Phase ごとの成果物）

## このタスクが触らないもの

- apps/api/src/route/* （04c が担当）
- apps/api/src/sync/* （03a / 03b が担当）
- apps/api/src/auth/* （05a / 05b が担当）
- packages/shared/* （01b が担当）
- D1 migration（01a が担当）
- apps/web の page / component（06* タスクが担当）

## 不変条件への影響

- #5 D1 boundary: 現時点は `scripts/lint-boundaries.mjs` が実行 gate、`.dependency-cruiser.cjs` は CI 導入待ち
- #6 GAS prototype 昇格防止: `__fixtures__/` を vitest 専用として明記、build 除外の固定は申し送り
- #11 admin 本文編集禁止: adminNotes / auditLog ともに `member_responses` に触れない、auditLog は append-only
- #12 adminNotes 分離: `PublicMemberProfile` / `MemberProfile` に adminNotes 不在を型テストで確認

## 02c 固有の責務

- `_shared/db.ts` / `_shared/brand.ts` / `_shared/sql.ts` の正本管理者
- `__tests__/_setup.ts`（in-memory D1 loader）の正本管理者
- `.dependency-cruiser.cjs` の正本管理者
- `scripts/lint-boundaries.mjs` の apps/web D1 boundary gate
```

## PR template

```markdown
## Summary

implementation NON_VISUAL PR: 管理者ドメインの D1 repository（5 ファイル）+ data access boundary tooling（lint-boundaries / dep-cruiser config 案 / in-memory D1 loader）の実装と Phase 1〜13 仕様書を追加。
後続 03a / 03b / 04c / 05a / 05b / 07c / 08a タスクの並列着手用 contract。
02c は同 Wave の `_shared/` 正本管理者であり、02a / 02b と相互独立。

## Scope

- docs/30-workflows/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary/ 配下
- apps/api/src/repository/ 配下の repository 実装・テスト
- 不変条件 #5 / #6 / #11 / #12 を構造で守る設計
  - #5: `scripts/lint-boundaries.mjs` 実行 gate + dep-cruiser config 案
  - #6: `__fixtures__/` を vitest 専用として明記
  - #11: auditLog append-only（UPDATE/DELETE API 不在）、adminNotes が `member_responses` に触れない
  - #12: 02a builder の戻り値型に adminNotes 不在

## Test plan

- [ ] doc 構造: 15 files が phase-template-app.md 準拠
- [ ] 不変条件マッピングが Phase 1, 4, 6, 7, 9 で一貫
- [ ] AC matrix が 11 AC × 4 軸でトレース完全
- [ ] `scripts/lint-boundaries.mjs` が PASS、dep-cruiser CI gate は申し送り済み
- [ ] implementation-guide が 03a / 03b / 04c / 05a / 05b / 07c / 08a の入口になる
- [ ] 02a / 02b との `_shared/` 正本合意が明記

## Out of scope

- D1 migration（01a 別 PR）
- API endpoint（04c 別 PR）
- Auth provider（05a / 05b 別 PR）
- Forms sync（03a / 03b 別 PR）
- Cron trigger（09b 別 PR）

## 関連

- 上流: 01a (D1 schema), 01b (zod / view model)
- 並列: 02a, 02b（`_shared/` 正本は 02c）
- 下流: 03a, 03b, 04c, 05a, 05b, 07c, 08a

Generated with Claude Code
```

## 実行手順（承認後のみ）

```bash
# 1. branch 作成（既に feature/02c-... なら skip）
git checkout -b feature/02c-admin-notes-audit-sync-jobs-and-data-access-boundary

# 2. add only this task's files
git add docs/30-workflows/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary/ apps/api/src/repository/ apps/web/src/lib/__tests__/boundary.test.ts scripts/lint-boundaries.mjs .dependency-cruiser.cjs .claude/skills/aiworkflow-requirements/

# 3. commit
git commit -m "$(cat <<'EOF'
feat(02c): admin repository boundary

- 不変条件 #5 / #6 / #11 / #12 を構造で守る
- adminUsers / adminNotes / auditLog / syncJobs / magicTokens 5 repo
- _shared/ + boundary tooling（lint-boundaries + dep-cruiser config 案）の正本管理者
- 03a / 03b / 04c / 05a / 05b / 07c / 08a 並列着手用 contract

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# 4. push
git push -u origin feature/02c-admin-notes-audit-sync-jobs-and-data-access-boundary

# 5. PR 作成
gh pr create --base dev \
  --title "feat(02c): admin repository boundary" \
  --body "$(cat outputs/phase-13/pr-template.md)"
```

## 実行タスク

1. local check L-1〜L-8 を **事前** 実行、結果を `outputs/phase-13/local-check-result.md` に記録
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
| 03a / 03b / 04c / 05a / 05b / 07c / 08a | この PR がマージされ次第着手 |
| 09a (staging) | この PR の実装が反映された後に smoke |
| 02a / 02b | `_shared/` 正本管理者として、02c の merge を待ってから実装 PR を出すか相談 |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| approval gate | — | user 承認なしには PR を絶対に作らない |
| secret hygiene | — | L-8 が 0 hit |
| scope 限定 | — | L-7 で対象外タスク領域への漏れを確認 |
| branch 戦略 | — | feature/* → dev、main 直 PR は禁止 |
| non visual | — | UI route / component 変更なし、スクリーンショット不要 |
| 02a/02b 整合 | — | `_shared/` 正本管理の宣言が PR description にある |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | local check L-1〜L-8 | 13 | pending | 承認前 |
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
| ドキュメント | outputs/phase-13/local-check-result.md | L-1〜L-8 結果 |
| ドキュメント | outputs/phase-13/change-summary.md | scope と不変条件影響 |
| ドキュメント | outputs/phase-13/pr-template.md | PR description |

## 完了条件

- [ ] L-1〜L-8 全て pass
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
- 後続: 03a / 03b / 04c / 05a / 05b / 07c / 08a が本 PR マージ後に並列着手
- 並列調整: 02a / 02b が `_shared/` を再 import するため、02c マージ後に 02a / 02b の実装 PR を出す順序を推奨
