# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets API 認証方式設定 (UT-03) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 作成日 | 2026-04-26 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke テスト) |
| 状態 | pending |

## 目的

AC-1〜AC-7 の全受入条件・Phase 1〜9 の完了状態・セキュリティ・シークレット衛生・Edge Runtime 制約の遵守を総合的に確認し、GO / NO-GO を判定する。

本 Phase を通過しなければ Phase 11 以降（手動 smoke テスト・ドキュメント更新・PR 作成）には進まない。

## 実行タスク

- AC-1〜AC-7 の全項目が PASS 状態であることを確認する
- Phase 1〜9 の成果物が全て outputs に配置されていることを確認する
- セキュリティレビューを実施する（秘密鍵のログ出力禁止、JWT クレームの最小化など）
- シークレット衛生を確認する（GOOGLE_SERVICE_ACCOUNT_JSON の管理状況）
- Edge Runtime 制約（Web Crypto API 利用・Node.js API 非使用）の遵守を確認する
- 4条件（価値性 / 実現性 / 整合性 / 運用性）の最終評価を行う
- GO / NO-GO 決定文書を作成する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/01-infrastructure-setup/ut-03-sheets-api-auth/index.md | AC 定義の正本・タスク全体概要 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | シークレット管理ルール |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | 環境変数管理ルール |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Edge Runtime 制約・Workers 制限事項 |
| 参考 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 同期ルール |

## 実行手順

### ステップ 1: AC 全項目の PASS 確認

index.md に定義された AC-1〜AC-7 を再読し、各 AC の証跡パスと担当 Phase を確認する。
Phase 7 (検証項目網羅性) の AC matrix を参照し、全 AC が証跡付きで PASS 状態であることを確認する。

| AC | 内容 | 証跡パス | 状態 |
| --- | --- | --- | --- |
| AC-1 | `packages/integrations/src/sheets-auth.ts` が存在し、型エラーなしでビルドが通る | outputs/phase-05/ | pending |
| AC-2 | Web Crypto API (`crypto.subtle`) のみを使用し、Node.js 固有 API（`crypto` モジュール等）を使用していない | outputs/phase-04/ | pending |
| AC-3 | JWT 署名アルゴリズムが RS256 であり、Service Account の private_key を正しく使用している | outputs/phase-05/ | pending |
| AC-4 | `GOOGLE_SERVICE_ACCOUNT_JSON` が Cloudflare Secret として設定され、コードにハードコードされていない | outputs/phase-05/ | pending |
| AC-5 | ローカル開発環境（`.dev.vars`）で Sheets API v4 への認証が成功することが確認できる | outputs/phase-11/ | pending |
| AC-6 | staging 環境で Sheets API v4 への認証が成功することが確認できる | outputs/phase-11/ | pending |
| AC-7 | エラー発生時にシークレット値（秘密鍵・アクセストークン）がログに出力されないことが確認できる | outputs/phase-06/ | pending |

### ステップ 2: Phase 1〜9 の完了確認

| Phase | 名称 | 主成果物パス | 状態 |
| --- | --- | --- | --- |
| 1 | 要件定義 | outputs/phase-01/requirements.md | pending |
| 2 | 設計 | outputs/phase-02/sheets-auth-design.md | pending |
| 3 | 設計レビュー | outputs/phase-03/design-review.md | pending |
| 4 | 事前検証手順 | outputs/phase-04/pre-verification.md | pending |
| 5 | 実装 | outputs/phase-05/implementation-log.md | pending |
| 6 | 異常系検証 | outputs/phase-06/error-case-verification.md | pending |
| 7 | 検証項目網羅性 | outputs/phase-07/ac-matrix.md | pending |
| 8 | 設定 DRY 化 | outputs/phase-08/dry-check.md | pending |
| 9 | 品質保証 | outputs/phase-09/qa-report.md | pending |

### ステップ 3: セキュリティレビュー

以下の観点を確認する。

- `sheets-auth.ts` 内で `private_key` をログ出力するコードが存在しないか
- JWT 生成後にアクセストークンをデバッグ出力するコードが存在しないか
- `JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON)` 失敗時に JSON 文字列全体が例外メッセージに含まれないか（マスキング処理の確認）
- Service Account の `client_email` と `private_key` 以外のフィールドをコードが参照していないか
- JWT のスコープが `https://www.googleapis.com/auth/spreadsheets.readonly` に限定されているか

### ステップ 4: シークレット衛生確認

- `GOOGLE_SERVICE_ACCOUNT_JSON` が `.dev.vars` にのみ存在し、`.env` / ソースコードにハードコードされていないか
- `.dev.vars` が `.gitignore` に含まれているか
- Cloudflare Secrets への登録手順が outputs/phase-05 に記録されているか
- GitHub Secrets に同名シークレットが存在する場合、CI/CD での利用目的が明確か

### ステップ 5: Edge Runtime 制約の遵守確認

- `crypto.subtle.importKey` / `crypto.subtle.sign` が使用されており、Node.js `crypto.createSign` は使用されていないか
- `TextEncoder` が使用されており、Node.js `Buffer` は使用されていないか
- `fetch` が使用されており、Node.js `https` モジュールは使用されていないか
- `packages/integrations` の `package.json` に Edge Runtime 非互換パッケージが追加されていないか

### ステップ 6: 4条件の最終評価

| 条件 | 評価観点 | 判定 |
| --- | --- | --- |
| 価値性 | Sheets API v4 への認証が実際に動作し、下流タスク（UT-09: Sheets→D1 同期ジョブ）が依存できる状態か | TBD |
| 実現性 | Web Crypto API のみで RS256 署名が実装され、Edge Runtime 制約内に収まっているか | TBD |
| 整合性 | `packages/integrations` の設計が CLAUDE.md の不変条件（D1 直接アクセス禁止等）と矛盾しないか | TBD |
| 運用性 | シークレットローテーション手順・エラー時の再認証フロー・ローカル開発手順が文書化されているか | TBD |

### ステップ 7: GO / NO-GO 判定

以下の全条件を満たす場合 GO、一つでも未達の場合 NO-GO とする。

**GO 条件**
- [ ] AC-1〜AC-7 の全項目が PASS
- [ ] Phase 1〜9 の全成果物が outputs に配置済み
- [ ] セキュリティレビューで重大な問題が未検出
- [ ] シークレット衛生が確認された（ハードコードなし・.gitignore 設定済み）
- [ ] Edge Runtime 制約の遵守が確認された
- [ ] 4条件（価値性 / 実現性 / 整合性 / 運用性）が全て PASS

**NO-GO 時の対応**
NO-GO となった場合は、問題箇所と対応 Phase を `outputs/phase-10/go-nogo-decision.md` に記録し、該当 Phase に差し戻す。

## 多角的チェック観点（AIが判断）

- 価値性: 全 AC に証跡が存在し、下流タスク（UT-09）の実装が開始できる状態か
- 実現性: Edge Runtime 制約内での JWT 署名実装が完了し、Cloudflare Workers で動作するか
- 整合性: シークレット管理ルール・CLAUDE.md 不変条件との矛盾がないか
- 運用性: Phase 11〜13 を実行するための前提条件が全て満たされているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC-1〜AC-7 全項目 PASS 確認 | 10 | pending | Phase 7 の AC matrix を参照 |
| 2 | Phase 1〜9 完了確認 | 10 | pending | 成果物の存在確認 |
| 3 | セキュリティレビュー | 10 | pending | 秘密鍵ログ出力禁止の確認 |
| 4 | シークレット衛生確認 | 10 | pending | .dev.vars / .gitignore 確認 |
| 5 | Edge Runtime 制約遵守確認 | 10 | pending | Web Crypto API 使用確認 |
| 6 | 4条件最終評価 | 10 | pending | 価値性/実現性/整合性/運用性 |
| 7 | GO / NO-GO 決定文書作成 | 10 | pending | outputs/phase-10/go-nogo-decision.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/go-nogo-decision.md | GO / NO-GO 判定結果・根拠・未解決事項 |
| メタ | artifacts.json | Phase 状態の更新 |

### outputs/phase-10/go-nogo-decision.md の必須記載項目

```markdown
# GO / NO-GO 判定

## 判定結果
- 判定: GO / NO-GO（どちらか）
- 判定日: YYYY-MM-DD

## AC チェックリスト
（AC-1〜AC-7 の各項目について PASS / FAIL と証跡パスを記載）

## Phase 完了チェックリスト
（Phase 1〜9 の各 Phase について complete / incomplete を記載）

## セキュリティレビュー結果
（重大な問題の有無・確認項目の結果を記載）

## シークレット衛生確認結果
（各確認項目の結果を記載）

## Edge Runtime 制約遵守確認結果
（各確認項目の結果を記載）

## 4条件最終評価
（価値性 / 実現性 / 整合性 / 運用性 それぞれ PASS / FAIL と根拠を記載）

## NO-GO の場合の差し戻し先
（NO-GO の場合のみ記載。問題箇所・対応 Phase・修正内容）
```

## 完了条件

- GO / NO-GO 判定が明示されている
- AC-1〜AC-7 の全項目の状態（PASS / FAIL）が記録されている
- セキュリティレビュー・シークレット衛生・Edge Runtime 制約の確認結果が記録されている
- 4条件の最終評価が全て TBD でない

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（セキュリティ問題・Edge Runtime 非準拠・シークレット漏洩リスク）も確認済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 11 (手動 smoke テスト)
- 引き継ぎ事項: GO 判定の根拠（`outputs/phase-10/go-nogo-decision.md`）を Phase 11 の実施前提として参照する
- ブロック条件: GO 判定が得られていない場合は Phase 11 に進まない。NO-GO の場合は差し戻し先 Phase で問題を解消してから再度 Phase 10 を実施する
