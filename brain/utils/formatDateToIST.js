function formatDateToIST(dateString) {
  const date = new Date(dateString);
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffset);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const dayOfWeek = days[istDate.getUTCDay()];
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  const month = months[istDate.getUTCMonth()];
  const year = String(istDate.getUTCFullYear()).slice(-2);
  let hour = istDate.getUTCHours();
  const minute = String(istDate.getUTCMinutes()).padStart(2, '0');

  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? String(hour) : '12';

  return `${dayOfWeek}, ${day} ${month}'${year}, ${hour}:${minute} ${ampm}`;
}

module.exports = formatDateToIST;
