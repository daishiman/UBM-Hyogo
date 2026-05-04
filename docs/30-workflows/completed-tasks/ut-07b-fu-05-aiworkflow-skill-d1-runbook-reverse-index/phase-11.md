[実装区分: 実装仕様書]

# Phase 11: 手動テスト検証（NON_VISUAL 縮約テンプレ）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-07b-fu-05-aiworkflow-skill-d1-runbook-reverse-index |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動テスト検証 |
| Wave | 7 |
| Mode | serial |
| 作成日 | 2026-05-04 |
| 前 Phase | 10 (最終レビューゲート) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | spec_created |
| Source Issue | #438 |
| TaskType | implementation |
| VisualEvidence | **NON_VISUAL** |
| 種別判定 | aiworkflow-requirements skill index 整備（docs / skill metadata 更新のみ）→ NON_VISUAL |

---

## 目的

本 Phase は「aiworkflow-requirements skill から D1 migration runbook（UT-07B-FU-03）/ `scripts/d1/*.sh` / `.github/workflows/d1-migration-verify.yml` を逆引き参照できる index が整備され、CI gate `verify-indexes-up-to-date` がローカルで PASS する」ことを、
`artifacts.json.metadata.visualEvidence == "NON_VISUAL"` の縮約テンプレに従い**画像なしの代替 evidence（grep による文言存在確認 / `pnpm indexes:rebuild` 実行ログ / `verify-indexes` CI gate の git diff 0 件 / link-checklist）** で確認する。
screenshot 生成は false green 防止のため **禁止** する。

---

## 種別判定（最初に確認）

| 軸 | 判定 | 根拠 |
| --- | --- | --- |
| UI 差分 | なし | apps/web / apps/api いずれにも touch しない。skill index と LOGS のみ |
| 実環境前提 | 不要 | grep / `pnpm indexes:rebuild` / `git diff` で完結する |
| 主証跡 | 静的検証（grep + diff + 自動再生成 exit code） | resource-map / quick-reference / topic-map の整合 |
| 適用テンプレ | NON_VISUAL 縮約（`phase-template-phase11.md` §「docs-only / NON_VISUAL 縮約テンプレ」） | visualEvidence=NON_VISUAL |

---

## 必須成果物（NON_VISUAL 縮約 3 点 + 任意補助 1 点）

| # | ファイル | 必須 | 役割 |
| --- | --- | --- | --- |
| 1 | `outputs/phase-11/main.md` | ✅ | NON_VISUAL 宣言 / 発火条件 / 必須 outputs リンク / 代替 evidence 差分表 |
| 2 | `outputs/phase-11/test-report.md` | ✅ | grep / `pnpm indexes:rebuild` / `git diff` の exit code・件数・出力転記 |
| 3 | `outputs/phase-11/manual-evidence.md` | ✅ | NON_VISUAL 代替 evidence（resource-map / quick-reference / topic-map の差分転記、CI gate 模擬実行ログ） |
| 4 | `outputs/phase-11/link-checklist.md` | 任意補助 | aiworkflow-requirements skill 内から D1 runbook / scripts / workflow を辿る逆引きパス一覧 |

> Screenshot は生成しない。`screenshots/.gitkeep` も置かない。VISUAL 系 outputs（`screenshot-plan.json` / `manual-test-checklist.md` / `discovered-issues.md` / `phase11-capture-metadata.json`）は本 Phase の対象外。本仕様書では参照のみ記述し、実体は実装フェーズで作成する。

---

## 実行タスク

1. `resource-map.md` に追記された D1 migration runbook + `scripts/d1/*.sh` + `.github/workflows/d1-migration-verify.yml` 行を grep で検出し、文言存在を `test-report.md` に記録する
2. `quick-reference.md` に追記された `bash scripts/cf.sh d1:apply-prod` 1 行を grep で検出し、文言存在を `test-report.md` に記録する
3. `mise exec -- pnpm indexes:rebuild` を実行し、exit code と所要時間、`topic-map.md` 再生成差分を `test-report.md` に記録する
4. `git diff --stat .claude/skills/aiworkflow-requirements/indexes/` を再実行し、再生成後の追加 drift が 0 件であることを `manual-evidence.md` に転記する
5. `verify-indexes-up-to-date` CI gate（`.github/workflows/verify-indexes.yml`）相当のローカルチェック（`pnpm indexes:rebuild` 後の `git status --porcelain` が空）を実行し、`manual-evidence.md` に転記する
6. aiworkflow-requirements skill の起点（`SKILL.md` → `indexes/resource-map.md` → 追記行 → `docs/30-workflows/unassigned-task/task-ut-07b-fu-03-production-migration-apply-runbook.md` / `scripts/d1/*.sh` / `.github/workflows/d1-migration-verify.yml`）を `link-checklist.md` に列挙する
7. NON_VISUAL であることの宣言 / 代替 evidence 差分表 / 申し送り先（後続 D1 migration 実走タスク）を `main.md` に記述する

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` §「NON_VISUAL 縮約テンプレ」 | 必須 3 点フォーマット |
| 必須 | `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` | L1-L4 evidence / 代替 evidence 差分表 |
| 必須 | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 逆引き追記対象（実装後の正本） |
| 必須 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 1 行追記対象 |
| 必須 | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | `pnpm indexes:rebuild` 再生成対象 |
| 必須 | `.claude/skills/aiworkflow-requirements/references/workflow-ut-07b-fu-03-production-migration-apply-runbook-artifact-inventory.md` | 上流からの skill feedback（追記理由の根拠） |
| 必須 | `.claude/skills/aiworkflow-requirements/references/workflow-ut-07b-fu-03-production-migration-apply-runbook-artifact-inventory.md` | 上流の system-spec 更新サマリー |
| 参考 | `.github/workflows/verify-indexes.yml` | CI gate 仕様 |
| 参考 | `scripts/d1/` 配下 | 逆引きリンク先（実体） |

---

## 実行手順

### ステップ 1: 環境前提確認

- `mise exec -- pnpm install --frozen-lockfile` exit 0
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` が存在
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` が存在
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` が存在
- `docs/30-workflows/unassigned-task/task-ut-07b-fu-03-production-migration-apply-runbook.md` が存在
- `scripts/d1/` 以下に `*.sh` が存在
- `.github/workflows/d1-migration-verify.yml` が存在
- `.github/workflows/verify-indexes.yml` が存在

### ステップ 2: resource-map.md 文言存在確認（grep）

```bash
# D1 migration runbook 逆引き行
rg -n "ut-07b-fu-03-production-migration-apply-runbook" \
  .claude/skills/aiworkflow-requirements/indexes/resource-map.md

# scripts/d1/*.sh 逆引き行
rg -n "scripts/d1/" \
  .claude/skills/aiworkflow-requirements/indexes/resource-map.md

# CI workflow 逆引き行
rg -n "d1-migration-verify\.yml" \
  .claude/skills/aiworkflow-requirements/indexes/resource-map.md
```

期待: 各 grep が 1 行以上ヒット。ヒット行を `test-report.md` に転記する。

### ステップ 3: quick-reference.md 1 行追記確認（grep）

```bash
rg -n "bash scripts/cf\.sh d1:apply-prod" \
  .claude/skills/aiworkflow-requirements/indexes/quick-reference.md
```

期待: 1 行ヒット。ヒット行を `test-report.md` に転記する。

### ステップ 4: `pnpm indexes:rebuild` 実行と topic-map 再生成

```bash
# 実行前 git diff snapshot
git diff --stat .claude/skills/aiworkflow-requirements/indexes/ > /tmp/indexes-before.txt

# 再生成
mise exec -- pnpm indexes:rebuild
echo "exit=$?"

# 実行後 git diff snapshot
git diff --stat .claude/skills/aiworkflow-requirements/indexes/ > /tmp/indexes-after.txt

# topic-map.md が新規再生成されているか
git diff .claude/skills/aiworkflow-requirements/indexes/topic-map.md | head -200
```

期待: exit code 0。`topic-map.md` に追記行を反映した新 keyword index が含まれる。所要時間 / exit code / 再生成バイト数を `test-report.md` に記録する。

### ステップ 5: CI gate `verify-indexes-up-to-date` 相当のローカル PASS 確認

```bash
# 再生成後に未コミット変更が「想定差分のみ」であることを確認
mise exec -- pnpm indexes:rebuild
git status --porcelain .claude/skills/aiworkflow-requirements/indexes/
```

期待:
- 1 回目 rebuild 後は resource-map / quick-reference / topic-map に意図した変更が出る
- 2 回目 rebuild は **冪等**（再実行dead path claim 補正以外 0 件）→ `manual-evidence.md` に「2 回目 rebuild diff 0 件」を転記
- これにより `verify-indexes-up-to-date` CI gate がローカル PASS する状態を再現

### ステップ 6: link-checklist 作成（任意補助）

```bash
# resource-map から D1 系参照先への到達可能性を逆走確認
rg -n "ut-07b-fu-03|scripts/d1/|d1-migration-verify" \
  .claude/skills/aiworkflow-requirements/

# 参照先実体存在確認
ls docs/30-workflows/unassigned-task/task-ut-07b-fu-03-production-migration-apply-runbook.md
ls scripts/d1/
ls .github/workflows/d1-migration-verify.yml
```

結果を `link-checklist.md` に「skill 起点 → 追記行 → 実体パス / 状態（OK / Broken）」テーブルで記録する。

### ステップ 7: main.md 集約

- visualEvidence=NON_VISUAL 宣言
- 必須 3 点へのリンク
- 代替 evidence 差分表（下記）
- 申し送り先: 次回 D1 migration 実走タスク（aiworkflow-requirements skill から runbook へ即逆引きできることを使用面から検証）

---

## 代替 evidence 差分表（必須）

| 元前提のシナリオ | 元前提 | 代替手段 | カバー範囲 | 申し送り先 |
| --- | --- | --- | --- | --- |
| S-1 skill 利用者が runbook へ辿れる | 実利用ユーザー操作 | `rg` による resource-map.md 内文言存在確認 | 逆引き行存在 | （L2 で吸収済） |
| S-2 quick-reference に apply コマンドが載る | 実コピペ動作 | `rg` で `bash scripts/cf.sh d1:apply-prod` 1 行存在確認 | quick-ref 1 行 | （L2 で吸収済） |
| S-3 topic-map keyword index が更新される | 手動目視 | `pnpm indexes:rebuild` exit 0 + git diff topic-map.md | topic-map 再生成 | （L3 で吸収済） |
| S-4 CI gate `verify-indexes-up-to-date` PASS | GitHub Actions 実走 | `pnpm indexes:rebuild` 2 回目で diff 0 件（冪等性） | CI gate 等価 | post-merge GitHub Actions 実 run |
| S-5 逆引きリンク先実体が存在する | 実 click 走査 | `ls` による実体存在確認 + `rg` 逆走 | 参照先存在 | （L2 で吸収済） |
| S-6 「赤がちゃんと赤になる」（L4 intentional violation） | — | resource-map から追記行を一時削除 → `verify-indexes` 相当チェックで diff が出ることを 1 回確認後に戻す | gate が機能 | （L4 で吸収済） |

---

## インタラクション状態テーブル（grep / rebuild 出力軸）

| 状態 | 入力 | 期待出力 | 確認 ID |
| --- | --- | --- | --- |
| resource-map に runbook 行 | `rg "ut-07b-fu-03-..." resource-map.md` | 1 行以上 | TC-01 |
| resource-map に scripts/d1 行 | `rg "scripts/d1/" resource-map.md` | 1 行以上 | TC-02 |
| resource-map に workflow 行 | `rg "d1-migration-verify.yml" resource-map.md` | 1 行以上 | TC-03 |
| quick-reference に apply 行 | `rg "scripts/cf.sh d1:apply-prod" quick-reference.md` | 1 行 | TC-04 |
| `pnpm indexes:rebuild` 1 回目 | exit code | 0 | TC-05 |
| `pnpm indexes:rebuild` 2 回目（冪等） | git diff bytes | 0 | TC-06 |
| L4: 追記行を一時削除 → rebuild | git diff 件数 | > 0（red 確認） | TC-07 |

---

## N/A 理由テーブル

| 検証種別 | 状態 | N/A 理由 |
| --- | --- | --- |
| Screenshot（VISUAL） | 撮影なし | skill index / docs / yml の文言更新のみ。UI 差分なし |
| Playwright UI E2E | 実行なし | renderer route 変更なし |
| アクセシビリティ（WCAG） | 検証なし | UI 差分なし |
| ダーク/ライトモード比較 | 撮影なし | UI 差分なし |
| ホバー / フォーカス | 撮影なし | UI 差分なし |
| Cloudflare Workers 実 deploy 検証 | 実走なし | apps/api / apps/web に touch しないため不要 |
| D1 migration 実走 | 実走なし | 本タスクは skill index 整備のみ。次回 D1 migration 実走タスクへ申し送り |

---

## 統合テスト連携

| 連携先 | 連携内容 |
| --- | --- |
| Phase 9 | typecheck / lint / `pnpm indexes:rebuild` green を本 Phase の前提として再利用 |
| Phase 12 | `manual-evidence.md` の grep 結果と再生成 evidence を `implementation-guide.md` Part 2 に転記 |
| 上流 UT-07B-FU-03 | `skill-feedback-report.md` の改善要求を本タスクで消化したことを記録 |
| 後続 D1 migration 実走 | aiworkflow-requirements skill 経由で runbook / scripts / yml に到達可能であることを使用面で検証 |

---

## 多角的チェック観点

- 不変条件 #5（apps/web → D1 直接禁止）: 本タスクは apps/web に一切 touch しないことを `git diff --name-only` で確認
- 不変条件 #6（GAS prototype を本番仕様に昇格させない）: 追記対象の参照先に GAS prototype が含まれていないこと
- L4（意図的 violation → red 確認）: resource-map から追記行を一時削除して `pnpm indexes:rebuild` 相当チェックで diff が出ることを 1 回確認
- 機密情報 grep: evidence ファイルに API token / OAuth token / 1Password 参照値の平文を転記しない
- DRY: D1 runbook の本文を resource-map にコピペせず、リンクと 1〜2 行の要約のみに留めること

---

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | resource-map 文言存在確認（3 種 grep） | completed | TC-01〜TC-03 |
| 2 | quick-reference 1 行追記確認 | completed | TC-04 |
| 3 | `pnpm indexes:rebuild` 1 回目実行 | completed | TC-05 |
| 4 | `pnpm indexes:rebuild` 2 回目（冪等）確認 | completed | TC-06 |
| 5 | L4 intentional violation 確認 | completed | TC-07 |
| 6 | link-checklist 作成 | completed | 任意補助 |
| 7 | 代替 evidence 差分表 | completed | 申し送り先記載 |
| 8 | main.md 集約 | completed | NON_VISUAL 宣言含む |

---

## 成果物

| 種別 | パス | 必須 | 説明 |
| --- | --- | --- | --- |
| ドキュメント | `outputs/phase-11/main.md` | ✅ | NON_VISUAL 宣言 / 必須 3 点リンク / 代替 evidence 差分表 |
| ドキュメント | `outputs/phase-11/test-report.md` | ✅ | grep / rebuild exit code / topic-map 差分 |
| ドキュメント | `outputs/phase-11/manual-evidence.md` | ✅ | 再生成冪等性 + L4 violation 結果転記 |
| ドキュメント | `outputs/phase-11/link-checklist.md` | 任意 | skill 起点 → 実体パス到達確認 |

---

## 完了条件

- [ ] `outputs/phase-11/main.md` に visualEvidence=NON_VISUAL を明記
- [ ] `outputs/phase-11/test-report.md` に TC-01〜TC-06 の grep / rebuild exit code を記録
- [ ] `outputs/phase-11/manual-evidence.md` に再生成冪等性（2 回目 diff 0）と L4 violation の red 確認を転記
- [ ] 代替 evidence 差分表が S-1〜S-6 を網羅
- [ ] L4 intentional violation を 1 件以上実施し violation 戻しまで完了
- [ ] N/A 理由テーブルが 7 行以上（screenshot / Playwright / a11y / theme / hover / 実 deploy / D1 実走）
- [ ] CI gate `verify-indexes-up-to-date` 相当のローカル PASS（2 回目 rebuild diff 0 件）を確認
- [ ] artifacts.json の phase 11 を completed に更新

---

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 必須 3 点（main / test-report / manual-evidence）が `outputs/phase-11/` 直下に配置済み
- screenshot 系ファイルが 0 件（生成禁止の遵守確認）
- 完了条件 8 件すべてにチェック
- artifacts.json の phase 11 を completed に更新

---

## 次 Phase

- 次: 12 (ドキュメント更新)
- 引き継ぎ事項: TC-01〜TC-07 の grep / rebuild evidence、再生成冪等性確認、L4 violation 結果、link-checklist
- ブロック条件: TC-01〜TC-06 のいずれかに FAIL がある場合は Phase 12 に進まず Phase 5/6 へ戻る
