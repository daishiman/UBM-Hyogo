# Phase 6 出力: main.md
# 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | architecture-and-scope-baseline |
| Phase | 6 / 13 (異常系検証) |
| 作成日 | 2026-04-23 |
| 状態 | completed |
| 入力 | outputs/phase-05/main.md (セットアップ実行 / 全 sanity check PASS) |

---

## 1. 異常系シナリオ表

| ID | シナリオ名 | 概要 | 想定影響 | 深刻度 |
| --- | --- | --- | --- | --- |
| A1 | branch drift | dev/main 対応表の矛盾 (例: `develop` と `dev` が混在する) | 下流タスクが参照するブランチ名が一致せず、staging 環境への誤デプロイ・PR 設定ミスが発生する | HIGH |
| A2 | secret placement ミス | runtime シークレット (OPENAI_API_KEY 等) が GitHub Secrets に配置され、deploy シークレット (CLOUDFLARE_API_TOKEN) が Cloudflare Secrets に配置される混線 | Workers 実行時に環境変数が取得できず、CI/CD パイプラインが本番クレデンシャルを保持する | HIGH |
| A3 | source-of-truth 競合 | Sheets と D1 の責務が重複する記述 (例: 「Sheets でも参照整合性を管理する」という記述) | 下流タスクがどちらを canonical と見なすか判断できなくなり、データ整合性設計が矛盾する | HIGH |
| A4 | downstream blocker 漏れ | 02/03 タスクへの依存関係が canonical-baseline.md に記載されているが、実際にそのパスが存在しない | 下流タスクが参照先ファイルを見つけられず作業を開始できない | MEDIUM |
| A5 | 無料枠逸脱前提 | 設計書に有料サービス (Cloudflare R2 有料プラン、Supabase 等) への依存が記述されている | 無料枠運用の前提が崩れ、コスト見積もりが変わり、ユーザー要求を満たせなくなる | HIGH |
| A6 | scope 外サービスの先行記述 | OOS-04 (通知基盤) が canonical-baseline.md の設計に含まれている | スコープが肥大化し、本タスクの完了判定が曖昧になる | MEDIUM |
| A7 | 実値シークレットの混入 | シークレット配置マトリクスに実際の API キーや token が placeholder なしで記述されている | セキュリティインシデント / リポジトリへのシークレット漏洩リスク | CRITICAL |

---

## 2. 各シナリオの検出方法と対処

### A1: branch drift → dev/main 対応表の矛盾

| 項目 | 内容 |
| --- | --- |
| 検出方法 | `rg -n "develop\|master\|staging-branch" doc/00-serial-architecture-and-scope-baseline` を実行し、ブランチ記法の混在がないことを確認する |
| 検出時の対処 | `develop` → `dev` に全箇所を一括修正 (`sed -i 's/develop/dev/g'` または手動修正)。修正後に canonical-baseline.md セクション2 の対応表が `feature/*→dev→main` であることを再確認する |
| 予防措置 | Phase 8 (設定 DRY 化) でブランチ記法の統一ルールを文書化し、以後の記述で `dev` のみを使用する |

### A2: secret placement ミス → runtime と deploy secret の混線

| 項目 | 内容 |
| --- | --- |
| 検出方法 | canonical-baseline.md セクション4 のシークレット配置マトリクスを確認し、OPENAI_API_KEY / ANTHROPIC_API_KEY / DATABASE_URL / GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY が「Cloudflare Secrets」列にのみ存在し「GitHub Secrets」列に存在しないことを確認する |
| 検出時の対処 | シークレット配置マトリクスを修正し、ランタイムシークレットは「Cloudflare Secrets」、CI/CD シークレットは「GitHub Secrets」に再配置する。判断基準は「Workers/Pages が実行時に使うか (→ Cloudflare)」vs「GitHub Actions が使うか (→ GitHub)」 |
| 予防措置 | Phase 9 (品質保証) の Secrets 漏洩チェックで配置先の整合性を確認する |

### A3: source-of-truth 競合 → Sheets と D1 の責務重複

| 項目 | 内容 |
| --- | --- |
| 検出方法 | `rg -n "Sheets.*canonical\|canonical.*Sheets\|Sheets.*正本" doc/00-serial-architecture-and-scope-baseline` を実行し、Sheets が canonical と記述されていないことを確認する |
| 検出時の対処 | 該当箇所を「Sheets は入力源 (non-canonical)」に修正する。decision-log.md NA-01 の根拠 (参照整合性なし・競合問題・API レート制限) を引用して修正の根拠を明記する |
| 予防措置 | canonical-baseline.md セクション3 の責務境界定義に「入力源 (Sheets): canonical でない」と明記することで記述基準を確立する |

### A4: downstream blocker 漏れ → 依存漏れ

| 項目 | 内容 |
| --- | --- |
| 検出方法 | `find doc/00-serial-architecture-and-scope-baseline/outputs -type f` を実行し、canonical-baseline.md セクション5 に記載された全参照パスのファイルが存在することを確認する |
| 検出時の対処 | 存在しないパスが見つかった場合、(a) ファイルを作成するか、(b) 参照パスを修正するかを判断する。本タスク (docs-only) の成果物であるべきファイルが欠如している場合は作成する。下流タスクの成果物への誤参照の場合は参照を削除する |
| 予防措置 | Phase 4 の V-03 検証コマンド (`find`) を定期的に実行することで、成果物の存在を継続確認する |

### A5: 無料枠逸脱前提 → 有料サービス依存

| 項目 | 内容 |
| --- | --- |
| 検出方法 | `rg -n "R2\|Supabase\|PlanetScale\|Neon\|有料\|課金\|プレミアム" doc/00-serial-architecture-and-scope-baseline` を実行し、有料サービスへの依存が記述されていないことを確認する |
| 検出時の対処 | 有料サービスへの依存が発見された場合、(a) 無料枠代替サービスへの置き換えを検討するか、(b) そのサービスが必要な理由が明確で無料枠内代替がない場合は、ユーザーに報告してスコープ再定義を行う |
| 予防措置 | canonical-baseline.md セクション1 の各コンポーネント備考欄に「無料枠で運用」と明記し、新規コンポーネント追加時に必ず確認する |

### A6: scope 外サービスの先行記述

| 項目 | 内容 |
| --- | --- |
| 検出方法 | decision-log.md セクション3 (スコープ外決定) のリストに含まれるサービス (通知基盤・モニタリング・CI/CD パイプライン等) が canonical-baseline.md のアーキテクチャ図や採用コンポーネント表に含まれていないことを確認する |
| 検出時の対処 | scope 外サービスが設計に混入していた場合、そのサービスを設計から削除し、decision-log.md の OOS リストに追記する |
| 予防措置 | OOS リスト (OOS-01〜OOS-08) を Phase 8 で final 版として確定させる |

### A7: 実値シークレットの混入

| 項目 | 内容 |
| --- | --- |
| 検出方法 | `rg -n "[A-Za-z0-9+/]{20,}=\|sk-[A-Za-z0-9]+\|ghp_[A-Za-z0-9]+" doc/00-serial-architecture-and-scope-baseline` で API キー形式のパターンを検索する |
| 検出時の対処 | 実値が発見された場合、即座に該当値を `<PLACEHOLDER>` に置換する。git の場合はコミット前に確認し、既にコミット済みの場合は git history の修正と、該当シークレットの即時ローテーション (無効化と再発行) を行う |
| 予防措置 | `.gitignore` に `.env*` を追加し、ドキュメント内は `<YOUR_API_KEY>` 等の placeholder のみを許容するルールを Phase 9 の Secrets 漏洩チェックで継続確認する |

---

## 3. 検証結果サマリー

本タスクにおける各シナリオの検証結果を以下に記録する。

| シナリオ ID | シナリオ名 | 本タスクでの検証結果 | 根拠 |
| --- | --- | --- | --- |
| A1 | branch drift | **PASS (問題なし)** | canonical-baseline.md セクション2 にて `feature/*` / `dev` / `main` の3種類のみ使用されていることを確認。`develop` `master` 等の旧記法は存在しない |
| A2 | secret placement ミス | **PASS (問題なし)** | canonical-baseline.md セクション4 のシークレット配置マトリクスにて、ランタイムシークレットが Cloudflare Secrets、CI/CD シークレットが GitHub Secrets に正しく配置されていることを確認 |
| A3 | source-of-truth 競合 | **PASS (問題なし)** | canonical-baseline.md セクション3 にて「入力源 (Sheets): canonical でない」と明記されていることを確認。decision-log.md NA-01 で Sheets を canonical とする案が根拠付きで棄却されていることを確認 |
| A4 | downstream blocker 漏れ | **PASS (問題なし)** | Phase 5 の sanity check 3 にて downstream 参照パスのファイル存在を確認済み。canonical-baseline.md / decision-log.md / baseline-inventory.md の全ファイルが存在する |
| A5 | 無料枠逸脱前提 | **PASS (問題なし)** | canonical-baseline.md セクション1 の全コンポーネントが Cloudflare 無料枠 + Google Sheets 無料枠内で運用されることを確認。有料サービスへの依存なし |
| A6 | scope 外サービスの先行記述 | **PASS (問題なし)** | canonical-baseline.md のアーキテクチャ図と採用コンポーネント表に通知基盤・モニタリング等の scope 外サービスが含まれていないことを確認 |
| A7 | 実値シークレットの混入 | **PASS (問題なし)** | 全 outputs ファイルに実値のシークレットが含まれていないことを確認。シークレット配置マトリクスはサービス種別とその配置先のみを記載し、実値は記載しない方針を採用 |

**異常系検証総合: 全7シナリオ PASS (問題なし)**

---

## 4. Phase 7 への引き継ぎ

### Blockers

なし。異常系検証の全7シナリオで問題が検出されなかった。Phase 7 (検証項目網羅性) に進行可能。

### Open Questions

なし。

### Phase 7 実行時の注意事項

- Phase 7 では AC-1〜AC-5 と各 Phase の検証項目のマトリクスを作成し、カバレッジの漏れがないことを確認すること
- 本 Phase (A1〜A7) の異常系シナリオが AC のいずれかで対処されているかもマトリクスに反映すること

---

## 完了確認

- [x] 異常系シナリオ表作成済み (A1〜A7 / 7件)
- [x] 各シナリオの検出方法と対処記載済み
- [x] 本タスクでの検証結果サマリー記録済み (全7件 PASS)
- [x] Phase 7 への引き継ぎ記載済み (blockers なし)
