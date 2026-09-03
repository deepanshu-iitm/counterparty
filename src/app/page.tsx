import { ProductCard } from "@/components/product-card";
import { searchProducts } from "@/lib/catalog/service";

export default function Home() {
  const products = searchProducts({
    minimumRamGb: 32,
    sortBy: "value",
  });

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Counterparty home">
          <span className="brand-mark">C</span>
          <span>Counterparty</span>
        </a>
        <div className="topbar__center">Agent-native commerce protocol</div>
        <div className="connection-status">
          <span className="connection-dot" />
          WebMCP ready
        </div>
      </header>

      <section className="workspace">
        <aside className="rail">
          <div>
            <p className="section-label">Mission</p>
            <h1>Find the right machine. Negotiate the right terms.</h1>
            <p className="rail__copy">
              Your agent handles repetitive bargaining. You remain the authority
              on every commitment.
            </p>
          </div>

          <div className="brief">
            <div className="brief__header">
              <span>Active brief</span>
              <span className="brief__status">Draft</span>
            </div>
            <p>Development laptop</p>
            <ul>
              <li>Budget up to $1,800</li>
              <li>At least 32 GB memory</li>
              <li>Strong warranty preferred</li>
            </ul>
          </div>

          <div className="authority-note">
            <span className="authority-note__icon">◆</span>
            <div>
              <strong>You hold final authority</strong>
              <p>The agent can negotiate, but it cannot commit a deal.</p>
            </div>
          </div>
        </aside>

        <section className="marketplace">
          <div className="marketplace__heading">
            <div>
              <p className="section-label">Qualified matches</p>
              <h2>Three counterparties, three strategies</h2>
            </div>
            <span className="result-count">{products.length} live offers</span>
          </div>

          <div className="product-list">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                featured={index === 0}
              />
            ))}
          </div>
        </section>

        <aside className="activity-panel">
          <div className="activity-panel__header">
            <div>
              <p className="section-label">Agent activity</p>
              <h2>Live trail</h2>
            </div>
            <span className="live-indicator">Live</span>
          </div>

          <div className="timeline">
            <div className="timeline-item timeline-item--complete">
              <span className="timeline-item__marker" />
              <div>
                <span className="timeline-item__time">12:40:02</span>
                <strong>Brief understood</strong>
                <p>Budget and hard constraints extracted.</p>
              </div>
            </div>
            <div className="timeline-item timeline-item--active">
              <span className="timeline-item__marker" />
              <div>
                <span className="timeline-item__time">12:40:04</span>
                <strong>Catalog ready</strong>
                <p>Three qualified sellers available to negotiate.</p>
              </div>
            </div>
            <div className="timeline-item">
              <span className="timeline-item__marker" />
              <div>
                <span className="timeline-item__time">Waiting</span>
                <strong>Negotiation</strong>
                <p>Connect an agent to begin structured offers.</p>
              </div>
            </div>
          </div>

          <div className="agent-callout">
            <span>Suggested prompt</span>
            <p>
              “Negotiate with the strongest options. Don&apos;t finalize
              anything without me.”
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
