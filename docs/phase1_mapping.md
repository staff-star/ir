# 中間CSV から ir-item.csv へのマッピング

| 中間項目 | ir-item.csv 列 | 変換 |
| --- | --- | --- |
| product_code または product_code_seed | 商品コード（楽天URL） | NFKC 正規化、小文字化、空白記号整理、32文字制限 |
| product_code / product_code_seed | 楽天商品番号 | Phase1 では商品コードを複写 |
| category_id_final | カテゴリ | 数字列を抽出して `|683|530|` 形式へ整形 |
| final_title_override / ai_title / raw_name | 商品名 | 優先順で確定 |
| ai_catchcopy | キャッチコピー | そのまま |
| ai_catchcopy | モバイルキャッチコピー | そのまま |
| sale_price / price_suggested | 販売価格 | 半角数字のみ許可 |
| tax_class | 消費税 / 消費税率 / 軽減税率 | `standard -> 1/10/0`, `reduced -> 1/8/1` |
| sale_price / price_suggested | 表示価格 | Phase1 は販売価格と同値 |
| 固定値 | 送料 | `1` |
| 固定値 | 個別送料 | `0` |
| warehouse_flag | 倉庫指定 | 0/1 正規化 |
| jan_code | JANコード | 半角数字のまま |
| ai_description_material | PC用商品説明文 | 同値展開 |
| ai_description_material | モバイル用商品説明文 | 同値展開 |
| ai_description_material | スマートフォン用商品説明文 | 同値展開 |
| 固定値 | 各説明文改行フラグ | `0` |
| product_code, image_count, image_ext, has_white_image | 画像1-画像20 | `http://r-asp02.item-robot.com/upload/images/1681/{product_code}/{file}.{ext}` |
| 固定値 | 在庫タイプ | `1` |
| 固定値 | 在庫数 | `0` |
| 固定値 | 在庫無制限 | `0` |
| 固定値 | 新品・中古 | `0` |

## Phase1 で空欄出力する主な列
- 楽天ジャンルID
- 非製品属性タグID
- yahooプロダクトカテゴリ
- ソーシャルギフト
- 画像説明列
- 選択肢、Yahoo スペック、自由入力行、商品属性
