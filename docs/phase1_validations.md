# バリデーション一覧

| 項目 | 条件 | エラーコード |
| --- | --- | --- |
| product_code | 空欄不可 | `REQUIRED` |
| product_code | 英小文字、数字、`-`、`_` 以外を除去後に空欄化しないこと | `INVALID` |
| product_code | 32文字以内 | `TOO_LONG` |
| product_code | publish 対象内で一意 | `DUPLICATE_PRODUCT_CODE` |
| title | `final_title_override > ai_title > raw_name` で決定できること | `REQUIRED` |
| title | 127文字以内 | `TOO_LONG` |
| category_id_final | 数字を1件以上含むこと | `REQUIRED` |
| sale_price | `sale_price` または `price_suggested` から決定できること | `REQUIRED` |
| sale_price | 半角数字のみ | `INVALID` |
| sale_price | 9桁以内 | `TOO_LONG` |
| tax_class | `standard/reduced/10/8` 系に解釈できること | `INVALID` |
| warehouse_flag | `0` または `1` | `INVALID` |
| jan_code | 指定時は半角数字のみ | `INVALID` |
| image_count | 必須、整数 | `REQUIRED`, `INVALID` |
| image_count | 0-20 の範囲 | `OUT_OF_RANGE` |
| image_count + has_white_image | 白背景画像追加時に 20 枠を超えないこと | `WHITE_IMAGE_OVERFLOW` |
| image_ext | 必須 | `REQUIRED` |
| image_ext | 拡張子のみ | `INVALID` |
| has_white_image | `0` または `1` | `INVALID` |

## 出力条件
- `publish_flag = 1`
- 上記エラーが 0 件
