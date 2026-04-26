# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | cloudflare-base-bootstrap |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-23 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (事前検証手順) |
| 状態 | pending |

## 目的

Phase 3 の目的は Phase 2 設計の PASS/MINOR/MAJOR 判定を行い、Phase 4（事前検証手順）への進行可否を決定すること。具体的には、Pages / Workers / D1 のリソース命名・ブランチ戦略・シークレット配置が下流タスク（02: wrangler.toml、03: D1 DB名、04: GitHub Secrets 名）と整合しているかを確認し、手戻りのない source-of-truth を確定する。

## 実行タスク

- input / output を確定する
- 正本仕様との整合を確認する
- 4条件と downstream 影響を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare セットアップ |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | Pages / Workers / D1 役割 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | token placement |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | web/api split |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | dev→staging, main→production ブランチ対応 |
| 参考 | Cloudflare Dashboard / Wrangler CLI | 初回セットアップ |

## 実行手順

### ステップ 1: input と前提の確認
- 上流 Phase と index.md を読む。
- 正本仕様との差分を先に洗い出す。

### ステップ 2: Phase 成果物の作成
- 本 Phase の主成果物を outputs/phase-03/main.md に作成・更新する。
- downstream task から参照される path を具体化する。

### ステップ 3: 4条件と handoff の確認
- 価値性 / 実現性 / 整合性 / 運用性を再確認する。
- 次 Phase に渡す blocker と open question を記録する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 本 Phase の出力を入力として使用 |
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
| 1 | input 確認 | 3 | pending | upstream を読む |
| 2 | 成果物更新 | 3 | pending | outputs/phase-03/main.md |
| 3 | 4条件確認 | 3 | pending | next phase へ handoff |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | Phase 3 の主成果物 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- 主成果物が作成済み
- 正本仕様参照が残っている
- downstream handoff が明記されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 4 (事前検証手順)
- 引き継ぎ事項:
  - Phase 4 では `wrangler login` が済んでいること、および Account ID が取得済みであることを前提に事前検証手順を組む
  - MAJOR 該当なし → Phase 4 即時着手可能
  - MINOR M-01（`develop` → `dev` 表記統一）は Phase 4 の scope 外として Phase 12 行き確定
- ブロック条件: 本 Phase の主成果物が未作成なら次 Phase に進まない。

## レビューチェックリスト (4条件)

| 観点 | レビュー問い | 評価根拠 | 判定 |
| --- | --- | --- | --- |
| 価値性 | インフラ担当者の手動セットアップミスを防ぎ、dev/main 環境混乱を解消するか | `dev` → staging、`main` → production を一意に定義。下流3タスク（02: wrangler.toml、03: D1 DB名、04: GitHub Secrets 名）が参照する明確な source-of-truth を確立する | PASS |
| 実現性 | Pages 無制限 / Workers 100k req/day / D1 5GB の無料枠で初回スコープが成立するか | ubm-hyogo 初期トラフィックは無料枠の 1/10 以下の見込み | PASS |
| 整合性 | branch / env / runtime / data / secret が一致するか | branch-strategy.md と deployment-cloudflare.md が同一の dev/main 対応を記述。APIトークン（Pages:Edit + Workers:Edit + D1:Edit）を CLOUDFLARE_API_TOKEN として GitHub Secrets に配置し、ランタイムシークレットは Cloudflare Workers Secrets に分離 | PASS |
| 運用性 | rollback / handoff / same-wave sync が可能か | Pages は Dashboard 1クリックでロールバック、Workers は `wrangler rollback` で独立ロールバック可能。同 Wave の 01a/01c とデータ共有なし | PASS |

## より単純な代替案

| 代替案 | 概要 | 不採用理由 |
| --- | --- | --- |
| 代替案A: Google Sheets を正本DB | Sheets をカノニカルとして直接参照 | 同時編集・スキーマ管理・履歴追跡に難があるため D1 を正本とした |
| 代替案B: OpenNext 単一構成 | Pages + Workers を一体化 | web と api のデプロイサイクルが異なるため経路を分離した（`ubm-hyogo-web` と `ubm-hyogo-api` を独立管理） |
| 代替案C: 通知基盤まで同時に入れる | Discord/Slack 通知を初回から導入 | 無料枠スコープ外のため未タスク行きとした |

## PASS / MINOR / MAJOR 判定

| 判定 | 条件 | 今回の実例 |
| --- | --- | --- |
| PASS | 下流 blocker を残さない | 4条件すべて PASS。Phase 4 へ進める |
| MINOR | 同 wave で吸収できる | `deployment-cloudflare.md` に残る `develop` 表記を `dev` に統一（Phase 12 で修正予定） |
| MAJOR | task 分割または前提再定義が必要 | 該当なし |

## MINOR 追跡表

| ID | 内容 | 対応 Phase |
| --- | --- | --- |
| M-01 | `deployment-cloudflare.md` に残る `develop` 表記を `dev` に統一 | Phase 12 |
| M-02 | `ubm-hyogo-web.pages.dev` URL の最終確定（DNS 設定後） | Phase 11 smoke test |
