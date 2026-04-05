# real_data_sample_note.md

## 目的
同梱している実データサンプルの位置づけと使い方を明確にする。

## 同梱ファイル
- `samples/ir-item_current_sample.csv`
- `samples/ir_item_header_analysis.csv`
- `samples/ir_item_phase1_runtime_inputs.csv`

## 使い方
### `ir-item_current_sample.csv`
- 現行運用の列使用状況を把握する
- どの列が実際に埋まっているかの参考にする
- item Robot の現場運用の癖を読む材料にする

### `ir_item_header_analysis.csv`
- ヘッダごとの利用状況を俯瞰する
- どの列を Phase1 で入力対象から外すか判断する

### `ir_item_phase1_runtime_inputs.csv`
- Phase1 で人が入力すべき列候補の整理
- 中間CSV設計のたたき台

## 注意
- サンプルは参考であり、正本ヘッダではない
- 最終的なヘッダ順・列名は公式テンプレートを優先する