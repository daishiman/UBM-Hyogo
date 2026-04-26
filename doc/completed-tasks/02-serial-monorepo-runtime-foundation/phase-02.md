# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | monorepo-runtime-foundation |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-04-23 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | completed |

## 目的

モノレポとランタイム基盤 における Phase 2 の判断と成果物を固定し、下流 Phase の手戻りを防ぐ。

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

| 依存Phase | Phase 1 | 上流成果物の参照確認 |

## 実行手順

### ステップ 1: input と前提の確認
- 上流 Phase と index.md を読む。
- 正本仕様との差分を先に洗い出す。

### ステップ 2: Phase 成果物の作成
- 本 Phase の主成果物を outputs/phase-02/main.md に作成・更新する。
- downstream task から参照される path を具体化する。

### ステップ 3: 4条件と handoff の確認
- 価値性 / 実現性 / 整合性 / 運用性を再確認する。
- 次 Phase に渡す blocker と open question を記録する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | 本 Phase の出力を入力として使用 |
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
| 1 | input 確認 | 2 | completed | upstream を読む |
| 2 | 成果物更新 | 2 | completed | outputs/phase-02/main.md |
| 3 | 4条件確認 | 2 | completed | next phase へ handoff |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/main.md | Phase 2 の主成果物 |
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

- 次: 3 (設計レビュー)
- 引き継ぎ事項: モノレポとランタイム基盤 の判断を次 Phase で再利用する。
- ブロック条件: 本 Phase の主成果物が未作成なら次 Phase に進まない。

## 構成図 (Mermaid)
```mermaid
graph TD
  A[User Request] --> B[モノレポとランタイム基盤]
  B --> C[Phase Outputs]
  C --> D[Downstream Tasks]
  D --> E[Implementation Phase]
```

## 環境変数一覧
| 区分 | 代表値 | 置き場所 | 理由 |
| --- | --- | --- | --- |
| runtime secret | GOOGLE_CLIENT_SECRET / AUTH_SECRET | Cloudflare Secrets | Workers runtime が直接利用 |
| deploy secret | CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID | GitHub Secrets | CI/CD 専用（wrangler deploy） |
| local canonical | 上記すべて | 1Password Environments | 平文 .env を正本にしない |
| public variable | NEXT_PUBLIC_APP_URL / CLOUDFLARE_ACCOUNT_ID | GitHub Variables / wrangler.toml | 非機密 |

注記: この Phase は secret 名と配置先の設計を固定するだけで、secret 値の作成・登録は行わない。`index.md` の「Secrets 一覧（このタスクで導入）なし」と矛盾しない。

注記（Auth.js）: Auth.js v5 では環境変数プレフィックスが `NEXTAUTH_*` から `AUTH_*` に変更。JWT 暗号化の仕様変更による既知バグあり。Magic Link・Google OAuth を使う場合は `AUTH_SECRET`（ランダム64文字以上）を必ず Cloudflare Secrets に設定する。

## 設定値表
| 項目 | 方針 | 根拠 |
| --- | --- | --- |
| branch strategy | feature -> dev -> main | deployment-branch-strategy |
| runtime split | apps/web（@opennextjs/cloudflare + Next.js 16.x on Workers）+ apps/api（Hono 4.12.x on Workers） | architecture-overview-core |
| source of truth | Sheets input / D1 canonical | user request + baseline |
| Node.js | 24.x LTS（Krypton、2028年4月まで）| pnpm 9 EOL・最新 LTS |
| pnpm | 10.x（pnpm 9 は 2026-04-30 EOL） | サポート継続・workspace 安定 |
| Next.js | 16.x（16.2.4 以上） | @opennextjs/cloudflare 推奨・App Router 安定 |
| React | 19.2.x | Next.js 16 対応・安定 |
| TypeScript | 6.x（6.0.3 以上、v7.0 はベータのため非推奨） | strict モード・型安全 |
| Wrangler | 4.x（4.85.0 以上） | v3 は保守モードのため v4 を使用 |
| Hono | 4.12.x | Workers 安定・軽量 |
| Tailwind CSS | 4.x（4.2.4 以上） | 高速再コンパイル・新カラーパレット |
| Auth.js | 5.x（既知バグあり。JWT / OAuth 周りに注意） | Google OAuth + Magic Link |
| @opennextjs/cloudflare | 最新安定版 | @cloudflare/next-on-pages 廃止予定のため代替 |
| Workers バンドルサイズ | 無料枠 3MB 以内 / 有料 10MB / Pages Functions 25MB | コスト管理 |

## 依存マトリクス
| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | ../00-serial-architecture-and-scope-baseline/ / 01a-parallel-github-and-branch-governance / 01b-parallel-cloudflare-base-bootstrap | この task 開始前に必要 |
| 下流 | 03-serial-data-source-and-storage-contract / 04-serial-cicd-secrets-and-environment-sync / 05b-parallel-smoke-readiness-and-handoff | この task の成果物を参照 |
| 並列 | なし | 同 Wave で独立実行可能 |

## 依存Phase成果物参照

- 参照対象: Phase 1
