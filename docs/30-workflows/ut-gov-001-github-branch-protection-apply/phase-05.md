# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub branch protection apply / rollback payload 正規化 (ut-gov-001-github-branch-protection-apply) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック（snapshot → adapter → dry-run → apply → rollback リハーサル → 再適用） |
| 作成日 | 2026-04-28 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | pending（仕様化のみ完了 / 実 PUT は Phase 13 ユーザー承認後の別オペレーション） |
| タスク種別 | implementation / NON_VISUAL / github_governance |

## 目的

Phase 4 で固定した T1〜T5 を Green にするための **6 ステップ実装ランブック** を仕様化する。コマンド系列（`gh api` GET / jq adapter / dry-run diff / `gh api` PUT / rollback リハーサル / 再適用）は本 Phase で**仕様レベルで定義**するが、**実行は禁止**。実 PUT は Phase 13 ユーザー承認後の別オペレーションでのみ走る（user_approval_required: true）。

> **重要**: 本 Phase 冒頭で **UT-GOV-004 完了の前提確認** を必須化する。未完了の場合は実装着手不可（Phase 3 NO-GO 条件）。同時完了の場合は案 D（2 段階適用）に切替。

## UT-GOV-004 完了の前提確認【実装着手前の必須ゲート】

実装担当者は **Step 1 に入る前に** 以下を確認する。1 件でも該当した場合は実装着手禁止 → Phase 3 NO-GO へ差し戻す（または案 D 2 段階適用へ切替）。

```bash
# UT-GOV-004 完了確認（必須・GET のみ / 副作用なし）
ls docs/30-workflows/completed-tasks/ | rg "ut-gov-004"            # 完了タスクとして配置されているか
gh issue view <UT-GOV-004 issue> --json state                      # state: CLOSED
gh run list --workflow ci --limit 20 --json name | jq -r '.[].name' | sort -u  # 実在 job 名一覧
```

| 確認項目 | 期待値 | NO-GO 条件 |
| --- | --- | --- |
| UT-GOV-004 task `status` | `completed` | `pending` / `in_progress`（同時完了で案 D 採用合意あり時のみ GO） |
| GitHub Issue 状態 | `CLOSED` | `OPEN` |
| `required_status_checks.contexts` 候補 | UT-GOV-004 結果と積集合済み | 未同期 / typo / 将来予定 job 含む |
| Phase 13 ユーザー承認 | 取得済み | 未取得（PUT は実行しない） |

**1 つでも NO-GO 条件に該当 → 実装着手禁止 → 本 Phase を pending に戻し UT-GOV-004 着手 or 案 D 切替へ。**

## 実行タスク

- タスク1: UT-GOV-004 完了ゲートを Step 0 として固定する。
- タスク2: snapshot / adapter / dry-run / apply / rollback リハーサル / 再適用を 6 ステップに分離する。
- タスク3: dev / main 独立 PUT（bulk 化禁止）と `{branch}` サフィックス物理分離を全 Step で徹底する。
- タスク4: 緊急 rollback 3 経路（通常 PUT / DELETE / 再適用）を Step 5 に組み込む。
- タスク5: 本 Phase で実 PUT を実行しない境界を明記する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-04.md | T1〜T5（Green 条件） |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-02/main.md | adapter field マッピング 11 field / 4 ステップ手順 |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md §8 | 苦戦箇所 |
| 必須 | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-2/design.md §2 | 草案 JSON 正本 |
| 参考 | https://docs.github.com/en/rest/branches/branch-protection | PUT schema |

## 実行手順

1. Step 0 で UT-GOV-004 完了 / Phase 13 承認状態を確認し、NO-GO 条件を判定する。
2. Step 1〜6 を lane 1〜5 順に実行する（**ただし Step 4 / 5 / 6 の `gh api PUT` / DELETE は Phase 13 ユーザー承認後のみ**）。
3. Step 5 / 6 のリハーサル結果は `outputs/phase-13/applied-{branch}.json` / `outputs/phase-11/rollback-rehearsal-log.md` に保全する。

## 統合テスト連携

T1〜T5（Phase 4）を各 Step の Green 条件として参照し、Phase 6 の異常系（T6〜T10）で fail path を追加検証する。Phase 11 smoke は Step 4〜6 を実走、Phase 13 で applied JSON を最終証跡化する。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-05/main.md | 実装ランブック（NOT EXECUTED テンプレ） |
| 別オペ成果（参考） | outputs/phase-13/branch-protection-{snapshot,payload,rollback,applied}-{dev,main}.json / outputs/phase-13/apply-runbook.md / outputs/phase-11/rollback-rehearsal-log.md | 本ワークフローでは生成しない（Phase 13 ユーザー承認後に実走者が生成） |

## 実装手順（6 ステップ / 仕様レベル）

### Step 0: 前提確認（必須・実 PUT 禁止）

- 上記「UT-GOV-004 完了の前提確認」を全項目クリア。
- Phase 13 ユーザー承認の取得状況を確認（未取得時は Step 4 以降の `gh api PUT` 禁止）。
- T1〜T5 が現在 Red であることを確認（payload / rollback / applied JSON が未生成 / GitHub 実値が草案未強制）。

### Step 1: snapshot 取得（lane 1 / 副作用なし GET）

```bash
# dev / main 独立に GET（PUT ではないので Phase 13 承認前でも可）
gh api repos/{owner}/{repo}/branches/dev/protection  > outputs/phase-13/branch-protection-snapshot-dev.json
gh api repos/{owner}/{repo}/branches/main/protection > outputs/phase-13/branch-protection-snapshot-main.json
```

- 確認: `jq -e '.required_status_checks' outputs/phase-13/branch-protection-snapshot-{dev,main}.json` が exit 0。
- snapshot は **PUT 不可形式**（GET ネスト構造のまま）。監査用として永続保存（Phase 2 §5）。

### Step 2: adapter 正規化（lane 2 / 副作用なし jq）

- 草案 → payload 生成（design.md §2 の正本を写経し、UT-GOV-004 contexts を埋め込む）:

  ```bash
  # 草案 JSON を写経した payload 雛形に UT-GOV-004 contexts を反映
  # （contexts 配列は UT-GOV-004 完了時の実在 job 名のみ。typo / 将来予定 job 名を入れない）
  # 結果を outputs/phase-13/branch-protection-payload-{dev,main}.json に保存
  ```

- snapshot → rollback payload 変換（Phase 2 §4.2 jq 擬似コード）:

  ```bash
  for branch in dev main; do
    jq '{
      required_status_checks: (.required_status_checks // null),
      enforce_admins: (.enforce_admins.enabled // false),
      required_pull_request_reviews: null,
      restrictions: (
        if .restrictions == null then null
        else {
          users: [.restrictions.users[].login],
          teams: [.restrictions.teams[].slug],
          apps:  [.restrictions.apps[].slug]
        } end),
      required_linear_history: (.required_linear_history.enabled // true),
      allow_force_pushes: (.allow_force_pushes.enabled // false),
      allow_deletions: (.allow_deletions.enabled // false),
      required_conversation_resolution: (.required_conversation_resolution.enabled // true),
      lock_branch: false,
      allow_fork_syncing: (.allow_fork_syncing.enabled // false)
    }' outputs/phase-13/branch-protection-snapshot-${branch}.json \
      > outputs/phase-13/branch-protection-rollback-${branch}.json
  done
  ```

- 確認: T2（11 field チェックリスト）を `jq` で全件突合。
- コミット粒度: `chore(governance): generate UT-GOV-001 payload / rollback adapter outputs`（**コミット 1**）。

### Step 3: dry-run 差分プレビュー（lane 3 / 副作用なし diff）

```bash
diff <(jq -S . outputs/phase-13/branch-protection-snapshot-dev.json) \
     <(jq -S . outputs/phase-13/branch-protection-payload-dev.json)
diff <(jq -S . outputs/phase-13/branch-protection-snapshot-main.json) \
     <(jq -S . outputs/phase-13/branch-protection-payload-main.json)
```

- 出力を `outputs/phase-13/apply-runbook.md §dry-run-diff` に転記し、ユーザーレビュー承認を得る（Phase 13 user_approval ゲートの入力）。
- 確認: T1 が Green。
- コミット粒度: `docs(governance): record UT-GOV-001 dry-run diff for dev / main`（**コミット 2**）。

### Step 4: apply（lane 4 / **Phase 13 ユーザー承認後のみ実行**）

> ⚠️ **本 Phase ではコマンドを記述するが実行は禁止**。実 PUT は Phase 13 ユーザー承認後の別オペレーションで実走。

```bash
# dev / main を **別コマンドで** 独立 PUT（bulk 化禁止 / §8.5）
gh api repos/{owner}/{repo}/branches/dev/protection \
  -X PUT --input outputs/phase-13/branch-protection-payload-dev.json \
  > outputs/phase-13/branch-protection-applied-dev.json

gh api repos/{owner}/{repo}/branches/main/protection \
  -X PUT --input outputs/phase-13/branch-protection-payload-main.json \
  > outputs/phase-13/branch-protection-applied-main.json
```

- 確認: T3（独立 PUT × 2 が exit 0）が Green。`applied-{dev,main}.json` が `{branch}` サフィックス分離。
- 失敗時: 422 → Step 2 へ戻し adapter field 漏れを再確認（Phase 6 T6 / T11 系の異常系参照）。
- コミット粒度: `chore(governance): record UT-GOV-001 apply result for dev / main`（**コミット 3**、applied JSON のみ）。

### Step 5: rollback リハーサル（lane 5 / **Phase 13 ユーザー承認後のみ実行**）

> ⚠️ 実 PUT / DELETE は Phase 13 ユーザー承認後のみ。

#### 5.1 通常 rollback（snapshot 相当へ戻す）

```bash
gh api repos/{owner}/{repo}/branches/dev/protection \
  -X PUT --input outputs/phase-13/branch-protection-rollback-dev.json
gh api repos/{owner}/{repo}/branches/main/protection \
  -X PUT --input outputs/phase-13/branch-protection-rollback-main.json
```

#### 5.2 緊急 rollback（`enforce_admins=true` 詰み時 / §8.4）

```bash
# 経路 A: enforce_admins サブリソース DELETE（最小破壊）
gh api repos/{owner}/{repo}/branches/main/protection/enforce_admins -X DELETE
# 経路 B: rollback payload の enforce_admins=false 版を PUT
gh api repos/{owner}/{repo}/branches/main/protection -X PUT --input outputs/phase-13/branch-protection-rollback-main.json
```

- 担当者: solo 運用のため**実行者本人**。連絡経路（手元 ssh / GitHub UI）を `apply-runbook.md` に必須明記（§8.4）。
- 確認: T4（rollback 3 経路すべて exit 0）が Green。

### Step 6: 再適用（lane 5 / **Phase 13 ユーザー承認後のみ実行**）

```bash
gh api repos/{owner}/{repo}/branches/dev/protection \
  -X PUT --input outputs/phase-13/branch-protection-payload-dev.json
gh api repos/{owner}/{repo}/branches/main/protection \
  -X PUT --input outputs/phase-13/branch-protection-payload-main.json

# 二重正本 drift 検証
gh api repos/{owner}/{repo}/branches/main/protection | jq '.required_pull_request_reviews'  # => null 期待
grep -E "required_pull_request_reviews\s*[:=]?\s*null" CLAUDE.md
```

- 確認: T4 末尾 / T5（2 段階適用採用時は第 2 段階再 PUT）が Green。
- リハーサル結果を `outputs/phase-11/rollback-rehearsal-log.md` に記録。
- コミット粒度: `docs(governance): record UT-GOV-001 rollback rehearsal log`（**コミット 4**）。

## コミット粒度

| # | メッセージ | スコープ | レビュー観点 |
| --- | --- | --- | --- |
| 1 | `chore(governance): generate UT-GOV-001 payload / rollback adapter outputs` | payload-{dev,main}.json + rollback-{dev,main}.json | adapter 11 field 突合 / contexts UT-GOV-004 反映 / `lock_branch=false` |
| 2 | `docs(governance): record UT-GOV-001 dry-run diff for dev / main` | apply-runbook.md §dry-run-diff | unintended diff 不在 / dev・main 独立記述 |
| 3 | `chore(governance): record UT-GOV-001 apply result for dev / main` | applied-{dev,main}.json | 独立 PUT × 2 / `{branch}` サフィックス / Phase 13 承認後のみ |
| 4 | `docs(governance): record UT-GOV-001 rollback rehearsal log` | rollback-rehearsal-log.md | 3 経路（通常 / 緊急 DELETE / 再適用）/ 担当者明記 |

> **4 コミット粒度を分離する理由**: rollback を adapter / dry-run / apply / 再適用 の各レイヤ単位で 1 コミットに保ち、片方向の revert で復元可能にするため（Phase 2 §9）。

## 検証コマンド（実装担当者向け / NOT EXECUTED）

```bash
# Step 1 完了後
test -f outputs/phase-13/branch-protection-snapshot-dev.json && \
test -f outputs/phase-13/branch-protection-snapshot-main.json

# Step 2 完了後（T2 の 11 field 全件突合）
jq -e '.lock_branch == false' outputs/phase-13/branch-protection-payload-dev.json
jq -e '.required_pull_request_reviews == null' outputs/phase-13/branch-protection-payload-main.json

# Step 3 完了後（T1）
diff <(jq -S . outputs/phase-13/branch-protection-snapshot-dev.json) \
     <(jq -S . outputs/phase-13/branch-protection-payload-dev.json) || echo "intended diff present"

# Step 4 完了後（T3 / Phase 13 承認後）
jq -e '.url' outputs/phase-13/branch-protection-applied-dev.json
jq -e '.url' outputs/phase-13/branch-protection-applied-main.json

# Step 5〜6 完了後（T4 / T5 / Phase 13 承認後）
grep -E "required_pull_request_reviews\s*[:=]?\s*null" CLAUDE.md
```

## 完了条件

- [ ] Step 0〜6 が `outputs/phase-05/main.md` に NOT EXECUTED テンプレで列挙されている
- [ ] UT-GOV-004 完了確認が Step 0 ゲートとして明記されている
- [ ] 4 コミット粒度（adapter outputs / dry-run diff / apply result / rollback log）が分離設計されている
- [ ] dev / main bulk 化禁止が Step 4 / Step 5 / Step 6 で再掲されている
- [ ] 緊急 rollback DELETE 経路と担当者明記が Step 5.2 にある
- [ ] 本ワークフローで実 `gh api PUT` / DELETE を実行しない旨が明示されている
- [ ] T5（2 段階適用フォールバック）採用時の第 2 段階再 PUT が Phase 13 完了条件に組み込まれる引き渡し記述がある

## 苦戦防止メモ

1. **UT-GOV-004 未完了で着手しない**: contexts 未出現値投入 → PR 全 block 事故（§8.2）。Step 0 ゲートで block。同時完了は案 D 2 段階適用へ。
2. **adapter 11 field を全件突合**: 1 field 漏れで 422（§8.1）。T2 チェックリストを Step 2 に転記。
3. **dev / main を bulk 化しない**: Step 4 / 5 / 6 で必ず別コマンド × 2。`{branch}` サフィックスを payload / snapshot / rollback / applied 全件で物理分離（§8.5）。
4. **`lock_branch=true` を payload に含めない**: 全 push 停止で incident 時詰む（§8.3）。Step 2 adapter で `lock_branch: false` 固定。
5. **`enforce_admins=true` 詰み時の DELETE 経路を runbook 必須**: solo 運用では実行者本人が即時 rollback 可能でないと governance 強制で詰む（§8.4）。
6. **本 Phase 自身は実 PUT しない**: 仕様化のみ。Step 4〜6 の実走は Phase 13 ユーザー承認後の別オペレーション。
7. **CLAUDE.md ↔ GitHub 実値の二重正本 drift 検証**: Step 6 末尾の grep を必ず実行（§8.6）。

## 次 Phase への引き渡し

- 次 Phase: 6 (異常系検証)
- 引き継ぎ事項:
  - 4 コミット粒度の分離が異常系（422 / contexts 不在 / lock_branch 誤投入 / 片側適用ミス / GET→PUT field drift）の前提
  - Step 2 の adapter 11 field チェックリストが Phase 6 異常系の入力
  - Step 4〜6 の実 PUT は Phase 13 ユーザー承認後（user_approval_required: true）
- ブロック条件:
  - UT-GOV-004 完了確認ゲートが欠落
  - dev / main bulk PUT 設計が残存
  - `lock_branch=true` が payload に混入
  - 緊急 rollback DELETE 経路が Step 5 から欠落
  - 担当者明記が apply-runbook.md に無い
