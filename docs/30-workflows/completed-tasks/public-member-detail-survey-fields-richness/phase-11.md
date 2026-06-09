# Phase 11: 手動テスト検証（VISUAL）

> 本タスクは **UI task（VISUAL / visualEvidence=VISUAL_ON_EXECUTION）**。local 実装と focused contract tests は完了済み。実 screenshot capture は staging seed apply と認証済み runtime 確認を伴うため user-gated pending とし、placeholder を PASS 扱いしない。

---

## 0. 視覚証跡の扱い（VISUAL_ON_EXECUTION）

| 項目 | 方針 |
| ---- | ---- |
| visualEvidence | `VISUAL_ON_EXECUTION`（実 capture は実装サイクルで取得） |
| 現状態の `outputs/phase-11/screenshots/` | **空ディレクトリを保持**（NON_VISUAL ではないため削除しない）。`.gitkeep` を置いてディレクトリを git に残す。実 capture は user 承認後の runtime cycle で同ディレクトリへ配置する |
| 完了根拠 | placeholder のみを PASS 扱いにしない。実 capture 取得時に coverage / metadata / source evidence を揃える（skill FB-LLM-MOD-05 系） |
| ファイル名一貫性 | 下記 §1 の semantic canonical 名を、phase spec（本ファイル）/ capture metadata / Phase 12 implementation-guide.md の 3 箇所で**完全一致**させる（FB-LLM-MOD-05-001） |

---

## 1. screenshot 計画（semantic canonical 名）

実装サイクルで以下の画面状態を撮る。ファイル名・対象・期待は本表を正本とし、capture metadata / implementation-guide.md に同一文字列で転記する。

| canonical ファイル名 | 対象画面状態 | 取得方法 | 検証する AC |
| -------------------- | ------------ | -------- | ----------- |
| `member-detail-full.png` | 全セクションが埋まった `TEST-MEM-01`（seed 全項目） | staging `/members/TEST-MEM-01`（seed apply 後）/ または local seed | AC-1〜AC-6, AC-9 |
| `member-detail-sparse.png` | public 項目が少ないメンバー（hometown / skills / canProvide / selfIntroduction の一部が空） | local seed の sparse fixture / 代表メンバー | AC-1（空 chip 非表示）/ AC-2（"—" + ブロック非表示）/ AC-5（MESSAGE 非表示分岐の対照） |
| `member-detail-message-hidden.png` | `selfIntroduction` が無いメンバー（MESSAGE セクションが描画されない状態） | selfIntroduction 未設定 fixture | AC-5（空時セクション非表示） |

> 配置先: `outputs/phase-11/screenshots/`。3 ファイルとも実装サイクルで取得。spec 段階では空（`.gitkeep` のみ）。
> capture metadata（`outputs/phase-11/capture-metadata.md` 相当）には各ファイルの「対象 URL / viewport / seed 状態 / 撮影日 / 対応 AC」を記録する。

---

## 2. staging 確認手順（seed apply は user-gated）

1. **seed apply（user-gated）**: Lane B の seed を staging D1 へ反映する。apply は `bash scripts/cf.sh d1 ...` ラッパー経由で、user 明示承認後にのみ実行する（今回サイクルでは未実行）。
2. `https://ubm-hyogo-web-staging.daishimanju.workers.dev/members/TEST-MEM-01` を開く。
3. 5 セクション（Hero / BUSINESS OVERVIEW / TAGS+SNS / PERSONAL / MESSAGE）+ 参加履歴がすべて表示され、各セクションに `[TEST]` プレフィックスの値が埋まっていることを目視確認。
4. proto（`pages-public.jsx` / `09e-screen-blueprints-public.md` §3）と並べ、表示順 AC-6 と eyebrow ラベル（`MEMBER PROFILE` / `BUSINESS OVERVIEW` / `TAGS` / `SNS / WEB` / `PERSONAL` / `MESSAGE`）の一致を確認。
5. `member-detail-full.png` を取得し `outputs/phase-11/screenshots/` へ配置。
6. sparse / message-hidden の対照画面を local seed もしくは別テストメンバーで取得（staging 反映が無い場合は local で代替し、その旨を capture metadata に記録）。

---

## 3. 実 route の smoke 確認（node-only import が無いこと）

`/(public)/members/[id]` は Server Component（force-dynamic）。ブラウザで実 route を開き、以下を確認（FB-W1-02b-4）:

- ページがクライアントで例外なくレンダリングされる（白画面・hydration error が出ない）。
- 新規 component（`BusinessOverviewSection` / `PersonalSection` / `MessageCard`）が **node 専用モジュール（`fs` / `path` 等）を import していない**こと。adapter は pure function で副作用無し。
- `apps/web` から D1 binding を直接触っていない（データは `fetchPublicOrNotFound` 経由のみ・不変条件 #2）。
- ブラウザ拡張由来の `[Sentry] You cannot use Sentry.init() in a browser extension` ログは本タスク対象外ノイズ（別ワークフロー）。これを本タスクの fail 根拠にしない。

---

## 4. 3 層評価（Semantic / Visual / AI UX）

proto 準拠を 3 観点で評価する。

| 層 | 観点 | proto 準拠の確認内容 |
| -- | ---- | -------------------- |
| **Semantic** | DOM 構造 / data 属性 / アクセシビリティ | `data-component` が proto セクション 5 種に対応 / `data-page="public-member-detail"` / kv-list の各行に `data-stable-key` / 見出し階層（h1 Hero → h-section 各セクション） |
| **Visual** | レイアウト / トークン / リズム | Avatar xl・chip-row・grid-2（business と tags+links 横並び）・accent-soft 引用カード・serif が proto と一致 / 色は OKLch トークンのみ（HEX 0）/ stack-lg の縦リズム |
| **AI UX** | 情報設計 / 可読性 | 「アンケートで答えた項目」が読み手に構造的に伝わる（ビジネス→タグ/リンク→パーソナル→メッセージの導線）/ 空項目で破綻しない（"—" や chip 非表示で自然に縮退）/ 情報の優先順位が proto と一致 |

---

## 5. Phase 11 完了条件（実装サイクル）

- §1 の 3 canonical screenshot が `outputs/phase-11/screenshots/` に実在し、capture metadata に対応 AC が紐づく。
- §2 staging 確認（seed apply 後）で TEST-MEM-01 の全セクション表示を目視 PASS。
- §3 smoke で node-only import 無し・D1 直アクセス無しを確認。
- §4 の 3 層評価が proto 準拠で blocker 無し。

> 現状態では local contract evidence は PASS、local runtime screenshots 3 PNG は present。staging seed apply と authenticated staging screenshot は pending_user_gate のまま保持する。
