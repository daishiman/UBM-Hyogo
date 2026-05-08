# Phase 12: ドキュメント

## 目的

本 task の完了をリポジトリ全体のドキュメント体系に統合する。task-specification-creator 標準に従い、**Part 1（中学生レベルの概念説明）** と **Part 2（技術者向け詳細）** の両方を提供し、システム仕様書の更新箇所・未タスク検出・skill feedback・compliance check を網羅する。

---

## Part 1: 中学生レベルでの概念説明

### Sentry が何を見ているか

Web サイトを使うとき、ボタンを押したらエラーが出ることがあります。そのエラーが「いつ・どこで・誰のブラウザで」起きたかを記録してくれる仕組みが **Sentry** です。たとえば、学校の連絡帳のように「何月何日、どこで困ったことが起きたか」を後から見直せるようにします。

### なぜ「分ける」必要があるのか

UBM 兵庫支部会のサイトは大きく分けて 2 つの場所で動いています。

1. **サーバー側（Cloudflare Workers）**: 会員リストを返す処理のように、皆さんのブラウザに届く前の処理
2. **ブラウザ側（みなさんのスマホ・PC）**: 画面のクリックやアニメーション

Sentry のカメラも、この 2 つの場所で**別の機種**を使う必要があります。なぜなら、ブラウザ用のカメラは「ブラウザにしかない部品（`window` という機能）」を使って動くからです。これをサーバー側に間違えて持ち込むと「そんな部品はないよ！」とエラーになってサイトが 500 エラーで真っ白になります。

### 今回 task-03 で決めたこと

- サーバー用の Sentry（`@sentry/cloudflare`）と、ブラウザ用の Sentry（`@sentry/nextjs`）を、絶対に混ざらないように **別々の入り口ファイル**へ置く契約を決めました。
- 同じカメラを 2 回起動してしまわないように「もう起動済み？」のフラグ（`__ubmSentryInitialized__`）を入れる設計にしました。
- カメラの暗証番号（DSN）はソースコードに書かず、Cloudflare の金庫（Secrets）に入れて、必要なときだけ取り出す方針にしました。

### 実装後に良くなること

- サイト全 19 ページで Browser SDK 混入による 500 エラーを防げます
- エラーが起きたら Sentry に届くので、開発者が早く気づけます
- 暗証番号がソースに残らないので安全になります

### 専門用語セルフチェック

| 用語 | 中学生向けの意味 |
| --- | --- |
| Sentry | エラーが起きた記録を残す連絡帳 |
| SDK | Sentry を使うための部品セット |
| Workers | サーバー側でサイトを動かす場所 |
| Browser | ユーザーのスマホやPC側で動く場所 |
| DSN | Sentry に送るための宛先情報 |
| Secrets | 大事な値をコードに書かずに置く金庫 |

---

## Part 2: 技術者向け詳細

### 2.1 アーキテクチャの要点

| 軸 | 採用 | 理由 |
| --- | --- | --- |
| runtime 分離 | `@sentry/cloudflare`（server/edge）+ `@sentry/nextjs`（browser）の 2 経路 | Workers ランタイムに `window` / `requestIdleCallback` がない |
| エントリ分離 | `instrumentation.ts` / `instrumentation-client.ts` | Next.js v15 規約・Browser SDK が server bundle へ推移混入する経路を遮断 |
| 動的 import | `await import("@sentry/cloudflare")` / `await import("@sentry/nextjs")` | bundler のチャンク分離保証 |
| 二重 init ガード | `globalThis.__ubmSentryInitialized__` / `window.__ubmSentryInitialized__` | HMR / client navigation 越しの重複 init 防止 |
| DSN 経路 | server: Cloudflare Secrets `SENTRY_DSN_WEB` / client: `[vars]` の `NEXT_PUBLIC_SENTRY_DSN` | client DSN は Sentry 仕様上公開前提 |
| 失敗時挙動 | fail-soft（throw しない、`undefined` 返却 + console fallback） | 観測層の障害がアプリ本体に波及しない |

### 2.2 公開 API（凍結）

```ts
export type CaptureContext = {
  tags?: Record<string, string>;
  extras?: Record<string, unknown>;
  extra?: Record<string, unknown>; // deprecated
  level?: "fatal" | "error" | "warning" | "info" | "debug";
  user?: { id?: string; email?: string };
};
export function captureException(error: unknown, ctx?: CaptureContext): Promise<string | undefined>;
export function captureMessage(message: string, ctx?: CaptureContext): Promise<string | undefined>;
export function register(): Promise<void>;
```

### 2.3 grep gate（CI 検出）

| gate | コマンド | 意図 |
| --- | --- | --- |
| G-1 | `rg 'requestIdleCallback' apps/web/.open-next/` | server bundle への Browser SDK 混入検出（最重要） |
| G-5 | `rg "process\\.env\\.SENTRY_DSN" apps/web/src` | `getEnv()` 経由統一の徹底 |

### 2.4 デプロイ経路（Cloudflare）

```
op://UBM-Hyogo/Sentry Web DSN (<env>)/dsn → scripts/cf.sh secret put → Cloudflare Secrets (SENTRY_DSN_WEB)
                                                  ↓ Workers binding
                                              getEnv().SENTRY_DSN_WEB
                                                  ↓
                                        instrumentation.ts register()
                                                  ↓
                                          @sentry/cloudflare init()
```

---

## システム仕様書の更新箇所

| ファイル | 更新内容 |
| --- | --- |
| `docs/00-getting-started-manual/specs/00-overview.md` | 観測層に Sentry runtime 分離方針の節を追記（runtime → SDK 対応表） |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`（存在する場合） | Sentry DSN 投入手順（`scripts/cf.sh secret put`）を追記 |
| `docs/00-getting-started-manual/specs/02-auth.md` | user 識別子（id / email）を Sentry capture context へ載せる際の sanitize 方針追記 |
| `CLAUDE.md` | 不変条件 #2（Cloudflare Secrets）に Sentry DSN を例示として追記（任意） |

> 正本 index / task-workflow-active への登録は本 implemented-local close-out で実施し、staging runtime 結果は user approval 後の Phase 12 で再同期する。

## 未タスク検出（unassigned-task-detection）

| 検出項目 | 提案 task |
| --- | --- |
| `apps/api` への Sentry 導入 | 別 workflow（本 task は `apps/web` 限定） |
| Sentry release tag 自動化 | CI に `git rev-parse HEAD` を `SENTRY_RELEASE` として inject する別 task |
| Sentry performance monitoring 設計 | `tracesSampleRate` の動的調整を含む別 task |
| `@sentry/cloudflare` の D1 / KV breadcrumb 統合 | 観測層拡張 task（PII / SQL マスキング設計を含む） |

## skill feedback

| skill | 採用ポイント | 改善提案 |
| --- | --- | --- |
| `task-specification-creator` | Phase 1〜13 の 13 段階構成、§0 自己完結ブロック、Phase 11 の AC × evidence マトリクス | runtime 分離タスク向けに「runtime × SDK 対応表」テンプレートを quick-reference に追加すると再利用性が上がる |
| `aiworkflow-requirements` | 不変条件 trace の表形式 | Sentry のような観測層タスク用の不変条件カテゴリ（observability）を topic-map に追加検討 |

## compliance check（phase12-task-spec-compliance-check）

- [ ] index.md / artifacts.json が存在
- [ ] phase-01.md 〜 phase-13.md が存在
- [ ] 各 phase に「目的 / 真の論点 / 実行タスク / 入力出力 / 参照資料 / 成果物 / 完了条件 / メタ情報」が揃う
- [x] artifacts.json の `metadata.workflow_state` が `implemented-local`
- [ ] `taskType: implementation` / `visualEvidence: NON_VISUAL` / `docs_only: false`
- [ ] Phase 3 凍結シグネチャが下流タスク（task-04 / task-05）から参照可能
- [ ] AC-1〜AC-9 と Phase 11 evidence が 1:1 対応
- [ ] CLAUDE.md `scripts/cf.sh` 経由 wrangler 実行ポリシー遵守
- [ ] solo-dev branch protection 整合（`required_pull_request_reviews=null`）
- [ ] SCOPE.md §6 diff scope 規律遵守

## 実行タスク（チェックリスト）

- [x] Part 1 / Part 2 を `outputs/phase-12/main.md` に転記
- [x] system spec 更新 diff を `outputs/phase-12/system-spec-update-summary.md` に記録
- [x] unassigned-task-detection を `outputs/phase-12/unassigned-task-detection.md` に記録
- [x] skill feedback を `outputs/phase-12/skill-feedback-report.md` に記録
- [x] compliance check を `outputs/phase-12/phase12-task-spec-compliance-check.md` に記録
- [x] documentation-changelog を `outputs/phase-12/documentation-changelog.md` に記録
- [x] implementation-guide を `outputs/phase-12/implementation-guide.md` に記録（PR 本文の元データ）

## 参照資料

- 元タスク §0「自己完結コンテキスト」, §10 DoD
- `CLAUDE.md`
- `docs/00-getting-started-manual/specs/00-overview.md`
- task-specification-creator skill `references/`

## 成果物

- 本 phase-12.md（中学生向け + 技術者向けドキュメント計画）
- `outputs/phase-12/main.md` 等 7 ファイル（本 implemented-local close-out で物理配置済）

## 完了条件（DoD）

- [x] Part 1（中学生レベル）が完成
- [x] Part 2（技術者向け）が runtime 対応表 / 凍結 API / grep gate / deploy 経路を網羅
- [x] system spec 更新箇所が列挙
- [x] unassigned-task が 4 件以上検出
- [x] skill feedback / compliance check が記述

## 統合テスト連携

- Phase 12 strict 7 outputs は、Phase 11 の `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` と実装後 evidence を混同しないために配置する。
- `skill-feedback-report.md` の改善提案は同一 wave で no-op / promote を判定し、今回は仕様書側の語彙・正本同期修正として反映済みとする。

## メタ情報

- workflow: task-03-w2-par-sentry-workers-sdk-unify
- phase: 12
- status: `implemented-local / completed`
- taskType: `implementation`
- visualEvidence: `NON_VISUAL`
