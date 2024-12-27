function parseBoolean(value) {
  return value === 'true'
        || value === '1'
        || value === true
        || value === 1;
}

module.exports = { parseBoolean };