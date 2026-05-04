# ut-09a-cloudflare-auth-token-injection-recovery-001

[実装区分: 実装仕様書]

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | Wave 9 |
| mode | serial |
| owner | - |
| 状態 | runtime_evidence_captured |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| issue | https://github.com/daishiman/UBM-Hyogo/issues/414 (OPEN, keep as-is — spec written as if CLOSED) |
| task_id | UT-09A-CLOUDFLARE-AUTH-TOKEN-INJECTION-RECOVERY-001 |

## purpose

`bash scripts/cf.sh whoami` が `You are not authenticated` を返している状態を、1Password / `.env` / Cloudflare API Token 注入経路の整合確認と必要最小修正で復旧し、staging 操作対象 Cloudflare account で `bash scripts/cf.sh whoami` が exit 0 を返す状態に戻す。secret 値を stdout / artifact / log / commit / 仕様書のいずれにも出さず、復旧 evidence path を親タスク `ut-09a-exec-staging-smoke-001` に引き渡す。

## why this is not a restored old task

このタスクは過去機能の復活ではなく、`docs/30-workflows/unassigned-task/task-09a-cloudflare-auth-token-injection-recovery-001.md` で formalize された「`scripts/cf.sh whoami` failure を 1Password → mise → wrangler の三段ラップ整合性確認で復旧する」ことだけを責務とする follow-up である。`ut-09a-exec-staging-smoke-001` Phase 11 で発見された preflight blocker（staging deploy smoke / wrangler tail / Forms sync / Playwright screenshot が全て停止）の真因のうち、**Cloudflare 認証経路** に限定して bug-fix する。新機能追加・wrangler 直接実行への切替・OAuth login 経路採用は含まない。

## scope in / out

### Scope In

- `bash scripts/cf.sh whoami` が exit 0 で staging 操作対象 account を返す状態への復旧
- `.env` の op 参照（`op://...` 形式）が指す 1Password item の存在確認（値は読まない）
- 1Password CLI (`op`) signin 状態の確認手順
- Cloudflare API Token に必要な scope（Workers Scripts Edit / D1 Edit / Pages Edit 等 staging 操作に必要なもの）の点検 SOP
- `scripts/cf.sh` / `scripts/with-env.sh` 経路に drift がないかの確認
- 復旧後の `bash scripts/cf.sh whoami` 実行 evidence の取得手順（標準出力のみ、token 値は除外）
- 復旧 evidence path を親タスク `ut-09a-exec-staging-smoke-001` Phase 11 へ引き渡す手順
- Phase 12 での system spec / `references/task-workflow-active.md` 同期

### Scope Out

- Cloudflare API Token の値そのものの仕様書記録
- `op://Vault/Item/Field` の vault 名・item 名を実値ベースで仕様書に書くこと（参照キー名のみ抽象化）
- `wrangler login` による OAuth トークン経路の採用（CLAUDE.md で禁止）
- `wrangler` を直接呼ぶ手順への変更
- production 認証経路の改修（本タスクは staging 復旧 SOP の確立に閉じる。production は同経路で副次的に復旧する想定）
- 親タスク `ut-09a-exec-staging-smoke-001` 自体の deploy smoke 実行
- Issue #414 の状態変更（OPEN のまま据え置き、reopen / close は行わない）
- ユーザー明示指示なしの commit / push / PR 作成 / 実 deploy

## dependencies

### Depends On

- ut-27-github-secrets-variables-deployment（Cloudflare API Token / account id を 1Password 側に保管している前提）
- 1Password CLI (`op`) ローカルインストール / signin 機能（環境前提）
- `scripts/cf.sh` / `scripts/with-env.sh` の既存実装（CLAUDE.md「Cloudflare 系 CLI 実行ルール」が正本）

### Blocks

- `ut-09a-exec-staging-smoke-001` Phase 11 の再実行（本タスク完了で `whoami` exit 0 状態が回復するまで blocked）
- 09a 系 staging evidence 全般（deploy / curl / wrangler tail / Forms sync / Playwright）
- 09c production deploy gate の解放（09a staging PASS が前提）

## refs

- docs/30-workflows/unassigned-task/task-09a-cloudflare-auth-token-injection-recovery-001.md
- https://github.com/daishiman/UBM-Hyogo/issues/414
- docs/30-workflows/ut-09a-exec-staging-smoke-001/outputs/phase-11/main.md
- docs/30-workflows/ut-09a-exec-staging-smoke-001/outputs/phase-11/wrangler-tail.log
- scripts/cf.sh（編集候補 — drift 確認 / 必要時に最小修正）
- scripts/with-env.sh（編集候補 — drift 確認 / 必要時に最小修正）
- .env（読まない・op 参照のみ確認対象）
- CLAUDE.md「シークレット管理」「Cloudflare 系 CLI 実行ルール」セクション
- .claude/skills/aiworkflow-requirements/references/task-workflow-active.md

## AC

- AC-1: `bash scripts/cf.sh whoami` が exit 0 で完了し、staging 操作対象 Cloudflare account identity が標準出力に現れる
- AC-2: 復旧過程・復旧後 evidence のいずれにも secret 値（API Token / OAuth token / cookie / account secret）が混入していない
- AC-3: `.env` の Cloudflare API Token に対応する op 参照キーが存在し、対応する 1Password item が存在することが「存在確認のみ」で記録されている（値は記録しない）
- AC-4: API Token に Workers Scripts Edit / D1 Edit / Pages Edit など staging 操作に必要な scope が付与されていることが SOP 上で確認されている（実 token を覗かずに、1Password 上の説明・名前 / Cloudflare dashboard 上の token 設定で確認）
- AC-5: `scripts/cf.sh whoami` の三段ラップ（`op run --env-file=.env` → `mise exec --` → `wrangler whoami`）の各段で「ここまでは到達した / どこで落ちた」が切り分けられる SOP が成立している
- AC-6: 復旧 evidence path（exit code / account identity 抜粋）が `ut-09a-exec-staging-smoke-001` Phase 11 に引き渡せる形で `outputs/phase-11/` 配下へ保存されている
- AC-7: `wrangler login` がローカルに残っていない、または `.env` op 参照経路を上書きしないことが SOP で確認されている

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義
- [phase-02.md](phase-02.md) — 設計
- [phase-03.md](phase-03.md) — 設計レビュー
- [phase-04.md](phase-04.md) — テスト戦略
- [phase-05.md](phase-05.md) — 実装ランブック
- [phase-06.md](phase-06.md) — 異常系検証
- [phase-07.md](phase-07.md) — AC マトリクス
- [phase-08.md](phase-08.md) — DRY 化
- [phase-09.md](phase-09.md) — 品質保証
- [phase-10.md](phase-10.md) — 最終レビュー
- [phase-11.md](phase-11.md) — 手動 smoke / 実測 evidence
- [phase-12.md](phase-12.md) — ドキュメント更新
- [phase-13.md](phase-13.md) — PR 作成

## outputs

- outputs/phase-01/main.md
- outputs/phase-02/main.md
- outputs/phase-03/main.md
- outputs/phase-04/main.md
- outputs/phase-05/main.md
- outputs/phase-06/main.md
- outputs/phase-07/main.md
- outputs/phase-08/main.md
- outputs/phase-09/main.md
- outputs/phase-10/main.md
- outputs/phase-11/main.md
- outputs/phase-12/main.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md
- outputs/phase-13/main.md

Phase 11 runtime evidence（`whoami` exit code / account identity 抜粋）は 2026-05-04 に取得済み。`outputs/phase-11/` 配下に redacted evidence を保存し、Phase 12 の 7 固定成果物も実体配置済み。

## invariants touched

- CLAUDE.md「Cloudflare 系 CLI 実行ルール」 — `wrangler` 直接実行禁止、`bash scripts/cf.sh` 経由のみが正本であることを再確認・強化する
- CLAUDE.md「ローカル `.env` の運用ルール」 — `.env` の中身を `cat` / `Read` / `grep` で読まないことを SOP として再確認する
- CLAUDE.md「禁止事項」 — `wrangler login` で OAuth トークンをローカルに保持しないことを再確認する
- secret 値（API Token / OAuth token）は stdout / artifact / log / commit / 仕様書のいずれにも記録しない
- Issue #414 は本仕様書作成では状態を変更しない（OPEN のまま据え置き）

## completion definition

全 phase 仕様書（phase-01〜phase-13）が揃い、Phase 11 evidence（`bash scripts/cf.sh whoami` exit 0 / account identity 抜粋 / redaction PASS）と Phase 12 close-out の 7 成果物が定義され、`scripts/cf.sh` 経由復旧手順、user 承認 gate（commit / push / PR）が明確であること。実 `whoami` は 2026-05-04 に実行済みで、commit・push・PR は行わない。

## issue 連携

- Issue #414 は OPEN のまま据え置き、本仕様書作成では reopen / close 操作を行わない（CLOSED 扱いで spec を書く運用方針）
- runtime_evidence_captured 段階でも Issue 状態を変更しない
- 実復旧実行・PR 作成時に必要であればユーザーが明示的に指示する
