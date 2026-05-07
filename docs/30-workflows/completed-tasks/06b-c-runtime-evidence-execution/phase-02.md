# Phase 2: evidence 保存先と redaction 方針確認 — 06b-c-runtime-evidence-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-c-runtime-evidence-execution |
| phase | 2 / 13 |
| 作成日 | 2026-05-04 |
| taskType | implementation（execution） |
| user_approval_required | false |

## 目的

Issue 本文に登場する 3 系統の path（`02-application-implementation/...` / `06b-C-...` / `completed-tasks/06b-C-...`）の drift を解消し、本タスクで evidence を **どこに書くか** を 1 つに固定する。あわせて redaction 対象と確認タイミングを明示する。

## 入力 / 出力

| | 内容 |
| --- | --- |
| 入力 | Phase 1 承認ログ、先行タスク `outputs/phase-11/manual-smoke-evidence.md` |
| 出力 | `outputs/phase-02/main.md`（保存先 + redaction matrix） |
| 副作用 | なし |

## evidence 保存先（正本確定）

| 種別 | 正本 path |
| --- | --- |
| screenshot | `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/screenshots/` |
| DOM dump JSON | `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/dom/` |
| smoke 一覧 | `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/manual-smoke-evidence.md` |
| runtime summary | `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/main.md` |
| 本タスクの runbook / 判定 log | `docs/30-workflows/06b-c-runtime-evidence-execution/outputs/phase-*/main.md` |

### 禁止 path（legacy stub。書き込み禁止）

- `docs/30-workflows/06b-C-profile-logged-in-visual-evidence/outputs/...`（ハイフン違いの legacy / 実体無し）
- `docs/30-workflows/02-application-implementation/...`

## redaction matrix

| 対象 | redact 必要性 | 具体例 | redact 方法 |
| --- | --- | --- | --- |
| email アドレス | **必須** | `<member-email>` / `<admin-email>` | screenshot は `page.evaluate` で `<*>@<*>` テキストを `<redacted-email>` 等に置換 / 手動キャプチャは画像エディタで黒塗り |
| Magic Link URL（token 入り） | **必須** | `https://<host>/api/auth/callback/email?token=...` | URL bar が映る前にナビゲーション完了を待ってから capture / 手動は URL bar をクロップ除外 |
| session cookie 値 | **必須** | `__Secure-next-auth.session-token=...` | DevTools・cookie banner が映らないようにする。screenshot 内に表示しない設計を Playwright spec が既に保持 |
| OAuth refresh token / id_token | **必須** | `eyJhbG...` 形式 | OAuth flow のブラウザを M-15 取得時のみ最小範囲でキャプチャ |
| 一般 PII（電話番号 / 住所等） | 可能な限り redact | profile 表示中のフィールド | M-08 capture 時の test fixture で固定値（架空データ）を使うことを推奨 |
| storageState ファイル中身 | **絶対に転記しない** | `apps/web/playwright/.auth/state.json` | `cat` / `Read` 禁止。path のみを言及 |

## redaction 確認タイミング

| 段階 | 確認内容 | 担当 Phase |
| --- | --- | --- |
| 取得直後（ローカルで開く） | 目視で email / token / cookie が画像中に映っていないか | Phase 6 |
| 保存前（commit 前） | 未追跡を含む docs/evidence 実ファイルと `git diff` で email pattern / token pattern を grep | Phase 9 |
| 保存後（PR 直前） | `rg -n "@gmail.com\\|@senpai-lab.com" docs/` で test account email が docs に混入していないか | Phase 9 |

## 実行手順

1. 上記 2 表を `outputs/phase-02/main.md` に転記する。
2. 「禁止 path」節を強調表示し、Phase 5 / 11 / 12 が誤って legacy path に書き込まないよう警告として残す。
3. redaction matrix の各行について「自動可 / 手動必須」をマークする。

## 完了条件チェックリスト

- [ ] evidence 正本 path 一覧が `outputs/phase-02/main.md` に確定している
- [ ] 禁止 path（legacy stub）が一覧化されている
- [ ] redaction 対象 6 種が表で記録されている
- [ ] redaction 確認タイミング（Phase 6 / 9）が明記されている

## 次 Phase への引き渡し

Phase 3 へ「evidence 保存先 path」と「redaction matrix」を引き渡す。Phase 3 は capture wrapper の dry-run を行い、`--out-dir` に正本 path が渡ることを確認する。
