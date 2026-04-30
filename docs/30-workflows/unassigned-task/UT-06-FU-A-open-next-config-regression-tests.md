# UT-06-FU-A-INFRA-REGRESSION: apps/web OpenNext wrangler 設定回帰テスト追加 - タスク指示書

> **検出 ID**: UNASSIGNED-FU-A-003
> **発生元**: `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/outputs/phase-12/unassigned-task-detection.md`

## メタ情報

| 項目         | 内容                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------ |
| タスクID     | UNASSIGNED-FU-A-003 (内部識別: UT-06-FU-A-INFRA-REGRESSION-001)                           |
| タスク名     | apps/web OpenNext wrangler 設定回帰テスト追加                                              |
| 分類         | followup / test-addition（インフラ回帰防止）                                               |
| 対象機能     | apps/web `wrangler.toml` / `.assetsignore` / `package.json` のインフラ設定                 |
| 優先度       | Medium                                                                                     |
| 見積もり規模 | 小規模                                                                                     |
| ステータス   | spec_pending                                                                               |
| visualEvidence | NON_VISUAL                                                                               |
| 親タスク     | UT-06-FU-A (`docs/30-workflows/ut-06-followup-A-opennext-workers-migration/`)              |
| 発見元       | UT-06-FU-A Phase 12 unassigned-task-detection (UNASSIGNED-FU-A-003)                        |
| 発見日       | 2026-04-29                                                                                 |

---

## 苦戦箇所【記入必須】

UT-06-FU-A の OpenNext Workers 移行では、実装の中心が `apps/web/wrangler.toml` / `apps/web/.assetsignore` / `apps/web/package.json` という **設定ファイルの変更** だった。これらは UI コンポーネントやアプリケーションロジックを伴わないため、Vitest の通常テストや Playwright の E2E では回帰を検出できない。具体的には:

- `pages_build_output_dir = ".next"` が誰かの手でうっかり復活すると、Workers 形式から Pages 形式へ静かに退行する
- `[env.staging.assets]` / `[env.production.assets]` のいずれかが欠落すると、deploy は通ってしまうが配信時に assets binding が失われる
- `package.json` の `scripts.deploy` が再追加されると、`scripts/cf.sh` ラッパーを迂回した直接 deploy が起きうる
- `.assetsignore` の `_worker.js` などの必須除外行が消えると、Workers エントリが assets としても配信されてしまう

これらは「次に同種の課題に直面したとき」に「目視レビューだけが頼り」になる構造的な弱点であり、CI で禁止キー検出と必須パターン検証を仕組み化することで、将来の同種課題を簡潔に解決できる。

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

UT-06-FU-A で apps/web を Cloudflare Pages 形式から OpenNext on Workers 形式へ移行した。移行の正しさは以下の構造的不変条件に依存している。

- `wrangler.toml` トップレベルに `pages_build_output_dir` が **存在しない**
- `[env.staging.assets]` / `[env.production.assets]` のように env-scoped で `[assets]` が存在し、`directory = ".open-next/assets"` を指す
- `package.json` の `scripts` に `deploy` キーが **存在しない**（`scripts/cf.sh` 経由を強制）
- `.assetsignore` に `_worker.js` 等 OpenNext が要求する必須除外行が含まれる

### 1.2 問題点・課題

- これらは設定ファイルなので、通常の単体テスト・E2E では到達しない
- レビューの記憶頼みでは、半年後に別タスクで `wrangler.toml` を触ったときに容易に retrogress する
- drift を deploy 後に発見すると、production rollback が必要になる

### 1.3 放置した場合の影響

- Pages 形式への意図しない退行を CI で防げない
- `scripts/cf.sh` 迂回を CI で検出できず、1Password 経由の secret 注入ルールが破られる
- `.assetsignore` 必須除外欠落で `_worker.js` が assets としても配信される事故が再発する

---

## 2. 何を達成するか（What）

### 2.1 目的

apps/web の OpenNext Workers 設定が満たすべき構造的不変条件を **CI で機械的に検証** し、設定退行を deploy 前に検出できる状態にする。

### 2.2 想定 AC

1. infra regression test が以下をすべて検証する
   - `apps/web/wrangler.toml` トップレベルに `pages_build_output_dir` キーが存在しないこと
   - `apps/web/wrangler.toml` の `[env.staging.assets]` / `[env.production.assets]` が存在し `directory = ".open-next/assets"` を含むこと
   - `apps/web/package.json` の `scripts` に `deploy` キーが存在しないこと
   - `apps/web/.assetsignore` に必須除外行（最低限 `_worker.js`）が含まれること
2. テストは `pnpm --filter @ubm-hyogo/web test:infra`（または同等 npm script）で実行可能
3. CI workflow（既存 `verify-*` または新規 `verify-web-infra` job）に組み込まれ、PR ブロッカーとして機能する
4. 失敗時メッセージから「どの不変条件が破られたか」「どこを直せば通るか」が読み取れる

### 2.3 スコープ

#### 含むもの

- vitest または node スクリプトでの infra regression test 追加
- `apps/web/wrangler.toml` を TOML パーサ（`@iarna/toml` 等）でパースしてキー存在検証
- `apps/web/package.json` の JSON パース・script 不在検証
- `apps/web/.assetsignore` の文字列パターン検証
- CI workflow への job 追加（または既存 verify-* への統合）

#### 含まないもの

- staging / production への実 deploy 実行
- Cloudflare 実アカウント操作（API token 利用テスト）
- OpenNext そのものの挙動テスト（OSS 側責務）
- E2E smoke（UT-06 Phase 11 で別途実施）

### 2.4 成果物

- infra regression test ファイル（例: `apps/web/tests/infra/wrangler-config.test.ts`）
- `apps/web/package.json` の test:infra script
- CI workflow 差分（`.github/workflows/verify-*.yml`）
- 失敗例 / 成功例のスクショまたはログ

---

## 3. リスクと対策

| リスク | 対策 |
| --- | --- |
| `pages_build_output_dir` が復活する | infra test で TOML トップレベルの禁止キー存在を assertion |
| env-scoped `[assets]` が欠落する | staging / production それぞれの `assets.directory` を明示的に検証 |
| `deploy` script が復活する（scripts/cf.sh 迂回） | `package.json` の `scripts.deploy === undefined` を assertion |
| `.assetsignore` の必須除外が消える | 必須行リストを定数化し全行存在検証 |
| TOML パーサの差異で false positive | `@iarna/toml` など実績あるパーサに固定し、fixture でゴールデンテスト |
| CI に組み込み忘れ | 既存 `verify-indexes` 等と同パターンで `.github/workflows/` に明示追加 |

---

## 4. 検証方法

### 4.1 ローカル検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test:infra
```

- 期待: 4 種の不変条件すべて PASS
- 退行シミュレーション:
  - `wrangler.toml` に `pages_build_output_dir = ".next"` を追記 → FAIL
  - `[env.production.assets]` ブロックを削除 → FAIL
  - `package.json` に `"deploy": "wrangler deploy"` を追加 → FAIL
  - `.assetsignore` から `_worker.js` を削除 → FAIL

### 4.2 CI 検証

- PR を立てた際に新 job が `required` として走り、退行 PR は merge ブロックされる

### 4.3 ゴールデン参照

- 現状の `apps/web/wrangler.toml` / `apps/web/.assetsignore` / `apps/web/package.json` が UT-06-FU-A 完了時点のスナップショットとして PASS することを確認

---

## 5. 影響範囲

- `apps/web/tests/infra/`（新規ディレクトリ想定）
- `apps/web/package.json`（test:infra script 追加）
- `.github/workflows/`（verify job 追加 / 拡張）
- 既存ビルド・deploy パスへの実行時影響なし（CI のみ）

---

## 6. 依存・関連タスク

- 依存: `task-impl-opennext-workers-migration-001`（移行完了が前提・現在の設定がゴールデン基準）
- 関連: UT-06-FU-A-PROD-ROUTE-SECRET-OBS（production deploy 前確認との直交）
- 関連: UT-GOV-001（branch protection / required status checks に統合）

---

## 7. 推奨タスクタイプ

test-addition / infra-quality-gate

---

## 7.5 Phase 計画 / 着手順序

| Phase | 内容 | 完了条件 |
|-------|------|----------|
| P1: ゴールデン取得 | 現行 `apps/web/wrangler.toml` / `.assetsignore` / `package.json` の不変条件を抽出し fixture 化 | 不変条件リスト + fixture コミット |
| P2: 単体テスト実装 | `defineCloudflareConfig` / TOML パース・JSON パース・文字列パターン検証の Vitest テスト追加 | `pnpm --filter @ubm-hyogo/web test:infra` で PASS |
| P3: 退行シミュレーション | 4 種の禁止/必須条件破りを fixture で再現し FAIL することを検証 | 全シナリオで期待 FAIL |
| P4: build pipeline 回帰 | `build:cloudflare` 出力に `.open-next/` が生成されることをスモーク統合テストで確認 | CI で `.open-next/assets` 存在 assert |
| P5: CI 組込 | `.github/workflows/verify-*.yml` に `verify-web-infra` job 追加 / branch protection の required status へ追加 | PR で job が required として実行 |
| P6: 失敗メッセージ整備 | 各 assertion の失敗メッセージに修正手順を含める | 失敗ログから直し方が読める |

---

## 8. 参照情報

- 検出ログ: `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/outputs/phase-12/unassigned-task-detection.md` の UNASSIGNED-FU-A-003
- 実装ガイド: `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/outputs/phase-12/implementation-guide.md`
- ゴールデン状態: 現行の `apps/web/wrangler.toml` / `apps/web/.assetsignore` / `apps/web/package.json`
- 関連スキル: task-specification-creator（本仕様書のフォーマット元）

---

## 9. 備考

- 本タスクは「設定 drift 検出」に特化しており、OpenNext や Cloudflare の挙動テストではない点に留意する
- 将来 `apps/api` 側でも同パターンの infra regression test が必要になった場合、本タスクの test 構造を re-use できるよう汎用化を意識する（ただし MVP ではスコープ外）
- 失敗メッセージは「人間が直す手順を逆引きできる」粒度を維持する（例: `pages_build_output_dir is forbidden; remove it from apps/web/wrangler.toml top-level — Workers形式では .open-next/ assets binding を使う`）
