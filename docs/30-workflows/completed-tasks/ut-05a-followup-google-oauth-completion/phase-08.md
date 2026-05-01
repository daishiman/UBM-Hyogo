# Phase 8: DRY 化 / リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Google OAuth Staging Smoke + Production Verification 統合 (UT-05A-FOLLOWUP-OAUTH) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 / リファクタリング |
| 作成日 | 2026-04-30 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | spec_created |
| タスク分類 | specification-design（refactoring / dry） |

## 目的

Phase 1〜7 で確定した「configuration 単一正本 + 段階適用」を **物理的な単一正本ファイル群**として固定し、`02-auth.md` / `13-mvp-auth.md` / `.claude/skills/aiworkflow-requirements/references/environment-variables.md` などの上位仕様が **link 参照のみ**で済む状態を作る。runbook も同様に、05a の `smoke-checklist.md` を staging smoke の唯一正本として再記載しない方針を確定する。secrets 配置 / redirect URI / consent screen / 段階適用 runbook の 4 文書が **誰がどこを書き、どこから読むか** の所有・参照グラフを明示する。

## 実行タスク

1. secrets 配置の単一正本化方針を確定する（完了条件: `outputs/phase-02/secrets-placement-matrix.md` が正本、参照元 3 箇所が link で参照する流れが図示）。
2. redirect URI matrix の単一正本化方針を確定する（完了条件: `outputs/phase-02/oauth-redirect-uri-matrix.md` が正本、Phase 5 / Phase 11 が link 参照のみ）。
3. consent screen spec の単一正本化方針を確定する（完了条件: `outputs/phase-02/consent-screen-spec.md` が正本、Phase 5 / Phase 11 Stage B が link 参照のみ）。
4. runbook 共通化方針を確定する（完了条件: 05a `smoke-checklist.md` を staging smoke 正本として **再記載しない**。本タスク Phase 5 runbook は手順番号で smoke-checklist.md を呼ぶ形式に統一）。
5. 命名揺れ（`OAUTH_*` / `GOOGLE_*` / `AUTH_*`）の Before/After 整理（完了条件: 揺れ件数表化）。
6. navigation drift（artifacts.json / index.md / phase-XX.md / outputs path）が 0（完了条件: link 切れ 0）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-05a-followup-google-oauth-completion/phase-01.md 〜 phase-07.md | DRY 化対象 |
| 必須 | docs/30-workflows/ut-05a-followup-google-oauth-completion/index.md | 用語・命名の正本 |
| 必須 | docs/00-getting-started-manual/specs/02-auth.md | secrets 配置を参照する側 |
| 必須 | docs/00-getting-started-manual/specs/13-mvp-auth.md | B-03 状態 / secrets 配置を参照する側 |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | secrets 配置の skill 側参照点 |
| 必須 | docs/30-workflows/completed-tasks/05a-parallel-authjs-google-oauth-provider-and-admin-gate/outputs/phase-11/smoke-checklist.md | staging smoke test ID の正本（再記載禁止） |

## 単一正本（source-of-truth）グラフ

```
                            ┌─────────────────────────────────────────────┐
                            │ outputs/phase-02/secrets-placement-matrix.md │  ← 正本（本タスク所有）
                            └─────────────────────────────────────────────┘
                                ▲              ▲                ▲
                                │              │                │
              ┌─────────────────┘              │                └────────────────────┐
              │                                │                                     │
  docs/00-getting-started-manual    docs/00-getting-started-manual    .claude/skills/aiworkflow-requirements
        /specs/02-auth.md                /specs/13-mvp-auth.md             /references/environment-variables.md
              │ link 参照                     │ link 参照                              │ link 参照
              └────────────── 値の重複定義禁止 ─────────────────────────────────────────┘

                            ┌─────────────────────────────────────────────┐
                            │ outputs/phase-02/oauth-redirect-uri-matrix.md│  ← 正本
                            └─────────────────────────────────────────────┘
                                ▲              ▲
                                │              │
                  outputs/phase-05      outputs/phase-11/staging
                  /implementation-      /redirect-uri-actual.md
                  runbook.md            outputs/phase-11/production
                                        /redirect-uri-actual.md
                                        ↑ actual 表は matrix と diff 0 を Phase 11 で確認

                            ┌─────────────────────────────────────────────┐
                            │ outputs/phase-02/consent-screen-spec.md      │  ← 正本
                            └─────────────────────────────────────────────┘
                                ▲              ▲
                                │              │
                  outputs/phase-05      outputs/phase-11/production
                  /implementation-      /consent-screen.png
                  runbook.md            /verification-submission.md

                            ┌─────────────────────────────────────────────┐
                            │ 05a/outputs/phase-11/smoke-checklist.md      │  ← staging smoke test ID 正本（既存）
                            └─────────────────────────────────────────────┘
                                ▲
                                │ link 参照（再記載禁止）
                  outputs/phase-05/implementation-runbook.md
                  outputs/phase-11/staging/manual-smoke-log.md
```

## Before / After 比較テーブル

### secrets 配置の参照

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `02-auth.md` | secrets 配置を本文に直接記述する余地 | 「`outputs/phase-02/secrets-placement-matrix.md` を参照」と link のみ | DRY / 実値混入リスク低減 |
| `13-mvp-auth.md` | B-03 状態と secrets を別個に書く可能性 | `secrets-placement-matrix.md` link + verification status のみ書く | source-of-truth 単一化 |
| `environment-variables.md`（skill） | 抽象論のみ | 具体配置は本タスク matrix へ link | skill 側は方針、本タスクは実行表 |

### redirect URI 参照

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| Phase 5 runbook | redirect URI を runbook 内に再列挙 | matrix へ link し「環境名のみ」runbook で指す | 重複定義 0 |
| Phase 11 staging actual | matrix を再記述 | matrix と diff を取り actual のみ記録 | 整合確認の簡素化 |
| Phase 11 production actual | 同上 | 同上 | 同上 |

### consent screen spec 参照

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| Phase 5 runbook | scope / privacy URL / authorized domain を再記述 | `consent-screen-spec.md` へ link | DRY |
| Phase 11 Stage B 手順 | spec を再記述 | spec link + 実 submit 結果のみ記録 | 単一正本 |

### runbook 共通化（smoke-checklist.md の扱い）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 本タスク Phase 5 runbook | M-01〜M-11 / F-09 / F-15 / F-16 / B-01 を本文に再記載する余地 | **再記載禁止**。「05a `smoke-checklist.md` の M-01 を実行」と test ID と link のみで指す | 05a が staging smoke test ID 正本のため重複禁止 |
| 本タスク Phase 11 staging log | smoke-checklist の test ID を流し込む | test ID 列を借りて PASS/FAIL のみ追記 | 列重複削減 |
| 本タスク独自の追加手順（Stage B/C） | smoke-checklist に書き戻す誘惑 | 本タスク runbook 内に閉じ込める（05a に逆流させない） | 責務分離 |

### 命名揺れ

| 対象 | Before（混在の可能性） | After | 理由 |
| --- | --- | --- | --- |
| OAuth client 識別子 | `OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_CLIENT_ID` | `GOOGLE_CLIENT_ID` に統一 | Auth.js / Google provider 規約 |
| OAuth client 秘密鍵 | `OAUTH_CLIENT_SECRET` / `GOOGLE_CLIENT_SECRET` | `GOOGLE_CLIENT_SECRET` | 同上 |
| Auth.js secret | `NEXTAUTH_SECRET` / `AUTH_SECRET` | `AUTH_SECRET`（Auth.js v5） | Auth.js v5 規約 |
| Auth.js base URL | `NEXTAUTH_URL` / `AUTH_URL` | `AUTH_URL`（Auth.js v5） | 同上 |
| admin_users.active | `ADMINS` / `ADMIN_EMAILS` / `admin_users.active` | `admin_users.active` | 05a 既存実装と整合 |
| Stage 表記 | `staging-smoke` / `stage-a` / `staging` | `Stage A: staging smoke` / `Stage B: production verification` / `Stage C: production smoke` | Phase 2 段階適用と一致 |

## 重複削除箇所一覧

| # | 重複候補 | 抽出方針 | 適用範囲 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | secrets 配置（key 名 / 1Password 参照 / Cloudflare env） | `secrets-placement-matrix.md` を正本、他は link | `02-auth.md` / `13-mvp-auth.md` / `environment-variables.md` / Phase 5 runbook / Phase 11 evidence | 実値の混入禁止を再強調 |
| 2 | redirect URI 一覧 | `oauth-redirect-uri-matrix.md` を正本 | Phase 5 runbook / Phase 11 staging actual / Phase 11 production actual | 環境名のみ runbook で指す |
| 3 | consent screen 値（scope / authorized domain / privacy URL） | `consent-screen-spec.md` を正本 | Phase 5 runbook / Phase 11 Stage B | scope は最小権限を再宣言しない |
| 4 | staging smoke test ID（M-01〜M-11 等） | 05a `smoke-checklist.md` を正本 | 本タスク Phase 5 runbook / Phase 11 staging log | **本タスク内では絶対に再記載しない** |
| 5 | 段階適用フロー A→B→C | `staging-vs-production-runbook.md` を正本 | Phase 5 runbook / Phase 11 main / index | フロー図は Phase 2 のみ |
| 6 | B-03 解除条件 a/b/c | `13-mvp-auth.md`（更新後）を将来の正本、本タスク完了までは Phase 1 / Phase 2 を一時正本 | Phase 11 / Phase 12 | Phase 12 で正本を `13-mvp-auth.md` に移管 |

## 共通化パターン

- 命名: `AUTH_SECRET` / `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `AUTH_TRUST_HOST` / `AUTH_URL` を 6 key の固定セットとして全 Phase で再利用。
- 環境名: `staging` / `production` の 2 値固定（`stg` / `prod` 短縮形は使わない）。
- Stage 表記: `Stage A` / `Stage B` / `Stage C` に統一。
- 評価軸: 4 条件は「価値性 / 実現性 / 整合性 / 運用性」の順序固定。
- evidence path: `outputs/phase-11/staging/` / `outputs/phase-11/production/` の 2 ディレクトリに収束。
- secrets 投入経路: `bash scripts/cf.sh secret put` 単一経路（`wrangler secret put` を直接書かない）。

## navigation drift の確認

| チェック項目 | 確認方法 | 想定結果 |
| --- | --- | --- |
| artifacts.json `phases[*].outputs` と各 phase-XX.md の成果物 path 一致 | grep `outputs/phase-` | 完全一致 |
| index.md `Phase 一覧` 表の file 列と実ファイル名 | ls で照合 | 完全一致 |
| index.md `主要成果物` 表のパス | artifacts.json と突き合わせ | 完全一致 |
| phase-XX.md 内の他 phase 参照リンク | `phase-YY.md` を全件確認 | リンク切れ 0 |
| 05a `smoke-checklist.md` への参照 | `docs/30-workflows/completed-tasks/05a-parallel-authjs-google-oauth-provider-and-admin-gate/outputs/phase-11/smoke-checklist.md` | 実在 |
| `02-auth.md` / `13-mvp-auth.md` 参照 | 既存 path 確認 | 実在 |
| `environment-variables.md` 参照 | `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | 実在 |
| `scripts/cf.sh` 参照 | `scripts/cf.sh` | 実在 |

## 削除対象一覧（drift 防止）

- 各 Phase 仕様書内に書かれていた / 書かれそうな実値（client_id / client_secret / token / authorized email 等）。
- `wrangler secret put` を直接書いた手順（`bash scripts/cf.sh secret put` に置換）。
- `wrangler login` 手順（記述禁止）。
- 05a `smoke-checklist.md` のテスト ID を本タスク内に再列挙したセクション。
- redirect URI / consent screen 値を runbook / Phase 11 内に再記載したブロック。

## 実行手順

### ステップ 1: source-of-truth グラフ確定
- 4 文書（secrets / redirect URI / consent / runbook）の正本と参照関係を Phase 8 main.md に図示。
- smoke-checklist.md は 05a 所有のため本タスクは「読み手」のみ。

### ステップ 2: Before / After 比較テーブル作成
- 4 区分（secrets / redirect URI / consent / runbook）+ 命名揺れ で記述。

### ステップ 3: 重複削除箇所 6 件以上の列挙
- 上表のとおり 6 件以上を確定。

### ステップ 4: navigation drift 確認
- artifacts.json と各 phase-XX.md の path を照合し link 切れ 0。

### ステップ 5: outputs/phase-08/main.md に集約
- 上記すべてを 1 ドキュメントに統合。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | DRY 化済み命名・path を品質保証チェックリストの前提に使用 |
| Phase 10 | navigation drift 0 を GO/NO-GO の根拠に使用 |
| Phase 11 | smoke-checklist.md 再記載禁止ルールを Stage A 実行時に再確認 |
| Phase 12 | system-spec-update-summary.md / documentation-changelog.md / 02-auth.md 更新 / 13-mvp-auth.md 更新で本グラフを採用 |
| 05a-parallel-authjs-google-oauth-provider-and-admin-gate | smoke-checklist.md 正本性の維持（本タスクから書き戻さない） |

## 多角的チェック観点

- 価値性: 単一正本化により verification 申請後の運用更新コスト削減。
- 実現性: 4 文書の正本化が `02-auth.md` / `13-mvp-auth.md` / `environment-variables.md` の既存構成と矛盾しない。
- 整合性: 不変条件 #2（consent キー統一）/ #5（D1 access 閉鎖）に違反しない。本タスクは D1 / Sheets schema を触らない。
- 運用性: 命名・環境名・Stage 表記の統一で runbook / log 検索性が向上。
- セキュリティ: source-of-truth 集約により、実値混入のリスクポイントが 1 箇所に集中（その 1 箇所で `op://` 参照のみを徹底すれば横展開不要）。
- AI 学習混入防止: 仕様書本体に実値を書かないルールを Phase 8 で再確認。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | secrets 単一正本化グラフ作成 | 8 | spec_created | 02-auth / 13-mvp-auth / environment-variables が link |
| 2 | redirect URI matrix 単一正本化 | 8 | spec_created | actual は diff のみ |
| 3 | consent screen spec 単一正本化 | 8 | spec_created | scope 再記載禁止 |
| 4 | smoke-checklist.md 再記載禁止ルール確定 | 8 | spec_created | 05a 正本維持 |
| 5 | 命名揺れ Before/After 整理 | 8 | spec_created | 6 key 固定 |
| 6 | navigation drift 確認 | 8 | spec_created | リンク切れ 0 |
| 7 | outputs/phase-08/main.md 作成 | 8 | spec_created | 全項目集約 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | DRY 化結果（source-of-truth グラフ・Before/After・重複削除箇所・navigation drift） |
| メタ | artifacts.json | Phase 8 状態の更新 |

## 完了条件

- [ ] source-of-truth グラフが 4 文書 + 1 外部正本（smoke-checklist.md）で図示
- [ ] Before / After 比較テーブルが 5 区分（secrets / redirect URI / consent / runbook / 命名）すべてで埋まっている
- [ ] 重複削除箇所が 6 件以上列挙されている
- [ ] smoke-checklist.md 再記載禁止が明記されている
- [ ] navigation drift（artifacts.json / index.md / phase-XX.md / outputs path）が 0
- [ ] 6 key 固定（AUTH_SECRET / GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / admin_users.active / AUTH_TRUST_HOST / AUTH_URL）が確定
- [ ] outputs/phase-08/main.md が作成済み

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- 成果物が `outputs/phase-08/main.md` に配置予定
- Before / After が 5 区分で網羅
- 重複削除箇所 6 件以上
- navigation drift 0
- 仕様書内に client_id / client_secret / token / authorized email の実値が 0 件
- artifacts.json の `phases[7].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 9 (品質保証)
- 引き継ぎ事項:
  - source-of-truth グラフ（Phase 9 link 検証 / セキュリティ確認の前提）
  - 6 key 固定セット（Phase 9 free-tier 見積もりで Cloudflare Secrets count に反映）
  - smoke-checklist.md 再記載禁止ルール（Phase 11 Stage A 実行時の再確認入力）
  - navigation drift 0 状態の維持
- ブロック条件:
  - Before / After に空セルが残る
  - navigation drift が 0 にならない
  - 4 文書の正本性が崩れる（複数箇所に分散定義）
  - smoke-checklist.md を本タスク内に再列挙してしまう
