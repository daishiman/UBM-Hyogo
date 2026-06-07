# Skill Feedback Report

`task-specification-creator` skill へのフィードバックを 3 観点で記す。本タスク（implemented_local_evidence_captured / implementation / NON_VISUAL・committed 生成物 + drift guard 型）で観測した、テンプレート上の摩擦点を改善候補として挙げる。

## テンプレート改善

候補: **NON_VISUAL かつ committed artifact + drift guard 型タスクの Phase 7 カバレッジ読み替えガイド**。

本タスクの主成果物には「カタログから決定論的に生成される SQL / manifest（committed 生成物）」が含まれる。これらは行カバレッジで測る対象ではなく、「生成物が SSOT から byte 一致で再生成できるか（drift guard）」が品質の本質になる。現テンプレートの Phase 7 は行/分岐カバレッジ前提の文面が中心のため、生成物型タスクでは「カバレッジ = drift guard PASS + ゲーティング期待値 spec PASS」と読み替える前提を毎回手書きで補う必要がある。テンプレートに「生成物型タスクのカバレッジ読み替え」節を 1 つ用意すると、同型タスク（seed / fixture / codegen）で再現性が上がる。

## ワークフロー改善

候補: **seed / fixture 系タスクの Phase 11 代替証跡パターンの明文化**。

本タスクは NON_VISUAL であり、Phase 11 はスクリーンショットを作らず「in-memory D1（setupD1）への seed 適用後のゲーティング期待値 spec」「seed→cleanup→seed の冪等性 spec」を主証跡とする。現状は compliance-check 側で n/a と宣言しつつ証跡の主ソースを個別記述しているが、seed / fixture 系は毎回同じ構造（committed 生成物 + drift spec + in-memory 適用 spec）になるため、Phase 11 代替証跡の標準パターンとして skill に登録すると、NON_VISUAL 時の「証跡が薄く見える」誤解を構造的に避けられる。

## ドキュメント改善

特記なし。

本タスクでは index.md（設計 SSOT）/ artifacts.json parity / strict 7 の各要件は既存テンプレートで過不足なく表現できた。上記 2 候補はいずれもテンプレート定義の欠陥ではなく「生成物 + drift guard 型 / seed・fixture 系」という特定タスク類型に対する読み替えガイドの不足であり、ドキュメント構造そのものの変更は不要。
