# Phase 11 outputs / manual-test-result — NON_VISUAL 宣言と代替証跡

## NON_VISUAL 宣言

| 項目 | 値 |
| --- | --- |
| visualEvidence | **NON_VISUAL** |
| screenshots/ ディレクトリ | **作成しない**（`.gitkeep` 含む） |
| UI / Renderer / 画面遷移 | 一切なし |
| 実走ステータス | **NOT EXECUTED**（Phase 13 ユーザー承認後の別オペレーションで実走） |

## スクリーンショットを作らない理由

本タスクは GitHub Actions Secrets / Variables の配置と、その結果として走る CD ワークフローの green / red 確認のみを扱う。**描画される画面は一切存在しない**。具体的には:

- `gh secret set` / `gh variable set` / `gh api` は CLI 操作で UI を持たない。
- CD の動作確認は GitHub Actions の run ログ・Cloudflare Pages / Workers Deploys の履歴・Discord 通知の到達確認に集約され、いずれも URL / commit SHA / マスク済みログという**テキスト証跡で完結**する。
- 仮にスクリーンショットを撮っても、(a) `gh secret list` の値マスク部分が画像化されるだけで情報量がテキスト出力以下、(b) 画像内に意図せず別 secret 値・画面外情報が写り込むリスクが上回る。

したがって本 Phase 11 では `outputs/phase-11/screenshots/` を**作らない**ことが正しい NON_VISUAL 整合である。

## 証跡の主ソース（実走時 = Phase 13 ユーザー承認後）

| # | 証跡 | 保存先 | 取得コマンド例 | 値マスク |
| --- | --- | --- | --- | --- |
| 1 | dev push の commit SHA | `outputs/phase-13/verification-log.md` | `git rev-parse HEAD` | N/A |
| 2 | `backend-ci.yml` deploy-staging run URL | 同上 | `gh run list --workflow=backend-ci.yml --branch=dev --limit=1 --json url -q .[0].url` | URL のみ。値は出力されない |
| 3 | `web-cd.yml` deploy-staging run URL | 同上 | `gh run list --workflow=web-cd.yml --branch=dev --limit=1 --json url -q .[0].url` | URL のみ |
| 4 | `gh secret list`（マスク済） | 同上 | `gh secret list` / `gh secret list --env staging` / `gh secret list --env production` | 値はマスク済 |
| 5 | `gh variable list` | 同上 | `gh variable list` | `CLOUDFLARE_PAGES_PROJECT` の値はそのまま表示（Variable のため） |
| 6 | Cloudflare Pages / Workers Deploys 履歴 ID | 同上 | `bash scripts/cf.sh pages deployment list` 等 | 値は出力されない |
| 7 | Discord 通知到達タイムスタンプ | 同上 | チャンネル目視 | 通知内容（commit SHA / 結果判定）のみ。token は含まれない |
| 8 | `if: secrets.X != ''` 評価結果（未設定耐性） | 同上 | `gh run view <id> --log` で通知ステップが skip されたかログ検証 | secret 値は含まれない |
| 9 | 1Password Item Notes Last-Updated 日時 | 1Password Item 内 | 1Password アプリで目視 | 日時のみ。値ハッシュは記載しない |

> **重要**: いずれの証跡にも secret / token / Webhook URL の**実値は一切含まれない**。`gh secret list` は値が常にマスクされる仕様、`gh run view --log` も secret はランナー側で `***` 置換される。

## 本 Phase（Phase 11 / spec_created）の証跡ステータス

| ファイル | ステータス | 内容 |
| --- | --- | --- |
| `manual-smoke-log.md` | NOT EXECUTED | 4 ステップのコマンド系列を仕様レベルで固定したのみ |
| `manual-test-result.md`（本ファイル） | NOT EXECUTED | NON_VISUAL 宣言と証跡主ソースの出所明示のみ |
| `link-checklist.md` | EXECUTED（spec walkthrough） | 仕様書間リンクの健全性チェックは spec walkthrough で完了可能 |

## 実走時の流れ（Phase 13 ユーザー承認後）

1. user 明示承認（実 secret 配置 + 実 dev push 実行）取得
2. `outputs/phase-13/apply-runbook.md` に従い secret/variable/environment を配置
3. `manual-smoke-log.md` STEP 1〜4 を実走
4. 上記表「証跡の主ソース」9 件を `outputs/phase-13/verification-log.md` に転記
5. drift / failure があれば即時 rollback（`gh secret delete` + 1Password から再注入）

## スクリーンショット代替の自己証明

> 「テキスト証跡だけで本タスクの動作確認は完結する」を本ファイルが宣言する。スクリーンショットの追加は将来 PR でも禁止する（NON_VISUAL タスクの整合維持のため）。
