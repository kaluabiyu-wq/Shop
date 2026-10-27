const currency = new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', currencyDisplay: 'code', minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const money = (n) => `ETB ${(Number(n ?? 0)).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatDate = (iso) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
