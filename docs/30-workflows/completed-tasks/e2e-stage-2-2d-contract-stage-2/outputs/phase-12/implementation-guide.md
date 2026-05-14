# Implementation Guide

## Part 1: 中学生レベル

このタスクでは、管理画面の「ブラウザ側のテスト用ダミーデータ」と「サーバー側の入力チェッカー」が同じ形になっているかを、機械が自動で確認するテストを作る。

たとえば、会員を削除するとき、ブラウザ側は `{ reason: '退会希望' }` という形のデータを送る、と決めている。サーバー側はそのデータを受け取って、`reason` が空っぽじゃないか、長すぎないか、をチェックする。もしブラウザ側のテストだけ通っていて、本当のサーバーが「`reason` がないからダメ」と返してきたら、本番で事故が起きる。

このテストは、サーバー側のチェッカー（zod schema と呼ばれる仕組み）を直接呼んで、ブラウザ側のダミーデータを通してみる。通れば OK、通らなければ「形がずれてる」と機械が教えてくれる。データベースには触らないので、すごく速い（pure unit test）。

テストするのは 7 つの管理画面 API（一覧取得、申請承認、本人同定、合併、却下、会員削除、監査ログ）。

## 用語チェック

| 用語 | 意味 |
|------|------|
| zod schema | データの形（必須項目・型・長さ）をチェックするためのプログラム的な定義 |
| contract test | 「送る側」と「受ける側」の取り決め（contract）が同じ形かをチェックするテスト |
| fixture | テスト用の固定データ |
| pure unit test | DB やネットワークなど外部に一切触らないテスト |
| named export | 別のファイルから「名前指定」で取り出せるようにすること |
| `archivedSourceMemberId` | 合併で消された側の元の会員 ID（消したわけではなく印を付けて保管） |

## Part 2: 技術者向け

- **shared schema 正本**: `MergeIdentityResponseZ` の shape は `packages/shared/src/schemas/identity-conflict.ts` を正本とする。親 workflow `phase-4.md` §1 Q2 / `phase-5.md` §4 が記載していた `{ targetMemberId, sourceMemberId, mergedAt }` は誤り。正本は `{ mergedAt, targetMemberId, archivedSourceMemberId, auditId }`。本 spec の fixture は `archivedSourceMemberId` + `auditId` を含む shape で固定する。
- **route named export 化**: CONST_007（schema 重複禁止）を満たすため、`DeleteBodyZ` (`member-delete.ts:10`) / `ListQueryZ` → `ListRequestsQueryZ` (`requests.ts`) / `QueryZ` → `ListAuditQueryZ` (`audit.ts`) を named export 化。各 +1 字句〜+1 行。route 内部の参照識別子は不変。
- **`z.object(` 重複禁止**: 2d test 内で `z.object(` を新規定義しない。すべて shared / route から import 解決。response shape が zod 未 export な場合は `expectTypeOf<typeof fixture>().toMatchTypeOf<...>()` で type-level 同型に置換。
- **`DeleteBodyZ` shared 昇格は no-op**: 本 PR では route からの named export で CONST_007（schema 重複禁止）を満たす。`packages/shared/src/schemas/` への移動は今回の contract test 目的には不要。
- **pure unit**: DB / network / FS / Cloudflare binding に一切触れない。`apps/web` も import しない。Vitest 標準 timeout（5s）で十分。
- **evidence**: `outputs/phase-11/evidence/*.txt` に typecheck / lint / vitest / grep / wc / dirty-diff / runner-version を保存。
- **状態語彙**: contract test は pure unit のため local pass = canonical pass。runtime / staging 区別なし。`workflow_state = implemented_local_evidence_captured` を Phase 12 PASS で確定。
- **CI/user gate**: commit / push / PR はユーザー承認後。
