import pdfParse from 'pdf-parse';
import xlsx from 'xlsx';
import ofx from 'ofx';
import Tesseract from 'tesseract.js';

const parseAmount = (value) => {
  if (value === null || value === undefined) return 0;
  const cleaned = String(value).replace(/[₹,$]/g, '').replace(/,/g, '').trim();
  const numberValue = Number(cleaned);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const parseDate = (value) => {
  if (!value) return '';
  const trimmed = String(value).trim();
  if (!trimmed) return '';

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }

  const match = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (match) {
    const [, dd, mm, yyyy] = match;
    const day = String(dd).padStart(2, '0');
    const month = String(mm).padStart(2, '0');
    return `${yyyy}-${month}-${day}`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
};

const normalizeCategory = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized.includes('food') || normalized.includes('restaurant') || normalized.includes('dining')) return 'Food';
  if (normalized.includes('travel') || normalized.includes('cab') || normalized.includes('uber') || normalized.includes('ola')) return 'Travel';
  if (normalized.includes('shop') || normalized.includes('amazon') || normalized.includes('myntra')) return 'Shopping';
  if (normalized.includes('bill') || normalized.includes('rent') || normalized.includes('utility')) return 'Bills';
  return 'Others';
};

const parseRowsFromSheet = (rows) => {
  if (!rows.length) return [];
  const headers = rows[0].map((h) => String(h || '').trim().toLowerCase());
  const indexOf = (label) => headers.findIndex((h) => h === label);
  const dateIndex = indexOf('date');
  const amountIndex = indexOf('amount');
  const categoryIndex = headers.findIndex((h) => ['category', 'type'].includes(h));
  const methodIndex = headers.findIndex((h) => ['paymentmethod', 'payment_method', 'method', 'mode'].includes(h));
  const notesIndex = headers.findIndex((h) => ['notes', 'description', 'details', 'narration'].includes(h));

  return rows.slice(1).map((row) => {
    const dateRaw = dateIndex >= 0 ? row[dateIndex] : row[0] || '';
    const amountRaw = amountIndex >= 0 ? row[amountIndex] : row[1] || '';
    const categoryRaw = categoryIndex >= 0 ? row[categoryIndex] : row[2] || '';
    const methodRaw = methodIndex >= 0 ? row[methodIndex] : '';
    const notesRaw = notesIndex >= 0 ? row[notesIndex] : '';

    return {
      date: parseDate(dateRaw),
      amount: parseAmount(amountRaw),
      category: normalizeCategory(categoryRaw || 'Others'),
      paymentMethod: methodRaw ? String(methodRaw).trim() : 'Imported',
      notes: String(notesRaw || '').trim()
    };
  });
};

const parseOfxTransactions = (content) => {
  try {
    const data = ofx.parse(content);
    const list =
      data?.OFX?.BANKMSGSRSV1?.STMTTRNRS?.STMTRS?.BANKTRANLIST?.STMTTRN ||
      data?.OFX?.CREDITCARDMSGSRSV1?.CCSTMTTRNRS?.CCSTMTRS?.BANKTRANLIST?.STMTTRN ||
      [];

    return list.map((item) => ({
      date: parseDate(item.DTPOSTED || item.DTUSER || ''),
      amount: parseAmount(item.TRNAMT || 0),
      category: normalizeCategory(item.MEMO || item.NAME || ''),
      paymentMethod: 'Imported',
      notes: String(item.MEMO || item.NAME || '').trim()
    }));
  } catch {
    return [];
  }
};

const parsePdfTransactions = async (buffer) => {
  const data = await pdfParse(buffer);
  const lines = data.text.split('\n').map((line) => line.trim()).filter(Boolean);
  const rows = [];

  lines.forEach((line) => {
    const dateMatch = line.match(/(\d{2}[\/\-]\d{2}[\/\-]\d{4}|\d{4}-\d{2}-\d{2})/);
    const amountMatch = line.match(/(-?\d[\d,]*\.?\d{0,2})/g);
    if (!dateMatch || !amountMatch) return;

    const date = parseDate(dateMatch[0]);
    const amount = parseAmount(amountMatch[amountMatch.length - 1]);
    if (!date || !amount) return;

    const notes = line.replace(dateMatch[0], '').replace(amountMatch[amountMatch.length - 1], '').trim();
    rows.push({
      date,
      amount,
      category: normalizeCategory(notes),
      paymentMethod: 'Imported',
      notes
    });
  });

  return rows;
};

const parseImageTransactions = async (buffer) => {
  try {
    const result = await Tesseract.recognize(buffer, 'eng');
    const text = result?.data?.text || '';
    const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
    const rows = [];

    lines.forEach((line) => {
      const dateMatch = line.match(/(\d{2}[\/\-]\d{2}[\/\-]\d{4}|\d{4}-\d{2}-\d{2})/);
      const amountMatch = line.match(/(-?\d[\d,]*\.?\d{0,2})/g);
      if (!dateMatch || !amountMatch) return;

      const date = parseDate(dateMatch[0]);
      const amount = parseAmount(amountMatch[amountMatch.length - 1]);
      if (!date || !amount) return;

      const notes = line.replace(dateMatch[0], '').replace(amountMatch[amountMatch.length - 1], '').trim();
      rows.push({
        date,
        amount,
        category: normalizeCategory(notes),
        paymentMethod: 'Imported',
        notes
      });
    });

    return rows;
  } catch {
    return [];
  }
};

export const parseImportFile = async ({ buffer, filename }) => {
  const extension = filename.split('.').pop()?.toLowerCase() || '';

  if (extension === 'json') {
    const parsed = JSON.parse(buffer.toString('utf8'));
    const entries = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.transactions)
        ? parsed.transactions
        : Array.isArray(parsed?.expenses)
          ? parsed.expenses
          : [];

    return entries.map((item) => ({
      date: parseDate(item.date || item.transactionDate || item.postedDate),
      amount: parseAmount(item.amount),
      category: normalizeCategory(item.category || item.type || ''),
      paymentMethod: item.paymentMethod || item.method || 'Imported',
      notes: String(item.notes || item.description || item.narration || '').trim()
    }));
  }

  if (extension === 'xlsx' || extension === 'xls' || extension === 'csv') {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    return parseRowsFromSheet(rows);
  }

  if (extension === 'ofx' || extension === 'qfx') {
    return parseOfxTransactions(buffer.toString('utf8'));
  }

  if (extension === 'pdf') {
    return parsePdfTransactions(buffer);
  }

  if (['png', 'jpg', 'jpeg'].includes(extension)) {
    return parseImageTransactions(buffer);
  }

  return [];
};

export const normalizeImportRow = (row) => ({
  date: row.date || '',
  amount: parseAmount(row.amount || 0),
  category: normalizeCategory(row.category || 'Others'),
  paymentMethod: row.paymentMethod || 'Imported',
  notes: String(row.notes || '').trim()
});
