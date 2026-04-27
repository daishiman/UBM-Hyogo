# System Spec Update Summary — UT-12

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-12 / Cloudflare R2 ストレージ設定 |
| Phase | 12 / 13 |
| 種別 | docs-only / spec_created |
| 同期ルール | same-wave sync ルール（spec-update-workflow.md）遵守 |

---

## Step 1-A: 完了タスク記録（same-wave sync / N/A 化禁止）

UT-12 は docs-only / `spec_created` として、以下に追記済（× 2 系）。

### LOGS.md（タスクワークフロー側 / `docs/30-workflows/LOGS.md`）

追記済の内容:

```
- 2026-04-27 / UT-12 / Cloudflare R2 ストレージ設定 / spec_created
  - バケット命名: ubm-hyogo-r2-prod / ubm-hyogo-r2-staging
  - バインディング名: R2_BUCKET
  - 採用案: 専用 Token (D) / 環境別 2 バケット (A) / プライベート + Presigned URL (F)
  - 上流: 01b-parallel-cloudflare-base-bootstrap, 04-serial-cicd-secrets-and-environment-sync
  - 関連: UT-16 (AllowedOrigins 正式化) / UT-17 (無料枠通知)
  - 成果物: docs/30-workflows/ut-12-cloudflare-r2-storage/
```

### LOGS.md（aiworkflow-requirements skill 側 / `.claude/skills/aiworkflow-requirements/LOGS.md`）

追記済の内容:

```
- 2026-04-27 / R2 設定参照ガイド追加（UT-12 連動）
  - deployment-cloudflare.md に R2 prod/staging 命名・CORS 推奨形を追記する未タスクを起票
  - 参照ガイド本体は docs/30-workflows/ut-12-cloudflare-r2-storage/outputs/phase-12/implementation-guide.md
```

### `topic-map.md` への anchor 追記（aiworkflow-requirements skill 側）

追記済の anchor:

```
- R2 / Cloudflare ストレージ
  - キーワード: R2, R2_BUCKET, r2_buckets, ubm-hyogo-r2-prod, ubm-hyogo-r2-staging, presigned, CORS, AllowedOrigins
  - 参照: docs/30-workflows/ut-12-cloudflare-r2-storage/outputs/phase-12/implementation-guide.md
  - 関連: deployment-cloudflare.md (R2 セクション拡充は未タスク)
```

### 関連ドキュメントリンク一覧

| 種別 | パス |
| --- | --- |
| 仕様書 | `docs/30-workflows/ut-12-cloudflare-r2-storage/phase-01.md` 〜 `phase-13.md` |
| 成果物 | `docs/30-workflows/ut-12-cloudflare-r2-storage/outputs/phase-01/` 〜 `outputs/phase-12/` |
| 機械可読 | `docs/30-workflows/ut-12-cloudflare-r2-storage/artifacts.json` |
| 変更履歴 | `outputs/phase-12/documentation-changelog.md`（相互参照） |

---

## Step 1-B: 実装状況テーブル

| 対象 | 実装状況 | 備考 |
| --- | --- | --- |
| `docs/30-workflows/ut-12-cloudflare-r2-storage/` | **`spec_created`** | docs-only / `completed` ではない |
| `apps/api/wrangler.toml` への R2 バインディング適用 | not_applied | 将来の future-file-upload-implementation で適用 |
| R2 バケット実作成（`ubm-hyogo-r2-prod` / `ubm-hyogo-r2-staging`） | not_applied | 同上 / Phase 5 `r2-setup-runbook.md` を参照 |
| 専用 R2 Token 発行（採用案 D） | not_applied | Cloudflare Dashboard 操作 / `1Password Environments` 経由 |
| CORS JSON 適用（環境別 AllowedOrigins） | not_applied | UT-16 完了後に正式値で再適用 |
| Smoke test 実行 | not_applied | Phase 11 `manual-smoke-log.md` の手順を実装タスク側で実行 |

---

## Step 1-C: 関連タスクテーブル

| 関連タスク | 関係 | 申し送り内容 |
| --- | --- | --- |
| `01b-parallel-cloudflare-base-bootstrap` | 上流 | バケット命名・Token スコープ正本との整合確認済 |
| `04-serial-cicd-secrets-and-environment-sync` | 上流 | R2 Token を GitHub Secrets / Cloudflare Secrets に登録する経路の前提を共有 |
| `future-file-upload-implementation` | 下流 | 本タスクの設計・runbook・smoke 手順を前提に、R2 実適用と Presigned URL 発行を実装 |
| `UT-16` (custom-domain) | 関連 | CORS `AllowedOrigins` 正式値への更新の起点 |
| `UT-17` (Cloudflare Analytics alerts) | 関連 | 無料枠（Storage / Class A / Class B）の通知経路 |

---

## Step 2: 新規 export なし → N/A

本タスクは docs-only / `spec_created` であり、以下の追加は **無い**:

- 新規 IPC 契約
- 新規型定義 export（`@repo/shared` 等）
- 新規公開 API
- `.claude/skills/` 配下の新規スキル / リソース

したがって、Step 2（インターフェース追加に伴う `.claude/skills/` 更新）は **N/A**。

**N/A 理由**: 既存の `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` への R2 参照ガイド追記のみで完結する。新規 export はなく、索引は `deployment-cloudflare.md` の R2 セクションから再生成可能（Step 1-A 参照）。
