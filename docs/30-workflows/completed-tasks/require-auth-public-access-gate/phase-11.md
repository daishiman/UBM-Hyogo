# Phase 11: 手動テスト（VISUAL）

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 11 / 13 |
| 名称 | 手動テスト（VISUAL・screenshot 証跡） |
| 種別 | 手動検証 Phase（UI task） |
| visualEvidence | **VISUAL** — `LoginRequiredNotice` は新規 UI 画面のため screenshot 対象 |
| screenshot mode | `screenshot-plan.json` の `mode = VISUAL`（デフォルト・[Feedback W1-02b-1]） |
| 実機操作 | **staging 必要・user-gated** — ローカル実装と決定的 evidence は取得済み。実 screenshot は staging 認証経路で取得 |
| 前提 | Phase 10（最終レビュー）PASS |

## 目的

未認証時の「ログインが必要です」案内画面と、認証済み時の従来コンテンツ表示を、**3 層評価（Semantic / Visual / AI UX）**で手動検証し、screenshot 証跡を取得する。
あわせて API ゲート（無認証 401）と サーバー間消費者（sitemap / OG が 200 維持）を curl / 実機で確認する。

> **重要**: 本 workflow は実コード実装とローカル決定的 evidence まで完了済み。
> 実 screenshot と実機操作は **staging 上でユーザー承認のもと取得**する（user-gated）。
> 本 Phase 仕様では取得対象・canonical 名・手順・3 層評価観点を定義し、screenshot status は **pending**（実行時取得）とする。

## 実行タスク

1. `screenshot-plan.json`（`mode = VISUAL`）を定義し、取得対象 2 枚の canonical 名・状態・対象ルートを固定する。
2. 手動テスト手順（未認証 → notice / CTA 遷移 / ログイン後コンテンツ / API 401 / sitemap・OG 200）を実行する。
3. 3 層評価（Semantic / Visual / AI UX）で notice 画面と認証済み画面を評価する。
4. screenshot capture metadata の `taskId` が本 workflow の taskId と一致することを確認する。
5. 証跡を `outputs/phase-11/manual-test-result.md` / `screenshot-plan.json` に記録する。

## 参照資料

| 参照 | パス | 用途 |
|------|------|------|
| 受け入れ基準 | `phase-1.md` 第 3 節（AC-1〜AC-9） | 手動確認の判定基準 |
| 設計 | `phase-2.md` 第 2-3 節 | notice 表示要素・API ゲート挙動 |
| 最終レビュー | `phase-10.md` | PASS 済みであること |
| component | `apps/web/src/components/auth/LoginRequiredNotice.tsx` | notice 表示要素 |

## 実行手順

### Step 1. screenshot-plan.json 定義（mode = VISUAL）

canonical 名は `<component>-<state>.png` 形式。

| # | canonical 名 | 状態 | 対象ルート / 操作 |
|---|-------------|------|------------------|
| 1 | `login-required-notice-unauthenticated.png` | 未認証で `/members` にアクセスした際の「ログインが必要です」案内画面 | 未ログイン状態で `/members` を開く |
| 2 | `public-members-authenticated.png` | 認証済みで従来コンテンツ（メンバー一覧）が表示される画面 | ログイン後に `/members` を開く |

```json
{
  "mode": "VISUAL",
  "taskId": "require-auth-public-access-gate",
  "screenshots": [
    {
      "name": "login-required-notice-unauthenticated.png",
      "route": "/members",
      "state": "unauthenticated",
      "status": "pending",
      "description": "未認証で /members アクセス時の『ログインが必要です』案内画面（本来コンテンツ非描画・ログインするボタン表示）"
    },
    {
      "name": "public-members-authenticated.png",
      "route": "/members",
      "state": "authenticated",
      "status": "pending",
      "description": "認証済みで従来のメンバー一覧コンテンツが表示される画面"
    }
  ]
}
```

> `status = pending`（実行時取得・staging user-gated）。実装サイクルで実 screenshot を取得したら `status = present` に更新し、ファイルを `outputs/phase-11/` 配下に配置する。

### Step 2. 手動テスト手順

| # | 手順 | 期待結果 | 対応 AC |
|---|------|---------|--------|
| 1 | 未認証状態で `/`, `/members`, `/members/[id]`, `/register`, `/privacy`, `/terms` を順にアクセス | いずれも「ログインが必要です」案内画面のみ表示・本来コンテンツ（会員情報・統計・フォーム）非描画 | AC-1 |
| 2 | notice の「ログインする」ボタンを押下 | `/login?redirect=<元の pathname>` へ遷移する | AC-2 |
| 3 | ログイン後（認証済み）に各ルートを再アクセス | 従来コンテンツが表示される（リグレッション無し） | AC-4 |
| 4 | `curl -i https://<api>/public/members`（無認証ヘッダ無し） | HTTP 401 を返す | AC-6 |
| 5 | `https://<web>/sitemap.xml` と OG 画像エンドポイントを開く | いずれも 200 で従来どおり生成される | AC-7 |
| 6 | 未認証で `/login` を直接アクセス | 従来どおりログイン画面が表示される（ゲート対象外） | AC-3 |

> 手順 4-6 は staging API / web に対して実行する（**user-gated**）。

### Step 3. 3 層評価（Semantic / Visual / AI UX）

| 層 | 評価対象 | 観点 |
|----|---------|------|
| Semantic | DOM / role / `data-testid` | `login-required-notice` / `login-required-notice-cta` が存在し、見出し「ログインが必要です」が `<h1>` 等の意味のある要素である。CTA が `<a>`/Link で `/login?redirect=...` を指す |
| Visual | レイアウト・トークン | OKLch トークンのみ（HEX 0）。既存 Card / Button primitive の見た目に整合。中央寄せ・読みやすい余白 |
| AI UX | 体験 | 未認証ユーザーが「なぜ見られないか」「次に何をすべきか（ログイン）」を迷わず理解できる文言・導線である |

### Step 4. capture metadata taskId 一致確認

- screenshot capture metadata の `taskId` が `require-auth-public-access-gate` と一致することを確認する（取り違え防止）。

## 統合テスト連携

- 手動テスト手順 1-3（UI）は Phase 4/6 の web layout ゲート spec の挙動を実機で裏付ける。
- 手順 4-5（API・sitemap・OG）は Phase 4/6 の api contract spec / header spec を実機で裏付ける。
- 自動テストと手動テストの結果が矛盾する場合は Phase 10 へ差し戻す。

## 多角的チェック観点（AIが判断）

- 価値系: ユーザー要望「ログインしないと情報が見れない」が体験として成立しているか（notice が情報を一切漏らさず、ログイン導線が明快か）。
- リスク系: 認証済み時に従来コンテンツが欠落していないか（過剰ゲートによる機能後退の検出）。

## サブタスク管理

- [ ] `screenshot-plan.json`（mode=VISUAL・2 枚・status=pending）を定義
- [ ] 手動テスト手順 1-6 を定義
- [ ] 3 層評価観点を定義
- [ ] capture metadata taskId 一致確認手順を記載
- [ ] 実 screenshot は staging user-gated として明記

## 成果物

| 成果物 | 配置 | status |
|--------|------|--------|
| 手動テスト結果 | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/outputs/phase-11/manual-test-result.md` | 実行時記録 |
| screenshot 計画 | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/outputs/phase-11/screenshot-plan.json` | mode=VISUAL |
| screenshot（未認証 notice） | `outputs/phase-11/login-required-notice-unauthenticated.png` | pending（user-gated） |
| screenshot（認証済みコンテンツ） | `outputs/phase-11/public-members-authenticated.png` | pending（user-gated） |

## 完了条件

- [ ] `screenshot-plan.json` が mode=VISUAL で 2 枚を canonical 名（`<component>-<state>.png`）で定義している
- [ ] 手動テスト手順（notice / CTA 遷移 / ログイン後 / API 401 / sitemap・OG 200）が定義されている
- [ ] 3 層評価（Semantic / Visual / AI UX）観点が定義されている
- [ ] 実 screenshot は status=pending（実装サイクルで staging user-gated 取得）と明記されている
- [ ] capture metadata の taskId 一致確認手順が記載されている

## タスク100%実行確認【必須】

- [ ] screenshot-plan・手動手順・3 層評価・taskId 一致・pending 明記をすべて記述した

## 次Phase

[phase-12.md](phase-12.md) — ドキュメント更新（implementation-guide / spec sync / unassigned / feedback / compliance）
