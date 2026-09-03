import type { ProductWithSeller } from "@/lib/catalog/types";

type ProductCardProps = {
  product: ProductWithSeller;
  featured?: boolean;
  negotiationStatus?: "NEGOTIATING" | "TERMS_ACCEPTED" | "CLOSED";
  onNegotiate?: (productId: string) => void;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

export function ProductCard({
  product,
  featured = false,
  negotiationStatus,
  onNegotiate,
}: ProductCardProps) {
  return (
    <article className={`product-card${featured ? " product-card--featured" : ""}`}>
      <div className="product-card__topline">
        <span className="product-card__eyebrow">{product.eyebrow}</span>
        <span className="reputation" aria-label={`${product.seller.reputation} out of 5`}>
          ★ {product.seller.reputation}
        </span>
      </div>

      <div>
        <h3>{product.name}</h3>
        <p className="product-card__seller">
          {product.seller.name} · {product.seller.specialty}
        </p>
      </div>

      <p className="product-card__description">{product.description}</p>

      <dl className="spec-grid">
        <div>
          <dt>Memory</dt>
          <dd>{product.specs.ramGb} GB</dd>
        </div>
        <div>
          <dt>Storage</dt>
          <dd>{product.specs.storageGb / 1_000} TB</dd>
        </div>
        <div>
          <dt>Battery</dt>
          <dd>{product.specs.batteryHours} hrs</dd>
        </div>
        <div>
          <dt>Ships</dt>
          <dd>{product.shippingDays} days</dd>
        </div>
      </dl>

      <div className="product-card__footer">
        <div>
          <span className="price-label">Listed at</span>
          <strong>{formatCurrency(product.listPrice)}</strong>
        </div>
        {negotiationStatus ? (
          <span className="negotiable-badge">
            {negotiationStatus === "TERMS_ACCEPTED"
              ? "Terms accepted"
              : negotiationStatus === "CLOSED"
                ? "Closed"
                : "Negotiating"}
          </span>
        ) : (
          <button
            className="text-button"
            onClick={() => onNegotiate?.(product.id)}
            type="button"
          >
            Open negotiation
          </button>
        )}
      </div>
    </article>
  );
}
