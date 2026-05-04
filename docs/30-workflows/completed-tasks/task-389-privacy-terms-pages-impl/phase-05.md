# Phase 5: 実装ランブック — task-389-privacy-terms-pages-impl

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 5 / 13 |
| 作成日 | 2026-05-03 |
| taskType | implementation |

## 目的

コード変更・テスト追加・build・deploy の手順を、後続実行者がそのまま実行できる粒度で定義する。local code / test は本サイクルで実行し、staging / production deploy と Cloud Console 操作はユーザー承認後に実行する。

## 前提チェック

```bash
git status --short                                # clean
gh issue view 385 --json state                    # CLOSED （build-prerender-failure 解消済）
mise install && mise exec -- pnpm install         # Node 24 / pnpm 10
```

`#385` が OPEN の場合 → Step 3 以降は blocked。Phase 1 へ戻り blocker を再記録。

## Step 1: コード差分（apps/web/app/privacy/page.tsx）

`Edit` ツールで以下を変更:

1. metadata に SEO 強化を追加:
```ts
export const metadata: Metadata = {
  title: "プライバシーポリシー | UBM 兵庫支部会",
  description: "UBM 兵庫支部会のプライバシーポリシー",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};
```
2. 本文を法務確認文面に置換（法務未確定の場合は暫定文面のまま、ファイル末尾に `<p>制定日: 2026-05-03 / 最終改定日: 2026-05-03</p>` を追記）。
3. ファイル末尾の連絡先案内に Google Form 再回答 URL（`https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform`）を含める。

## Step 2: コード差分（apps/web/app/terms/page.tsx）

Step 1 と対称の変更を terms ページに適用（`canonical: "/terms"`、6 セクション、改定日、連絡先）。

## Step 3: テスト追加

`Write` で `apps/web/app/privacy/__tests__/page.test.tsx` と `apps/web/app/terms/__tests__/page.test.tsx` を新規作成（Phase 4 の実装スケッチを採用）。

## Step 4: ローカル検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- privacy terms
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web build
```

期待: typecheck/lint/test/build いずれも exit 0。

## Step 5: staging deploy（ユーザー承認後）

```bash
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
```

## Step 6: staging HTTP 200 検証

```bash
STAGING_HOST="<staging URL — Phase 11 で確定>"
curl -s -o /dev/null -w "privacy=%{http_code}\n" "$STAGING_HOST/privacy"
curl -s -o /dev/null -w "terms=%{http_code}\n" "$STAGING_HOST/terms"
```

両方 200 を確認 → Phase 11 の `manual-smoke-log.md` に記録。

## Step 7: production deploy（ユーザー承認後）

```bash
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production
```

## Step 8: production HTTP 200 検証 + consent screen 設定

```bash
PROD_HOST="<production URL>"
curl -s -o /dev/null -w "privacy=%{http_code}\n" "$PROD_HOST/privacy"
curl -s -o /dev/null -w "terms=%{http_code}\n" "$PROD_HOST/terms"
```

Google Cloud Console → OAuth consent screen → Privacy/Terms URL に production URL を入力 → 保存 → screenshot 取得。

## 禁止事項

- ユーザー承認なしに Step 5〜8（deploy / production smoke / consent screen 更新）を実行しない
- `git commit` / `git push` / `gh pr create` はユーザー承認後のみ
- `wrangler` 直接実行禁止（必ず `bash scripts/cf.sh` 経由）
- `.env` 実値の `cat` / `Read` 禁止

## 完了条件

- [ ] 全 Step が連番で実行可能
- [ ] 各 Step の期待 exit / 出力が定義されている
- [ ] `outputs/phase-05/main.md` を作成する
