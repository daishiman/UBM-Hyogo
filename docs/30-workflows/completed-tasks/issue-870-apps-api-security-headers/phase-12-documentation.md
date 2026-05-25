# Phase 12: ドキュメント — issue-870-apps-api-security-headers

> 実装区分: 実装仕様書 / NON_VISUAL / implementation_mode: new / 状態: implemented_local_evidence_captured
> 前 Phase: [phase-11-manual-test.md](phase-11-manual-test.md) / 次 Phase: [phase-13-pr.md](phase-13-pr.md)

## 目的

実装完了後に行うドキュメント整備の手順と成果物を定義する。
本 Phase は 2 部構成の implementation guide 本文 + `outputs/phase-12/` の strict 7 成果物から成る。

---

## Part 1: 中学生レベルの概念説明

> 専門用語を使わず、日常の例え話で「このタスクが何をしているか」を説明する。

### このタスクでやっていること

あなたがレストランで食事をするとき、お店は「アレルギー情報を表示」「食材の産地を明示」など、
**お客さんを守るためのルール** を守っています。

`apps/api` はインターネット越しにデータをやり取りする「裏口の窓口」です。
今まで、この窓口には「安全を示す札」が何も貼られていませんでした。

このタスクでは、窓口に以下の 4 種類の「安全の札」を自動で貼るようにします。

| 札の名前 | 日常の例え | 実際の効果 |
|----------|-----------|-----------|
| `X-Content-Type-Options: nosniff` | 「このメニューはランチメニューです。夕食メニューとして使わないでください」 | ブラウザがファイルの種類を勝手に変えて実行するのを防ぐ |
| `Strict-Transport-Security` | 「このお店は必ず正面玄関（鍵付き）からしか入れません」 | 次回以降は必ず暗号化通信（HTTPS）を使うようにブラウザに伝える |
| `Referrer-Policy: no-referrer` | 「どこから来たかは教えません」 | どのページからアクセスしてきたか、外部には知らせない |
| `Cache-Control: no-store`（マイページ等） | 「このレシートはシュレッダーにかけてください」 | 個人情報が含まれるページは、ブラウザに保存しないよう指示する |

また、「許可された人だけが窓口にアクセスできる」ルール（CORS allowlist）も追加します。
これは「このレストランは会員証を持つお客様専用です」という看板を掲げるようなものです。

---

## Part 2: 技術者レベルの詳細説明

### 型定義・シグネチャ

```typescript
// apps/api/src/middleware/security-headers.ts

/** 全 route に無条件で付与するセキュリティヘッダの定数マップ */
export const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
} as const;

/** HSTS max-age のデフォルト値（1 年 = 31,536,000 秒） */
export const DEFAULT_HSTS_MAX_AGE = 31_536_000;

/**
 * Cache-Control: no-store を付与する route prefix の既定値。
 * これらのプレフィックスで始まる route は、既存 Cache-Control が
 * 未設定の場合のみ no-store を補完する。
 */
export const DEFAULT_NO_STORE_PREFIXES = [
  "/me",
  "/auth",
  "/admin",
  "/internal",
] as const;

/** securityHeaders middleware のオプション型 */
export interface SecurityHeadersOptions {
  /** HSTS max-age（秒）。省略時は DEFAULT_HSTS_MAX_AGE を使用 */
  hstsMaxAge?: number;
  /** Cache-Control: no-store を補完するパスプレフィックス一覧 */
  noStorePrefixes?: readonly string[];
}

/**
 * セキュリティヘッダ付与 middleware。
 * - X-Content-Type-Options / Referrer-Policy / HSTS を全 route に付与
 * - noStorePrefixes に一致かつ既存 Cache-Control が未設定の route に no-store を補完
 */
export const securityHeaders: (
  options?: SecurityHeadersOptions
) => MiddlewareHandler<{ Bindings: Env }>;

/**
 * ALLOWED_ORIGINS 環境変数（カンマ区切り文字列）を string[] に変換する。
 * - 空文字・スペースのみのエントリは除外する
 * - 前後スペースは trim する
 * - 入力が undefined / 空文字の場合は [] を返す
 */
export const parseAllowedOrigins: (raw?: string) => string[];

/**
 * Env.ALLOWED_ORIGINS を参照して CORS allowlist middleware を構成する。
 * - allowlist 内 origin: Access-Control-Allow-Origin を付与
 * - allowlist 外 origin: CORS ヘッダを付与しない（deny-by-default）
 * - ALLOWED_ORIGINS 未設定時: いかなる origin も許可しない
 */
export const corsFromEnv: () => MiddlewareHandler<{ Bindings: Env }>;
```

### 付与ヘッダ一覧と条件

| ヘッダ | 値 | 付与条件 |
|--------|-----|---------|
| `X-Content-Type-Options` | `nosniff` | 全 route・無条件 |
| `Referrer-Policy` | `no-referrer` | 全 route・無条件 |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | 全 route・無条件（`hstsMaxAge` option で上書き可） |
| `Cache-Control` | `no-store` | `noStorePrefixes` に一致 **かつ** 既存 `Cache-Control` が未設定の場合のみ |
| `Access-Control-Allow-Origin` | `<allowlist の一致 origin>` | `ALLOWED_ORIGINS` allowlist に一致する origin からのリクエスト時のみ |

### エラーハンドリング

| シナリオ | 挙動 |
|---------|------|
| `ALLOWED_ORIGINS` が undefined | `parseAllowedOrigins` が `[]` を返す。`corsFromEnv` は deny-by-default で動作 |
| `ALLOWED_ORIGINS` が空文字列 | 同上 |
| `ALLOWED_ORIGINS` がカンマのみ（例: `","`) | `parseAllowedOrigins` が空エントリを除外して `[]` を返す |
| `hstsMaxAge` が 0 以下 | 仕様上考慮しない。呼び出し元が正の値を渡す責務を持つ |
| middleware が例外 throw | Hono の `app.onError` が補足する（既存の共通エラーハンドラに委譲） |

### 設定値一覧

| 設定項目 | 管理場所 | staging 例 | production 例 |
|---------|---------|-----------|--------------|
| `ALLOWED_ORIGINS` | `apps/api/wrangler.toml` の `[env.staging.vars]` / `[env.production.vars]` | `"https://staging.ubm-hyogo.workers.dev"` | `"https://ubm-hyogo.workers.dev,https://www.ubm-hyogo.com"` |
| `DEFAULT_HSTS_MAX_AGE` | `apps/api/src/middleware/security-headers.ts` の定数 | — | 31536000 (固定) |
| `DEFAULT_NO_STORE_PREFIXES` | 同上 | — | `/me,/auth,/admin,/internal` (固定) |

### middleware 適用位置

```typescript
// apps/api/src/index.ts
const app = new Hono<{ Bindings: Env }>();

// ↓ ここに追加（route mount より前）
app.use("*", corsFromEnv());
app.use("*", securityHeaders());

// 既存の route mount は変更しない
app.route("/public", publicRouter);
// ... 以下省略
```

---

## outputs/phase-12/ 成果物一覧

実装サイクル完了後、以下 7 ファイルを `outputs/phase-12/` に作成する。

| ファイル | 役割 | 備考 |
|---------|------|------|
| `main.md` | Phase 12 strict 7 のインデックス。 | 7 ファイルの存在確認導線 |
| `implementation-guide.md` | Part 1（中学生説明）+ Part 2（技術詳細）の完成版。PR 本文への引用元。 | 本 Phase の記述が草稿。実装後に実際のコードと照合して確定版を作成 |
| `system-spec-update-summary.md` | 変更対象ファイル一覧・変更内容のサマリ。設計書・スペックファイルへの反映状況。 | `index.md` の変更対象表を実装結果で更新する |
| `documentation-changelog.md` | 本タスクで更新・新規作成したドキュメントの変更ログ。 | 本ワークフロー内の全 phase-*.md と outputs/ ファイルを列挙 |
| `unassigned-task-detection.md` | Phase 10 の MINOR 指摘 + スコープ外として記録した事項の一覧。次サイクルの任意タスク候補。 | **未タスク 0 件でも「0 件」と明記して必ず作成する** |
| `skill-feedback-report.md` | task-specification-creator スキルへのフィードバック。Phase 設計の改善点・テンプレート更新提案。 | レトロスペクティブ観点で記述 |
| `phase12-task-spec-compliance-check.md` | Phase 12 canonical 9 heading の準拠確認チェックリスト。`verify:phase12-compliance` CI gate の手動確認版。 | CI gate のローカル事前確認用 |

---

## aiworkflow-requirements への反映観点

本タスク完了後、以下の観点で aiworkflow-requirements スキルの参照ドキュメントへの反映を検討する。

| ドキュメント候補 | 反映内容 |
|----------------|---------|
| `security-*.md`（セキュリティ設計ドキュメント） | `apps/api` 側の HTTP セキュリティヘッダ構成（middleware 名・ヘッダ値・CORS allowlist 設計）を追記 |
| `api-*.md`（API 設計ドキュメント） | middleware 適用位置（app 生成直後・route mount 前）と CORS env 分離パターンを追記 |

反映の実施は本タスクのスコープ外だが、次サイクルの `unassigned-task-detection.md` に候補として記録する。

---

## DoD（Definition of Done）

- [x] `outputs/phase-12/main.md` 作成済み
- [x] `outputs/phase-12/implementation-guide.md` 作成済み（Part 1 + Part 2 を含む）
- [x] `outputs/phase-12/system-spec-update-summary.md` 作成済み
- [x] `outputs/phase-12/documentation-changelog.md` 作成済み
- [x] `outputs/phase-12/unassigned-task-detection.md` 作成済み（0 件の場合も「0 件」と明記）
- [x] `outputs/phase-12/skill-feedback-report.md` 作成済み
- [x] `outputs/phase-12/phase12-task-spec-compliance-check.md` 作成済み
- [x] aiworkflow-requirements への反映を同一サイクルで実施済み
