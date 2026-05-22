# Phase 12: Documentation — issue-801 admin error focus transfer

## 概要（中学生レベル）

ウェブの管理画面でエラーが出たとき、画面の見出し（「管理画面を表示できませんでした」）に自動的にカーソル（フォーカス）が移動するようにする。これにより、目が見えない人がスクリーンリーダー（画面の文字を音声で読み上げるソフト）を使っている場合に、エラーが起きたことをすぐに気付ける。

今までは管理画面のエラー画面が「ただテキストが出るだけ」だったため、画面を見ていない人はエラーに気付けなかった。一般ページでは同じ機能をすでに実装してあるので、それを管理画面にもコピーして揃える。

## 設計判断（Why）

- なぜ `/admin` route segment の 1 枚にするのか → `/admin` page と nested child routes で同じエラー UX を出したいので、1 ファイルで route render error を一括カバーするのが最小コスト。`apps/web/app/(admin)/layout.tsx` 由来の layout error はこの child boundary では捕捉しない。
- なぜ「トップへ戻る」リンクが `/admin` ではなく `/` なのか → ログインが切れているときに `/admin` に戻ると無限にリダイレクトループする可能性があるため、安全側として公開トップへ戻す
- なぜ共通 hook 化しないのか → 4 つのエラー画面（root / admin / login / profile）が揃ってから一括で hook 化したほうが衝突しないため、本タスクは inline 実装で揃えるだけにする

## 親 workflow への反映

`docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i06-root-error-focus/spec.md` section 4.3 の admin route segment 横展開が達成されたことを、親 workflow の `improvements/integration-fixes/index.md` と aiworkflow-requirements 正本に反映した。

## 不変条件 trace

| 不変条件 | 反映 |
|---|---|
| CLAUDE.md #1 既存 API のみ接続 | apps/web の UI 単独変更のため違反なし |
| CLAUDE.md #2 OKLch トークン正本化 | className を OKLch トークンで構成、HEX 直書きなし |
| CLAUDE.md #5 D1 直接アクセス禁止 | apps/web 側のみで完結 |
| `apps/web` env 不変条件 | `process.env.NODE_ENV` のみで機密 env 参照を増やさない |
| UI prototype alignment 不変条件 1〜4 | 全継承 |

## 未タスク・横展開候補

- issue-769-followup-001: `useAutoFocusOnMount(ref)` 共通 hook 抽出（root + admin + login + profile の 4 箇所一括）
- issue-769-followup-002: `/profile/error.tsx` focus transfer
- login error.tsx: i05 or 別 followup（本タスク非対象）

これらは現時点で別 issue として管理しており、本タスクで先送りしているわけではない（CONST_007 例外条件記載）。

## evidence

Phase 12 strict 7:

1. `outputs/phase-12/main.md`
2. `outputs/phase-12/implementation-guide.md`
3. `outputs/phase-12/system-spec-update-summary.md`
4. `outputs/phase-12/documentation-changelog.md`
5. `outputs/phase-12/unassigned-task-detection.md`
6. `outputs/phase-12/skill-feedback-report.md`
7. `outputs/phase-12/phase12-task-spec-compliance-check.md`

## DoD

- 中学生レベル説明あり
- 設計判断（Why）が明文化されている
- aiworkflow-requirements への反映 diff が確認できる
- 不変条件 trace 表があり全項目反映済
