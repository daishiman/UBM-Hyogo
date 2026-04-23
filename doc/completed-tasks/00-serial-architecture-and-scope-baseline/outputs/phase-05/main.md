# Phase 5 出力: main.md
# セットアップ実行

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | architecture-and-scope-baseline |
| Phase | 5 / 13 (セットアップ実行) |
| 作成日 | 2026-04-23 |
| 状態 | completed |
| 入力 | outputs/phase-04/main.md (事前検証手順確立) |

---

## 1. docs-only タスクの成果物方針

本タスク (`architecture-and-scope-baseline`) は `docs_only: true` として定義されている。したがって以下の方針を採用する。

| 方針 | 説明 |
| --- | --- |
| **実値ファイルではなく runbook と placeholder を成果物にする** | wrangler.toml, .env, secrets 等の実値ファイルは本タスクの成果物に含めない。代わりに「何をどこに設定するか」を記述した runbook と `<PLACEHOLDER>` 形式の参照表を成果物とする |
| コード実装は行わない | `apps/web`, `apps/api`, `packages/*` 等のソースコードへの変更は一切行わない |
| 外部サービスへの実アクセスは行わない | Cloudflare API, Google Sheets API, GitHub API への実操作は行わない |
| downstream 参照パスを確定する | Wave 1 の下流タスクが参照すべき canonical path を明示する |

---

## 2. 実行手順全文

### Step 1: 設計書更新

**目的**: canonical-baseline.md と decision-log.md が正本仕様と整合していることを確認し、最終版として確定する。

| 手順 | 操作内容 | 確認方法 |
| --- | --- | --- |
| 1-A | `outputs/phase-02/canonical-baseline.md` の内容を開き、アーキテクチャ基準線 (セクション1) が正本仕様 (architecture-overview-core.md) と一致していることを確認する | 目視確認 / 差分なし |
| 1-B | `outputs/phase-02/canonical-baseline.md` のブランチ/環境対応表 (セクション2) が `feature/*→dev→main` / `local→staging→production` と記載されていることを確認する | 目視確認 |
| 1-C | `outputs/phase-02/decision-log.md` のシークレット配置マトリクス (canonical-baseline.md セクション4) に実値が含まれないことを確認する | `rg -n "実値\|password\|token" outputs/` で確認 |

### Step 2: runbook 草案作成

**目的**: Wave 1 以降の実装タスクが参照するための手順書 (runbook) の草案を作成する。本 Phase では内容の正確性より構造の確立を優先する。

runbook の構成要素:

```
runbook-draft/
  01-cloudflare-setup.md       # Cloudflare Pages / Workers / D1 の初期設定手順 (placeholder)
  02-github-secrets-setup.md   # GitHub Secrets の設定手順 (placeholder)
  03-1password-setup.md        # 1Password Environments の設定手順 (placeholder)
  04-google-sheets-setup.md    # Google Sheets API 認証手順 (placeholder)
```

**注意**: 本 Phase では runbook の構造定義のみ行い、実際のファイル作成は下流タスク (02-serial-monorepo-runtime-foundation) で実施する。本 Phase の成果物は「runbook が必要であることとその構成」の記録である。

### Step 3: downstream 参照表更新

**目的**: Wave 1 の各タスクが参照すべき canonical path を確定する。

| 参照先タスク | 参照ファイル (canonical path) | 参照セクション |
| --- | --- | --- |
| 02-serial-monorepo-runtime-foundation | `doc/00-serial-architecture-and-scope-baseline/outputs/phase-02/canonical-baseline.md` | セクション1 (構成), セクション3 (責務境界), セクション4 (シークレット配置) |
| 03-serial-data-source-and-storage-contract | `doc/00-serial-architecture-and-scope-baseline/outputs/phase-02/canonical-baseline.md` | セクション1 (DB層/入力源), セクション3 (入力源責務) |
| 03-serial-data-source-and-storage-contract | `doc/00-serial-architecture-and-scope-baseline/outputs/phase-02/decision-log.md` | DL-03 (Sheets 非採用理由), DL-04 (D1 採用理由) |
| Wave 1 全タスク | `doc/00-serial-architecture-and-scope-baseline/outputs/phase-02/canonical-baseline.md` | セクション2 (ブランチ/環境対応表) |

**下流タスクの参照パスが変更された場合**: 本ファイルの Step 3 と canonical-baseline.md のセクション5 を同時に更新すること。

---

## 3. 各ステップ後の sanity check 結果

### sanity check 1: scope 外サービス未追加

| 確認項目 | 確認内容 | 結果 |
| --- | --- | --- |
| 通知基盤の未追加 | Slack / メール / Teams 等の通知サービスが設計に追加されていないこと | PASS: decision-log.md OOS-04 で明示的に除外済み |
| モニタリングの未追加 | Datadog / Sentry 等の監視サービスが追加されていないこと | PASS: decision-log.md OOS-07 で明示的に除外済み |
| 実コード実装の未実施 | apps/web, apps/api 等のソースコードが変更されていないこと | PASS: 本タスクは docs-only であり、コード変更は行っていない |
| 有料サービスの未導入 | 全コンポーネントが Cloudflare 無料枠 + Google Sheets 無料枠内で運用可能であること | PASS: canonical-baseline.md セクション1 の備考欄で「無料枠で運用」と明示 |

### sanity check 2: branch/env/secret が正本仕様と一致

| 確認項目 | 確認内容 | 結果 |
| --- | --- | --- |
| branch 名 | `feature/*` / `dev` / `main` の3種類のみ使用 | PASS: canonical-baseline.md セクション2 で `develop` / `master` 等の旧記法なし |
| env 名 | `local` / `staging` / `production` の3種類のみ使用 | PASS: canonical-baseline.md セクション2 で一致を確認 |
| Cloudflare Secrets | ランタイムシークレットが Cloudflare Secrets に配置 | PASS: canonical-baseline.md セクション4 で確認 |
| GitHub Secrets | CI/CD シークレットが GitHub Secrets に配置 | PASS: canonical-baseline.md セクション4 で確認 |
| 1Password | ローカル秘密情報の正本が 1Password Environments に配置 | PASS: canonical-baseline.md セクション4 で確認 |
| secret 実値なし | placeholder のみ使用、実値の記載なし | PASS: シークレット実値は一切記載されていない |

### sanity check 3: downstream 参照パスが存在する

| 確認項目 | 参照パス | 結果 |
| --- | --- | --- |
| canonical-baseline.md の存在 | `doc/00-serial-architecture-and-scope-baseline/outputs/phase-02/canonical-baseline.md` | PASS: ファイル存在確認済み |
| decision-log.md の存在 | `doc/00-serial-architecture-and-scope-baseline/outputs/phase-02/decision-log.md` | PASS: ファイル存在確認済み |
| baseline-inventory.md の存在 | `doc/00-serial-architecture-and-scope-baseline/outputs/phase-01/baseline-inventory.md` | PASS: ファイル存在確認済み |

---

## 4. Phase 6 への引き継ぎ

### Blockers

なし。全 sanity check が PASS。Phase 6 (異常系検証) に進行可能。

### Open Questions

| # | 質問 | 対応先 |
| --- | --- | --- |
| OQ-05-01 | runbook の実ファイル作成は 02-serial-monorepo-runtime-foundation で行うが、そのタスクで canonical path の参照先として本 Phase の downstream 参照表を引用することを確認する必要がある | 02-serial-monorepo-runtime-foundation の Phase 1 で確認 |

### Phase 6 実行時の注意事項

- 異常系シナリオは docs-only タスク固有のリスク (ドキュメント不整合・参照切れ・記法ミス) に焦点を当てること
- 実サービス障害等の運用時異常系は対象外 (下流タスクで対応)

---

## 完了確認

- [x] docs-only タスクの成果物方針を明示 (runbook + placeholder)
- [x] 実行手順全文記載 (Step 1〜3)
- [x] sanity check 1 (scope 外サービス未追加) PASS
- [x] sanity check 2 (branch/env/secret が正本仕様と一致) PASS
- [x] sanity check 3 (downstream 参照パスが存在する) PASS
- [x] Phase 6 への引き継ぎ記載済み
