# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | monorepo-runtime-foundation |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| 作成日 | 2026-04-23 |
| 前 Phase | 5 (セットアップ実行) |
| 次 Phase | 7 (検証項目網羅性) |
| 状態 | completed |

## 目的

モノレポとランタイム基盤 における Phase 6 の判断と成果物を固定し、下流 Phase の手戻りを防ぐ。

## 実行タスク

- input / output を確定する
- 正本仕様との整合を確認する
- 4条件と downstream 影響を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | apps/web / apps/api |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-monorepo.md | dependency rule |
| 必須 | .claude/skills/aiworkflow-requirements/references/technology-core.md | Node / pnpm / Next.js |
| 必須 | .claude/skills/aiworkflow-requirements/references/technology-frontend.md | Next.js / Tailwind |
| 必須 | .claude/skills/aiworkflow-requirements/references/technology-backend.md | Workers / D1 / backend stack |

| 依存Phase | Phase 5 | 上流成果物の参照確認 |

## 実行手順

### ステップ 1: input と前提の確認
- 上流 Phase と index.md を読む。
- 正本仕様との差分を先に洗い出す。

### ステップ 2: Phase 成果物の作成
- 本 Phase の主成果物を outputs/phase-06/main.md に作成・更新する。
- downstream task から参照される path を具体化する。

### ステップ 3: 4条件と handoff の確認
- 価値性 / 実現性 / 整合性 / 運用性を再確認する。
- 次 Phase に渡す blocker と open question を記録する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | 本 Phase の出力を入力として使用 |
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
| 1 | input 確認 | 6 | completed | upstream を読む |
| 2 | 成果物更新 | 6 | completed | outputs/phase-06/main.md |
| 3 | 4条件確認 | 6 | completed | next phase へ handoff |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | Phase 6 の主成果物 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- [ ] 主成果物が作成済み
- [ ] 正本仕様参照が残っている
- [ ] downstream handoff が明記されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 7 (検証項目網羅性)
- 引き継ぎ事項: モノレポとランタイム基盤 の判断を次 Phase で再利用する。
- ブロック条件: 本 Phase の主成果物が未作成なら次 Phase に進まない。

## 異常系シナリオ表 (最低5件)
| ID | 異常 | 期待される検出 | 対処 |
| --- | --- | --- | --- |
| A1 | branch drift | dev / main 対応表の矛盾検出 | index / phase を同時修正 |
| A2 | secret placement ミス | runtime と deploy secret の混線検出（例: AUTH_SECRET を GitHub Variables に置く） | placement matrix 修正 |
| A3 | source-of-truth 競合 | Sheets と D1 の責務重複を検出 | contract 再定義 |
| A4 | downstream blocker 漏れ | 依存漏れ検出（03/04/05b への参照が欠落） | task 追記 |
| A5 | 無料枠逸脱前提 | Workers バンドルサイズ 3MB 超過を検出 | `@opennextjs/cloudflare` の `optimizePackageImports` で削減、超過なら Pages Functions（25MB）へ移行 |
| A6 | pnpm バージョン混在 | pnpm 9 が使用されている（2026-04-30 EOL） | `pnpm --version` 確認 → pnpm 10.x へ移行 |
| A7 | Node.js バージョン不一致 | Node 22.x が混在（最新 LTS は 24.x） | `.nvmrc` / `package.json#engines` で Node 24.x を固定 |
| A8 | @cloudflare/next-on-pages 継続使用 | 廃止予定の adapter が package.json に残存 | `@opennextjs/cloudflare` に移行・next-on-pages を削除 |
| A9 | Auth.js NEXTAUTH_* 環境変数 | v5 以降は AUTH_* に変更済み。NEXTAUTH_* が残っていると認証失敗 | 環境変数プレフィックスを AUTH_* に統一 |

## 再現手順
- branch / env / secret / source-of-truth をわざと入れ替えてレビューする。
- legacy snapshot と新仕様の差分を照合する。

## 期待エラーと対処
- 矛盾: architecture / deployment reference を優先して修正
- 漏れ: AC, refs, outputs, downstream を補完
- 依存不整合: Wave gate を見直す

## 依存Phase成果物参照

- 参照対象: Phase 5
