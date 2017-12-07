const meses = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
];

function getMonthYearString(date) {
  if (!date) return null;
  const month = date.getMonth();
  const year = date.getFullYear();
  return `${meses[month]}, ${year}`;
}

function getStringFromDate(date) {
  if (!date) return null;
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  return `${day} de ${meses[month]} de ${year}`;
}

module.exports = { getMonthYearString, getStringFromDate };
