import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <Container className="grid gap-10 py-10 lg:grid-cols-2 lg:gap-16">
      <Skeleton className="aspect-[4/5] w-full" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-6 h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="mt-6 h-40 w-full" />
      </div>
    </Container>
  );
}
