const PHASE1_INPUT_SCHEMA = Object.freeze([
  { key: 'product_code_seed', required: true, note: '商品コードの元ネタ。product_code が空なら正規化して採用。' },
  { key: 'product_code', required: false, note: '指定時は優先採用。32文字以内、英小文字/数字/-/_ のみ。' },
  { key: 'raw_name', required: true, note: '元の商品名。ai_title も final_title_override も空なら採用。' },
  { key: 'ai_title', required: false, note: 'AI 提案の商品名。' },
  { key: 'final_title_override', required: false, note: '人の最終上書き商品名。最優先。' },
  { key: 'category_id_final', required: true, note: 'カテゴリID。683 または |683|530| のような形式を許可。' },
  { key: 'price_suggested', required: false, note: 'AI 提案価格。sale_price が空なら採用。' },
  { key: 'sale_price', required: false, note: '最終販売価格。半角数字のみ。' },
  { key: 'jan_code', required: false, note: 'JAN コード。数字のみを推奨。' },
  { key: 'warehouse_flag', required: false, note: '倉庫指定。0/1 を想定。空欄時は 0。' },
  { key: 'tax_class', required: false, note: 'standard / reduced / 10 / 8 など。空欄時は standard。' },
  { key: 'image_count', required: true, note: '連番画像の枚数。0-20。' },
  { key: 'image_ext', required: true, note: '画像拡張子。png / jpg / jpeg / webp / gif を想定。' },
  { key: 'has_white_image', required: false, note: '白背景画像の有無。1 のとき w.ext を追加。' },
  { key: 'ai_catchcopy', required: false, note: 'キャッチコピー。' },
  { key: 'ai_description_material', required: false, note: '説明文素材。Phase1 では PC/モバイル/スマホ説明文へ同値展開。' },
  { key: 'attribute_template_key', required: false, note: '将来拡張用。Phase1 では保持のみ。' },
  { key: 'note', required: false, note: '運用メモ。CSV には出さず確認用シートに残す。' },
  { key: 'publish_flag', required: true, note: '1 の行だけ出力対象。0/空欄は除外。' }
]);

const REVIEW_SCHEMA = Object.freeze([
  '元データ行',
  'publish_flag',
  '出力対象',
  'product_code_seed',
  'product_code',
  '確定商品コード',
  'raw_name',
  'ai_title',
  'final_title_override',
  '確定商品名',
  'category_id_final',
  '確定カテゴリ',
  'price_suggested',
  'sale_price',
  '確定販売価格',
  '確定表示価格',
  'jan_code',
  'warehouse_flag',
  'tax_class',
  '消費税',
  '消費税率',
  '軽減税率',
  'image_count',
  'image_ext',
  'has_white_image',
  '生成画像枚数',
  '画像1',
  '画像2',
  '画像3',
  '画像4',
  'ai_catchcopy',
  'ai_description_material',
  'attribute_template_key',
  'note',
  'エラー件数',
  'エラーメッセージ'
]);

const ERROR_SCHEMA = Object.freeze([
  '元データ行',
  'field',
  'code',
  'message',
  'publish_flag',
  'product_code'
]);

const IR_ITEM_HEADER = buildIrItemHeader_();

function buildIrItemHeader_() {
  const header = [
    '商品コード（楽天URL）',
    '楽天商品番号',
    'カテゴリ',
    '商品名',
    '楽天ジャンルID',
    '非製品属性タグID',
    'yahooプロダクトカテゴリ',
    'キャッチコピー',
    'モバイルキャッチコピー',
    '販売価格',
    '消費税',
    '消費税率',
    '軽減税率',
    '表示価格',
    '送料',
    '個別送料',
    '置き配指定',
    '倉庫指定',
    'JANコード',
    'ソーシャルギフト',
    'PC用商品説明文',
    'PC用商品説明文改行',
    'モバイル用商品説明文',
    'モバイル用商品説明文改行',
    'スマートフォン用商品説明文',
    'スマートフォン用商品説明文改行',
    'PC用販売説明文',
    'PC用販売説明文改行'
  ];

  for (let i = 1; i <= PHASE1_CONFIG.maxImageSlots; i += 1) {
    header.push(`画像${i}`);
  }
  for (let i = 1; i <= PHASE1_CONFIG.maxImageSlots; i += 1) {
    header.push(`画像${i}の説明`);
  }

  header.push(
    '在庫タイプ',
    '選択肢項目名1（横軸）',
    '選択肢項目名2（縦軸）',
    'Yahoo スペック項目（横軸）',
    'Yahoo スペック項目（縦軸）',
    '在庫数',
    '在庫無制限',
    'au PAY マーケット管理ID',
    '付箋1',
    '付箋2',
    '付箋3',
    '新品・中古',
    'カタログIDなしの理由',
    'セット商品用カタログID',
    'オプションマスタ',
    '自由入力行（項目）1',
    '自由入力行（値）1',
    '自由入力行（項目）2',
    '自由入力行（値）2',
    '自由入力行（項目）3',
    '自由入力行（値）3',
    '自由入力行（項目）4',
    '自由入力行（値）4',
    '自由入力行（項目）5',
    '自由入力行（値）5'
  );

  for (let i = 1; i <= 100; i += 1) {
    header.push(`商品属性（項目）${i}`);
    header.push(`商品属性（値）${i}`);
    header.push(`商品属性（単位）${i}`);
  }

  return header;
}
