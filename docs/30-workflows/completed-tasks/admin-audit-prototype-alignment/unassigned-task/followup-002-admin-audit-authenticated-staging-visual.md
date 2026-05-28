# admin-audit-prototype-alignment FU-002 - /admin/audit authenticated staging visual baseline - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | admin-audit-prototype-alignment-fu-002 |
| タスク名 | `/admin/audit` authenticated staging visual baseline spec |
| 分類 | テスト追加（visual regression） |
| 対象機能 | `/admin/audit` 認証後 3 state (default / filtered / empty) の staging baseline |
| 優先度 | medium |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | Phase 12（admin-audit-prototype-alignment 親 workflow close-out） |
| 発見日 | 2026-05-27 |
| 親タスク | `docs/30-workflows/completed-tasks/admin-audit-prototype-alignment/`（移動後パス） |
| 親タスク状態 | implemented_local_runtime_pending |
| taskType | implementation |
| visualEvidence | VISUAL |
| 関連 area | web, admin-ui, playwright |
| wave | 2-plus |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

親 workflow `admin-audit-prototype-alignment` で `/admin/audit` UI を prototype 整合した。Phase 11 で local authenticated fixture から `admin-audit-{default,filtered,empty}.png` の 3 枚を取得済みだが、staging 上の **authenticated** baseline は未取得（user-gated）。

現状 `apps/web/playwright/tests/visual-staging/admin-audit.spec.ts` は unauthenticated guard 描画のみを baseline 化しており、ログイン後 3 state の regression 保護が無い。

### 1.2 問題点・課題

- prototype 整合後の visual regression を staging で自動検出できない
- 既知の admin visual matrix（先例 `admin-visual-baseline-admin-routes` Task E）と粒度が揃っていない
- audit log API レスポンス変更時の UI 影響を CI で捕捉できない

### 1.3 放置した場合の影響

- design token 変更 / primitives 改修時に `/admin/audit` だけ regression が漏れる
- 親 workflow の VISUAL 保護が local fixture 止まりで close-out される

---

## 2. 何を達成するか（What）

### 2.1 目的

`apps/web/playwright/tests/admin-staging-visual/admin-audit.spec.ts` を新規作成し、storageState 付きで `/admin/audit` 3 state baseline を staging 環境で取得する。

### 2.2 最終ゴール

- `admin-staging-visual` project にて `admin-audit-{default,filtered,empty}-linux.png` の Linux baseline が CI で生成・比較される
- `playwright-smoke.yml` の admin-visual matrix に新 spec が組み込まれる（both-or-none preflight 維持）

---

## 3. どう実装するか（How）

### 3.1 実装手順

1. `apps/web/playwright/tests/admin-staging-visual/admin-audit.spec.ts` を新規作成。先例 `admin-meetings.spec.ts` の構造をベースに以下 3 test を実装:
   - default: `/admin/audit` を開きスクリーンショット
   - filtered: `/admin/audit?limit=50` を開きスクリーンショット
   - empty: 環境変数 / クエリで empty state を再現してスクリーンショット（empty 再現が staging で困難な場合は filter 条件で 0 件にする）
2. `playwright.config.ts` の `admin-staging-visual` project の testMatch に新 spec を含めること（既存 glob で吸収できる場合は no-op）。
3. `.github/workflows/playwright-smoke.yml` の `admin-visual` matrix に追加 entry（既存 both-or-none preflight 形式に揃える）。
4. Linux baseline を bot で生成 → review → push（user-gated）。
5. 空コミットによる required check 再トリガー（先例 `feedback_visual_baseline_github_token_retrigger.md`）。

### 3.2 受入基準（AC）

- [ ] `admin-staging-visual/admin-audit.spec.ts` が 3 test を含む
- [ ] storageState（authenticated admin）を再利用している
- [ ] snapshotPathTemplate が `{projectName}` 固定（先例 L-AVBE-004）
- [ ] CI で 3 PNG baseline が生成され、後続 PR で diff 比較される
- [ ] `playwright-smoke.yml` の admin-visual matrix に both-or-none で組み込まれている

---

## 4. 苦戦箇所 / 予想される困難（将来再利用可能ナレッジ）

| # | 困難 | 予防策 / 先例 |
| --- | --- | --- |
| 1 | empty state の再現性が staging で不安定（誰かが監査ログを生成すると 0 件にならない） | filter クエリで存在しない `actorEmail` を指定して 0 件確定。または `?from=2099-01-01` で未来日 filter |
| 2 | bot push の baseline が `GITHUB_TOKEN` の pull_request 非発火問題に当たる | 空コミット手動 push で required checks 再トリガー（先例 `feedback_visual_baseline_github_token_retrigger.md`） |
| 3 | macOS local generated PNG が CI と差分を起こす | `*-linux.png` のみを正本とし、macOS 用 PNG は commit しない（先例 L-I902-002, L-AVBE-004） |
| 4 | 同 wave に visual と smoke を両方積むと testIgnore が混線 | playwright.config の testIgnore で visual-staging と admin-staging-visual の glob を排他化（先例 L-AVBE-003） |
| 5 | `admin-staging-visual` project の EVIDENCE_DIR が同名衝突する | snapshotPathTemplate に `{projectName}` を含め、EVIDENCE_DIR を project ごとに自動分岐（先例 L-AVBE-002） |
| 6 | API 404（Task B 同型）の再発で「empty」と「fetch error」が見分けられず baseline 不安定化 | spec 冒頭で API 200 確認 step を入れ、404 時は test.skip() で早期離脱 |

---

## 5. 関連先行事例

- `docs/30-workflows/completed-tasks/admin-visual-baseline-admin-routes/` — admin route 全般の staging visual baseline 構築（Task E）。snapshotPathTemplate / testIgnore / EVIDENCE_DIR 自動分岐の lessons L-AVBE-001..006
- `docs/30-workflows/completed-tasks/admin-meetings-prototype-alignment/` — 同種の prototype-alignment + visual baseline サイクル
- `docs/30-workflows/completed-tasks/issue-902-members-staging-visual-baseline/` — member 系 visual baseline 先例 L-I902-001..004
- `apps/web/playwright/tests/admin-staging-visual/admin-meetings.spec.ts` — storageState 再利用パターン

---

## 6. スコープ外（明示）

- audit log API スキーマ拡張
- 認証フローの変更
- 非 admin route の visual baseline 追加

---

## GitHub Issue

- #992 https://github.com/daishiman/UBM-Hyogo/issues/992
