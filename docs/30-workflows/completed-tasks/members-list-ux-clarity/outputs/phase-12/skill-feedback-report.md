# Skill Feedback Report

## テンプレート改善

parent + sub workflowではsub側Phase 12設計文にも、strict 7はparent root集約と明記する必要がある。

## ワークフロー改善

実装仕様書が`spec_created`のままPhase 4-10を`completed`にすると、実コード未反映との矛盾を生む。実装サイクル中はstatusとevidenceを同時に更新する。

## ドキュメント改善

filter chipの対象は「絞り込み」と「並び替え」を分離して明記する。URL query維持とchip表示対象は同義ではない。
