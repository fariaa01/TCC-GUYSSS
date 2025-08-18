function firstDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function lastDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}
function dueDateForMonth(date, dueDay) {
  const last = lastDayOfMonth(date).getDate();
  const day = Math.min(dueDay, last);
  return new Date(date.getFullYear(), date.getMonth(), day);
}
module.exports = { firstDayOfMonth, dueDateForMonth };
