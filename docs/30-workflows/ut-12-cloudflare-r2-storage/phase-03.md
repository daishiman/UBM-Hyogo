# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare R2 ストレージ設定 (UT-12) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-27 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (事前検証手順) |
| 状態 | pending |
| タスク種別 | spec_created（docs-only） |

## 目的

Phase 2 で確定した設計（R2 アーキテクチャ / wrangler.toml diff / Token 判断 / CORS ポリシー / モニタリング方針）の妥当性を 4条件（価値性 / 実現性 / 整合性 / 運用性）で評価し、Phase 4 以降の進行可否を判定する。MINOR / MAJOR / BLOCKER 区分で結果を記録し、必要に応じて Phase 2 へ差し戻す。

## 実行タスク

- Phase 2 の設計成果物 4 点をレビューする
- 代替案を列挙し採用案との比較で妥当性を確認する
- 4条件評価で各観点に判定（PASS / MINOR / MAJOR / BLOCKER）を付与する
- AC-1〜AC-8 と Phase 2 設計の対応表を作成する
- BLOCKER / MAJOR がある場合は Phase 2 へ差し戻す決定を下す
- Phase 4 進行可否のゲート判定を文書化する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-12-cloudflare-r2-storage/phase-02.md | レビュー対象の設計仕様 |
| 必須 | docs/30-workflows/ut-12-cloudflare-r2-storage/phase-01.md | AC・スコープ・4条件評価 |
| 必須 | docs/30-workflows/ut-12-cloudflare-r2-storage/index.md | タスク概要・受入条件 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare 仕様の確認 |
| 必須 | docs/01-infrastructure-setup/01b-parallel-cloudflare-base-bootstrap/outputs/phase-05/token-scope-matrix.md | Token スコープ整合確認 |
| 参考 | .claude/skills/task-specification-creator/references/review-gate-criteria.md | レビューゲート基準 |

## 実行手順

### ステップ 1: 設計成果物の妥当性確認

- `outputs/phase-02/r2-architecture-design.md` が AC-1 / AC-2 / AC-8 を満たしているか
- `outputs/phase-02/wrangler-toml-diff.md` が AC-2 を満たし apps/web に影響しない設計か
- `outputs/phase-02/token-scope-decision.md` が AC-3 を満たし最小権限原則に整合しているか
- `outputs/phase-02/cors-policy-design.md` が AC-5 を満たし環境別 AllowedOrigins を含むか
- 機密情報（Account ID / 実 Token）が成果物に直書きされていないこと

### ステップ 2: 代替案の検討

- バケット数: 1 バケット + prefix 分離 vs 環境別 2 バケット
- Token 戦略: 既存拡張 vs 専用 Token 新規作成 vs Workers RPC 経由のみ
- アクセス方針: 全プライベート + Presigned URL vs 一部 Public Bucket
- モニタリング: Cloudflare Analytics 直視 vs UT-16 集約
- 各代替案のコスト・運用負荷・リスクを比較し採用案の合理性を確認

### ステップ 3: 4条件評価と判定区分

- 価値性 / 実現性 / 整合性 / 運用性で各設計成果物に判定を付与
- 判定区分:
  - PASS: そのまま次 Phase へ
  - MINOR: Phase 5 実行前に解消可能な軽微修正
  - MAJOR: 設計の根本見直し（Phase 2 差し戻し）
  - BLOCKER: 上流タスク未完了等で本タスク自体を保留

### ステップ 4: AC 対応表と進行可否ゲート

- AC-1〜AC-8 と Phase 2 設計成果物の対応表を作成
- 全 AC の充足見込みを判定する
- Phase 4 進行可否（GO / NO-GO / RETURN）を決定して文書化する

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | MAJOR / BLOCKER 判定時に差し戻す |
| Phase 4 | PASS / MINOR 判定時に verify suite 設計の入力として使用 |
| Phase 5 | レビュー結果と採用設計を実行根拠として渡す |
| Phase 12 | レビュー結果サマリを implementation-guide に反映 |

## 多角的チェック観点（AIが判断）

- 価値性: 将来のファイルアップロード実装が「設計待ち」で止まらない設計になっているか
- 実現性: 無料枠（10GB / Class A 1,000万 / Class B 1億）内で運用可能か、wrangler / Token で実現可能か
- 整合性: 01b 命名トポロジー・04 secret 経路・UT-16 / UT-16 のフックポイントと矛盾しないか
- 運用性: Token rotation / CORS 再設定 / バケット rollback / 監視通知が運用に乗るか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | r2-architecture-design.md レビュー | 3 | pending | AC-1 / AC-2 / AC-8 整合 |
| 2 | wrangler-toml-diff.md レビュー | 3 | pending | AC-2 / 不変条件 5 整合 |
| 3 | token-scope-decision.md レビュー | 3 | pending | AC-3 / 最小権限原則 |
| 4 | cors-policy-design.md レビュー | 3 | pending | AC-5 / UT-17 連携 |
| 5 | 代替案の検討 | 3 | pending | バケット / Token / アクセス / 監視 |
| 6 | 4条件評価と判定区分 | 3 | pending | PASS/MINOR/MAJOR/BLOCKER |
| 7 | AC 対応表と進行可否決定 | 3 | pending | GO/NO-GO/RETURN |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/design-review.md | 4条件評価・代替案比較・AC 対応表 |
| ドキュメント | outputs/phase-03/review-decision.md | Phase 4 進行可否（GO/NO-GO/RETURN）と理由 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

> 上記成果物の実体ファイルは Phase 3 実行時に作成する。本 phase 仕様書では作成しない。

## 完了条件

- Phase 2 の設計成果物 4 点すべてのレビューが完了している
- 代替案の検討が記録されている
- 4条件すべてに判定（PASS / MINOR / MAJOR / BLOCKER）が付与されている
- AC-1〜AC-8 と Phase 2 設計の対応表が作成されている
- Phase 4 進行可否（GO / NO-GO / RETURN）が文書化されている
- MAJOR / BLOCKER がある場合は Phase 2 差し戻し記録が残っている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- MAJOR / BLOCKER 判定の場合は Phase 2 差し戻し決定が明記されている
- 機密情報の直書き有無を再確認
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 4 (事前検証手順)
- 引き継ぎ事項: 設計レビュー結果 / 4条件判定 / AC 対応表 / 採用設計を Phase 4 へ
- ブロック条件: MAJOR / BLOCKER 判定が残っている場合は Phase 4 に進まない

## 代替案

| 案 | 内容 | メリット | デメリット | 採否 |
| --- | --- | --- | --- | --- |
| A: 環境別 2 バケット（採用案） | `ubm-hyogo-r2-prod` / `ubm-hyogo-r2-staging` | 環境影響を完全分離・01b 命名と整合 | バケット 2 個分の管理工数 | 採用 |
| B: 1 バケット + prefix 分離 | `ubm-hyogo-r2` 配下に `prod/` `staging/` prefix | 管理対象 1 個 | 環境間影響リスク・CORS 設定の複雑化 | 不採用 |
| C: Token 既存拡張 | 既存 Token に R2:Edit 追加 | 設定コスト最小 | 最小権限違反・Rotation 影響範囲大 | 不採用 |
| D: Token 専用作成（採用案） | R2 用 Token を新規作成 | 最小権限・Rotation 容易 | GitHub Secrets 追加 | 採用 |
| E: Public Bucket 全公開 | バケット全体を公開 | URL 直配信が容易 | プライベート資産漏洩リスク | 不採用 |
| F: プライベート + Presigned URL（採用案） | デフォルトプライベート、必要時のみ Presigned URL 発行 | セキュリティ担保・最小権限 | URL 発行ロジック必要（実装は別タスク） | 採用 |

## 4条件評価（判定枠）

| 観点 | 設計対象 | 判定 | 理由 |
| --- | --- | --- | --- |
| 価値性 | r2-architecture-design.md | TBD | 将来実装の前提として十分か Phase 2 確認後に記入 |
| 価値性 | cors-policy-design.md | TBD | ブラウザ直接アップロード経路として現実的か確認後に記入 |
| 実現性 | wrangler-toml-diff.md | TBD | wrangler@3.x で R2 バインディング適用可能か確認後に記入 |
| 実現性 | token-scope-decision.md | TBD | Cloudflare API Token UI で R2:Edit が選択可能か確認後に記入 |
| 整合性 | r2-architecture-design.md | TBD | 01b 命名トポロジーと完全一致か確認後に記入 |
| 整合性 | wrangler-toml-diff.md | TBD | apps/web 非対象（不変条件 5）が守られているか確認後に記入 |
| 整合性 | cors-policy-design.md | TBD | UT-16 完了後の再設定経路が明示されているか確認後に記入 |
| 運用性 | token-scope-decision.md | TBD | rotation 手順・障害影響範囲が記載されているか確認後に記入 |
| 運用性 | r2-architecture-design.md（モニタリング部） | TBD | 無料枠閾値・UT-17 連携経路が運用に乗るか確認後に記入 |

**判定凡例:**
- PASS: そのまま次 Phase へ
- MINOR: Phase 5 実行前に解消可能な軽微修正（Phase 4 進行可）
- MAJOR: 設計の根本見直しが必要（Phase 2 差し戻し）
- BLOCKER: 上流タスク未完了等により本タスク自体を保留

## AC 対応表（Phase 2 設計との紐付け）

| AC | 内容 | Phase 2 設計成果物 | 充足見込み |
| --- | --- | --- | --- |
| AC-1 | 命名 (`ubm-hyogo-r2-prod` / `ubm-hyogo-r2-staging`) | r2-architecture-design.md | TBD |
| AC-2 | wrangler.toml `[[r2_buckets]]` | wrangler-toml-diff.md | TBD |
| AC-3 | Token スコープ判断 | token-scope-decision.md | TBD |
| AC-4 | smoke test | （Phase 11 担当 / Phase 4 verify suite） | TBD |
| AC-5 | CORS 設定 | cors-policy-design.md | TBD |
| AC-6 | 無料枠モニタリング | r2-architecture-design.md（モニタリング章） | TBD |
| AC-7 | 下流向け公開 | （Phase 5 binding-name-registry.md） | TBD |
| AC-8 | パブリック / プライベート選択基準 + UT-17 連携 | r2-architecture-design.md | TBD |

## レビューポイント / リスク

- 01b の token-scope-matrix.md が未更新の場合は AC-3 判定を保留しゲートを返す
- CORS 設計の AllowedOrigins が暫定値（UT-16 未確定）の場合は MINOR 判定とし Phase 12 に申し送る
- 機密情報の直書きが見つかった場合は BLOCKER として即時差し戻す
- 無料枠モニタリングが UT-17 未着手の場合は連携ポイントの「将来宿題」明記で MINOR 許容

## Phase 4 進行可否ゲート

| 判定パターン | 進行可否 | アクション |
| --- | --- | --- |
| 全 PASS | GO | Phase 4 へ進む |
| MINOR を含む（MAJOR / BLOCKER なし） | GO（条件付き） | MINOR を Phase 5 着手前に解消する宿題として記録 |
| MAJOR あり | RETURN | Phase 2 へ差し戻し再設計 |
| BLOCKER あり | NO-GO | 上流ブロッカー解消まで本タスクを保留 |

## 次フェーズへの引き渡し

- Phase 4 への入力: 設計レビュー結果 / 4条件判定 / AC 対応表 / 採用設計サマリ / MINOR 宿題リスト
- Phase 4 で実施すべき内容: verify suite の対象（wrangler / R2 CLI / CORS 適用確認）の事前検証手順設計
- Phase 12 (ドキュメント更新) への申し送り: MINOR 宿題が implementation-guide に反映される必要がある
