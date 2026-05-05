# Phase 13 出力 — PR 作成

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 08a-B-public-search-filter-coverage |
| phase | 13 / 13 |
| wave | 08a-fu |
| mode | parallel |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| user_approval_required | **true** |
| close-out 判定 | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |

## 目的

Phase 1〜12 で固定された 08a-B 検索/フィルタ仕様書群を、`feature/* → dev → main` のブランチ経路で PR にまとめるための **PR 作成手順 / PR 本文ドラフト / CI 確認項目 / approval gate** を確定する。本仕様書作成タスクではコミット・push・PR を**実行しない**。

## 中学生レベル概念説明

「PR（プルリクエスト）」は「**この変更を本番にマージしてよいか確認をお願いします**」という申請書のこと。本タスクの PR は仕様書更新に加えて、検索と並び順の小さな API 修正を含む。図書館で言えば「司書のマニュアル更新」と「検索カードの並び替えルール修正」を同時に申請する。

## 自走禁止操作（本 Phase で実行しないこと）

- `git commit` / `git push` / `gh pr create` の実行
- 追加の `apps/api` / `apps/web` コード差分の作成（Phase 12 review で検出した AC 直結の API 修正は本 branch に含める）
- `pnpm dev` 以外の deploy（`scripts/cf.sh deploy ...`）
- D1 への migration apply
- aiworkflow-requirements `references/` の SKILL.md / topic-map / keywords への直接編集

## PR 作成手順（実行は user approval 後）

`.claude/commands/ai/diff-to-pr.md` および CLAUDE.md「PR作成の完全自律フロー」に従う。

### Step 1: ブランチ確認 + リモート同期

```bash
# 現在ブランチ確認（feature/08a-B-public-search-filter-coverage 想定）
git branch --show-current

# main 同期
git fetch origin main
git checkout main && git merge --ff-only origin/main
git checkout -

# main を作業ブランチに取り込む
git merge main
```

### Step 2: 品質検証（3 コマンド固定）

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

→ 失敗時は最大 3 回まで自動修復し、修復差分をコミット。テスト実行は本 PR 作成フローでは行わない（CLAUDE.md 規定）。

### Step 3: 変更ファイル確認

```bash
git status --porcelain
git diff main...HEAD --name-only
```

### Step 4: PR 作成

```bash
gh pr create --base dev --head feature/08a-B-public-search-filter-coverage \
  --title "docs(08a-B): public /members search/filter coverage spec" \
  --body "$(cat <<'EOF'
<本ファイル下部の PR 本文ドラフトを使用>
EOF
)"
```

> base ブランチは個人開発ポリシーに従い `dev`（staging）。`feature/* → dev → main` 経路の前段。

## PR 本文ドラフト

以下を `gh pr create --body` の入力として使う。`outputs/phase-12/implementation-guide.md` および `.claude/commands/ai/diff-to-pr.md` を根拠とする。

---

### Summary

`/members` 公開検索/フィルタ機能（q / zone / status / tag / sort / density）の動作仕様を `12-search-tags.md` 正本に沿って固定し、08a-A use-case coverage では扱わない検索パラメータの spec gap と API 実装 drift を解消する implementation タスク。

- 6 query parameter の AC・既定値・許容値・不正値挙動・evidence path を固定
- `GET /public/members` の query/response schema を strict 化方針として確定
- `q` の LIKE wildcard escape、tag 5件 cap、`sort=name` / `sort=recent` の fullName tie-break、tag AND の bind offset を実コードへ反映
- 不変条件 #4 公開状態フィルタ正確性 / #5 public boundary / #6 admin-only field 非露出 を AC として明文化
- a11y（AC-A1/A2）・大量ヒット描画（AC-L1）・空結果 / 不正値 fallback の UI 挙動を仕様化

### 変更ファイル一覧

#### 新規（docs/30-workflows/08a-B-public-search-filter-coverage/）

- `index.md` / `artifacts.json`
- `phase-01.md` 〜 `phase-13.md`（13 ファイル）
- `outputs/phase-01/main.md` 〜 `outputs/phase-13/main.md`（13 ファイル）
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

#### 実コード変更（本 PR に含める）

- `apps/api/src/_shared/search-query-parser.ts`
- `apps/api/src/_shared/__tests__/search-query-parser.test.ts`
- `apps/api/src/repository/_shared/sql.ts`
- `apps/api/src/repository/_shared/sql.test.ts`
- `apps/api/src/repository/publicMembers.ts`
- `apps/api/src/repository/publicMembers.test.ts`

### スクリーンショット参照

`outputs/phase-11/screenshots/` 配下に Phase 11 で取得する 9 種:

- `members-default.png` — 初期表示
- `members-q-hit.png` — q 部分一致
- `members-zone.png` — zone+status 複合
- `members-tag-and.png` — tag AND
- `members-sort-name.png` — sort=name
- `members-density-dense.png` — density=dense
- `members-density-list.png` — density=list
- `members-empty.png` — 空結果
- `members-large-hit.png` — 大量ヒット paginated

> screenshot / curl / axe は Phase 11 runtime evidence として 08b / 09a 実行 cycle で取得する。本 PR 本文では取得対象として参照のみ。

### テストカバレッジ（計画値）

| layer | before% | after% | delta% |
| --- | --- | --- | --- |
| api parser | 65 | 95 | +30 |
| api repo | 70 | 88 | +18 |
| api use-case | 60 | 82 | +22 |
| web url | 55 | 90 | +35 |
| web component | 30 | 70 | +40 |
| shared zod | - | 100 | +100 |

詳細: `outputs/phase-12/unassigned-task-detection.md` coverage layer 表。

### a11y 結果（要約）

- AC-A1: filter input すべてに `aria-label` を付与（zone / status / tag / sort / density / q）
- AC-A2: keyboard 単独で全 filter UI に到達（Tab → Arrow → Enter / Space）
- axe-core 実測: Phase 11 で `outputs/phase-11/a11y-report.json` に記録（CI gate 化は 08b / 09a の実測設計で扱う）

### 不変条件マッピング

- #4 公開状態フィルタ正確性: `buildBaseFromWhere` の固定 WHERE（`public_consent='consented' AND publish_state='public' AND is_deleted=0`）+ `existsPublicMember` 同形条件
- #5 public/member/admin boundary: `apps/web` から D1 直接 import なし、`fetchPublic` 経由のみ
- #6 admin-only field 非露出: `PublicMemberListViewZ.strict()` + SELECT 句 allowlist + `SUMMARY_KEYS` 三段防御

### 残作業（runtime evidence）

- runtime: Phase 11 screenshot / curl / axe evidence は 08b / 09a 実行 cycle で取得
- observability: a11y axe-core CI gate 化と大量ヒット 1s 描画ベンチ自動化は 08b / 09a の実測設計で扱う

### Test plan

- [ ] `mise exec -- pnpm install --force` が成功
- [ ] `mise exec -- pnpm typecheck` green
- [ ] `mise exec -- pnpm lint` green
- [ ] CI workflow（typecheck / lint / verify-indexes）green
- [ ] 仕様書 13 phase の links が壊れていないこと
- [ ] artifacts.json parity（root / outputs 同期）
- [ ] outputs/phase-12/ の 7 ファイルが揃っていること

🤖 Generated with [Claude Code](https://claude.com/claude-code)

---

## CI 確認項目

PR 作成後、`gh pr checks` で以下を確認:

| job | 期待結果 |
| --- | --- |
| `typecheck` | green |
| `lint` | green |
| `verify-indexes-up-to-date`（`.github/workflows/verify-indexes.yml`） | green |
| `test` | green |
| `coverage gate`（`scripts/coverage-guard.sh` `--changed`） | green or N/A |
| `branch protection`（required_status_checks） | 全部 green |

> `apps/api` に実コード差分を含むため、focused API tests は本 PR 起因として確認する。

## approval gate 宣言

| 項目 | 値 |
| --- | --- |
| `user_approval_required` | **true** |
| 必要 approval | 「PR を作成して dev に merge 経路に乗せる」承認 |
| 承認後の自動実行 | `git push` / `gh pr create` までを CLAUDE.md「PR作成の完全自律フロー」で実行 |
| 承認なしの実行禁止操作 | コミット / push / PR 作成 / `specs/` 4 ファイルへの追記 |

## runtime evidence pending の取り扱い

正本 specs 4 ファイルと aiworkflow indexes は Phase 12 で同一 wave 同期済み。Phase 13 は commit / push / PR の user approval gate であり、Phase 11 runtime evidence の取得は 08b / 09a 実行 cycle に残る。

| 選択肢 | 採否 |
| --- | --- |
| 正本 specs 4 件 | synced |
| workflow / aiworkflow indexes | synced |
| Phase 11 screenshot / curl / axe | runtime pending（08b / 09a で取得） |

## DoD（Phase 13）

| ID | 内容 | 結果 |
| --- | --- | --- |
| P13-1 | PR 作成手順が CLAUDE.md「PR作成の完全自律フロー」に整合 | ✅ |
| P13-2 | PR 本文ドラフトが `implementation-guide.md` を根拠としている | ✅ |
| P13-3 | スクリーンショット参照（9 種）が `outputs/phase-11/screenshots/` 配下に列挙 | ✅ |
| P13-4 | CI 確認項目が列挙されている | ✅ |
| P13-5 | `user_approval_required: true` が宣言されている | ✅ |
| P13-6 | コミット / push / PR を本タスクで実行していない宣言 | ✅ |
| P13-7 | base ブランチが `dev`（個人開発ポリシー） | ✅ |
| P13-8 | runtime evidence pending と synced specs の境界が明記 | ✅ |

## タスク100%実行確認

- [x] 必須セクションがすべて埋まっている
- [x] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [x] 実装、deploy、commit、push、PR を実行していない
- [x] base ブランチが `dev`（個人開発ポリシー）
- [x] approval gate が `user_approval_required: true` で宣言されている

## 次 Phase への引き渡し

完了。**user approval 待ち**。承認後は CLAUDE.md「PR作成の完全自律フロー」に従い、

1. リモート同期 + main 取り込み
2. `pnpm install --force` / `pnpm typecheck` / `pnpm lint`
3. PR 本文ドラフトを使った `gh pr create --base dev`
4. CI 確認 + URL 報告

の 4 step を 1 回で完遂する。

本仕様書作成タスクではコミット / push / PR を**実行しない**。
