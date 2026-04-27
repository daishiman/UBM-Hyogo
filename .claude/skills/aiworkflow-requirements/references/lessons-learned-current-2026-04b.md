# Lessons Learned（current）2026-04b

> 親ファイル: [lessons-learned-current.md](lessons-learned-current.md)
> 前のファイル: [lessons-learned-current-2026-04.md](lessons-learned-current-2026-04.md)

---

## UT-11 Google OAuth + PKCE タスク仕様書作成（2026-04-27）

### L-UT11-001: Cloudflare Edge Runtime での PKCE 実装制約

| 項目 | 内容 |
| --- | --- |
| 症状 | Cloudflare Pages / Workers の Edge Runtime で Node.js の `crypto.createHash()` が使用不可 |
| 原因 | Edge Runtime は Web Crypto API（`crypto.subtle`）のみサポート。Node.js ランタイムではない |
| 解決策 | `crypto.getRandomValues()` で 32 バイトの code_verifier 生成 → `crypto.subtle.digest("SHA-256", ...)` でハッシュ → Base64URL エンコード（`+→-`、`/→_`、`=削除`）の3ステップを仕様書に明記 |
| 再発防止 | Phase 1 でタスク種別に「Edge Runtime 制約あり」を記録。Phase 9 に `node:crypto` 禁止 lint チェックを追加。Phase 4 テスト仕様に `@cloudflare/vitest-pool-workers` 採用を明記 |
| 関連 AC | AC-2（PKCE 実装）、AC-9（ローカル動作確認） |

### L-UT11-002: state parameter の Edge Runtime 保存戦略

| 項目 | 内容 |
| --- | --- |
| 症状 | Edge Runtime はリクエスト間でメモリを共有しないため、OAuth state をサーバーサイド変数で保持不可 |
| 原因 | Cloudflare Workers はリクエストスコープのサンドボックス。グローバル変数は使用不可 |
| 解決策 | state を HttpOnly Cookie（`SameSite=Lax; Secure; Max-Age=600; Path=/api/auth/callback`）に一時保存。コールバック時に取り出して照合後に削除 |
| 代替案（却下） | Workers KV は有料プランが必要なため初期実装では不採用 |
| 再発防止 | Phase 2 設計書に「Edge Runtime のステートレス制約と state 保存戦略」を必須セクションとして記載 |
| 関連 AC | AC-3（state 検証）、AC-6（Cookie 属性） |

### L-UT11-003: ADMIN_EMAIL_ALLOWLIST の管理戦略決定

| 項目 | 内容 |
| --- | --- |
| 決定 | 初期実装は Cloudflare Secret（カンマ区切り文字列）で管理。D1 テーブル移行は別タスク |
| 理由 | D1 row 追加は Cloudflare 無料枠の row 数を消費する（不変条件 #10 適合のため Secret を選択） |
| 注意点 | Secret 更新後は Workers の再デプロイが必要。Runbook に「新規管理者追加手順」（allowlist 更新 → wrangler secret put → 再デプロイ）を明記 |
| 拒否時 UX | Google 側では認証成功、アプリ側で 403 拒否。ユーザーへのフィードバックメッセージを明確化が必要 |
| 関連 AC | AC-4（allowlist 外拒否）、AC-12（Secrets 配置）、AC-13（Runbook） |

### L-UT11-004: spec_created タスクの Phase 11 VISUAL 分類判断

| 項目 | 内容 |
| --- | --- |
| 問題 | spec_created（docs_only）タスクでも UI（ログインボタン）が対象範囲に含まれる場合、Phase 11 の分類が NON_VISUAL か VISUAL かで揺れる |
| 判断基準 | 「実装後に実際の画面操作 / スクリーンショットが必要な要素があるか」で判断。本タスクは /login ボタン・Google 同意画面・Cookie inspector が対象 → **VISUAL** |
| 実施内容 | Phase 11 仕様書を VISUAL で作成し、screenshot-plan.json（8 件）と manual-test-checklist.md を作成。actual な PNG は実装完了後に取得（placeholder で pending） |
| 再発防止 | Phase 1 でタスク種別（spec_created / UI task）を明示するときに、Phase 11 の分類（VISUAL / NON_VISUAL）も同時に記録する |

### L-UT11-005: validate-phase-output.js の VISUAL タスク補助成果物要件

| 項目 | 内容 |
| --- | --- |
| 症状 | VISUAL タスクでは `manual-test-checklist.md` / `manual-test-result.md` / `discovered-issues.md` / `screenshot-plan.json` の 4 点が `outputs/phase-11/` に必須。不足すると validate-phase-output.js が ERROR を返す |
| 対策 | spec_created タスクでも Phase 11 が VISUAL の場合、これら 4 点を placeholder として事前に作成する。manual-test-result.md には「実装前 placeholder」を明記し、actual 結果は実装後に更新 |
| 確認コマンド | `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js <workflow-path>` |
