[実装区分: 実装仕様書]

# Phase 12 — implementation guide

| 項目 | 値 |
|------|------|
| phase | 12 |
| 名称 | ドキュメント整理 |
| status | completed |
| 完了条件 | Part 1 中学生レベル説明 + Part 2 技術詳細 + 視覚証跡セクション完成 |

---

## Part 1 — 中学生レベル概念説明

### branch protection とは

GitHub の「校則」のようなもの。`dev` と `main` という大事なブランチに対し「ここに merge する前に必ず通らないといけないチェック」を決めておく仕組み。
今回はその校則に **「UI が壊れていないことを画像比較で確認するテスト (3 種類)」** を追加する。

### required status check とは

校則の中の「絶対に合格しないと merge できないテスト一覧」のこと。
現在 5 種類（`ci`, `Validate Build`, `coverage-gate`, `lighthouse-ci`, `e2e-tests-coverage-gate`）が登録されており、ここに 3 種類追加して合計 8 種類にする。

### 「全置換」の罠

GitHub の校則更新 API（`PUT /branches/{branch}/protection`）は「校則を 1 行だけ追加」する API ではなく、**「校則集を丸ごと差し替える」** API。
つまり「新しい校則 1 行だけ送る」と、それ以外の校則（force-push 禁止、レビュー必須など）が全部消えてしまう。
正しい使い方は「今の校則集を全部取得 → 1 行追加した校則集を作成 → 丸ごと送信」の 3 ステップ。

### viewport とは

スマホ / タブレット / PC で同じサイトを開くと見え方が変わる。それぞれを `mobile` / `tablet` / `desktop` と呼び、3 サイズ全てで UI が壊れていないかを別々のテストで確認する。

### check run の名前

GitHub Actions で動いたテスト 1 個 1 個に名前がついていて、その名前を「校則」に登録する。名前が 1 文字でも違うと「永遠に合格しないテスト」になり、PR が永遠に merge できなくなる。
だから **必ず実物の名前を `gh api` で取得してから登録** する。

### rollback とは

校則を間違えて入れた場合に「元に戻す」操作。事前に「元に戻す用の校則集」を作っておけば、何かあっても 1 コマンドで戻せる。

---

## Part 2 — 技術詳細

### 2.1 PUT body 型定義（TypeScript-like）

```typescript
type BranchProtectionPut = {
  required_status_checks: {
    strict: boolean;
    contexts: string[]; // check run name の配列
  } | null;
  enforce_admins: boolean;
  required_pull_request_reviews: null | {
    dismiss_stale_reviews: boolean;
    require_code_owner_reviews: boolean;
    required_approving_review_count: number;
  };
  restrictions: null | { users: string[]; teams: string[]; apps: string[] };
  required_linear_history?: boolean;
  allow_force_pushes?: boolean;
  allow_deletions?: boolean;
  block_creations?: boolean;
  required_conversation_resolution?: boolean;
  lock_branch?: boolean;
  allow_fork_syncing?: boolean;
};
```

### 2.2 実行コマンド (Phase 5 step 5, 9 抜粋)

```bash
gh api -X POST repos/daishiman/UBM-Hyogo/branches/dev/protection/required_status_checks/contexts --input /tmp/visual-full-contexts.json
gh api -X POST repos/daishiman/UBM-Hyogo/branches/main/protection/required_status_checks/contexts --input /tmp/visual-full-contexts.json
```

### 2.3 実測 after contexts

```json
[
  "Validate Build",
  "ci",
  "coverage-gate",
  "e2e-tests-coverage-gate",
  "lighthouse-ci",
  "visual-full (desktop)",
  "visual-full (mobile)",
  "visual-full (tablet)"
]
```

当初の仕様例では workflow prefix 付きの `visual-full (...)` を想定していたが、Phase 11 の check-runs 実測では既存 contexts と同じ prefix なしの `visual-full (...)` が正だった。required status check には実測名を登録済み。

### 2.4 想定エラー

| code | 原因 | 対処 |
|------|------|------|
| 422 Validation Failed | required_pull_request_reviews 構造不正 | `null` で送る（solo dev policy） |
| 404 Not Found | branch 名 typo / token scope 不足 | scope `repo` 確認 / branch 存在確認 |
| 403 Forbidden | 認証エラー | `gh auth status` |
| context 残存 | jq テンプレが全フィールド継承していない | Phase 2 §4 テンプレを再使用 |

### 2.5 不変条件 (Phase 9 §3)

```bash
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection | jq -e '
  .required_pull_request_reviews == null
  and .enforce_admins.enabled == true
  and .lock_branch.enabled == false
  and .required_linear_history.enabled == true
  and .required_conversation_resolution.enabled == true
  and .allow_force_pushes.enabled == false
  and .allow_deletions.enabled == false
'
```

### 2.6 関連ドキュメント

- 親タスク evidence: `docs/30-workflows/task-709-visual-baseline-runtime-capture/outputs/phase-11/evidence/visual-full-stability.md`
- governance 先例: UT-GOV-001
- workflow: `.github/workflows/playwright-visual-full.yml`

---

## 視覚証跡

UI/UX変更なしのため Phase 11 スクリーンショット不要
