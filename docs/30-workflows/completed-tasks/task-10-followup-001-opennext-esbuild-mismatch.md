# SUPERSEDED: OpenNext esbuild host/binary mismatch 解消 - タスク指示書

本ファイルは `docs/30-workflows/task-10-followup-001-opennext-esbuild-mismatch/` の Phase 1-13 workflow に展開済み。2026-05-11 の実行で `package.json` / `pnpm-lock.yaml` に esbuild override を反映し、`build:cloudflare` PASS を `outputs/phase-11/evidence/after-build-cloudflare.log` に保存した。以後の正本は workflow directory を参照する。

## メタ情報

| 項目         | 内容                                                            |
| ------------ | --------------------------------------------------------------- |
| タスクID     | task-10-followup-001-opennext-esbuild-mismatch                  |
| Issue        | #609                                                            |
| タスク名     | `build:cloudflare` を阻む OpenNext / esbuild バージョン整合     |
| 分類         | 改善（環境）                                                    |
| 対象機能     | `apps/web` Cloudflare Workers ビルドパイプライン                |
| 優先度       | 高                                                              |
| 見積もり規模 | 小規模                                                          |
| ステータス   | SUPERSEDED / 実装済み                                           |
| 発見元       | task-10-ui-primitives-spec / Phase 11 evidence                  |
| 発見日       | 2026-05-09                                                      |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

task-10 (UI primitives 実装) で `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` を実行したところ、`@opennextjs/cloudflare` 内部で利用される esbuild の host バージョン (`0.25.4`) と node_modules に解決されたバイナリ (`0.21.5`) の不一致で fail した。`pnpm rebuild esbuild` でも mismatch が解消しなかった。

### 1.2 問題点・課題

- `build:cloudflare` が deploy 直前の最終ゲートだが、ローカル / CI 双方で詰まる構造。
- task-10 の `VISUAL_ON_EXECUTION` evidence (runtime screenshot / axe) がこの blocker により取得できない。
- 下流 task-11..17 (`ui-prototype-alignment-mvp-recovery`) も同 build を経て visual evidence を出すため、同じ詰まりに直撃する。
- staging / production への再デプロイ全体を阻害する潜在リスク。

### 1.3 放置した場合の影響

- task-10 Phase 13 (PR) が runtime evidence 不足で merge できない。
- 下流 task-11..17 の Phase 11 evidence もブロックされ、UI prototype alignment の MVP recovery が遅延。
- Cloudflare Workers への deploy が rollback / hotfix を含めて困難になる。

---

## 2. 何を達成するか（What）

### 2.1 目的

`pnpm --filter @repo/web build:cloudflare` がローカル (Node 24 / pnpm 10) と CI でグリーン通過する状態を回復させる。

### 2.2 最終ゴール

- `@opennextjs/cloudflare` が要求する esbuild host と node_modules バイナリが一致する。
- `mise exec -- pnpm --filter @repo/web build:cloudflare` が PASS する。
- task-10 の Phase 11 runtime evidence (screenshot + axe) が取得可能になる。

### 2.3 スコープ

#### 含むもの

- `package.json` / `pnpm-lock.yaml` の esbuild バージョン整合
- `@opennextjs/cloudflare` peer 依存の確認とアップグレード判断
- ESBUILD_BINARY_PATH 等の env 経由解決（`scripts/cf.sh` 既存路線との整合）
- ローカルと CI で再現性が取れる検証手順の文書化

#### 含まないもの

- UI primitive 実装の追加変更（task-10 本体は完了済み）
- D1 schema・API endpoint の変更
- 新規 Cloudflare binding の追加

### 2.4 成果物

- 整合された `pnpm-lock.yaml`（必要に応じて `package.json` の esbuild 制約）
- `build:cloudflare` PASS ログ
- 再現手順ドキュメント（`docs/00-getting-started-manual/` 配下に短いノート、または既存 cf-script README に追記）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- Node 24.15.0 / pnpm 10.33.2（`.mise.toml` 正本）
- `mise exec --` 経由で実行
- `scripts/cf.sh` 系 wrapper を直接 wrangler に置き換えないこと（CLAUDE.md 不変条件）

### 3.2 依存タスク

- 直接の依存なし（環境タスク）
- 影響先: task-10 Phase 13、task-11..17 visual evidence

### 3.3 必要な知識

- pnpm の peer 解決と `.pnpm` ストア構造
- esbuild の `host` / `binary` 二段構造（プラットフォーム固有 binary パッケージ）
- `@opennextjs/cloudflare` の bundler 内部依存
- `ESBUILD_BINARY_PATH` 環境変数の効き方

### 3.4 推奨アプローチ

1. 失敗ログを再取得し、host / binary それぞれの解決元を `pnpm why esbuild` で特定する。
2. `@opennextjs/cloudflare` が pin している esbuild バージョン要求を読む。
3. workspace 全体で esbuild を単一バージョンに揃える（pnpm `overrides` 検討）。
4. `scripts/cf.sh` ですでに `ESBUILD_BINARY_PATH` を解決している前提を再確認し、binary 側を host 側に追従させる手順を明文化する。

---

## 4. 実行手順

### Phase 構成

1. 失敗ログ再取得と原因特定
2. esbuild 整合方針の決定
3. lockfile 更新と検証
4. 再現手順のドキュメント化

### Phase 1: 失敗ログ再取得と原因特定

#### 目的

host / binary の不一致を機械的に特定する。

#### 手順

1. `mise exec -- pnpm --filter @repo/web build:cloudflare 2>&1 | tee build-cloudflare.log`
2. `mise exec -- pnpm why esbuild`
3. `@opennextjs/cloudflare` の `package.json` から esbuild 要求を確認

#### 成果物

`build-cloudflare.log` と `pnpm why esbuild` 出力

#### 完了条件

mismatch を起こしている host / binary バージョンが特定できている

### Phase 2: esbuild 整合方針の決定

#### 目的

upgrade / downgrade / overrides のいずれで揃えるかを決める。

#### 手順

1. `@opennextjs/cloudflare` が許容する esbuild 範囲を確認
2. `apps/web` 直接依存の esbuild 利用箇所を確認
3. `pnpm.overrides` で単一バージョンに固定する案を採用

#### 成果物

整合方針ノート

#### 完了条件

採用方針が 1 つに収束している

### Phase 3: lockfile 更新と検証

#### 目的

`build:cloudflare` を PASS させる。

#### 手順

1. `pnpm.overrides` で esbuild を host バージョンに固定
2. `mise exec -- pnpm install`
3. `mise exec -- pnpm --filter @repo/web build:cloudflare`
4. ログを `outputs/` または task-10 evidence へ反映

#### 成果物

PASS ログと差分

#### 完了条件

`build:cloudflare` が PASS、CI でも再現する

### Phase 4: 再現手順のドキュメント化

#### 目的

将来同じ mismatch が起きた時に最短で復旧できる手順を残す。

#### 手順

1. `docs/00-getting-started-manual/` または `scripts/cf.sh` README に short note を追加
2. 苦戦箇所セクションを参照しやすくする

#### 成果物

ドキュメント差分

#### 完了条件

note が main にマージ可能な状態である

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `mise exec -- pnpm --filter @repo/web build:cloudflare` が PASS する
- [ ] `pnpm why esbuild` が単一バージョンに収束する
- [ ] task-10 Phase 11 evidence が取得可能になる

### 品質要件

- [ ] `mise exec -- pnpm typecheck` 成功
- [ ] `mise exec -- pnpm lint` 成功
- [ ] CI 上でも `build:cloudflare` が PASS する

### ドキュメント要件

- [ ] esbuild mismatch 復旧手順ノートが存在する
- [ ] task-10-ui-primitives-spec の blocker reference が解消済みリンクへ更新

---

## 6. 検証方法

### テストケース

- ローカル (Node 24 / pnpm 10) で `build:cloudflare` PASS
- CI workflow で `build:cloudflare` PASS
- `pnpm why esbuild` が単一バージョン

### 検証手順

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter @repo/web build:cloudflare
mise exec -- pnpm why esbuild
```

---

## 7. リスクと対策

| リスク                                                                | 影響度 | 発生確率 | 対策                                                            |
| --------------------------------------------------------------------- | ------ | -------- | --------------------------------------------------------------- |
| `pnpm.overrides` が他パッケージの bundler 動作を壊す                   | 中     | 中       | `apps/api` / `packages/*` の build を全部緑になるまで検証       |
| `@opennextjs/cloudflare` upgrade が runtime API 互換性を破壊          | 高     | 低       | 同パッケージは bump しない、esbuild 側のみ揃える方針を優先      |
| platform 固有 binary が CI と local で異なり host と再 mismatch       | 中     | 中       | `ESBUILD_BINARY_PATH` を含む `scripts/cf.sh` 経路で再現性確認   |

---

## 8. 苦戦箇所メモ（再発防止）

- `pnpm rebuild esbuild` を最初に試したが host バージョンと binary バージョンが別パッケージで管理されているため解消しなかった。
- esbuild は `esbuild` (host) と `@esbuild/<platform>` (binary) の 2 段構造。`pnpm why` で両方を見ないと原因に辿り着かない。
- `@opennextjs/cloudflare` は bundler 内部に esbuild を抱えるので、`apps/web` 単独の依存だけ揃えても直らない。workspace 全体の `overrides` が現実的。
- `mise exec --` を抜くと Node が古い系統に落ちて esbuild 解決が変わるケースがある。再現時は必ず `mise exec --` 経由で実行する。

---

## 9. 参照情報

### 関連ドキュメント

- `docs/30-workflows/task-10-ui-primitives-spec/outputs/phase-11/evidence/build.log`
- `docs/30-workflows/task-10-ui-primitives-spec/outputs/phase-12/unassigned-task-detection.md`
- `scripts/cf.sh`
- `apps/web/wrangler.toml`

### 関連 issue / task

- task-10-ui-primitives-spec (本 followup の親)
- ui-prototype-alignment-mvp-recovery (下流 task-11..17 の親 workflow)
