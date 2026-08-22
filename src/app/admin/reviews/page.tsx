import Link from "next/link";
import { db } from "@/lib/db";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import { Badge } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Rating";
import { ReviewRowActions } from "./ReviewRowActions";

export const metadata = { title: "Reviews" };

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function ReviewsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const where = sp.status === "pending" ? { isApproved: false } : sp.status === "approved" ? { isApproved: true } : {};

  const reviews = await db.review.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { product: { select: { name: true, slug: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Reviews</h1>

      <StatusFilterSelect options={["pending", "approved"]} />

      <Table>
        <thead>
          <tr>
            <Th>Product</Th>
            <Th>Rating</Th>
            <Th>Review</Th>
            <Th>Customer</Th>
            <Th>Status</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {reviews.length === 0 && <EmptyRow colSpan={6}>No reviews found.</EmptyRow>}
          {reviews.map((r) => (
            <tr key={r.id}>
              <Td>
                <Link href={`/product/${r.product.slug}`} target="_blank" className="hover:underline">
                  {r.product.name}
                </Link>
              </Td>
              <Td>
                <Rating value={r.rating} />
              </Td>
              <Td className="max-w-xs">
                {r.title && <p className="font-medium">{r.title}</p>}
                <p className="line-clamp-2 text-ink-soft">{r.comment}</p>
              </Td>
              <Td>
                {r.customerName}
                {r.isVerifiedPurchase && <Badge tone="outline" className="ml-2">Verified</Badge>}
              </Td>
              <Td>
                <Badge tone={r.isApproved ? "success" : "outline"}>{r.isApproved ? "Approved" : "Pending"}</Badge>
              </Td>
              <Td className="text-right">
                <ReviewRowActions id={r.id} isApproved={r.isApproved} />
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
