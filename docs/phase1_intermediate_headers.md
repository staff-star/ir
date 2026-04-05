# 中間CSVヘッダ一覧

| key | 必須 | 用途 |
| --- | --- | --- |
| product_code_seed | 必須 | 商品コードの元データ |
| product_code | 任意 | 手動で確定済みの商品コード |
| raw_name | 必須 | 元の商品名 |
| ai_title | 任意 | AI 提案の商品名 |
| final_title_override | 任意 | 人の最終上書き商品名 |
| category_id_final | 必須 | 最終カテゴリID |
| price_suggested | 任意 | AI 提案価格 |
| sale_price | 任意 | 最終販売価格 |
| jan_code | 任意 | JAN コード |
| warehouse_flag | 任意 | 倉庫指定 |
| tax_class | 任意 | 税区分 |
| image_count | 必須 | 連番画像枚数 |
| image_ext | 必須 | 画像拡張子 |
| has_white_image | 任意 | 白背景画像の有無 |
| ai_catchcopy | 任意 | キャッチコピー |
| ai_description_material | 任意 | 説明文素材 |
| attribute_template_key | 任意 | 将来拡張用キー |
| note | 任意 | 運用メモ |
| publish_flag | 必須 | 1 の行だけ出力 |
