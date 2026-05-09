# task-11 member_identities local seed and runtime evidence - タスク指示書

## メタ情報

| 項目         | 内容                                                                  |
| ------------ | --------------------------------------------------------------------- |
| タスクID     | task-11-followup-001-member-identities-local-seed                     |
| タスク名     | local D1 に member_identities seed を投入し PENDING_RUNTIME_EVIDENCE を解消 |
| 分類         | 検証 / seed-data / runtime-evidence                                   |
| 対象機能     | `apps/web/app/(public)/members` (一覧 + filter + density toggle)      |
| 優先度       | 中                                                                    |
| 見積もり規模 | 小規模                                                                |
| ステータス   | 未実施                                                                |
| 発見元       | task-11-public-top-and-member-list / Phase 11 manual-test-result.md   |
| 発見日       | 2026-05-09                                                            |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

task-11 は公開 top と members 一覧を実装したが、ローカル D1 の `member_identities` テーブルが空のため `/members` 画面の runtime screenshot / axe.json が取得できず、Phase 11 ledger に `PENDING_RUNTIME_EVIDENCE` が残った。`/` (top) の hero/stats/timeline は static で先行確認できたが、一覧 UI は seed なしでは empty state しか確認できない。

### 1.2 問題点・課題

- members-list.png / members-grid.png が未取得
- axe-result.json が `/members` 経路で未取得
- density toggle (table/grid) と filter の振る舞いが空配列でしか確認できない

### 1.3 放置した場合の影響

- 下流 task で MemberTable / MemberGrid / MemberFilters の regression を発見しづらい
- Phase 13 (PR) の evidence パッケージに `/members` 視覚検証が欠ける

---

## 2. 何を達成するか（What）

### 2.1 目的

local D1 に最小 seed を投入し、`/members` の runtime evidence (screenshot + axe) を取得して task-11 Phase 11 ledger を完結させる。

### 2.2 最終ゴール

- `pnpm tsx scripts/seed-local.ts` 等で member_identities + 関連 tag マッピングが投入される
- `members-list.png` / `members-grid.png` / `axe-result.json` が evidence にアーカイブされる
- task-11 Phase 11 の `PENDING_RUNTIME_EVIDENCE` が解消される

### 2.3 スコープ

#### 含むもの

- local 用 seed migration / script の作成
- 公開可視 (`publicConsent=true`) member 5-10 件 + tag mapping
- Playwright + axe-core での screenshot / a11y レポート取得
- evidence のアーカイブと ledger 更新

#### 含まないもの

- production / staging への seed 投入
- D1 schema 変更 (既存 schema のまま seed のみ)
- Google Form 実回答との同期ロジック変更
- admin-managed data (tags master 等) の本格整備

### 2.4 成果物

- `apps/api/migrations/seed-local-*.sql` または `scripts/seed-local.ts`
- `docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-11/evidence/members-list.png`
- 同 `members-grid.png`
- 同 `axe-result.json`
- task-11 spec の Phase 11 ledger 更新 (`PENDING_RUNTIME_EVIDENCE` → `runtime-evidence-captured`)

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `apps/api` の D1 binding が local で起動可能
- `apps/web` の dev server (`@opennextjs/cloudflare` 経由) が起動できる
- task-ut-04 seed-data-runbook の方針に準拠

### 3.2 依存タスク

- task-ut-04 seed-data-runbook（seed 方針の正本）
- task-11-public-top-and-member-list（親 workflow / ledger 更新先）

### 3.3 必要な知識

- D1 migrations / wrangler d1 execute
- Playwright での screenshot 取得 + axe-core injection
- `publicConsent` フラグの不変条件

---

## 4. スコープ（含む / 含まない） — 再掲

含む: local seed、runtime evidence 取得、ledger 更新。
含まない: schema 変更、prod/staging への投入、admin UI。

---

## 5. 検証方法

```bash
# seed 投入
bash scripts/cf.sh d1 execute ubm-hyogo-db-local --file=apps/api/migrations/seed-local-member-identities.sql --local
# または
mise exec -- pnpm tsx scripts/seed-local.ts

# 起動 + 確認
mise exec -- pnpm --filter @repo/web dev
curl -s http://localhost:3000/members | grep -c 'data-testid="member-card"'

# evidence 取得
mise exec -- pnpm --filter @repo/web exec playwright test public-top-and-list.spec.ts
```

完了条件: `/members` の table / grid 両 density で行/カードが描画され、axe violations が 0 (または既知例外のみ)。

---

## 6. リスクと対策

| リスク                                                | 対策                                                                |
| ----------------------------------------------------- | ------------------------------------------------------------------- |
| seed が prod に流出する                              | `--local` flag 強制 + script に env guard を入れる                  |
| `publicConsent=false` を誤って公開ルートに出す       | seed データの全件で `publicConsent=true` を明示し、API 側で再フィルタ |
| seed が D1 schema 変更のたびに壊れる                 | seed-data-runbook に従い migration 番号と整合させる                 |

---

## 7. 苦戦箇所メモ（再発防止）

- task-11 Phase 11 で `/` は static で取れたが `/members` は seed 依存で取れない、という非対称が ledger 上に明記されていなかった。data-dependent な runtime evidence は別 followup として最初から分離する。

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-11/manual-test-result.md`
- `docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-12/main.md`
- `docs/30-workflows/unassigned-task/task-ut-04-*` (seed-data-runbook)

### 関連 task

- task-11-public-top-and-member-list（親 workflow）
- task-ut-04 seed-data-runbook（seed 方針）
