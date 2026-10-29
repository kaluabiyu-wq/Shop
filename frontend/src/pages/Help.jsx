import { Link } from 'react-router-dom';

const faqs = [
  { q: 'How do I place an order?', a: 'Add the items you want to your cart, review quantities, then continue to checkout and enter your delivery details.' },
  { q: 'When will my order arrive?', a: 'Delivery estimates are usually 1–3 business days in Addis Ababa and 3–7 business days in regional cities after order confirmation. These are estimates, not guarantees.' },
  { q: 'Can I cancel an order?', a: 'Open My orders to see whether the order is still eligible for cancellation. Orders already being prepared or shipped may not be cancellable.' },
  { q: 'What if an item is unavailable?', a: 'Stock can change. The store checks availability during checkout; if an item becomes unavailable, contact support before making another payment.' },
  { q: 'How do returns work?', a: 'Contact the shop within 7 days of delivery to request a return. Items should be unused and in original packaging. The shop must confirm eligibility and refund arrangements.' },
];

export default function Help() {
  return <div className="container narrow help-page">
    <span className="eyebrow">WE’RE HERE TO HELP</span>
    <h1>Help & customer care</h1>
    <p className="muted">Find quick answers about shopping, delivery, orders, and returns.</p>
    <section className="faq-list" aria-label="Frequently asked questions">
      {faqs.map((item) => <details className="faq-item" key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}
    </section>
    <section className="help-contact">
      <h2>Still need help?</h2>
      <p>For an order-specific question, keep your order number handy so the shop can assist you faster.</p>
      <a className="btn" href="mailto:support@example.com?subject=Online%20store%20support">Email customer support</a>
      <p className="muted small">Store owner: replace support@example.com with your real support email before launch.</p>
      <Link to="/orders">View my orders</Link>
    </section>
  </div>;
}
