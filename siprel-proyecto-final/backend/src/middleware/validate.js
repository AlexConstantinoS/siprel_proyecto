const USER_RE = /^[A-Za-z0-9._-]{4,30}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,72}$/;

function text(value, max = 200) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function validUser(value) { return USER_RE.test(String(value || '')); }
function validEmail(value) { return EMAIL_RE.test(String(value || '')) && String(value).length <= 150; }
function validPassword(value) { return PASSWORD_RE.test(String(value || '')); }
function positiveInt(value) { return Number.isInteger(Number(value)) && Number(value) > 0; }

module.exports = { text, validUser, validEmail, validPassword, positiveInt };
