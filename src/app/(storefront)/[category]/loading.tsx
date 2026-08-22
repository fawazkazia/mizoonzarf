import { Container } from "@/components/ui/Container";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <Container className="py-10">
      <ProductGridSkeleton count={12} />
    </Container>
  );
}
