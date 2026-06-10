# Phase 5: 実装手順インデックス

`[実装区分: 実装仕様書（診断・観測性向上のコード変更を含む）]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 |
| workflow_id | `profile-session-fetch-failure-investigation` |
| taskType | VISUAL（`/profile` エラー表示分岐を観測性目的で変更） |
| implementation_mode | `new`（診断用の新規コード + 新規テスト） |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | `implemented_local_evidence_captured` |
| ブランチ | `feat/profile-session-fetch-failure-investigation` |
| 起点 | `origin/dev` (b59a9b450) |
| 想定 PR base | `dev` |

## 目的

Phase 4 で確定した I/O 契約（`/me` HTTP status × web error code 対応表・診断スクリプト I/O・区別分岐/ログの期待値）を、コード実装可能な **3 つの実装仕様書本体（task-01..03）** へ分解し、各タスクの相互依存と実行順を確定する。

本サイクルのスコープは **観測性向上（D1 区別表示 / D2 構造化ログ / D3 診断スクリプト）に限定**する。真因確定後にはじめて方針が決まる本格的な根本修正（410 復帰フロー / 5xx 根治 / transport デプロイ齟齬の運用是正 / 管理者 `/profile` 専用 UX）は **本 Phase の範囲外**であり、Phase 12 で未タスク化する（CONST_007 例外①: 合意未済の仕様分岐。SSOT §3 OUT）。

## 実行タスク

### 5.1 タスク一覧と実装仕様書本体

| タスク | 領域 | 種別 | 実装仕様書 | 概要 |
| --- | --- | --- | --- | --- |
| T01 | `apps/web`（UI） | VISUAL | [`task-01-error-branch-disambiguation.md`](./task-01-error-branch-disambiguation.md) | `/profile` のデフォルト失敗分岐を `MEMBER_SESSION_410` / 5xx 族 / `MEMBER_SESSION_FAILED` で区別表示。ユーザー向け文言は安全側を維持し、開発者向けに原因コードを `data-cause` 属性で可視化。401→redirect・404→再ログイン CTA は回帰なし（AC-3 / H6 是正） |
| T02 | `apps/web`（lib） | NON_VISUAL | [`task-02-structured-logging.md`](./task-02-structured-logging.md) | `/me` 取得失敗時に `status` / `code` / `path` を構造化ログ出力（`safe-fetch.ts`）。memberId 等の個人情報を出さない（AC-4 / 不変条件 #11 / D2） |
| T03 | `scripts/` | NON_VISUAL | [`task-03-diagnose-script.md`](./task-03-diagnose-script.md) | 新規 `scripts/diagnose-profile-session.sh`（read-only・冪等）。staging `/me` status 確認 / env・secret parity / deploy 版数を 1 本に集約（AC-5 / D3） |

### 5.2 変更ファイル一覧（新規 / 編集 / 削除）

| パス | 変更種別 | タスク | 内容 |
| --- | --- | --- | --- |
| `apps/web/src/lib/server-fetch/profile-session-cause.ts` | 新規 | T01 | error code → `{ cause, detail }` の写像純関数（Phase 8 で集約済みの SSOT。T01 が参照） |
| `apps/web/app/(member)/profile/page.tsx` | 編集 | T01 | デフォルト分岐（現 66-74 行）を 410 / 5xx 族 / FAILED で区別し `data-cause` を付与。404 分岐（53-63）・401 redirect（46-47）は無変更 |
| `apps/web/src/components/member/SectionError.tsx` | 編集 | T01 | 開発者向け原因コードを描画する optional prop `cause?: string`（`data-cause` 属性出力）を追加。既存 props・文言は無変更 |
| `apps/web/src/lib/server-fetch/safe-fetch.ts` | 編集 | T02 | `safeServerFetch` 失敗時に `status` / `code` / `path` を構造化ログ出力する `onError` フックを追加（既存呼び出しは後方互換） |
| `scripts/diagnose-profile-session.sh` | 新規 | T03 | read-only・冪等の診断スクリプト |
| `apps/web/app/(member)/profile/page.spec.tsx` | 編集（テスト） | T01 | 410 / 5xx 族 / FAILED 各 status の区別ケースを追加。既存 404 / 401 / 503 ケースは回帰 guard として保持 |
| `apps/web/src/components/member/__tests__/SectionError.spec.tsx` | 新規（テスト） | T01 | `cause` prop の `data-cause` 描画と後方互換テスト |
| `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts` | 新規（テスト） | T02 | 構造化ログ出力（`status`/`code`/`path`）と memberId 非露出テスト |
| `apps/web/src/lib/server-fetch/__tests__/profile-session-cause.spec.ts` | 新規（テスト） | T01/T08 | 写像純関数の網羅テスト（Phase 8 で集約。Phase 6 でケース確定） |

> 削除ファイルは無し。`apps/api` 配下・D1 schema・Google Form 仕様・`/me` レスポンス shape / path / status 体系は一切変更しない（AC-6 / 不変条件 #5）。

### 5.3 依存関係と実行順

3 タスクは関心が分離（UI 表示 / server ログ / 運用診断）し、相互にコード依存が無いため **並列実装可能**。レビュー観点での推奨実行順:

1. **T02（構造化ログ）** — `safe-fetch.ts` の `onError` フックを先に固める。これにより T01 の区別分岐実装中も server ログで status/code を即確認でき、観測性の足場ができる。
2. **T01（区別表示）** — Phase 8 で集約する写像純関数 `profile-session-cause.ts` を新設し、`page.tsx` のデフォルト分岐を 410 / 5xx 族 / FAILED で区別。`SectionError` に `cause` prop を追加。401 redirect・404 CTA は無変更で回帰 guard を通す。
3. **T03（診断スクリプト）** — 完全独立。既存 `smoke-staging-me.sh` / `diagnose-auth-secret-parity.sh` の命名・read-only 規約に揃え、staging 実機切り分け（Phase 11）を 1 本のコマンドで再現可能にする。

> T01 と T02 は同じ「デフォルト分岐に集約された root cause（H6）」を異なる層（UI 区別 / server ログ）で可視化する多重観測。どちらか一方でも原因コードは露出するが、両方実装して UI とログの両面から切り分け可能にする（SSOT §2 / Phase 2 因果ループ B1）。

### 5.4 検証コマンド（全タスク共通の最終確認）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  "app/(member)/profile/page.spec.tsx" \
  "src/components/member/__tests__/SectionError.spec.tsx" \
  "src/lib/server-fetch/__tests__/safe-fetch.spec.ts" \
  "src/lib/server-fetch/__tests__/profile-session-cause.spec.ts"
# 診断スクリプト（read-only・実装後 / staging 認証は user-gated）
bash scripts/diagnose-profile-session.sh --help
```

## 完了条件

- [x] T01〜T03 の実装仕様書本体へのリンクを確定
- [x] 変更ファイル一覧（新規 / 編集 / 削除）を確定
- [x] 依存関係（相互非依存・並列可）と推奨実行順を確定
- [x] 全タスク共通の検証コマンドを確定
- [x] 本格修正（410 復帰 / 5xx 根治 / transport 運用是正 / 管理者 UX）は本 Phase の範囲外であり Phase 12 で未タスク化することを明記（CONST_007 例外①）

## 成果物

- `outputs/phase-5/phase-5.md`（本ファイル）
- `outputs/phase-5/task-01-error-branch-disambiguation.md`
- `outputs/phase-5/task-02-structured-logging.md`
- `outputs/phase-5/task-03-diagnose-script.md`

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | `/me` 解決 / 401・410 境界（区別分岐の根拠） |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | `/me` レスポンス shape の不変確認（AC-6） |
| MVP 認証方針 | `docs/00-getting-started-manual/specs/13-mvp-auth.md` | session 未解決→401→redirect の正本 |
| UI/UX | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | エラー表示 / 導線の方針 |

- `_shared-context.md`（SSOT §2 仮説マトリクス / §3 スコープ / §4 AC / §5 inventory）
- `outputs/phase-4/phase-4.md`（I/O 契約）

## 統合テスト連携

各 task-0N の `## 5. テスト方針` の TC-ID を Phase 6（410/5xx/FAILED/404/401 fail path / 回帰 guard / ログ出力）で集約し、Phase 7 で変更ブロックに限定した line/branch カバレッジを確認、Phase 8 で写像純関数化（重複排除）と rollback 方針へ引き継ぐ。
