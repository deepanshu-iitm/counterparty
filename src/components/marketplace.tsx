"use client";

import { useEffect, useRef, useState } from "react";
import type { Agreement } from "@/lib/agreements/types";
import {
  approveAgreement,
  commitAgreement,
  prepareAgreement,
  rejectAgreement,
} from "@/lib/agreements/service";
import type { ProductSearch, ProductWithSeller } from "@/lib/catalog/types";
import { searchProducts } from "@/lib/catalog/service";
import {
  startNegotiation,
  submitCounteroffer,
} from "@/lib/negotiation/engine";
import type {
  CounterofferInput,
  Negotiation,
} from "@/lib/negotiation/types";
import {
  recommendDeal,
  type DealPreference,
} from "@/lib/recommendation/service";
import {
  registerCounterpartyTools,
  type CounterpartyToolActions,
} from "@/webmcp/register";
import { ProductCard } from "./product-card";

type Activity = {
  id: number;
  actor: "AGENT" | "HUMAN" | "SYSTEM";
  action: string;
  detail: string;
  result: string;
  time: string;
};

const suggestedOffers: Record<string, CounterofferInput> = {
  "forgebook-pro": {
    price: 1_775,
    warrantyMonths: 24,
    shippingDays: 5,
  },
  "nova-slate-x": {
    price: 1_795,
    warrantyMonths: 24,
    shippingDays: 3,
  },
  "gearframe-16": {
    price: 1_730,
    warrantyMonths: 6,
    shippingDays: 2,
  },
};

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const now = () =>
  new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());

export function Marketplace({ products }: { products: ProductWithSeller[] }) {
  const [negotiations, setNegotiations] = useState<Record<string, Negotiation>>(
    {},
  );
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [preference, setPreference] = useState<DealPreference>("value");
  const [webMcpStatus, setWebMcpStatus] = useState<
    "checking" | "ready" | "unsupported"
  >("checking");
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: 1,
      actor: "SYSTEM",
      action: "Marketplace ready",
      detail: "Deterministic seller policies loaded.",
      result: "3 counterparties online",
      time: now(),
    },
  ]);

  const negotiationsRef = useRef(negotiations);
  const agreementRef = useRef(agreement);
  const preferenceRef = useRef(preference);
  const activityIdRef = useRef(1);
  const actionsRef = useRef<CounterpartyToolActions | null>(null);

  const recordActivity = (
    actor: Activity["actor"],
    action: string,
    detail: string,
    result: string,
  ) => {
    activityIdRef.current += 1;
    const event: Activity = {
      id: activityIdRef.current,
      actor,
      action,
      detail,
      result,
      time: now(),
    };
    setActivities((current) => [event, ...current].slice(0, 12));
  };

  const saveNegotiation = (negotiation: Negotiation) => {
    const next = {
      ...negotiationsRef.current,
      [negotiation.id]: negotiation,
    };
    negotiationsRef.current = next;
    setNegotiations(next);
  };

  const toolActions: CounterpartyToolActions = {
    searchProducts: (input: ProductSearch) => {
      const matches = searchProducts(input);
      recordActivity(
        "AGENT",
        "search_products",
        `${input.minimumRamGb ?? "Any"} GB+ · ${input.maxPrice ? `under ${money(input.maxPrice)}` : "any budget"}`,
        `${matches.length} qualified products`,
      );
      return {
        count: matches.length,
        products: matches,
        humanPreference: preferenceRef.current,
      };
    },
    startNegotiation: (productId) => {
      const existing = Object.values(negotiationsRef.current).find(
        (item) => item.productId === productId && item.status !== "CLOSED",
      );
      const negotiation = existing ?? startNegotiation(productId);
      saveNegotiation(negotiation);
      const product = products.find((item) => item.id === productId);
      recordActivity(
        "AGENT",
        "start_negotiation",
        product?.seller.name ?? productId,
        existing ? "Existing negotiation returned" : "Seller opened terms",
      );
      return {
        negotiation,
        note: existing
          ? "An active negotiation already exists for this product."
          : "Negotiation opened. No inventory is reserved.",
      };
    },
    submitCounteroffer: (negotiationId, offer) => {
      const negotiation = negotiationsRef.current[negotiationId];
      if (!negotiation) {
        throw new Error(`Unknown negotiation: ${negotiationId}`);
      }
      const result = submitCounteroffer(negotiation, offer);
      saveNegotiation(result.negotiation);
      recordActivity(
        "AGENT",
        "submit_counteroffer",
        `${money(offer.price)} · ${offer.warrantyMonths}mo warranty`,
        result.outcome === "ACCEPTED"
          ? "Terms accepted"
          : result.outcome === "COUNTERED"
            ? `Seller countered ${money(result.negotiation.currentOffer.price)}`
            : "Negotiation closed",
      );
      return result;
    },
    getNegotiations: () => {
      const active = Object.values(negotiationsRef.current);
      const recommendation = recommendDeal(
        active,
        products,
        preferenceRef.current,
      );
      recordActivity(
        "AGENT",
        "get_negotiations",
        `Human preference: ${preferenceRef.current}`,
        `${active.length} negotiations compared`,
      );
      return {
        humanPreference: preferenceRef.current,
        negotiations: active,
        recommendation,
        instruction:
          "Respect the current human preference when recommending an offer.",
      };
    },
    prepareAgreement: (negotiationId) => {
      const negotiation = negotiationsRef.current[negotiationId];
      if (!negotiation) {
        throw new Error(`Unknown negotiation: ${negotiationId}`);
      }
      const nextAgreement = prepareAgreement(negotiation);
      agreementRef.current = nextAgreement;
      setAgreement(nextAgreement);
      recordActivity(
        "AGENT",
        "prepare_agreement",
        negotiationId,
        "Waiting for human approval",
      );
      return {
        agreement: nextAgreement,
        instruction:
          "Stop here. Ask the human to review and approve these exact terms in the UI.",
      };
    },
    commitAgreement: (agreementId) => {
      const currentAgreement = agreementRef.current;
      if (!currentAgreement || currentAgreement.id !== agreementId) {
        throw new Error(`Unknown agreement: ${agreementId}`);
      }
      const negotiation =
        negotiationsRef.current[currentAgreement.negotiationId];
      if (!negotiation) {
        throw new Error("The source negotiation is unavailable");
      }
      const result = commitAgreement(currentAgreement, negotiation);
      agreementRef.current = result.agreement;
      setAgreement(result.agreement);
      recordActivity(
        result.success ? "AGENT" : "SYSTEM",
        "commit_agreement",
        agreementId,
        result.success ? result.transactionId : result.error,
      );
      return result;
    },
  };

  useEffect(() => {
    actionsRef.current = toolActions;
  });

  useEffect(() => {
    const controller = new AbortController();
    const proxyActions: CounterpartyToolActions = {
      searchProducts: (input) => actionsRef.current?.searchProducts(input),
      startNegotiation: (productId) =>
        actionsRef.current?.startNegotiation(productId),
      submitCounteroffer: (negotiationId, offer) =>
        actionsRef.current?.submitCounteroffer(negotiationId, offer),
      getNegotiations: () => actionsRef.current?.getNegotiations(),
      prepareAgreement: (negotiationId) =>
        actionsRef.current?.prepareAgreement(negotiationId),
      commitAgreement: (agreementId) =>
        actionsRef.current?.commitAgreement(agreementId),
    };

    registerCounterpartyTools(proxyActions, controller.signal)
      .then(({ supported }) =>
        setWebMcpStatus(supported ? "ready" : "unsupported"),
      )
      .catch(() => setWebMcpStatus("unsupported"));

    return () => controller.abort();
  }, []);

  const activeNegotiations = Object.values(negotiations);
  const productById = new Map(products.map((product) => [product.id, product]));
  const recommendation = recommendDeal(
    activeNegotiations,
    products,
    preference,
  );

  const selectPreference = (nextPreference: DealPreference) => {
    preferenceRef.current = nextPreference;
    setPreference(nextPreference);
    recordActivity(
      "HUMAN",
      "Preference changed",
      nextPreference,
      "Agent should reevaluate active offers",
    );
  };

  const approve = () => {
    if (!agreement) return;
    const approved = approveAgreement(agreement);
    agreementRef.current = approved;
    setAgreement(approved);
    recordActivity(
      "HUMAN",
      "Agreement approved",
      agreement.id,
      "Agent may now commit exact terms",
    );
  };

  const reject = () => {
    if (!agreement) return;
    const rejected = rejectAgreement(agreement);
    agreementRef.current = rejected;
    setAgreement(rejected);
    recordActivity("HUMAN", "Agreement rejected", agreement.id, "Deal stopped");
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Counterparty home">
          <span className="brand-mark">C</span>
          <span>Counterparty</span>
        </a>
        <div className="topbar__center">Agent-native negotiation protocol</div>
        <div className="connection-status">
          <span
            className={`connection-dot connection-dot--${webMcpStatus}`}
          />
          {webMcpStatus === "ready"
            ? "6 WebMCP tools ready"
            : webMcpStatus === "checking"
              ? "Connecting WebMCP"
              : "Browser preview"}
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
              <span className="brief__status">Live</span>
            </div>
            <p>Development laptop</p>
            <ul>
              <li>Budget up to $1,800</li>
              <li>At least 32 GB memory</li>
              <li>Strong warranty preferred</li>
            </ul>
          </div>

          <div>
            <p className="section-label">What matters now</p>
            <div className="preference-control" role="group" aria-label="Deal preference">
              {(["value", "warranty", "delivery"] as const).map((item) => (
                <button
                  className={preference === item ? "is-active" : ""}
                  key={item}
                  onClick={() => selectPreference(item)}
                  type="button"
                >
                  {item === "value"
                    ? "Best value"
                    : item === "warranty"
                      ? "Warranty"
                      : "Fast delivery"}
                </button>
              ))}
            </div>
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
              <p className="section-label">
                {activeNegotiations.length ? "Negotiation desk" : "Qualified matches"}
              </p>
              <h2>
                {activeNegotiations.length
                  ? `${activeNegotiations.length} live conversations`
                  : "Three counterparties, three strategies"}
              </h2>
            </div>
            <span className="result-count">{products.length} live offers</span>
          </div>

          {activeNegotiations.length > 0 && (
            <div className="negotiation-board">
              {recommendation && (
                <div className="recommendation">
                  <span className="recommendation__label">
                    Recommended for {preference}
                  </span>
                  <div>
                    <strong>{recommendation.product.name}</strong>
                    <p>{recommendation.reason}</p>
                  </div>
                  <span className="recommendation__price">
                    {money(recommendation.negotiation.currentOffer.price)}
                  </span>
                </div>
              )}
              {activeNegotiations.map((negotiation) => {
                const product = productById.get(negotiation.productId);
                if (!product) return null;
                const offer = negotiation.currentOffer;

                return (
                  <article className="negotiation-card" key={negotiation.id}>
                    <div className="negotiation-card__heading">
                      <div>
                        <span>{product.seller.name}</span>
                        <h3>{product.name}</h3>
                      </div>
                      <span className={`status-chip status-chip--${negotiation.status.toLowerCase()}`}>
                        {negotiation.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="offer-terms">
                      <div><span>Price</span><strong>{money(offer.price)}</strong></div>
                      <div><span>Warranty</span><strong>{offer.warrantyMonths} mo</strong></div>
                      <div><span>Delivery</span><strong>{offer.shippingDays} days</strong></div>
                    </div>
                    <div className="negotiation-card__footer">
                      <span>{negotiation.roundsRemaining} rounds remaining</span>
                      {negotiation.status === "NEGOTIATING" && (
                        <button
                          className="text-button"
                          onClick={() =>
                            toolActions.submitCounteroffer(
                              negotiation.id,
                              suggestedOffers[negotiation.productId],
                            )
                          }
                          type="button"
                        >
                          Propose target terms
                        </button>
                      )}
                      {negotiation.status === "TERMS_ACCEPTED" && (
                        <button
                          className="primary-button"
                          onClick={() =>
                            toolActions.prepareAgreement(negotiation.id)
                          }
                          type="button"
                        >
                          Prepare agreement
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="product-list">
            {products.map((product, index) => {
              const negotiation = activeNegotiations.find(
                (item) => item.productId === product.id,
              );
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  featured={index === 0}
                  negotiationStatus={negotiation?.status}
                  onNegotiate={(productId) =>
                    toolActions.startNegotiation(productId)
                  }
                />
              );
            })}
          </div>

          {agreement && (
            <section className={`approval-panel approval-panel--${agreement.status.toLowerCase()}`}>
              <div>
                <p className="section-label">Human decision required</p>
                <h2>
                  {agreement.status === "COMMITTED"
                    ? "Agreement committed"
                    : agreement.status === "REJECTED"
                      ? "Agreement rejected"
                      : "Review exact terms"}
                </h2>
                <p className="approval-panel__id">{agreement.id} · {agreement.termsHash}</p>
              </div>
              <div className="approval-terms">
                <strong>{money(agreement.terms.price)}</strong>
                <span>{agreement.terms.warrantyMonths}-month warranty</span>
                <span>{agreement.terms.shippingDays}-day delivery</span>
              </div>
              {agreement.status === "AWAITING_HUMAN_APPROVAL" && (
                <div className="approval-actions">
                  <button className="secondary-button" onClick={reject} type="button">
                    Reject
                  </button>
                  <button className="primary-button" onClick={approve} type="button">
                    Approve exact terms
                  </button>
                </div>
              )}
              {agreement.status === "APPROVED" && (
                <div className="approval-state">
                  Approved. The agent may now call <code>commit_agreement</code>.
                </div>
              )}
              {agreement.status === "COMMITTED" && (
                <div className="approval-state">
                  Receipt <strong>{agreement.transactionId}</strong>
                </div>
              )}
            </section>
          )}
        </section>

        <aside className="activity-panel">
          <div className="activity-panel__header">
            <div>
              <p className="section-label">Agent activity</p>
              <h2>Auditable trail</h2>
            </div>
            <span className="live-indicator">Live</span>
          </div>

          <div className="timeline">
            {activities.map((activity, index) => (
              <div
                className={`timeline-item${index === 0 ? " timeline-item--active" : " timeline-item--complete"}`}
                key={activity.id}
              >
                <span className="timeline-item__marker" />
                <div>
                  <span className="timeline-item__time">
                    {activity.time} · {activity.actor}
                  </span>
                  <strong>{activity.action}</strong>
                  <p>{activity.detail}</p>
                  <span className="timeline-item__result">→ {activity.result}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="agent-callout">
            <span>Suggested prompt</span>
            <p>
              “Find a development laptop under $1,800. Negotiate with the
              strongest options, but don&apos;t finalize without me.”
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
