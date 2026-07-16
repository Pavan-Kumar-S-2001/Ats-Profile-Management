const crypto = require('crypto');
const pdfParse = require('pdf-parse');

/**
 * Extract page count and a naive candidate-name guess from PDF bytes.
 * Falls back gracefully if the PDF can't be parsed.
 */
async function processPdfBuffer(buffer, fallbackFileName) {
  const contentHash = crypto.createHash('sha256').update(buffer).digest('hex');
  let pageCount = null;
  let candidateName = null;

  try {
    const data = await pdfParse(buffer);
    pageCount = data.numpages || null;
    candidateName = guessCandidateName(data.text, fallbackFileName);
  } catch (err) {
    // Corrupt or unreadable PDF - still store the record, just flag it
    candidateName = guessCandidateName('', fallbackFileName);
  }

  return { contentHash, pageCount, candidateName };
}

/**
 * Very lightweight heuristic: use the first non-empty line of text if it looks
 * like a name (short, mostly alphabetic); otherwise derive from the filename.
 */
function guessCandidateName(text, fileName) {
  const firstLine = (text || '')
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 2 && l.length < 60 && /^[A-Za-z.\s]+$/.test(l));

  if (firstLine) return firstLine;

  return fileName
    .replace(/\.pdf$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\bresume\b/gi, '')
    .trim() || fileName;
}

module.exports = { processPdfBuffer };
