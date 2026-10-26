const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' });

export const money = (n) => currency.format(n ?? 0);

export const formatDate = (iso) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
