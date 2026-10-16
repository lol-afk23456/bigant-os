// Date-only fields must represent the exact calendar day supplied by the user.
// Date.parse alone also accepts impossible days by rolling into the next month.
export const isISODate = value => typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(value))
  && new Date(value).toISOString().slice(0, 10) === value;
