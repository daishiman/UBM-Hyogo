# cf-token-env-contract-and-rotation-retirement

[実装区分: 実装仕様書]

> **判定根拠（CONST_004 / CONST_005）**: 本タスクは shell script（`provision-staging-secrets.sh`）・GitHub Actions YAML（`runtime-smoke-staging.yml` / 新規 drift gate workflow / `cf-token-rotation-reminder.yml` 削除）・TypeScript verifier + Vitest test・runbook ドキュメントの変更を伴う。「CI が毎回赤くなる障害を解消し再発を構造的に防ぐ」という目的はコード変更なしでは達成不可能なため、ドキュメントのみ仕様書ではなく**実装仕様書**として作成する。トークン再発行・環境シークレット投入の一部は operational 手順だが、本実行サイクルが確実に実行できるよう runbook として手順を本仕様書に明記する（CONST_006）。

---

## メタ情報

| 項目 | 値 |
| ---- | --- |
| Task ID | TASK-CF-TOKEN-ENV-CONTRACT-AND-ROTATION-RETIREMENT-001 |
| Feature 名 | cf-token-env-contract-and-rotation-retirement |
| Task type | implementation（ci-gate / infra） |
| visualEvidence | NON_VISUAL（CI/インフラ。UI 表示物の変更なし。証跡は local shell/TS test log + actionlint + drift gate 実行ログ） |
| implementation_mode | new（implemented_local_evidence_captured。実装は本サイクル） |
| workflow_state | implemented_local_evidence_captured |
| 関連 issue | なし（CI 失敗ログ起点: backend-ci #706 `runtime smoke staging / bulk-tag-runtime-smoke` failure） |
| 親タスク | docs/30-workflows/completed-tasks/issue-1081-bulk-tag-real-d1-runtime-smoke（CF トークンを要求する `bulk-tag-runtime-smoke` ジョブの導入元） |
| 消費 unassigned task | なし |
| 関連先行タスク | completed-tasks/staging-mint-bearer-env-contract-guard（`verify-mint-env-contract` gate の導入元・責務分離の参照） |
| runtime_boundary | shell/yml/verifier/test/runbook の編集は同一 cycle で実装可能。Cloudflare トークン再発行・1Password 保管・`gh secret set` / provisioning 実行・commit・push・PR は user-gated。 |

---

## 背景・現状分析

CI `backend-ci`（実体は `runtime-smoke-staging.yml`）の `bulk-tag-runtime-smoke` ジョブが**再現性高く毎回失敗**している。

```
Error: missing secrets in environment 'staging-runtime-smoke': CLOUDFLARE_API_TOKEN
Error: Process completed with exit code 1.
```

| 観測事実 | 内容 |
| -------- | ---- |
| エラー箇所 | `runtime-smoke-staging.yml` の `bulk-tag-runtime-smoke` → `verify required staging secrets` step |
| env dump | `CLOUDFLARE_API_TOKEN:`（空） / `CLOUDFLARE_ACCOUNT_ID: b3dde7be...`（値あり） / `STAGING_API_BASE: ***`（値あり） |
| 第1ジョブ `smoke` は成功 | `smoke` は CF トークン不要（STAGING_* のみ）。CF トークンを要求するのは `bulk-tag-runtime-smoke` のみ |
| `provision-staging-secrets.sh` の `SECRETS` 配列 | `STAGING_*` + `SLACK_WEBHOOK_INCIDENT` のみ。**`CLOUDFLARE_API_TOKEN` を含まない** |
| `cf-token-rotation-reminder.yml` | 90日ローテーション運用が存在（85日で reminder issue 起票）。ただし今回の障害とは無関係 |
| `verify-mint-env-contract.mts` | mint 系 env のみ検査。`CLOUDFLARE_API_TOKEN` は検査対象外 → ギャップを検出できなかった |

**真因の確定**: `bulk-tag-runtime-smoke`（issue-1081 で追加）が要求する `CLOUDFLARE_API_TOKEN` が、環境シークレット投入の正本 `provision-staging-secrets.sh` に追加されなかった。`staging-runtime-smoke` 環境にトークンが**構造的に未登録**であり、かつ既存 drift gate がこの種の secret を検査対象外にしていたため、ギャップが検出されず、ジョブが `exit 1` で毎回赤くなる。**週次のトークン失効問題ではなく、provisioning 正本のギャップ**である。

---

## 真の論点（1文）

`staging-runtime-smoke` の `bulk-tag-runtime-smoke` が毎回赤くなる真因は「`CLOUDFLARE_API_TOKEN` が環境投入正本 `provision-staging-secrets.sh` に欠落し環境未登録」という構造ギャップであり、これを (1) provisioning 正本へ追加し、(2) 全消費 secret を provisioning 正本と突合する drift gate で再発を構造的に封じ、(3) graceful degrade で hard-fail を skip 化し、加えて (4) CF トークンを非失効・狭スコープ・環境分離へ再発行して 90日カレンダーローテーション（`cf-token-rotation-reminder`）を撤廃し「漏洩時即時失効」運用へ一本化する。

---

## issue 本文と実装の乖離

本タスクは GitHub issue ではなく CI 失敗ログ起点のため issue 本文との乖離はない。代わりに**ユーザー報告の認識と実態の乖離**を記録する。

| ユーザー報告の仮説 | 実態 | 仕様書での扱い |
| ------------------ | ---- | -------------- |
| 「1週間ごとに API キーを変える運用なのでは」 | ローテーションは 90日（`cf-token-rotation-reminder`）。今回の障害はローテーションと無関係 | 真因は provisioning ギャップと明記し、ローテーションは別軸の論点として整理 |
| 「API キーを変える取り組み自体をなくしたい」 | 非失効・狭スコープ・環境分離トークン + 漏洩時即時失効で実現可能 | ユーザー承認に基づき rotation reminder を撤廃（AC-5/AC-6） |
| 「本番も同じ運用でよいか」 | 本番デプロイトークンも非失効化可能。ただし爆発半径が大きいため狭スコープ・環境分離・即時失効を必須条件とする | ユーザー承認に基づき両環境を統一（AC-6 に production 条件を明記） |

---

## 設計核心 — 実装成果物

### Lane A: staging smoke token gap 解消（実障害の即時解消 + 再発防止）

| # | ファイル | 種別 | 役割 |
| - | -------- | ---- | ---- |
| A1 | `scripts/smoke/provision-staging-secrets.sh` | 編集 | `SECRETS` 配列へ `CLOUDFLARE_API_TOKEN`（1Password 参照）を追加。inventory 検証ループが自動的に環境登録を担保 |
| A2 | `.github/workflows/runtime-smoke-staging.yml` | 編集 | `bulk-tag-runtime-smoke` を graceful degrade 化。`CLOUDFLARE_API_TOKEN` 欠落時は hard-fail でなく `verify-bulk-inputs.outputs.cf_degraded=1` で skip。`STAGING_*` 欠落は従来通り hard-fail 維持 |
| A3 | `scripts/smoke/verify-runtime-smoke-secret-contract.mts` | 新規 | `runtime-smoke-staging.yml` の全消費 `secrets.*` を抽出し provisioning 正本（+ exempt list）と突合する drift gate |
| A4 | `scripts/smoke/__tests__/verify-runtime-smoke-secret-contract.spec.ts` | 新規 | A3 の Vitest（pure function unit test） |
| A5 | `.github/workflows/verify-runtime-smoke-secret-contract.yml` | 新規 | A3 を PR / push で実行する CI gate |

### Lane B: rotation 撤廃 + token 再発行ポリシー統一（staging + production）

| # | ファイル | 種別 | 役割 |
| - | -------- | ---- | ---- |
| B1 | `.github/workflows/cf-token-rotation-reminder.yml` | 削除 | 90日カレンダーローテーション撤廃 |
| B2 | `docs/30-workflows/operations/cf-token-provisioning-and-revocation-runbook.md` | 新規 | 非失効・狭スコープ・環境分離トークンの発行 / 保管 / 投入 / 漏洩時即時失効手順（rotation runbook の置換） |
| B3 | `docs/30-workflows/operations/cf-token-rotation-runbook.md` | 編集（tombstone 化） | 冒頭に「retired」マーカーと B2 への転送を記載し監査履歴として保持 |
| B4 | `docs/30-workflows/operations/cf-token-rotation-log.md` | 編集 | 末尾に「rotation policy retired・event-based revocation へ移行」を追記し履歴保持 |

> **operational（user-gated・runbook 記載・本仕様のコード変更には含まない実行手順）**:
> - staging smoke 用トークン発行（`ubm-hyogo-db-staging` の D1:Edit のみ・no-expiry）→ 1Password 保管 → `provision-staging-secrets.sh` 実行で環境投入。
> - production deploy 用トークン発行（production Workers Scripts:Edit + production D1:Edit のみ・no-expiry・staging とは**別トークン**）→ 既存 production 環境シークレット更新。
> - 旧トークンの失効。`CF_TOKEN_ISSUED_AT` repo var の削除（任意）。

### user-gated 境界

| 項目 | 境界 |
| ---- | ---- |
| shell / yml / verifier / test / runbook 編集 | 本 cycle で実装可能（spec → 本実行サイクル） |
| local test（Vitest / actionlint / bash -n） | 本実行サイクルで PASS 確認 |
| Cloudflare トークン再発行・1Password 保管 | **user-gated** |
| `gh secret set` / `provision-staging-secrets.sh` 実行 | **user-gated** |
| `cf-token-rotation-reminder.yml` 削除の commit / push / PR | **user-gated** |
| drift gate を dev/main の required status check に登録 | **user-gated**（branch protection 変更・CLAUDE.md ブランチ戦略） |

---

## 正本順位（衝突時の優先度）

1. `docs/30-workflows/completed-tasks/cf-token-env-contract-and-rotation-retirement/outputs/phase-*/`（本仕様書）
2. 実装コード現行 surface（`runtime-smoke-staging.yml` / `provision-staging-secrets.sh` / `verify-mint-env-contract.mts`）
3. `docs/00-getting-started-manual/specs/*.md`
4. `CLAUDE.md`（シークレット管理 / ブランチ戦略の運用参照）

---

## Phase 構成

| Phase | 内容 | 主成果物 |
| ----- | ---- | -------- |
| 1 | 要件定義（scope / AC / 不変条件 / inventory） | outputs/phase-1/phase-1.md |
| 2 | 設計（topology / lane / contract / 検証 path） | outputs/phase-2/phase-2.md |
| 3 | 設計レビュー（Phase 4 進行判定） | outputs/phase-3/phase-3.md |
| 4 | テスト作成（drift gate unit test / degrade matrix / actionlint） | outputs/phase-4/phase-4.md |
| 5 | 実装（A1〜A5 / B1〜B4 の変更手順） | outputs/phase-5/phase-5.md |
| 6 | テスト拡充（fail path / 回帰 guard） | outputs/phase-6/phase-6.md |
| 7 | カバレッジ確認（変更行 line/branch） | outputs/phase-7/phase-7.md |
| 8 | リファクタリング（重複排除 / 命名整合） | outputs/phase-8/phase-8.md |
| 9 | 品質保証（lint / typecheck / actionlint / mirror parity） | outputs/phase-9/phase-9.md |
| 10 | 最終レビュー（AC 判定 / blocker） | outputs/phase-10/phase-10.md |
| 11 | 手動テスト（NON_VISUAL・API/CI smoke evidence ledger） | outputs/phase-11/phase-11.md |
| 12 | ドキュメント更新（strict 7 outputs） | outputs/phase-12/phase-12.md |
| 13 | PR 作成（user 明示承認後） | outputs/phase-13/phase-13.md |

---

## 受入条件（AC サマリ・詳細は phase-1）

- **AC-1**: `provision-staging-secrets.sh` の `SECRETS` に `CLOUDFLARE_API_TOKEN`（op 参照）が含まれ、inventory 検証で `staging-runtime-smoke` 環境へ登録される。
- **AC-2**: `bulk-tag-runtime-smoke` は `CLOUDFLARE_API_TOKEN` 欠落時に hard-fail せず `::notice::` で degrade-skip。トークン存在時は従来通り smoke 実走。
- **AC-3**: `STAGING_API_BASE` / `STAGING_ADMIN_BEARER` 欠落は従来通り hard-fail（degrade 対象外）。
- **AC-4**: 新 drift gate が `runtime-smoke-staging.yml` の全消費 secret を provisioning 正本と突合し、未 provision secret（exempt 除く）があれば PR で fail。`CLOUDFLARE_API_TOKEN` 追加前は fail、追加後は PASS。
- **AC-5**: `cf-token-rotation-reminder.yml` を削除し、runbook を「非失効・狭スコープ・環境分離・漏洩時即時失効」へ置換する。
- **AC-6**: staging smoke トークンと production deploy トークンは別トークン・狭スコープ（staging=D1:Edit staging のみ / production=Workers+D1 production のみ）・no-expiry で runbook に発行手順が記載される。
- **AC-7**: 既存 `verify-mint-env-contract` の挙動は不変（責務分離）。
- **AC-8**: redaction / masking 不変条件維持（トークン値・JWT を log / artifact に出さない）。

---

## スコープ外（含まない）

- 本番ランタイム smoke（`production-runtime-smoke.yml` / attendance provider）の挙動変更（CF トークン非依存のため対象外）。
- D1 schema 変更・API endpoint 追加・Google Form 仕様変更。
- 既存 mint bearer env 契約（`verify-mint-env-contract`）の責務変更。
- GitHub OIDC によるトークンレス federation（個人開発規模に対しオーバーエンジニアリング。runbook に「不採用判断」として記録）。
