# 実装ガイド — Issue #399 admin queue resolve staging visual evidence

## Part 1: 中学生レベル

### なぜ必要か

たとえば、学校の先生が提出箱を確認するとき、紙が本当に入っているか、先生が返事を書けるか、終わった後に箱が空になったかを写真で残すと安心できる。今回の `/admin/requests` も同じで、管理画面で依頼が見えること、詳しく見られること、承認や却下の確認画面が出ること、ほかの人が先に処理した時に知らせることを写真で残す必要がある。

### 何をするか

本番公開前の試し打ち場所で、テスト用の依頼だけを一時的に入れる。7枚の画面写真を撮り、メールアドレスやログインの秘密が写らないように黒塗りする。撮り終わったらテスト用の依頼を消して、空になったことも確認する。

### 今回作ったもの

- テスト用データを入れる SQL
- テスト用データを片付ける SQL
- staging 以外では動かない seed / cleanup script
- 画面写真を撮るための runbook
- focused Vitest

### 用語の言い換え

| 用語 | 日常語の説明 |
| --- | --- |
| staging | 本番公開前の試し打ち場所 |
| seed | テスト用の紙を提出箱に入れること |
| cleanup | テスト用の紙を片付けること |
| screenshot | 画面写真 |
| redaction | 見せてはいけない文字を黒塗りすること |

## Part 2: 技術者レベル

### 実装対象

本サイクルでは、staging-only reversible seed と capture runbook を追加した。staging への実 seed 投入と screenshot 取得は user 承認付き runtime cycle で実施する。

| 種別 | パス | 要件 |
| --- | --- | --- |
| seed SQL | `apps/api/migrations/seed/issue-399-admin-queue-staging-seed.sql` | synthetic data only、既存ID列の `ISSUE399-` prefix で識別 |
| cleanup SQL | `apps/api/migrations/seed/issue-399-admin-queue-staging-cleanup.sql` | `ISSUE399-` 接頭辞の seed 行と runtime byproduct（`deleted_members` / `audit_log`）を DELETE し count=0 を検証 |
| seed script | `scripts/staging/seed-issue-399.sh` | `CLOUDFLARE_ENV=staging` 以外を拒否 |
| cleanup script | `scripts/staging/cleanup-issue-399.sh` | 対象 seed のみ削除し count=0 を検証 |
| capture | `docs/30-workflows/issue-399-admin-queue-resolve-staging-visual-evidence/runbook.md` | 手動手順を正本にする。`scripts/staging/capture-issue-399.mjs` は今回存在しない |
| runbook | 本 workflow Phase 05 / Phase 11 | 手動実行でも同じ evidence path を使う |

### TypeScript contract

```ts
type Issue399CaptureState =
  | "pending-visibility-list"
  | "pending-delete-list"
  | "detail-panel"
  | "approve-modal"
  | "reject-modal"
  | "empty-state"
  | "already-resolved-toast";

interface Issue399CaptureMetadata {
  task: "issue-399-admin-queue-resolve-staging-visual-evidence";
  environment: "staging";
  capturedAt: string;
  baseUrl: string;
  screenshots: Array<{
    state: Issue399CaptureState;
    path: string;
    redaction: "pass" | "fail";
  }>;
  cleanupVerification: {
    query: string;
    count: 0;
  };
}
```

### 使用例

```bash
CLOUDFLARE_ENV=staging bash scripts/staging/seed-issue-399.sh
# Follow runbook.md manually and save screenshots under outputs/phase-11/screenshots/.
CLOUDFLARE_ENV=staging bash scripts/staging/cleanup-issue-399.sh
```

### CLIシグネチャ

```bash
CLOUDFLARE_ENV=staging bash scripts/staging/seed-issue-399.sh
CLOUDFLARE_ENV=staging bash scripts/staging/cleanup-issue-399.sh
pnpm exec vitest run scripts/staging/__tests__/seed-issue-399.test.ts scripts/staging/__tests__/cleanup-issue-399.test.ts apps/api/migrations/seed/__tests__/issue-399-seed-syntax.test.ts
```

### エラーハンドリング

| ケース | 期待動作 |
| --- | --- |
| `CLOUDFLARE_ENV` が `staging` 以外 | exit 1、D1 mutation なし |
| admin session 不在 | screenshot 取得を開始せず、runbook の admin login 手順へ戻る |
| 409 toast が出ない | `manual-test-result.md` を FAIL、UI修正候補を `discovered-issues.md` に記録 |
| redaction 漏れ | `redaction-check.md` を FAIL、画像を evidence として採用しない |

### エッジケース

| ケース | 扱い |
| --- | --- |
| cleanup 前に seed を再実行 | `admin_member_notes` は `INSERT OR REPLACE` のため同じ 5 件に戻る |
| approve / reject 後の副作用 | cleanup が `deleted_members` と `audit_log` の `ISSUE399-` byproduct も削除する |
| 409 toast と empty state の順序 | 409 を cleanup 前に取得し、empty state は cleanup 後に取得する |

### 設定項目と定数一覧

| 名前 | 値 |
| --- | --- |
| `CLOUDFLARE_ENV` | `staging` のみ許可 |
| seed prefix | `ISSUE399-` |
| D1 database | `ubm-hyogo-db-staging` |
| screenshot dir | `outputs/phase-11/screenshots/` |

### テスト構成

| テスト | 内容 |
| --- | --- |
| `scripts/staging/__tests__/seed-issue-399.test.ts` | env guard |
| `scripts/staging/__tests__/cleanup-issue-399.test.ts` | env guard |
| `apps/api/migrations/seed/__tests__/issue-399-seed-syntax.test.ts` | seed / cleanup / byproduct cleanup |

### 親 workflow 反映

Phase 11 runtime evidence が揃った後に、親 workflow `04b-followup-004` の `outputs/phase-12/implementation-guide.md` へ evidence link を追記する。link 先が未実体の implementation-prepared 段階では追記しない。
