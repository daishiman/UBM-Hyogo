# Phase 12: ドキュメント

[実装区分: 実装仕様書]

> Phase: 12 / 13

---

## 12.1 中学生レベル概念説明(Canonical SSOT)

### このタスクは何をしているの?

このサイトの会員リストや会員詳細ページを表示するとき、サイトの「表側(`apps/web`)」は会員データを「裏側(`apps/api`)」に取りに行きます。Cloudflare という土台の上では、表と裏は **service binding** という安全な内線電話のような仕組みでつながっています。内線電話を使うことで、外のインターネットを通らずに、安全かつ高速にデータをやり取りできます。

ところが、テストや CI(自動テスト環境)では、本物の裏側を立ち上げる代わりに「テスト用の偽の裏側(mock API)」を使いたいことがあります。そこで「`PUBLIC_API_BASE_URL` という設定が指定されていたら、内線電話の代わりに普通のインターネット越し HTTP で偽の裏側を呼ぼう」というロジックを 3b で入れました。

しかしこれには **危険な穴** があります。本番(production)で誰かが間違えて `PUBLIC_API_BASE_URL` を設定してしまうと、本番でも内線電話を使わずインターネット越しになってしまい、以下の問題が起きます:

1. Cloudflare のループバック制限で 404 エラーが返り、会員ページが壊れる
2. 本来「裏側だけが触れるデータベース」が外向き通信に晒されるリスクが生まれる

このタスクでは、「`PUBLIC_API_BASE_URL` を使うのは **テスト or CI 環境のときだけ**」という条件を追加して、本番では絶対に内線電話を使うようにします。あわせて、本番に近い状態でこの安全策が効いていることを確かめるテストを追加します。

### キーワード(中学生レベルの語彙で)

- **service binding(サービス バインディング)**: Cloudflare の中でだけ通じる「内線電話」。同じ Cloudflare アカウントの中の表と裏をつなぐ。
- **HTTP fallback(エイチティーティーピー フォールバック)**: 内線電話の代わりに使う「普通の電話」。インターネット越しに相手を呼ぶ。
- **production / staging(プロダクション / ステージング)**: 本番環境と、本番直前の確認環境のこと。
- **CI(シーアイ)**: コードを変更したときに自動でテストする仕組み。GitHub Actions が代表例。
- **regression(リグレッション)**: 過去に直したはずの問題が、別の修正をきっかけにまた出てくること。今回の対策はこの再発防止策。

### 何を確かめたら OK か

- 本番設定(`NODE_ENV=production` / `CI` 未設定 / `PLAYWRIGHT_TEST` 未設定)で `PUBLIC_API_BASE_URL` が設定されていても、内線電話(service binding)が使われる
- Playwright 設定(`PLAYWRIGHT_TEST=1`)では `PUBLIC_API_BASE_URL` が設定されていれば普通の電話(HTTP fallback)が使われる。`CI=true` だけでは内線電話(service binding)を維持する
- `pnpm test` でこの 2 つが自動的に検証される

---

## 12.2 実装ガイド(implementation-guide 抜粋)

実装の細部は以下を参照:

- [Phase 5: 実装](./phase-5-implementation.md) — `isTestOrPlaywright()` の挿入位置・`getServiceBinding()` 書き換え差分・ファイル冒頭コメント更新
- [Phase 6: テスト追加](./phase-6-test-additions.md) — `public.spec.ts` に追加する 5 ケースの完全な test 本体
- [Phase 9: QA](./phase-9-qa.md) — typecheck / lint / test / build / 逆 assertion / grep の全 QA コマンド

## 12.3 アップデート対象のドキュメント

| ドキュメント | 更新内容 |
|--------------|---------|
| `docs/30-workflows/issue-666-fetch-public-service-binding-regression/` 配下 phase-1..13 | 本タスク仕様書群(本 PR で新規追加) |
| `docs/30-workflows/unassigned-task/task-e2e-stage3b-fetch-public-service-binding-priority-regression-001.md` | 既存単一仕様書。Issue #666 workflow に consumed 済みであることを明記し、再度 open unassigned として拾わない |
| `.claude/skills/aiworkflow-requirements/references/testing-playwright-e2e.md` | Stage 3b Server Component mock API の transport 説明を「Vitest / Playwright 限定の HTTP fallback 優先」に補正 |
| `CLAUDE.md` | 編集なし(`apps/web` env 不変条件節は既存記述で十分。`isTestOrPlaywright()` の存在は本 phase-12 / phase-5 のコメントで十分追跡可能) |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | 編集なし(transport 選択ロジックは内部実装詳細であり、API schema 定義の範囲外) |

## 12.4 関連ドキュメント参照

- CLAUDE.md「`apps/web` env アクセス不変条件」(task-02 wrangler-env-injection 節)
- CLAUDE.md 不変条件 #5(D1 直接アクセス禁止)
- CLAUDE.md 不変条件 #8(`*.spec.ts` 命名遵守)
- `apps/web/src/lib/env.ts`(`getEnv()` / `getPublicEnv()` 経路の参照元)
- `task-05a-fetchpublic-service-binding-001` 仕様書(逆方向 fallback 設計)
- `task-e2e-stage3b-e2e-tests-hard-gate-001` 仕様書(HTTP fallback 優先化を導入した親タスク)
