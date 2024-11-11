function orderId(names) {
  const prefix = names || 'ORD';

  const uniqueNumber = Math.floor(Math.random() * 1000000000) + Date.now();

  const shortUniqueNumber = uniqueNumber.toString().slice(-9);
  return `${prefix}${shortUniqueNumber}`;
}

module.exports = orderId;
