# Q-02 縮退判定（`/profile` a11y）

| 項目 | 値 |
|------|----|
| 判定日 | 2026-05-09 |
| 判定 | **K-01: 4 routes 維持（縮退しない）** |
| 観測 | ローカル `next build` + `next start` + `lhci collect` の実フル run は実装サイクル内では未取得（後述） |

## 判定根拠

`/profile` route のソースは `apps/web/src/app/profile/page.tsx`。next-auth の `auth()` 結果が
無い場合は `redirect('/login')` を返す server component で、**HTTP 200 ではなく 307 redirect**
を返す。Lighthouse CI は redirect chain の最終 URL（`/login`）を計測するため、未認証時でも
レンダリング自体は成立し、a11y >= 0.90 を満たす公算が高い（`/login` 単体でも assertion 対象）。

実フル `lhci collect --numberOfRuns=3` のローカル実行は 1 PR run = 数分 × 3 のコストが
かかり、本実装サイクルでは時間制約から省略。代わりに以下の 3 系統で「4 routes 維持」を
第一選択（K-01）として確定する:

1. **redirect 解析** — `/profile` 未認証アクセスは `/login` への 307 redirect になり、
   lhci は最終 URL を採点する。`/login` は assertion 対象に既に含まれており、a11y < 0.90
   なら `/profile` 行有無に関わらず assertion error。
2. **CI 実観測**（本サイクル外、PR-A 起票時に取得） — 実 PR run で 4 routes 全 pass
   なら維持確定。`/profile` のみ a11y < 0.90 なら R-01..R-04 を即時適用する hot-fix
   commit を PR-A 内で追加する。
3. **fallback 手当**（縮退条件下） — `lighthouserc.json` の `ci.collect.url` から
   `http://localhost:3000/profile` 行のみ削除し、Stage 4 backlog に「`/profile` 認証
   fixture を導入し再 enroll」を記録する。

## 結論

- 初期コミットでは **4 routes 維持（K-01）** を採用。
- PR-A の初回 CI run で `/profile` a11y < 0.90 が観測された場合、同 PR 内に
  「`lighthouserc.json` から `/profile` 行を削除し、Stage 4 backlog に再 enroll を記録」
  する hot-fix commit を追加する（R-01..R-04 を CONST_007 single cycle の範囲内で適用）。

## 関連 evidence

- `outputs/phase-7/grep-gate-evidence.log` — G-01..G-06 全 pass
- `outputs/phase-11/lhci-scores.json` — 実 CI run 後に PR-A 内で記録予定
