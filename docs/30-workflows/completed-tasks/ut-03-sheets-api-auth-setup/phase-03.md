# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets API 認証方式設定 (UT-03) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-29 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | completed（実装・仕様書フェーズ完了。workflow root は `completed`） |
| タスク種別 | implementation（design review） |
| visualEvidence | NON_VISUAL |

## 目的

Phase 2 の設計（Service Account JSON key + Web Crypto JWT + TTL 1h キャッシュ）に対して、3 つ以上の代替案（OAuth 2.0、`google-auth-library`、Workers 互換 JWT ライブラリ）を比較し、4 条件 + 4 観点で PASS / MINOR / MAJOR を確定し、Phase 4 への着手可否ゲート（GO / NO-GO）を通す。

## 実行タスク

1. 代替案を最低 3 つ列挙する（A: 採択 base case / B: OAuth 2.0 / C: google-auth-library / D: Workers 互換 JWT ライブラリ）（完了条件: 4 案以上が比較表に並ぶ）。
2. 各代替案に対し 4 条件 + 4 観点（Edge Runtime 互換 / Secret hygiene / 無料枠 / 不変条件 #5）で PASS / MINOR / MAJOR を付与（完了条件: マトリクスに空セルゼロ）。
3. base case（案 A）を選定理由付きで確定（完了条件: 選定理由が代替案比較から導出されている）。
4. PASS / MINOR / MAJOR 判定基準を定義（完了条件: 各レベルの基準文が記載）。
5. 着手可否ゲート（GO / NO-GO）を定義（完了条件: Phase 4 移行の前提として明示）。
6. open question を Phase 4 以降に明示的に渡す（完了条件: open question が 0 件 or 受け皿 Phase 指定）。
7. 成果物 `outputs/phase-03/main.md` と `outputs/phase-03/alternatives.md` を分離して作成（完了条件: 2 ファイル分離が成果物リストと一致）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-03-sheets-api-auth-setup/phase-02.md | レビュー対象設計 |
| 必須 | docs/30-workflows/ut-03-sheets-api-auth-setup/outputs/phase-02/main.md | base case の構造 |
| 必須 | docs/30-workflows/ut-03-sheets-api-auth-setup/outputs/phase-01/main.md | AC-1〜AC-10 |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-monorepo.md | `packages/integrations` 境界 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Secret 配置方針 |
| 参考 | https://github.com/googleapis/google-auth-library-nodejs | C 案の実装観察 |
| 参考 | https://github.com/tsndr/cloudflare-worker-jwt | D 案候補 |
| 参考 | https://github.com/panva/jose | D 案候補（Web Crypto ベース） |

## 代替案サマリ（詳細は `outputs/phase-03/alternatives.md`）

- 案 A（base case）: 自前実装 Service Account JSON key + Web Crypto API + TTL 1h キャッシュ。
- 案 B: OAuth 2.0（offline access + refresh_token 永続化）。
- 案 C: `google-auth-library`（Node.js 公式ライブラリ）を使う。
- 案 D: Workers 互換 JWT ライブラリ（`@tsndr/cloudflare-worker-jwt` / `jose` 等）+ token 交換は自前。

## PASS / MINOR / MAJOR 判定基準

| レベル | 基準 |
| --- | --- |
| PASS | base case の判断軸を満たす。block にならず Phase 4 へ進める。 |
| MINOR | 警告レベル。Phase 5 実装時に補足対応（runbook / log 追記）が必要だが Phase 4 移行は許可。 |
| MAJOR | block。Phase 4 に進めない。設計を Phase 2 に差し戻すか、open question として MVP スコープ外に明確化する。 |

## base case（案 A）最終 PASS / MINOR / MAJOR 判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | UT-09 / UT-21 が再利用可能、運用ゼロで Sheets 接続確立 |
| 実現性 | PASS | 01c 完了済、Web Crypto API は Workers ネイティブ |
| 整合性 | PASS | 不変条件 #1/#4/#5 + CLAUDE.md Secret 運用ルール遵守 |
| 運用性 | PASS | TTL 1h キャッシュ + 1Password 集中管理 + runbook |
| Edge Runtime 互換 | PASS | Node API 非依存、Web Crypto のみ |
| Secret hygiene | PASS | 1Password `op://` 参照のみ、`.env` 平文禁止 |
| 無料枠 | PASS | 追加ストレージ不要、token 交換は月数十回 |
| 不変条件 #5 | PASS | D1 を触らない |

## 着手可否ゲート（Phase 4 への GO / NO-GO 判定）

### GO 条件（全て満たすこと）

- [ ] 代替案 4 案以上が評価マトリクスに並んでいる
- [ ] base case の最終判定が全観点 PASS
- [ ] MAJOR が一つも残っていない
- [ ] MINOR がある場合、対応 Phase（5 / 6 / 11 / 12）が指定されている
- [ ] open question が 0 件、または Phase 12 unassigned-task-detection.md への送り先が明記
- [ ] alternatives.md に各代替案の却下理由が明文化

### NO-GO 条件（一つでも該当）

- 4 条件のいずれかに MAJOR が残る
- Edge Runtime 非互換の設計（Node API 依存）が残っている
- `GOOGLE_SERVICE_ACCOUNT_JSON` の Secret 配置経路が未定義
- `.dev.vars` の `.gitignore` ガード手順が未記載

## open question（Phase 4 以降に渡す候補）

| # | 質問 | 受け皿 Phase | 備考 |
| --- | --- | --- | --- |
| 1 | scale-out 時の token 交換コール頻度を staging 観測で再確認するか | Phase 11 | 月次推定値の検証 |
| 2 | private_key ローテーション運用手順をいつ整備するか | Phase 12 unassigned | 数年単位なので MVP 後で可 |
| 3 | スコープを `spreadsheets.readonly` に固定するか書き込みも許容するか | Phase 4 / UT-09 設計 | UT-09 で同期方式に応じ判断 |
| 4 | Workers 互換 JWT ライブラリ（D 案）を将来採択する余地 | Phase 12 unassigned | 自前実装が肥大化した場合の選択肢 |

## 実行手順

### ステップ 1: 代替案の列挙

- 案 A〜D を `outputs/phase-03/alternatives.md` に記述。
- 各案に概要・利点・欠点・却下理由（A 以外）を 3〜5 行で記述。

### ステップ 2: 評価マトリクスの作成

- 8 観点（4 条件 + Edge Runtime 互換 + Secret hygiene + 無料枠 + 不変条件 #5）× 4 案を埋める。
- 空セルが残らないこと。

### ステップ 3: base case の最終判定

- 全 PASS 確認。
- MINOR が残る場合は対応 Phase を明示。

### ステップ 4: 着手可否ゲートの判定

- GO / NO-GO チェックリストを通す。
- GO の場合のみ artifacts.json `phases[2].status` を `spec_created` のままにし Phase 4 へ進める。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | base case を入力に、テスト戦略をモジュール 8 要素 × 検証種別で組む |
| Phase 5 | open question #3（スコープ固定方針）を実装で確定 |
| Phase 10 | base case の最終 PASS 判定を GO/NO-GO の根拠に再利用 |
| Phase 11 | open question #1 を staging 観測で確認 |
| Phase 12 | open question #2 / #4 を unassigned-task-detection.md に登録 |

## 多角的チェック観点

- 価値性: 案 A が無人実行に最適である理由が比較から明示されているか。
- 実現性: 案 C（`google-auth-library`）の Node API 依存が MAJOR である根拠が明文化されているか。
- 整合性: 全代替案で不変条件 #5 が PASS であるか確認。
- 運用性: 案 B（OAuth 2.0）の refresh_token 永続化負担が MAJOR である根拠が明文化されているか。
- Edge Runtime 互換: 案 D（Workers 互換 JWT ライブラリ）が PASS で残るか、追加依存のコスト判断が記載されているか。
- Secret hygiene: 全代替案で `.env` 平文禁止 / 1Password 経由が一貫しているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 代替案 4 案の列挙 | 3 | spec_created | A〜D |
| 2 | 評価マトリクスの作成 | 3 | spec_created | 8 観点 × 4 案 |
| 3 | base case 最終 PASS 判定 | 3 | spec_created | 全観点 PASS |
| 4 | PASS/MINOR/MAJOR 基準の定義 | 3 | spec_created | 3 レベル |
| 5 | 着手可否ゲートの定義 | 3 | spec_created | GO / NO-GO |
| 6 | open question の Phase 振り分け | 3 | spec_created | 4 件 |
| 7 | 成果物 2 ファイル分離 | 3 | spec_created | main.md / alternatives.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | レビュー結果・評価マトリクス・PASS/MINOR/MAJOR・着手可否ゲート |
| ドキュメント | outputs/phase-03/alternatives.md | 代替案 A〜D の詳細・却下理由 |
| メタ | artifacts.json | Phase 3 状態の更新（後続 Phase 群作成時に生成） |

## 完了条件

- [ ] 代替案が 4 案以上比較されている
- [ ] 8 観点 × 4 案のマトリクスに空セルが無い
- [ ] base case の最終判定が全観点 PASS
- [ ] PASS / MINOR / MAJOR の判定基準が明文化されている
- [ ] 着手可否ゲートの GO / NO-GO 条件が記述されている
- [ ] open question 4 件すべてに受け皿 Phase が割り当てられている
- [ ] 成果物が 2 ファイル（main.md / alternatives.md）に分離されている

## タスク 100% 実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 成果物が `outputs/phase-03/` 配下に配置済み
- 4 条件 + 4 観点すべてが PASS
- MAJOR ゼロ
- MINOR がある場合、対応 Phase が記述
- artifacts.json `phases[2].status = spec_created`

## 次 Phase への引き渡し

- 次 Phase: 4 (テスト戦略)
- 引き継ぎ事項:
  - 採用 base case = 案 A（自前実装 SA + Web Crypto + TTL 1h キャッシュ）
  - モジュール 8 要素（Phase 2 で確定）に対する検証観点を Phase 4 入力に渡す
  - open question 4 件を該当 Phase へ register
- ブロック条件:
  - GO 条件のいずれかが未充足
  - MAJOR が残っている
  - base case が代替案比較から導出されていない
