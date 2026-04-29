# Phase 8 成果物 — リファクタリング (DRY 化)

> 状態: **NOT EXECUTED — spec_created**
> 本ワークフローは Phase 1〜13 のタスク仕様書整備に閉じる。実 adapter 実装 / 実 PUT は Phase 13 ユーザー承認後の別オペレーションで実施されるため、ここには「リファクタ後に到達すべき SSOT 構造」を仕様レベルで固定する。

## 1. SSOT 一覧

| # | SSOT 対象 | 物理位置 | 参照する Phase | 役割 |
| --- | --- | --- | --- | --- |
| 1 | `{branch}` サフィックス命名規則 | 本 main.md §2 | Phase 5 / 11 / 13 | 8 ファイル命名の単一情報源 |
| 2 | adapter 関数分解図 | 本 main.md §3 | Phase 5 / 6 | GET → PUT 変換ロジックの単一情報源 |
| 3 | `apply-runbook.template.md`（仕様レベル） | 本 main.md §4 | Phase 11 / 13 | 4 ステップ手順の単一情報源 |
| 4 | rollback 3 経路 | 本 main.md §5 | Phase 11 / 13 | 通常 / 緊急 / 再適用 の単一情報源 |
| 5 | 二重正本 grep 検証 `verify_no_drift()` | 本 main.md §6 | Phase 11 / 13 | CLAUDE.md ↔ applied 突合の単一情報源 |

## 2. `{branch}` サフィックス命名 SSOT

### 2.1 命名テンプレ

```
branch-protection-{kind}-{branch}.json
  kind   ∈ {payload, snapshot, rollback, applied}
  branch ∈ {dev, main}
```

### 2.2 8 ファイル展開表

| kind | dev | main |
| --- | --- | --- |
| payload | `branch-protection-payload-dev.json` | `branch-protection-payload-main.json` |
| snapshot | `branch-protection-snapshot-dev.json` | `branch-protection-snapshot-main.json` |
| rollback | `branch-protection-rollback-dev.json` | `branch-protection-rollback-main.json` |
| applied | `branch-protection-applied-dev.json` | `branch-protection-applied-main.json` |

### 2.3 用途分離（再掲・Phase 2 §5 と整合）

| kind | 形式 | PUT 可？ | 用途 |
| --- | --- | --- | --- |
| payload | adapter 正規化済み（PUT schema） | ✅ | 本適用 / 再適用 |
| snapshot | GET 応答そのまま | ❌（422） | 監査・差分計算 |
| rollback | adapter 正規化済み（snapshot を adapter 通過） | ✅ | 緊急時 rollback |
| applied | PUT 応答そのまま | ❌（保存のみ） | 適用結果の証跡 |

### 2.4 ループパターン（bulk 化禁止を維持）

```bash
# ループ化はしてよい。ただし 1 回のループ内で 1 PUT を per-branch 独立に発行する。
for branch in dev main; do
  gh api "repos/{owner}/{repo}/branches/${branch}/protection" \
    -X PUT --input "branch-protection-payload-${branch}.json" \
    > "branch-protection-applied-${branch}.json"
done
```

> bulk 化禁止 = 「dev / main を 1 回の PUT に丸める」ことを禁ずる、という意味。ループによる per-branch PUT は許容（§8.5 と整合）。

## 3. adapter 関数分解図

### 3.1 構造

```
map_get_to_put(snapshot)
  ├── flatten_restrictions(restrictions)
  ├── extract_enabled_bool(field; default)
  ├── force_lock_branch_false()
  └── normalize_required_pr_reviews_null()
```

### 3.2 各 sub-function の責務

| 関数 | 入力 | 出力 | 単一責務 |
| --- | --- | --- | --- |
| `flatten_restrictions(r)` | `{users:[{login}], teams:[{slug}], apps:[{slug}]} or null` | `{users:[login...], teams:[slug...], apps:[slug...]} or null` | GET の object 配列を PUT の文字列配列に flatten |
| `extract_enabled_bool(field; default)` | `{enabled, ...}` または `null` | `bool` | `.enabled` を bool に抽出、欠損時は default |
| `force_lock_branch_false()` | -（固定値関数） | `false` | §8.3 違反防止のための固定値注入 |
| `normalize_required_pr_reviews_null()` | -（固定値関数） | `null` | solo 運用ポリシー（CLAUDE.md）注入 |
| `map_get_to_put(snapshot)` | snapshot JSON | PUT payload JSON | 上記 4 関数を合成して 1 つの payload を生成 |

### 3.3 Before / After 擬似コード

#### Before（Phase 2 §4.2 jq 直書き、各 field 個別記述）

```bash
jq '{
  required_status_checks: (.required_status_checks // null),
  enforce_admins: (.enforce_admins.enabled // false),
  required_pull_request_reviews: null,
  restrictions: (
    if .restrictions == null then null
    else { users: [.restrictions.users[].login], teams: [.restrictions.teams[].slug], apps: [.restrictions.apps[].slug] } end),
  required_linear_history: (.required_linear_history.enabled // true),
  allow_force_pushes: (.allow_force_pushes.enabled // false),
  allow_deletions: (.allow_deletions.enabled // false),
  required_conversation_resolution: (.required_conversation_resolution.enabled // true),
  lock_branch: false,
  allow_fork_syncing: (.allow_fork_syncing.enabled // false)
}' snapshot-{branch}.json > rollback-{branch}.json
```

#### After（sub-function 分解 / shell wrapper を許容）

```bash
# adapter.sh — sub-function 集
flatten_restrictions() { jq 'if . == null then null else { users: [.users[].login], teams: [.teams[].slug], apps: [.apps[].slug] } end'; }
extract_enabled_bool() { local default="$1"; jq --argjson d "$default" '(.enabled // $d)'; }
force_lock_branch_false() { echo 'false'; }
normalize_required_pr_reviews_null() { echo 'null'; }

map_get_to_put() {
  local snap="$1"
  jq \
    --argjson reviews "$(normalize_required_pr_reviews_null)" \
    --argjson lock    "$(force_lock_branch_false)" \
    '{
       required_status_checks: (.required_status_checks // null),
       enforce_admins: (.enforce_admins.enabled // false),
       required_pull_request_reviews: $reviews,
       restrictions: (
         if .restrictions == null then null
         else { users: [.restrictions.users[].login], teams: [.restrictions.teams[].slug], apps: [.restrictions.apps[].slug] } end),
       required_linear_history: (.required_linear_history.enabled // true),
       allow_force_pushes: (.allow_force_pushes.enabled // false),
       allow_deletions: (.allow_deletions.enabled // false),
       required_conversation_resolution: (.required_conversation_resolution.enabled // true),
       lock_branch: $lock,
       allow_fork_syncing: (.allow_fork_syncing.enabled // false)
     }' "$snap"
}
```

> 上記は仕様レベル擬似コード。実装は Phase 5（実装ランブック）で確定。jq モジュール化 vs shell wrapper の選択は open question #1。

## 4. apply-runbook テンプレ統合

### 4.1 テンプレ章立て（Phase 11 / 13 共通参照）

```
apply-runbook.template.md
├─ 0. 担当者・連絡経路（冒頭表 1 箇所に集約）
├─ 1. 前提チェック（UT-GOV-004 completed？）
├─ 2. snapshot 取得（per-branch ループ）
├─ 3. adapter 正規化（map_get_to_put）
├─ 4. dry-run / 差分プレビュー（diff_payload(branch)）
├─ 5. apply（per-branch 独立 PUT × 2）
├─ 6. rollback リハーサル（通常経路）
├─ 7. 再適用
├─ 8. 二重正本 verify_no_drift()
└─ 9. 緊急 rollback 経路（別 anchor / 警告ボックス）
```

### 4.2 担当者・連絡経路表（冒頭固定）

| 役割 | 担当 | 連絡経路 |
| --- | --- | --- |
| 実行者 | 本人（solo 運用） | 手元 ssh / GitHub UI |
| 緊急 rollback 担当 | 本人（同一） | 手元 ssh / GitHub UI |
| 承認者 | 本人（user_approval_required: true） | Phase 13 ゲート |

### 4.3 Phase 11 / 13 からの参照方法

- Phase 11: リハーサル用に template の §1〜§7 を実走、§8 は記録のみ、§9 は手順読み合わせのみ。
- Phase 13: 本番用に template 全章を実走（§9 は緊急時のみ）、user_approval_required: true ゲートを §5 着手前に通過。

## 5. rollback 3 経路 SSOT

### 5.1 通常 rollback

```bash
for branch in dev main; do
  gh api "repos/{owner}/{repo}/branches/${branch}/protection" \
    -X PUT --input "branch-protection-rollback-${branch}.json"
done
```

### 5.2 緊急 rollback（enforce_admins=true で admin 自身 block、§8.4）

```bash
# 経路 A: enforce_admins サブリソースのみ DELETE（最小 patch）
gh api repos/{owner}/{repo}/branches/main/protection/enforce_admins -X DELETE

# 経路 B: rollback payload 全体を PUT（enforce_admins=false 含む）
gh api repos/{owner}/{repo}/branches/main/protection \
  -X PUT --input branch-protection-rollback-main.json
```

> ⚠️ 警告: 緊急経路は通常 rollback より影響範囲が大きいか、または小さい（enforce_admins のみ）。**経路 A を優先**し、経路 A で復旧不能な場合のみ経路 B に切り替える。

### 5.3 再適用（rollback リハーサル後）

```bash
for branch in dev main; do
  gh api "repos/{owner}/{repo}/branches/${branch}/protection" \
    -X PUT --input "branch-protection-payload-${branch}.json"
done
```

### 5.4 経路選択フロー

```
incident 発生
  ├─ admin 自身 block？ → §5.2 緊急（経路 A → 経路 B）
  ├─ 設定値が誤っただけ？ → §5.1 通常 rollback
  └─ rollback リハーサル直後 → §5.3 再適用
```

## 6. 二重正本 verify_no_drift() SSOT

### 6.1 関数仕様

```bash
verify_no_drift() {
  # GitHub 実値（正本）と CLAUDE.md ブランチ戦略の grep 整合
  local actual_main_reviews
  actual_main_reviews=$(gh api repos/{owner}/{repo}/branches/main/protection \
    | jq -r '.required_pull_request_reviews // "null"')
  if [ "$actual_main_reviews" != "null" ]; then
    echo "DRIFT: main の required_pull_request_reviews が null でない (実値=${actual_main_reviews})"
    return 1
  fi
  if ! grep -qE 'required_pull_request_reviews\s*[:=]?\s*null' CLAUDE.md; then
    echo "DRIFT: CLAUDE.md に required_pull_request_reviews=null の記述がない"
    return 1
  fi
  return 0
}
```

### 6.2 呼び出し箇所

- Phase 11: リハーサル後に 1 回（記録のみ）
- Phase 13: 本適用後に 1 回（drift があれば即時通知 → 緊急 rollback 検討）

## 7. navigation drift チェック結果（spec_created プレースホルダ）

| 項目 | 期待 | 結果 |
| --- | --- | --- |
| artifacts.json `phases[*].outputs` × 実 path | 完全一致 | NOT EXECUTED |
| Phase 13 outputs 8 ファイル + runbook 1 通 | 9 ファイル一致 | NOT EXECUTED |
| `{branch}` サフィックス（dev / main 以外混入なし） | 0 件混入 | NOT EXECUTED |
| Phase 11 / 13 runbook の template 参照 | リンク切れ 0 | NOT EXECUTED |

## 8. 用語統一サマリ

| 用語 | 採用表記 | 不採用表記 |
| --- | --- | --- |
| 正本 | 「正本 (canonical)」 | 「canonical」「正規」 |
| PUT 用 payload | 「PUT payload (adapter 正規化済み)」 | 「正規化 payload」「adapter 出力」 |
| rollback 種別 | 「通常 / 緊急 enforce_admins / 再適用」3 経路 | 「rollback」単独 |
| ファイル名 | `branch-protection-{kind}-{branch}.json` | dev/main 個別ハードコード |

## 9. 削除対象（最終確認）

- snapshot をそのまま PUT に流す擬似コードの混入: 検出時即除去
- `lock_branch=true` を許容する分岐: 固定値 false 化済み
- `required_pull_request_reviews={}`（空 object）の混入: `null` に統一
- dev / main の二重コピペ: per-branch ループに統合

## 10. 引き渡し（Phase 9 へ）

- SSOT 5 件確定（命名 / adapter / runbook テンプレ / rollback 3 経路 / verify_no_drift）
- adapter sub-function 4 件 + 合成 main 関数の分解図
- `apply-runbook.template.md` の章立て（Phase 11 / 13 共通）
- 用語統一表（正本 / PUT payload / rollback 種別）

## 11. NOT EXECUTED 注記

本仕様書は spec_created 段階。実 adapter 実装 / 実 runbook 実走 / 実 PUT は Phase 5 / 11 / 13 ユーザー承認後の別オペレーションで実施する。本 main.md には到達すべき SSOT 構造のみを固定し、実コード成果物は Phase 5 で生成、実走ログは Phase 11 / 13 で生成する。
