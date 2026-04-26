# Phase 5: セットアップ実行

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | monorepo-runtime-foundation |
| Phase 番号 | 5 / 13 |
| Phase 名称 | セットアップ実行 |
| 作成日 | 2026-04-23 |
| 前 Phase | 4 (事前検証手順) |
| 次 Phase | 6 (異常系検証) |
| 状態 | completed |

## 目的

モノレポとランタイム基盤 における Phase 5 の判断と成果物を固定し、下流 Phase の手戻りを防ぐ。

## 実行タスク

- input / output を確定する
- 正本仕様との整合を確認する
- 4条件と downstream 影響を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | apps/web / apps/api |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-monorepo.md | dependency rule |
| 必須 | .claude/skills/aiworkflow-requirements/references/technology-core.md | Node / pnpm / Next.js |
| 必須 | .claude/skills/aiworkflow-requirements/references/technology-frontend.md | Next.js / Tailwind |
| 必須 | .claude/skills/aiworkflow-requirements/references/technology-backend.md | Workers / D1 / backend stack |

| 依存Phase | Phase 4 | 上流成果物の参照確認 |

## 実行手順

### ステップ 1: input と前提の確認
- 上流 Phase と index.md を読む。
- 正本仕様との差分を先に洗い出す。

### ステップ 2: Phase 成果物の作成
- 本 Phase の主成果物を outputs/phase-05/main.md に作成・更新する。
- downstream task から参照される path を具体化する。

### ステップ 3: 4条件と handoff の確認
- 価値性 / 実現性 / 整合性 / 運用性を再確認する。
- 次 Phase に渡す blocker と open question を記録する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | 本 Phase の出力を入力として使用 |
| Phase 7 | AC トレースに使用 |
| Phase 10 | gate 判定の根拠 |
| Phase 12 | close-out と spec sync 判断 |

## 多角的チェック観点（AIが判断）

- 価値性: 誰のどのコストを下げるか明確か。
- 実現性: 初回無料運用スコープで成立するか。
- 整合性: branch / env / runtime / data / secret が一致するか。
- 運用性: rollback / handoff / same-wave sync が可能か。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | input 確認 | 5 | completed | upstream を読む |
| 2 | 成果物更新 | 5 | completed | outputs/phase-05/main.md |
| 3 | 4条件確認 | 5 | completed | next phase へ handoff |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | Phase 5 の主成果物 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- [ ] 主成果物が作成済み
- [ ] 正本仕様参照が残っている
- [ ] downstream handoff が明記されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 6 (異常系検証)
- 引き継ぎ事項: モノレポとランタイム基盤 の判断を次 Phase で再利用する。
- ブロック条件: 本 Phase の主成果物が未作成なら次 Phase に進まない。

## 手順全文 (コピペ可)

この Phase でモノレポ基盤を実装する。secret 値の登録と本番デプロイは行わない。

### Step 1: runtime バージョン確認
```bash
node --version        # v24.x.x であること
pnpm --version        # 10.x.x であること
wrangler --version    # 4.x.x であること
```

### Step 2: pnpm workspace 設定確認
```bash
cat pnpm-workspace.yaml
# packages:
#   - 'apps/*'
#   - 'packages/*'

pnpm install          # エラーがないこと
pnpm typecheck        # TypeScript 6.x strict で通ること
pnpm lint             # lint エラーがないこと
```

実装済みファイル:

- `package.json`
- `pnpm-workspace.yaml`
- `tsconfig.json`
- `.nvmrc`
- `apps/web/package.json`
- `apps/web/next.config.ts`
- `apps/web/open-next.config.ts`
- `apps/web/app/page.tsx`
- `apps/api/package.json`
- `apps/api/src/index.ts`
- `packages/shared/package.json`
- `packages/shared/src/index.ts`
- `packages/integrations/package.json`
- `packages/integrations/src/index.ts`

### Step 3: apps/web 構成確認（docs-first）
- `apps/web/next.config.ts` に `@opennextjs/cloudflare` の設定が含まれること
- `apps/web/wrangler.toml` が存在し Workers ターゲットが正しいこと
- `apps/web/open-next.config.ts` が存在すること
- `apps/web/package.json` の `build:cloudflare` スクリプトに `opennextjs-cloudflare build` が含まれること

### Step 4: apps/api 構成確認（docs-first）
- `apps/api/src/index.ts` に Hono の entry point があること
- `apps/api/wrangler.toml` が存在し Workers ターゲットが正しいこと

### Step 5: runbook 草案作成
- `outputs/phase-05/foundation-bootstrap-runbook.md` に上記手順を記録
- downstream 参照表更新（03-serial-data-source-and-storage-contract 向け）

## サンプルコマンド
```bash
rg -n "AC-|dev|main|D1|Sheets|1Password" doc/02-serial-monorepo-runtime-foundation
git diff -- doc/02-serial-monorepo-runtime-foundation
rg -n "apps/web|apps/api|packages/shared|packages/integrations" doc/02-serial-monorepo-runtime-foundation
```

## 設定ファイル全文
- 実値ファイルは repository root / apps / packages に配置済み。生成物 `.next` / `.open-next` は成果物に含めない。

## 各ステップ後の sanity check
- scope 外サービスを追加していない
- branch / env / secret placement が正本仕様に一致する
- downstream task が参照できる path がある
- 正本仕様と差分がある runtime version は Phase 12 Step 2 の同期対象として残っている

## 依存Phase成果物参照

- 参照対象: Phase 4
