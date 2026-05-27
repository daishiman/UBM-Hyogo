---
spec_classification: implementation_spec
state: implemented_local_runtime_pending
phase: 12
phase_name: ドキュメント
created_at: 2026-05-27
---

# Phase 12: ドキュメント

[実装区分: 実装仕様書]

## 1. 中学生レベル概念説明

- **visual baseline（見本画像）**: ウェブ画面が壊れてないか確かめるための「お手本画像」。CI が新しい撮影画像と見本を比べて、ピクセルの違いが大きいと fail する。
- **viewport（ブラウザの窓の大きさ）**: スマホ・タブレット・PC で見え方が違うので、4 通りの大きさで撮る。今回は 375 / 768 / 1280 / 1440 px。
- **env-gated（環境変数があるときだけ動く）**: 詳細ページは「会員 ID」「会合 ID」が必要なので、ID がないと開けない。なので環境変数 `PLAYWRIGHT_ADMIN_MEMBER_DETAIL_ID` と `PLAYWRIGHT_ADMIN_MEETING_DETAIL_ID` が両方入っているときだけテストを走らせる。
- **bot push（CI 自動 commit）**: 見本画像は CI が自動で commit するけど、GitHub の bot トークンは「pull_request」イベントを起こさないルール。だから人間があとから「空 commit」を push して、もう一度チェックを走らせる必要がある。
- **regression dry-run（壊れチェックの動作確認）**: わざと色をちょっと変えて、CI が「違いがある！」と気づくか試す。気づいたらすぐ元に戻す。

---

## 2. 必須見出し（canonical 9）

1. 概要
2. AC（受け入れ条件）
3. 不変条件
4. 変更対象ファイル
5. テスト方針
6. CI / gate
7. 運用フロー
8. evidence 配置
9. DoD（完了条件）

---

## 3. implementation-guide.md（要追記）

`outputs/phase-12/implementation-guide.md` に下記を含める:

- 3 ステップ運用フロー: baseline 取得 → bot push → 空コミット再トリガー
- env-gated 2 routes 投入運用（seed ID が両方そろうまで 44 PNG 運用を禁止）
- regression dry-run の手順
- required check 候補（PUT は user-gated）

---

## 4. 関連ドキュメント参照

| 参照先 | 用途 |
|---|---|
| `docs/00-getting-started-manual/specs/design-tokens.md` | regression dry-run の対象 token 確認 |
| `apps/web/src/styles/tokens.css` | OKLch token 正本 |
| `apps/web/playwright/tests/visual-staging-authenticated/` | staging admin storageState setup |
| `apps/web/playwright.config.ts` | project / testMatch 設定 |
| 親 workflow `docs/30-workflows/admin-ui-prototype-alignment/` | Task A-D の完了状態 |
| MEMORY: `feedback_visual_baseline_github_token_retrigger` | 空コミット再トリガー運用 |
| MEMORY: `L-I902-001..004` | env-gated `[id]` / `-linux.png` 正本 |

---

## 5. CONST_007 ドキュメント明記

- 本仕様は今回サイクル内で完結（実 PUT のみ user-gated）。
- バックログ・別 Issue・別 PR への先送りは無し。
