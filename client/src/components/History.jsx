export default function History({ items, onOpen }) {
  if (!items.length) return null;
  return (
    <section className="card history">
      <h3>Recent analyses</h3>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <button onClick={() => onOpen(item.id)}>
              <span className="history-title">{item.jobTitle}</span>
              <span className="history-meta">
                {item.score}/100 · {item.engine === "ai" ? "AI" : "Keyword"} · {new Date(item.createdAt).toLocaleString()}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
