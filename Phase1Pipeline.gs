function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('CSV出力ツール')
    .addItem('シートを準備する', 'initializePhase1Workbook')
    .addItem('使い方と見本を更新', 'refreshGuideSheet')
    .addSeparator()
    .addItem('共通の確認を更新', 'refreshConfirmationSheet')
    .addItem('楽天の確認を更新', 'refreshRakutenConfirmationSheet')
    .addItem('Yahooの確認を更新', 'refreshYahooConfirmationSheet')
    .addSeparator()
    .addItem('共通CSVを書き出す', 'exportIrItemCsv')
    .addItem('楽天CSVを書き出す', 'exportRakutenItemsubCsv')
    .addItem('YahooCSVを書き出す', 'exportYahooItemsubCsv')
    .addToUi();
}

function initializePhase1Workbook() {
  const ss = getActiveSpreadsheet_();
  writeInputSheet_();
  writeSampleSheet_();
  initializeSheet_(ss, PHASE1_CONFIG.sheetNames.review, [REVIEW_SCHEMA], 1);
  initializeSheet_(ss, PHASE1_CONFIG.sheetNames.errors, [ERROR_SCHEMA], 1);
  initializePhase2Sheets();
  writeGuideSheet_();
}

function initializePhase2Sheets() {
  const ss = getActiveSpreadsheet_();
  initializeSheet_(ss, PHASE1_CONFIG.sheetNames.rakutenReview, [RAKUTEN_REVIEW_SCHEMA], 1);
  initializeSheet_(ss, PHASE1_CONFIG.sheetNames.rakutenErrors, [RAKUTEN_ERROR_SCHEMA], 1);
  initializeSheet_(ss, PHASE1_CONFIG.sheetNames.yahooReview, [YAHOO_REVIEW_SCHEMA], 1);
  initializeSheet_(ss, PHASE1_CONFIG.sheetNames.yahooErrors, [YAHOO_ERROR_SCHEMA], 1);
}

function refreshGuideSheet() {
  writeSampleSheet_();
  writeGuideSheet_();
}

function refreshConfirmationSheet() {
  const result = buildPhase1Result_();
  writeReviewSheet_(result.reviewRows);
  writeErrorSheet_(result.errorRows);
}

function exportIntermediateCsv() {
  const rows = readInputRows_();
  const matrix = [
    PHASE1_INPUT_SCHEMA.map(function (item) { return item.key; }),
    PHASE1_INPUT_SCHEMA.map(function (item) { return item.note; })
  ];

  rows.forEach(function (row) {
    matrix.push(PHASE1_INPUT_SCHEMA.map(function (item) {
      return normalizeCellValue_(row[item.key]);
    }));
  });

  downloadCsvFile_(
    buildExportFileName_('phase1_intermediate', 'csv'),
    matrix,
    PHASE1_CONFIG.exportEncoding.intermediate
  );
}

function exportIrItemCsv() {
  const result = buildPhase1Result_();
  writeReviewSheet_(result.reviewRows);
  writeErrorSheet_(result.errorRows);

  const exportRows = result.records
    .filter(function (record) { return record.shouldExport; })
    .map(function (record) {
      return IR_ITEM_HEADER.map(function (header) {
        return normalizeCellValue_(record.irItemRow[header]);
      });
    });

  if (exportRows.length === 0) {
    throw new Error('共通CSV の出力対象がありません。エラー一覧 を確認してください。');
  }

  downloadCsvFile_(
    buildExportFileName_('ir-item', 'csv'),
    [IR_ITEM_HEADER].concat(exportRows),
    PHASE1_CONFIG.exportEncoding.irItem
  );
}

function buildPhase1Result_() {
  const sourceRows = readInputRows_();
  const records = sourceRows.map(function (sourceRow, index) {
    return buildPhase1Record_(sourceRow, index + 3);
  });

  appendDuplicateProductCodeErrors_(records);

  return {
    records: records,
    reviewRows: [REVIEW_SCHEMA].concat(records.map(buildReviewRow_)),
    errorRows: buildErrorRowsFromRecords_(records, ERROR_SCHEMA)
  };
}

function buildPhase1Record_(source, sourceRowNumber) {
  const errors = [];
  const normalized = {};

  normalized.productCode = normalizeProductCode_(source.product_code, errors);
  normalized.title = resolveTitle_(source, errors);
  normalized.category = normalizeCategory_(source.category, errors);
  normalized.rakutenGenreId = normalizeRakutenGenreId_(source.rakuten_genre_id, errors);
  normalized.yahooProductCategory = normalizeYahooProductCategory_(source.yahoo_product_category, errors);
  normalized.salePrice = resolveSalePrice_(source.sale_price, errors);
  normalized.displayPrice = resolveDisplayPrice_(normalized.salePrice);
  normalized.tax = resolveTaxRule_(source.food_flag, errors);
  normalized.janCode = normalizeJanCode_(source.jan_code, errors);
  normalized.catchcopy = '';
  normalized.description = '';
  normalized.imageBundle = buildImageBundle_(normalized.productCode, source.image_count, source.image_ext, errors);

  const irItemRow = createEmptyRowFromHeader_(IR_ITEM_HEADER);
  irItemRow['商品コード（楽天URL）'] = normalized.productCode;
  irItemRow['楽天商品番号'] = PHASE1_CONFIG.copyProductCodeToRakutenItemNumber ? normalized.productCode : '';
  irItemRow['カテゴリ'] = normalized.category;
  irItemRow['商品名'] = normalized.title;
  irItemRow['楽天ジャンルID'] = normalized.rakutenGenreId;
  irItemRow['yahooプロダクトカテゴリ'] = normalized.yahooProductCategory;
  irItemRow['キャッチコピー'] = normalized.catchcopy;
  irItemRow['モバイルキャッチコピー'] = normalized.catchcopy;
  irItemRow['販売価格'] = normalized.salePrice;
  irItemRow['消費税'] = normalized.tax.taxFlag;
  irItemRow['消費税率'] = normalized.tax.taxRate;
  irItemRow['軽減税率'] = normalized.tax.reducedTaxRateFlag;
  irItemRow['表示価格'] = normalized.displayPrice;
  irItemRow['送料'] = PHASE1_CONFIG.defaultShippingCode;
  irItemRow['個別送料'] = PHASE1_CONFIG.defaultIndividualShippingCode;
  irItemRow['倉庫指定'] = PHASE1_CONFIG.defaultWarehouseFlag;
  irItemRow['JANコード'] = normalized.janCode;
  irItemRow['PC用商品説明文'] = normalized.description;
  irItemRow['PC用商品説明文改行'] = '0';
  irItemRow['モバイル用商品説明文'] = normalized.description;
  irItemRow['モバイル用商品説明文改行'] = '0';
  irItemRow['スマートフォン用商品説明文'] = normalized.description;
  irItemRow['スマートフォン用商品説明文改行'] = '0';
  irItemRow['PC用販売説明文'] = '';
  irItemRow['PC用販売説明文改行'] = PHASE1_CONFIG.defaultPcSalesCopyLineBreak;
  irItemRow['在庫タイプ'] = PHASE1_CONFIG.defaultStockType;
  irItemRow['在庫数'] = PHASE1_CONFIG.defaultStockQuantity;
  irItemRow['在庫無制限'] = PHASE1_CONFIG.defaultStockUnlimited;
  irItemRow['新品・中古'] = PHASE1_CONFIG.defaultConditionCode;

  normalized.imageBundle.urls.forEach(function (url, index) {
    irItemRow[`画像${index + 1}`] = url;
  });

  validateAttributeDependency_(source, normalized, errors);

  return {
    sourceRowNumber: sourceRowNumber,
    source: source,
    normalized: normalized,
    irItemRow: irItemRow,
    errors: errors,
    shouldExport: errors.length === 0
  };
}

function buildReviewRow_(record) {
  const urls = record.normalized.imageBundle.urls;
  return [
    record.sourceRowNumber,
    record.shouldExport ? '1' : '0',
    record.normalized.productCode || '',
    record.normalized.title || '',
    record.source.category || '',
    record.normalized.category || '',
    record.source.rakuten_genre_id || '',
    record.normalized.rakutenGenreId || '',
    record.source.yahoo_product_category || '',
    record.normalized.yahooProductCategory || '',
    record.source.sale_price || '',
    record.normalized.salePrice || '',
    record.normalized.displayPrice || '',
    record.source.jan_code || '',
    record.source.food_flag || '',
    record.normalized.tax.taxFlag || '',
    record.normalized.tax.taxRate || '',
    record.normalized.tax.reducedTaxRateFlag || '',
    record.source.image_count || '',
    record.source.image_ext || '',
    String(urls.length),
    urls[0] || '',
    urls[1] || '',
    urls[2] || '',
    urls[3] || '',
    record.source.attribute_template_key || '',
    record.source.note || '',
    String(record.errors.length),
    buildErrorMessages_(record.errors)
  ];
}

function readInputRows_() {
  const sheet = getOrCreateSheet_(PHASE1_CONFIG.sheetNames.input);
  const lastRow = sheet.getLastRow();
  const columnCount = PHASE1_INPUT_SCHEMA.length;

  if (lastRow < 3) {
    return [];
  }

  const values = sheet.getRange(3, 1, lastRow - 2, columnCount).getDisplayValues();
  const rows = [];

  values.forEach(function (line) {
    if (line.every(isBlankCell_)) {
      return;
    }

    const row = {};
    PHASE1_INPUT_SCHEMA.forEach(function (item, index) {
      row[item.key] = normalizeCellValue_(line[index]);
    });
    rows.push(row);
  });

  return rows;
}

function writeReviewSheet_(rows) {
  initializeSheet_(getActiveSpreadsheet_(), PHASE1_CONFIG.sheetNames.review, rows, 1);
}

function writeErrorSheet_(rows) {
  initializeSheet_(getActiveSpreadsheet_(), PHASE1_CONFIG.sheetNames.errors, rows, 1);
}

function writeInputSheet_() {
  const ss = getActiveSpreadsheet_();
  const rows = buildInputSheetRows_();
  initializeSheet_(ss, PHASE1_CONFIG.sheetNames.input, rows, 2);
  applyInputSheetFormat_(getOrCreateSheet_(PHASE1_CONFIG.sheetNames.input, ss), rows[0].length);
}

function writeGuideSheet_() {
  const ss = getActiveSpreadsheet_();
  const rows = buildGuideSheetRows_();
  initializeSheet_(ss, PHASE1_CONFIG.sheetNames.guide, rows, 4);
  const sheet = getOrCreateSheet_(PHASE1_CONFIG.sheetNames.guide, ss);
  populateGuideSheet_(sheet);
  applyGuideSheetFormat_(sheet);
}

function writeSampleSheet_() {
  const ss = getActiveSpreadsheet_();
  const rows = buildSampleSheetRows_();
  initializeSheet_(ss, PHASE1_CONFIG.sheetNames.sample, rows, 5);
  applySampleSheetFormat_(getOrCreateSheet_(PHASE1_CONFIG.sheetNames.sample, ss), rows.length, rows[4].length);
}

function initializeSheet_(ss, sheetName, rows, frozenRows) {
  const sheet = getOrCreateSheet_(sheetName, ss);
  sheet.clearContents();
  sheet.clearFormats();

  if (rows.length > 0) {
    const maxColumns = rows.reduce(function (maxValue, row) {
      return Math.max(maxValue, row.length);
    }, 0);
    const normalizedRows = rows.map(function (row) {
      return padRow_(row, maxColumns);
    });
    sheet.getRange(1, 1, normalizedRows.length, maxColumns).setValues(normalizedRows);
  }

  if (frozenRows) {
    sheet.setFrozenRows(frozenRows);
  }

  sheet.autoResizeColumns(1, Math.max(sheet.getLastColumn(), 1));
}

function buildInputSheetRows_() {
  return [
    PHASE1_INPUT_SCHEMA.map(function (item) { return buildInputHeaderLabel_(item); }),
    PHASE1_INPUT_SCHEMA.map(function (item) { return item.note; })
  ];
}

function buildGuideSheetRows_() {
  return buildBlankMatrix_(98, 10);
}

function buildSampleSheetRows_() {
  const columnCount = PHASE1_INPUT_SCHEMA.length;
  const blankRow = new Array(columnCount).fill('');
  const sampleHeader = PHASE1_INPUT_SCHEMA.map(function (item) { return buildInputHeaderLabel_(item); });
  const sampleNotes = PHASE1_INPUT_SCHEMA.map(function (item) { return item.note; });

  return [
    Object.assign(blankRow.slice(), { 0: '入力見本' }),
    Object.assign(blankRow.slice(), { 0: 'このシートの使い方', 1: '5行目が見出し、6行目が説明、7行目以降が実際の入力例です。実務では「中間入力」シートの3行目から入力します。' }),
    Object.assign(blankRow.slice(), { 0: '見方のコツ', 1: '左側はAIがまとめて貼る欄、右側は人が最後に確認する欄です。出力先の切り替え列はなくし、CSVを書き出したときは全行を対象にして、エラー行だけを自動で除外します。' }),
    blankRow.slice(),
    sampleHeader,
    sampleNotes,
    buildSchemaRowFromObject_({
      product_code: 'uji-matcha-200g',
      title: '宇治抹茶 200g 送料無料',
      category: '683|530',
      rakuten_genre_id: '100227',
      yahoo_product_category: '1001100',
      sale_price: '1480',
      rakuten_title: '宇治抹茶 200g お菓子作りにも使いやすい粉末茶',
      rakuten_catchcopy: '毎日の一杯にも製菓にも使いやすい',
      rakuten_pc_desc: '楽天PC用の説明文です。素材や使い方を入れます。',
      rakuten_sales_desc: '期間限定のおすすめ価格です。',
      rakuten_sp_desc: '楽天スマホで読みやすい短めの説明です。',
      yahoo_title: '宇治抹茶 200g 国産茶葉使用',
      yahoo_catchcopy: 'お菓子作りにも飲用にも使いやすい',
      yahoo_desc: 'Yahoo用の商品説明です。HTMLも扱う想定です。',
      yahoo_sp_free: 'スマホだけで見せたい補足情報を入れます。',
      food_flag: '1',
      image_count: '3',
      image_ext: 'jpg',
      rakuten_delivery_set_id: '1',
      yahoo_shipping_group_id: '2',
      attribute_template_key: '',
      note: '初回出品分',
      jan_code: '4542320580542'
    }),
    buildSchemaRowFromObject_({
      product_code: 'teabag-houjicha-20p',
      title: 'ほうじ茶 ティーバッグ 20包',
      category: '217199',
      rakuten_genre_id: '100316',
      yahoo_product_category: '1001100',
      sale_price: '1080',
      rakuten_title: 'ほうじ茶 ティーバッグ 20包 毎日飲みやすい香ばしさ',
      yahoo_title: 'ほうじ茶 ティーバッグ 20包',
      yahoo_desc: 'Yahoo用の説明は短めにまとめています。',
      yahoo_sp_free: 'スマホ向けの補足だけを入れます。',
      food_flag: '1',
      image_count: '2',
      image_ext: 'jpg',
      attribute_template_key: '',
      note: 'Yahooは後日開始',
      jan_code: '4900000000000'
    })
  ];
}

function buildSchemaRowFromObject_(valuesByKey) {
  return PHASE1_INPUT_SCHEMA.map(function (item) {
    return valuesByKey[item.key] || '';
  });
}

function buildInputHeaderLabel_(item) {
  return item.required ? `${item.label}（必須）` : item.label;
}

function applyInputSheetFormat_(sheet, columnCount) {
  sheet.getRange(1, 1, 2, columnCount).setWrap(true).setVerticalAlignment('top');
  sheet.getRange(1, 1, 1, columnCount).setFontWeight('bold');
  applyInputBlockColors_(sheet, 1, 2);
  applyInputBlockColors_(sheet, 3, 498);
  sheet.autoResizeColumns(1, columnCount);
}

function applyInputBlockColors_(sheet, startRow, rowCount) {
  const colors = startRow <= 2
    ? ['#dbeafe', '#c7d2fe', '#bfdbfe', '#fff2cc']
    : ['#f8fbff', '#f2f5ff', '#eff6ff', '#fffdf0'];

  INPUT_BLOCKS.forEach(function (block, index) {
    sheet.getRange(startRow, block.from, rowCount, block.to - block.from + 1).setBackground(colors[index]);
  });
}

function populateGuideSheet_(sheet) {
  setMergedValue_(sheet, 'A1:J2', 'CSV作成ガイド');
  setMergedValue_(
    sheet,
    'A3:J4',
    '入力は「中間入力」1枚でまとめて行い、その後に 共通、楽天、Yahoo の確認用シートへ分かれます。CSVを書き出すときは全行を対象にし、エラー行だけを自動で除外します。'
  );

  setMergedValue_(sheet, 'A6:C8', '1. データ入力\n共通の中間入力へ入れる');
  setMergedValue_(sheet, 'D6:D8', '→');
  setMergedValue_(sheet, 'E6:G8', '2. 各確認用を更新\nPhase1 / 楽天 / Yahoo');
  setMergedValue_(sheet, 'H6:H8', '→');
  setMergedValue_(sheet, 'I6:J8', '3. 必要なCSVだけ作成\nir-item / itemsub');

  setMergedValue_(sheet, 'A11:J11', '1. データ入力');
  setMergedValue_(
    sheet,
    'A12:D27',
    '青い欄はAIや元データを一気に貼る欄です。黄色い欄は人が確認して決める欄です。\n\n列のまとまりは次の2つです。\n・AI一括入力: 商品コード、共通商品名、カテゴリ、各モール向けの名前と説明文\n・人が確認する入力: 食品フラグ、画像枚数、画像の種類、配送番号、属性テンプレート名、メモ、JANコード\n\n出力先を選ぶ列はありません。共通CSV、楽天CSV、YahooCSV のどれを押しても全行を対象にし、エラー行だけを自動で除外します。\n\n共通CSVでは表示価格は販売価格と同じ値です。説明系は空欄で出します。楽天CSVでは表示価格も販売価格と同じ値、二重価格文言は 1 固定です。YahooCSVでは商品コードや価格など一部の列を空欄で出します。\n\n1行に1商品ずつ入れます。画像は白背景画像なしで、1 から image_count の枚数だけ自動生成します。'
  );
  setMergedValue_(sheet, 'E12:J12', '画面イメージ: 入力見本');
  sheet.getRange('E13').setFormula("=ARRAY_CONSTRAIN('入力見本'!A5:F8,4,6)");
  setMergedValue_(sheet, 'E19:J19', '画面イメージ: 中間入力');
  sheet.getRange('E20').setFormula("=ARRAY_CONSTRAIN('中間入力'!A1:F4,4,6)");

  setMergedValue_(sheet, 'A30:J30', '2. 各確認用を更新');
  setMergedValue_(
    sheet,
    'A31:D48',
    '入力後はメニューから確認用を更新します。\n\n共通の確認では ir-item.csv に入る内容を見ます。\n楽天の確認では、楽天専用の商品名、送料、表示価格、固定値の入り方を見ます。\nYahooの確認では、Yahoo専用の商品名、隠しページ設定、配送グループなどを見ます。\n\nエラーが出たら、直す場所は必ず「中間入力」です。修正したあと、もう一度その確認用を更新してください。'
  );
  setMergedValue_(sheet, 'E31:J31', '画面イメージ: 確認用');
  sheet.getRange('E32').setFormula("=ARRAY_CONSTRAIN('確認用'!A1:F4,4,6)");
  setMergedValue_(sheet, 'E37:J37', '画面イメージ: 楽天確認用');
  sheet.getRange('E38').setFormula("=ARRAY_CONSTRAIN('楽天確認用'!A1:F4,4,6)");
  setMergedValue_(sheet, 'E43:J43', '画面イメージ: Yahoo確認用');
  sheet.getRange('E44').setFormula("=ARRAY_CONSTRAIN('Yahoo確認用'!A1:F4,4,6)");

  setMergedValue_(sheet, 'A51:J51', '3. CSVを作る');
  setMergedValue_(
    sheet,
    'A52:D68',
    '確認用を見て問題がなければ、必要なCSVだけ書き出します。\n\nどのCSVも全行を対象にし、エラーがある行だけ自動で除外します。\n\nCSVはこのパソコンにダウンロードされます。ブラウザの確認が出たら保存を許可してください。'
  );
  setMergedValue_(sheet, 'E52:J52', 'メニュー例');
  setMergedValue_(
    sheet,
    'E53:J58',
    'CSV出力ツール\n・シートを準備する\n・使い方と見本を更新\n・共通の確認を更新\n・楽天の確認を更新\n・Yahooの確認を更新\n・共通CSVを書き出す'
  );
  setMergedValue_(sheet, 'E60:J60', '出力されるファイル');
  setMergedValue_(
    sheet,
    'E61:J66',
    'ir-item_20260405_090000.csv\nir-itemsub_楽天_20260405_090000.csv\nir-itemsub_Yahoo_20260405_090000.csv'
  );

  setMergedValue_(sheet, 'A71:J71', '困ったとき');
  setMergedValue_(sheet, 'A72:C75', '楽天だけ止まる');
  setMergedValue_(sheet, 'D72:J75', '「楽天エラー一覧」を見てください。配送方法セット番号、販売価格、食品フラグなど、楽天でも共通でも使う欄が原因になることがあります。');
  setMergedValue_(sheet, 'A76:C79', 'Yahooだけ止まる');
  setMergedValue_(sheet, 'D76:J79', '「Yahooエラー一覧」を見てください。配送グループ番号や商品名などを確認します。');
  setMergedValue_(sheet, 'A80:C83', '何も出ない');
  setMergedValue_(sheet, 'D80:J83', '各エラー一覧に理由が出ていないかを確認してください。エラーがなければ全行が出力対象です。');
}

function applyGuideSheetFormat_(sheet) {
  const totalRows = 98;
  const totalColumns = 10;
  sheet.getRange(1, 1, totalRows, totalColumns).setWrap(true).setVerticalAlignment('top');

  for (let column = 1; column <= 4; column += 1) {
    sheet.setColumnWidth(column, 145);
  }
  for (let column = 5; column <= 10; column += 1) {
    sheet.setColumnWidth(column, 110);
  }

  sheet.getRange('A1:J2').setBackground('#f4efe6').setFontWeight('bold').setFontSize(16).setHorizontalAlignment('center').setVerticalAlignment('middle');
  sheet.getRange('A3:J4').setBackground('#fff9ef');
  sheet.getRange('A6:C8').setBackground('#d9ead3').setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle').setBorder(true, true, true, true, true, true);
  sheet.getRange('D6:D8').setFontSize(18).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');
  sheet.getRange('E6:G8').setBackground('#cfe2f3').setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle').setBorder(true, true, true, true, true, true);
  sheet.getRange('H6:H8').setFontSize(18).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');
  sheet.getRange('I6:J8').setBackground('#fce5cd').setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle').setBorder(true, true, true, true, true, true);

  ['A11:J11', 'A30:J30', 'A51:J51', 'A71:J71'].forEach(function (a1) {
    sheet.getRange(a1).setBackground('#b6d7a8').setFontWeight('bold').setFontSize(12);
  });

  ['A12:D27', 'A31:D48', 'A52:D68'].forEach(function (a1) {
    sheet.getRange(a1).setBackground('#f8fbf4').setBorder(true, true, true, true, true, true);
  });

  ['E12:J12', 'E19:J19', 'E31:J31', 'E37:J37', 'E43:J43', 'E52:J52', 'E60:J60'].forEach(function (a1) {
    sheet.getRange(a1).setBackground('#ddebf7').setFontWeight('bold').setHorizontalAlignment('center').setBorder(true, true, true, true, true, true);
  });

  ['E13:J16', 'E20:J23', 'E32:J35', 'E38:J41', 'E44:J47'].forEach(function (a1) {
    sheet.getRange(a1).setBackground('#ffffff').setBorder(true, true, true, true, true, true).setFontSize(9);
  });

  ['E53:J58', 'E61:J66', 'A72:C75', 'D72:J75', 'A76:C79', 'D76:J79', 'A80:C83', 'D80:J83'].forEach(function (a1) {
    sheet.getRange(a1).setBackground('#fffdf0').setBorder(true, true, true, true, true, true);
  });

  ['A72:C75', 'A76:C79', 'A80:C83'].forEach(function (a1) {
    sheet.getRange(a1).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');
  });

  for (let row = 1; row <= totalRows; row += 1) {
    sheet.setRowHeight(row, row <= 4 ? 28 : 24);
  }
}

function applySampleSheetFormat_(sheet, rowCount, columnCount) {
  sheet.getRange(1, 1, rowCount, columnCount).setWrap(true).setVerticalAlignment('top');
  sheet.getRange(1, 1, 3, columnCount).setBackground('#f4efe6');
  sheet.getRange(1, 1, 1, columnCount).setFontWeight('bold').setFontSize(14);
  sheet.getRange(5, 1, 1, columnCount).setFontWeight('bold');
  applySampleBlockColors_(sheet, 5, 4);
  sheet.autoResizeColumns(1, columnCount);
}

function applySampleBlockColors_(sheet, startRow, rowCount) {
  const colors = ['#dbeafe', '#c7d2fe', '#bfdbfe', '#fff2cc'];
  INPUT_BLOCKS.forEach(function (block, index) {
    sheet.getRange(startRow, block.from, rowCount, block.to - block.from + 1).setBackground(colors[index]);
  });
}

function setMergedValue_(sheet, a1, value) {
  const range = sheet.getRange(a1);
  range.merge();
  range.setValue(value);
  return range;
}

function buildBlankMatrix_(rowCount, columnCount) {
  const rows = [];
  for (let row = 0; row < rowCount; row += 1) {
    rows.push(new Array(columnCount).fill(''));
  }
  return rows;
}

function getOrCreateSheet_(sheetName, ss) {
  const spreadsheet = ss || getActiveSpreadsheet_();
  return spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
}

function getActiveSpreadsheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('アクティブなスプレッドシートが見つかりません。コンテナバインドされた GAS で実行してください。');
  }
  return ss;
}

function createEmptyRowFromHeader_(headerRow) {
  return headerRow.reduce(function (row, header) {
    row[header] = '';
    return row;
  }, {});
}

function appendDuplicateProductCodeErrors_(records) {
  const buckets = {};

  records.forEach(function (record) {
    if (!record.normalized.productCode) {
      return;
    }
    if (!buckets[record.normalized.productCode]) {
      buckets[record.normalized.productCode] = [];
    }
    buckets[record.normalized.productCode].push(record);
  });

  Object.keys(buckets).forEach(function (productCode) {
    if (buckets[productCode].length <= 1) {
      return;
    }

    buckets[productCode].forEach(function (record) {
      record.errors.push(buildError_('product_code', 'DUPLICATE_PRODUCT_CODE', `product_code が重複しています: ${productCode}`));
      record.shouldExport = false;
    });
  });
}

function buildErrorRowsFromRecords_(records, schema) {
  const rows = [schema];
  records.forEach(function (record) {
    record.errors.forEach(function (error) {
      rows.push([
        record.sourceRowNumber,
        error.field,
        error.code,
        error.message,
        record.shouldExport ? '1' : '0',
        record.normalized.productCode || ''
      ]);
    });
  });
  return rows;
}

function buildErrorMessages_(errors) {
  return errors.map(function (error) {
    return `[${error.code}] ${error.message}`;
  }).join('\n');
}

function normalizeProductCode_(value, errors) {
  let productCode = trimToString_(value);

  if (!productCode) {
    errors.push(buildError_('product_code', 'REQUIRED', '商品コードを入力してください。'));
    return '';
  }

  productCode = productCode
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[　\s]+/g, '-')
    .replace(/[^0-9a-z_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/_+/g, '_')
    .replace(/^[-_]+|[-_]+$/g, '');

  if (!productCode) {
    errors.push(buildError_('product_code', 'INVALID', '商品コードが空になりました。英小文字、数字、-、_ のみになるように直してください。'));
    return '';
  }

  if (productCode.length > PHASE1_CONFIG.maxProductCodeLength) {
    errors.push(buildError_('product_code', 'TOO_LONG', `商品コードは ${PHASE1_CONFIG.maxProductCodeLength} 文字以内で入力してください。`));
  }

  return productCode;
}

function resolveTitle_(source, errors) {
  const title = trimToString_(source.title);
  if (!title) {
    errors.push(buildError_('title', 'REQUIRED', '共通の商品名を入力してください。'));
    return '';
  }
  if (title.length > PHASE1_CONFIG.maxProductNameLength) {
    errors.push(buildError_('title', 'TOO_LONG', `共通の商品名は ${PHASE1_CONFIG.maxProductNameLength} 文字以内で入力してください。`));
  }
  return title;
}

function resolveMallTitle_(specificValue, fallbackValue, fieldName, label, errors) {
  const title = trimToString_(specificValue) || trimToString_(fallbackValue);
  if (!title) {
    errors.push(buildError_(fieldName, 'REQUIRED', `${label}を入力してください。`));
    return '';
  }
  if (title.length > PHASE1_CONFIG.maxProductNameLength) {
    errors.push(buildError_(fieldName, 'TOO_LONG', `${label}は ${PHASE1_CONFIG.maxProductNameLength} 文字以内で入力してください。`));
  }
  return title;
}

function normalizeCategory_(value, errors) {
  return normalizeCategoryLike_(value, 'category', '共通カテゴリ', true, errors);
}

function normalizeCategoryLike_(value, fieldName, label, required, errors) {
  const rawValue = trimToString_(value);
  if (!rawValue) {
    if (required) {
      errors.push(buildError_(fieldName, 'REQUIRED', `${label}を入力してください。`));
    }
    return '';
  }

  const ids = rawValue.match(/\d+/g) || [];
  if (ids.length === 0) {
    errors.push(buildError_(fieldName, 'INVALID', `${label}は数字だけ、または 683|530 のように入力してください。`));
    return '';
  }

  return `|${ids.join('|')}|`;
}

function normalizeRakutenGenreId_(value, errors) {
  return normalizeDigitsField_(value, 'rakuten_genre_id', '楽天ジャンルID', errors, {
    required: true,
    maxDigits: 20
  });
}

function normalizeYahooProductCategory_(value, errors) {
  return normalizeDigitsField_(value, 'yahoo_product_category', 'Yahoo productカテゴリ', errors, {
    required: true,
    maxDigits: 10
  });
}

function resolveSalePrice_(salePrice, errors) {
  return normalizeDigitsField_(salePrice, 'sale_price', '販売価格', errors, {
    required: true,
    maxDigits: PHASE1_CONFIG.maxPriceDigits
  });
}

function resolveDisplayPrice_(salePrice) {
  return salePrice || '';
}

function resolveTaxRule_(value, errors) {
  const rawValue = trimToString_(value);
  if (!rawValue) {
    errors.push(buildError_('food_flag', 'REQUIRED', '食品フラグを入力してください。1=食品、0=非食品です。'));
    return TAX_CLASS_RULES[PHASE1_CONFIG.defaultTaxClass];
  }
  if (rawValue === '0') {
    return TAX_CLASS_RULES.standard;
  }
  if (rawValue === '1') {
    return TAX_CLASS_RULES.reduced;
  }
  errors.push(buildError_('food_flag', 'INVALID', '食品フラグは 1=食品、0=非食品 で入力してください。'));
  return TAX_CLASS_RULES[PHASE1_CONFIG.defaultTaxClass];
}

function normalizeJanCode_(value, errors) {
  return normalizeDigitsField_(value, 'jan_code', 'JANコード', errors, {
    required: false,
    maxDigits: 13
  });
}

function normalizeDigitsField_(value, fieldName, label, errors, options) {
  const settings = options || {};
  const rawValue = trimToString_(value);

  if (!rawValue) {
    if (settings.required) {
      errors.push(buildError_(fieldName, 'REQUIRED', `${label}を入力してください。`));
    }
    return settings.defaultValue || '';
  }

  if (!/^\d+$/.test(rawValue)) {
    errors.push(buildError_(fieldName, 'INVALID', `${label}は数字だけで入力してください。`));
    return rawValue;
  }

  if (settings.maxDigits && rawValue.length > settings.maxDigits) {
    errors.push(buildError_(fieldName, 'TOO_LONG', `${label}は ${settings.maxDigits} 桁以内で入力してください。`));
  }

  return rawValue;
}

function normalizeChoiceField_(value, fieldName, label, errors, allowedValues, options) {
  const settings = options || {};
  const rawValue = trimToString_(value);

  if (!rawValue) {
    return settings.defaultValue || '';
  }

  if (allowedValues.indexOf(rawValue) === -1) {
    errors.push(buildError_(fieldName, 'INVALID', `${label}は ${allowedValues.join('/')} のいずれかで入力してください。`));
    return rawValue;
  }

  return rawValue;
}

function normalizeRakutenSalePeriod_(value, fieldName, label, errors) {
  const rawValue = trimToString_(value);
  if (!rawValue) {
    return '';
  }
  if (!/^\d{12}$/.test(rawValue)) {
    errors.push(buildError_(fieldName, 'INVALID', `${label}は YYYYMMDDHHMM の 12 桁で入力してください。`));
  }
  return rawValue;
}

function normalizeYahooPath_(value, fallbackValue, errors) {
  const rawValue = trimToString_(value) || trimToString_(fallbackValue);
  return normalizeCategoryLike_(rawValue, 'yahoo_path', 'Yahooのパス', true, errors);
}

function buildImageBundle_(productCode, imageCountValue, imageExtValue, errors) {
  const imageCountText = trimToString_(imageCountValue);
  const imageExt = trimToString_(imageExtValue).replace(/^\./, '').toLowerCase();
  const urls = [];

  if (!productCode) {
    return { urls: urls };
  }

  if (!imageCountText) {
    errors.push(buildError_('image_count', 'REQUIRED', '画像枚数を入力してください。'));
    return { urls: urls };
  }

  if (!/^\d+$/.test(imageCountText)) {
    errors.push(buildError_('image_count', 'INVALID', '画像枚数は 0 から 20 の整数で入力してください。'));
    return { urls: urls };
  }

  if (!imageExt) {
    errors.push(buildError_('image_ext', 'REQUIRED', '画像の種類を入力してください。'));
    return { urls: urls };
  }

  if (!/^[a-z0-9]+$/.test(imageExt)) {
    errors.push(buildError_('image_ext', 'INVALID', '画像の種類は jpg や png のように拡張子だけを入力してください。'));
  }

  const imageCount = Number(imageCountText);
  if (imageCount < 0 || imageCount > PHASE1_CONFIG.maxImageSlots) {
    errors.push(buildError_('image_count', 'OUT_OF_RANGE', `画像枚数は 0 から ${PHASE1_CONFIG.maxImageSlots} の間で入力してください。`));
    return { urls: urls };
  }

  for (let i = 1; i <= imageCount; i += 1) {
    urls.push(`${PHASE1_CONFIG.imageBaseUrl}${productCode}/${i}.${imageExt}`);
  }

  return { urls: urls };
}

function validateAttributeDependency_(source, normalized, errors) {
}

function downloadCsvFile_(fileName, rows, charset) {
  const blob = createCsvBlob_(fileName, rows, charset);
  const html = HtmlService.createHtmlOutput(buildCsvDownloadDialogHtml_(fileName, blob))
    .setWidth(420)
    .setHeight(220);

  SpreadsheetApp.getUi().showModalDialog(html, 'CSV をダウンロード');
}

function createCsvBlob_(fileName, rows, charset) {
  const csvText = buildCsvText_(rows);
  const blob = Utilities.newBlob('', 'text/csv', fileName);
  blob.setDataFromString(csvText, charset);
  return blob;
}

function buildCsvText_(rows) {
  return rows.map(toCsvLine_).join('\r\n');
}

function buildCsvDownloadDialogHtml_(fileName, blob) {
  const payload = JSON.stringify({
    fileName: fileName,
    base64: Utilities.base64Encode(blob.getBytes()),
    mimeType: blob.getContentType() || 'text/csv'
  });

  return `
<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
    <meta charset="utf-8">
    <style>
      body { font-family: sans-serif; padding: 16px; line-height: 1.6; }
      .box { border: 1px solid #d9d9d9; border-radius: 8px; padding: 16px; background: #fafafa; }
      .title { font-weight: 700; margin-bottom: 8px; }
      .sub { color: #555; font-size: 13px; }
      .button { display: inline-block; margin-top: 12px; padding: 8px 14px; background: #1a73e8; color: #fff; text-decoration: none; border-radius: 6px; }
    </style>
  </head>
  <body>
    <div class="box">
      <div class="title">CSV のダウンロードを開始します</div>
      <div id="status" class="sub">ブラウザの確認が出たら、保存を許可してください。</div>
      <a id="manualDownload" class="button" href="#">もう一度ダウンロードする</a>
    </div>
    <script>
      const payload = ${payload};

      function decodeBase64(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
          bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
      }

      function triggerDownload() {
        const bytes = decodeBase64(payload.base64);
        const blob = new Blob([bytes], { type: payload.mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = payload.fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(function () {
          URL.revokeObjectURL(url);
        }, 1000);
      }

      document.getElementById('manualDownload').addEventListener('click', function(event) {
        event.preventDefault();
        triggerDownload();
      });

      window.addEventListener('load', function() {
        triggerDownload();
        document.getElementById('status').textContent = 'ダウンロードを開始しました。保存先はブラウザの設定により変わります。';
      });
    </script>
  </body>
</html>`;
}

function toCsvLine_(row) {
  return row.map(function (cell) {
    const value = normalizeCellValue_(cell);
    if (/[",\r\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }).join(',');
}

function buildExportFileName_(prefix, extension) {
  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
  return `${prefix}_${timestamp}.${extension}`;
}

function padRow_(row, length) {
  const clone = row.slice();
  while (clone.length < length) {
    clone.push('');
  }
  return clone;
}

function normalizeCellValue_(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}

function trimToString_(value) {
  return normalizeCellValue_(value).trim();
}

function isBlankCell_(value) {
  return trimToString_(value) === '';
}

function buildError_(field, code, message) {
  return {
    field: field,
    code: code,
    message: message
  };
}

function normalizePublishFlag_(value) {
  return trimToString_(value) === '1' ? '1' : '0';
}
