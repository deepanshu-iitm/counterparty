import { Marketplace } from "@/components/marketplace";
import { searchProducts } from "@/lib/catalog/service";

export default function Home() {
  const products = searchProducts({
    minimumRamGb: 32,
    sortBy: "value",
  });

  return <Marketplace products={products} />;
}
