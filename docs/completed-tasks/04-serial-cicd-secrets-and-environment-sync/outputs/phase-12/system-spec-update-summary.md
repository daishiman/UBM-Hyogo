# システム仕様書 更新サマリー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | cicd-secrets-and-environment-sync |
| 対象 Phase | 12 |
| 作成日 | 2026-04-26 |

---

## 正本仕様ファイルの同期結果

| # | ファイルパス | 同期結果 | 根拠 |
| --- | --- | --- | --- |
| 1 | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | PASS | runtime / deploy / public の3分類、GitHub Secrets / Variables、Cloudflare Secrets、1Password Environments 方針が記載済み |
| 2 | `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` | PASS | `dev`→staging、`main`→production、PR承認不要・CI必須が記載済み |
| 3 | `.claude/skills/aiworkflow-requirements/references/deployment-core.md` | PASS | `web-cd.yml` と `backend-deploy.yml` の分離、Workers/OpenNext、Node 24 / pnpm 10、CI最小ゲートを反映済み |
| 4 | `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | PASS | local canonical が 1Password Environments であること、平文 `.env` を秘密の正本にしないことが記載済み |

> 注記: 実値（トークン等）はいかなる仕様ファイルにも記載しない。プレースホルダーのみ使用すること。

---

## same-wave sync チェック

### Wave 4 タスク一覧

| タスク名 | 実行種別 | 依存関係 | 本タスクとの整合性確認項目 |
| --- | --- | --- | --- |
| 04-serial-cicd-secrets-and-environment-sync（本タスク） | serial | 上流: 01a/01b/01c/02/03 | — |
| 05a-parallel-observability-and-cost-guardrails | parallel | 本タスク成果物を参照 | GitHub Actions workflow の secret 参照方法が一致しているか |
| 05b-parallel-smoke-readiness-and-handoff | parallel | 本タスク成果物を参照 | deploy path 分離（web / api）が handoff 仕様と一致しているか |

### sync チェック結果

| チェック項目 | 結果 | 備考 |
| --- | --- | --- |
| 05a が参照する deploy credential contract が本タスク placement matrix と一致する | PASS | 04 側 contract として GitHub Environment Secret `CLOUDFLARE_API_TOKEN` と GitHub Variable `CLOUDFLARE_ACCOUNT_ID` を固定 |
| 05b の handoff 仕様が web-cd / backend deploy の分離を前提とする | PASS | 04 側 contract として `web-cd.yml` / `backend-deploy.yml` の分離を固定 |
| 全 Wave 4 タスクで 1Password Environments を local canonical として扱う | PASS | 本タスク AC-3 で確定。05a / 05b に同一制約を伝達済み |

---

## 未解決事項（unassigned）

| ID | 内容 | 解消責任タスク | 優先度 |
| --- | --- | --- | --- |
| U-01 | backend workflow の具体ファイル名 | `.github/workflows/backend-deploy.yml` に固定 | 解消 |
| U-02 | 05a / 05b との secret 名照合 | 04 側 downstream contract として `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` の参照方法を固定 | 解消 |
| U-03 | Cloudflare Secret の rotation 周期 | `deployment-secrets-management.md` / `environment-variables.md` の90日ローテーション方針を参照 | 解消 |
| U-06 | D1 migration の CI/CD 組み込み | deploy workflow には未組み込み。`docs/unassigned-task/UT-22-d1-migration-sql-implementation.md` に分離済み | 継続管理 |

## Phase 11 screenshot 判定

| 項目 | 判定 | 根拠 |
| --- | --- | --- |
| UI/UX 変更 | N/A | 本タスクの実変更は workflow / package scripts / 仕様書であり、画面コンポーネント変更を含まない |
| Phase 11 screenshot | N/A | 画面変更がないため画像証跡は不要 |
| 代替証跡 | PASS | `outputs/phase-11/manual-smoke-log.md` と `outputs/phase-11/link-checklist.md` を Phase 11 evidence とする |
