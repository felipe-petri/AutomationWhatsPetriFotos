/**
 * Calcula a quantidade de dias úteis entre duas datas (exclui sábados e domingos).
 */
export function calculateBusinessDays(startDate: Date | string, endDate: Date | string = new Date()): number {
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 0
  }

  const cur = new Date(start)
  cur.setHours(0, 0, 0, 0)

  const target = new Date(end)
  target.setHours(0, 0, 0, 0)

  if (cur >= target) {
    return 0
  }

  let businessDays = 0
  while (cur < target) {
    cur.setDate(cur.getDate() + 1)
    const dayOfWeek = cur.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays++
    }
  }

  return businessDays
}
