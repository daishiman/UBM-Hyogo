# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 12 / 13 |
| 名称 | ドキュメント更新（implementation-guide / spec sync / unassigned / feedback / compliance） |
| 種別 | ドキュメント生成 Phase |
| visualEvidence | VISUAL（implementation-guide Part2 に Phase 11 screenshot 参照を含める） |
| 前提 | Phase 11（手動テスト）完了 |
| 必須成果物 | 6 種（下記）。0 件でも出力必須の成果物あり |

## 目的

task-specification-creator skill が定める **Phase 12 必須 6 成果物**を定義する。
本 workflow は実コード実装とローカル決定的 evidence まで完了済みのため、ここでは Phase 12 成果物の実体と正本同期内容を確定する。
特に本タスクは **新規 middleware（`requirePublicAccess`）= 新規インターフェース追加**を含むため、Step2（システム仕様 sync）で `aiworkflow-requirements` の更新が必要である点を明記する。

## 実行タスク

1. 必須 6 成果物それぞれの必須内容を定義する。
2. Step2（システム仕様 sync）で新規 middleware 追加に伴う `aiworkflow-requirements` 更新対象を特定する。
3. specs4 ファイル（`00-overview.md` / `02-auth.md` / `06-member-auth.md` / `01-api-schema.md`）更新を AC-11 として記録する。
4. `LOGS.md` × 2・topic-map 更新と index 再生成コマンドを定義する。

## 参照資料

| 参照 | パス | 用途 |
|------|------|------|
| 受け入れ基準 | `phase-1.md` 第 3 節（AC-11） | spec 更新対象 |
| doc 更新方針 | `phase-2.md` 第 4 節 | specs4 の更新箇所 |
| skill | `.claude/skills/task-specification-creator/` | Phase 12 必須 6 成果物の定義 |
| システム仕様 | `.claude/skills/aiworkflow-requirements/references/`（`security-*.md` / `api-*.md`） | Step2 更新対象 |
| index 生成 | `.claude/skills/aiworkflow-requirements/scripts/generate-index.js` | topic-map / keywords 再生成 |

## 実行手順 — 必須 6 成果物

### 成果物 1: `outputs/phase-12/implementation-guide.md`

中学生レベル（Part1）+ 技術者レベル（Part2）の 2 部構成。

- **Part1（中学生レベル・例え話）**:
  - 例え話「**鍵のかかった部屋**」: これまで公開ページは「誰でも入れる部屋」だったが、これからは「会員証（ログイン）を見せないと入れない部屋」にする。会員証が無い人にはドアの前で「ログインが必要です」という張り紙（案内画面）を見せ、「ログインする」ボタンで受付（`/login`）に案内する。
  - 裏口（API 直叩き）も同じ鍵で閉める。ただし館内スタッフ（sitemap / OG ワーカー）は「職員パス（内部認証）」で通れるようにする。
- **Part2（技術者レベル）**:
  - 型定義: `LoginRequiredNoticeProps`（`redirectTo?: string`）、`RequirePublicAccessEnv`（`AUTH_SECRET?` / `INTERNAL_AUTH_SECRET?`）。
  - API: `requirePublicAccess(): MiddlewareHandler`（session OR `X-Internal-Auth` → next / なければ 401）。`createPublicRouter()` 冒頭の `app.use("*", requirePublicAccess())`。
  - コード例: `(public)/layout.tsx` の session 分岐（未認証 → `<LoginRequiredNotice redirectTo={pathname} />`・children 非 render）、web RSC の cookie 転送、sitemap / OG の `X-Internal-Auth` 付与。
  - 視覚証跡（VISUAL）: Phase 11 の `login-required-notice-unauthenticated.png` / `public-members-authenticated.png` を参照（status=pending の旨を併記）。

### 成果物 2: `outputs/phase-12/system-spec-update-summary.md`

- **Step1-A（完了記録）**: C1（web UI gate）/ C2（API gate + server-to-server）の実装完了内容。
- **Step1-B（実装状況）**: 変更ファイル一覧（component 新規 / layout 編集 / middleware 新規 / router 編集 / web fetch 編集 / sitemap 編集 / og 編集 / specs4 編集）と各 AC の充足状況。
- **Step1-C（関連タスク）**: 既存 `/profile`・`/admin/*` ゲート（変更なし・スコープ外）との関係、`INTERNAL_AUTH_SECRET` 既存内部認証機構の再利用。
- **Step2（システム仕様 sync — 更新要）**: 本タスクは **新規 middleware `requirePublicAccess` 追加 = 新規インターフェースあり**のため、`aiworkflow-requirements` の更新が必要。
  - `references/security-*.md`: 公開 API の認証境界が「未認証可」→「会員セッション OR 内部認証必須（fail-closed）」へ変わったことを反映。
  - `references/api-*.md`: `/public/*` のアクセスゲート（`requirePublicAccess`・401 挙動・`X-Internal-Auth` 内部経路）を新規インターフェースとして追記。
  - specs4 ファイル更新（AC-11）も本成果物に記載: `00-overview.md`（3 層アクセス制御 → 全ルート認証必須）/ `02-auth.md`（公開ルートも認証必須）/ `06-member-auth.md`（可視性テーブル是正）/ `01-api-schema.md`（公開 API は会員セッション or 内部認証必須）。

### 成果物 3: `outputs/phase-12/documentation-changelog.md`

- 更新したドキュメントの差分要約（specs4・implementation-guide・system-spec-update-summary・`aiworkflow-requirements` references）。
- 更新前後の意味の変化（「公開層は未ログイン可」→「全ルート認証必須」）を 1 行ずつ記録。

### 成果物 4: `outputs/phase-12/unassigned-task-detection.md`（0 件でも出力必須）

- **current**（本サイクルで発生した未タスク）: Phase 10 で記録した MINOR 指摘（あれば）を未タスク化対象として列挙。「機能に影響なし」を理由に却下しない。
- **baseline**（既存の周辺改善余地・スコープ外）: M-1（JWT 検証共通化が部分的な場合の追加最適化）/ M-2（`INTERNAL_AUTH_SECRET` 本番設定整備）の 2 項目を、本サイクルで対応しなかった範囲として current と分離して記録する。
- 0 件の場合も「current 0 件 / baseline N 件」と明記して出力する。

### 成果物 5: `outputs/phase-12/skill-feedback-report.md`（改善点なしでも出力必須）

- task-specification-creator / aiworkflow-requirements skill 適用時に気づいた改善点。
- 改善点が無い場合も「改善点なし」と明記して出力する。

### 成果物 6: `outputs/phase-12/phase12-task-spec-compliance-check.md`（root evidence）

- Phase 12 の 6 成果物が canonical 構成（必須 9 見出し・Phase 11 evidence 表・workflow root スキャン）に準拠していることの自己検証記録。
- `verify:phase12-compliance` が `ok:true` を返すための前提（Phase 11 evidence 表の `Classification | Path | Status` 形式・`present`/`pending`/`n/a` 語彙）を満たすこと。

## index 再生成・LOGS 更新

| 操作 | 対象 |
|------|------|
| `LOGS.md` 更新（× 2） | `docs/30-workflows/LOGS.md` と `.claude/skills/aiworkflow-requirements/` 配下の LOGS（該当する場合）に本タスクのエントリを追記 |
| topic-map 更新 | `aiworkflow-requirements` の topic-map / keywords を新規 middleware に対応させる |
| index 再生成 | `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` を実行し drift を解消（`verify-indexes-up-to-date` gate 対応） |

## 多角的チェック観点（AIが判断）

- 正本整合: specs4・`aiworkflow-requirements` の双方で「全ルート認証必須」が一貫しているか（片方だけ更新の正本不整合を防ぐ）。
- 学習資産: implementation-guide Part1 の例え話が、非技術ユーザーにも認証ゲートの目的を伝えられるか。

## サブタスク管理

- [ ] 6 成果物の必須内容を定義
- [ ] Step2 で `aiworkflow-requirements`（security-*.md / api-*.md）更新要を明記
- [ ] specs4 更新（AC-11）を記録
- [ ] LOGS×2 / topic-map 更新と `generate-index.js` 実行を定義
- [ ] unassigned-task-detection / skill-feedback-report は 0 件でも出力する旨を明記

## 成果物

| 成果物 | 配置 |
|--------|------|
| implementation-guide | `outputs/phase-12/implementation-guide.md` |
| system-spec-update-summary | `outputs/phase-12/system-spec-update-summary.md` |
| documentation-changelog | `outputs/phase-12/documentation-changelog.md` |
| unassigned-task-detection | `outputs/phase-12/unassigned-task-detection.md` |
| skill-feedback-report | `outputs/phase-12/skill-feedback-report.md` |
| phase12-task-spec-compliance-check | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## 完了条件

- [ ] 必須 6 成果物それぞれの必須内容が定義されている
- [ ] Step2 で新規 middleware 追加に伴う `aiworkflow-requirements` 更新（security-*.md / api-*.md）が明記されている
- [ ] specs4 更新（AC-11）が記録されている
- [ ] LOGS×2 / topic-map 更新と `generate-index.js` 実行が定義されている
- [ ] unassigned / skill-feedback は 0 件でも出力必須と明記されている

## タスク100%実行確認【必須】

- [ ] 6 成果物・Step2 sync・specs4・index 再生成をすべて記述した

## 次Phase

[phase-13.md](phase-13.md) — PR作成（**ユーザー明示承認後のみ**・最終 Phase）
