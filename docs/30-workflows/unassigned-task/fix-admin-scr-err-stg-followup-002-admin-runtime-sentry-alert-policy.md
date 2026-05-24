# admin scope の error.boundary.caught Sentry alert policy 整備 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                  |
| ------------ | ------------------------------------------------------------------------------------- |
| タスクID     | fix-admin-scr-err-stg-followup-002-admin-runtime-sentry-alert-policy                  |
| タスク名     | admin scope の `error.boundary.caught` Sentry / Cloudflare alert policy 整備（IaC 化） |
| 分類         | 改善 / observability                                                                  |
| 対象機能     | apps/web admin scope runtime error 検知                                               |
| 優先度       | 中                                                                                    |
| 見積もり規模 | 小規模                                                                                |
| ステータス   | 未実施                                                                                |
| 発見元       | TASK-FIX-ADMIN-SCR-ERR-STG-001 close-out review                                       |
| 発見日       | 2026-05-23                                                                            |
| 親 workflow  | `docs/30-workflows/fix-admin-server-components-render-error-stg/`                     |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

親タスク TASK-FIX-ADMIN-SCR-ERR-STG-001 で対応した Server Components render error (digest=167275886) は、**Cloudflare Workers staging `/admin` を手動操作した結果初めて global-error boundary に到達して検知された**。本来であれば Cloudflare alert / Sentry alert が「scope=admin の `error.boundary.caught` イベントが閾値以上発生」を能動検知し、user-gated 確認以前に通知されるべきだった。

CLAUDE.md の「cloudflare alert policy IaC」trigger に準拠し、admin scope のエラー閾値検知を IaC 化することで、同型 regression を deploy 直後に自動検知する仕組みを確立する。

### 1.2 問題点・課題

- production build では Next.js が error.message を omit するため、運用者の手掛かりは **digest hash のみ**。digest 単位の頻度集計 + scope ラベルで alert を設計しないと、原因切り分けが困難
- 現状 admin scope 専用の alert policy が定義されておらず、public / member shell の noise に紛れて admin error が埋もれる
- alert policy が手動コンソール設定だけだと drift し、誰がいつ設定変更したかが追跡不能（IaC 化の必要性）

### 1.3 放置した場合の影響

- 同型 Server Components render error が production で発生した場合、ユーザー報告まで検知できない
- digest=167275886 のような匿名 digest を後追い調査する際、頻度 / scope / 発生時間帯のメタが揃わず原因特定が遅延
- governance 上、alert policy が GitOps から外れているため CODEOWNERS / 変更履歴の枠組みからも漏れる

---

## 2. スコープ

### 2.1 含むもの

- admin scope（`/admin/**`）に絞った `error.boundary.caught` イベント閾値 alert policy 設計
- alert policy の IaC 化（Terraform もしくは `wrangler.toml` 連動の宣言的設定、または Sentry alert rule の YAML/JSON 管理）
- digest 単位の頻度集計（同一 digest が N 分間に M 回以上発生で通知）+ scope=admin ラベルでのフィルタ
- 通知先（Slack / メール / GitHub issue 自動起票のいずれか）の選定と疎通テスト
- runbook を `docs/30-workflows/` 配下に追記

### 2.2 含まないもの

- 既存 `apps/web/src/app/error.tsx` の振る舞い変更（error boundary 自体は親タスクで踏破済み）
- 新規 telemetry SDK 導入（既存 Cloudflare / Sentry 設定の範囲内で実現）
- public / member scope の alert（本タスクは admin に限定）
- D1 schema 変更・新規 API endpoint 追加

---

## 3. 実装ステップ概要

1. 現行の Cloudflare Workers observability 設定 / Sentry プロジェクト設定を棚卸しし、`error.boundary.caught` イベントが既に emit されているか確認
2. emit されていない場合は `apps/web/src/app/error.tsx` 内に `scope: 'admin' | 'member' | 'public'` ラベル付き emit を追加
3. alert policy を IaC 化（Terraform module もしくは Sentry alert rule JSON / `wrangler.toml` analytics_engine binding 経由など、リポジトリで採用可能な手段を選択）
4. 閾値の初期値: 同一 digest が 5 分間に 3 回以上 / scope=admin で 1 件でも発生で通知（運用しながら chunked tune）
5. 通知先疎通テスト（staging で意図的に admin scope error を 1 件発生させて到達確認）
6. runbook 追記: alert 発火時の初動（digest grep → 関連 PR 特定 → rollback 判定）
7. CODEOWNERS に alert policy IaC ファイルを追加（governance path 整合）

---

## 4. 受け入れ条件（DoD）

- **AC-1**: admin scope `error.boundary.caught` の alert policy が IaC ファイルとしてリポジトリにコミット済み
- **AC-2**: alert は digest 単位の頻度 + scope=admin ラベルで閾値発火する
- **AC-3**: 通知先疎通テストが staging で 1 回 pass（実際に通知が届いた evidence）
- **AC-4**: 初動 runbook が `docs/30-workflows/` 配下に存在
- **AC-5**: CODEOWNERS で alert policy IaC ファイルの owner が明示済み
- **AC-6**: 手動コンソール設定との drift が無い（IaC が正本）

---

## 5. 苦戦箇所メモ

production build では Next.js が `error.message` を build 時に omit し、`digest` のハッシュ文字列だけが残る。これは XSS / 情報漏洩防止の挙動で変更不可。したがって alert は「digest 単位の頻度」を 1 次キーにし、digest → 該当 deploy の build artifact → ソースマップ / コミット範囲を紐づける運用設計が必須。

scope ラベルは error.tsx 側で route segment から判定して emit する必要がある（`(admin)` route group か `(member)` か `(public)` か）。route group は URL に現れないため、`usePathname()` ベースの prefix match 等で `/admin` / `/profile` / それ以外 にマッピングする。

Cloudflare Workers の analytics_engine と Sentry の二重 emit になり得るので、どちらを正本にするか先に決定する。alert 発火元が二重化すると noise が倍増し alert fatigue を招く。

閾値設計は最初は緩めに（false-positive < 1 件/日）し、digest hit 数を観測しながら段階的に厳しくする。最初から strict にすると alert fatigue で運用が形骸化する。

---

## 6. 関連リソース

- `apps/web/src/app/error.tsx`（scope ラベル emit 追加対象）
- `apps/web/wrangler.toml`（analytics_engine binding 候補）
- `docs/30-workflows/fix-admin-server-components-render-error-stg/`（親 workflow / digest=167275886 の発見経緯）
- 関連 PR: #849
- CLAUDE.md「Cloudflare 系 CLI 実行ルール」「Governance / CODEOWNERS」セクション
- CLAUDE.md trigger keyword「cloudflare alert policy IaC」「kv usage monitoring」（task-specification-creator skill の Trigger 群）
- `.github/CODEOWNERS`（alert policy IaC path 追加対象）
