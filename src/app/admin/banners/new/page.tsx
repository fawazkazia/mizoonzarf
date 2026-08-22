import { BannerForm } from "../BannerForm";

export const metadata = { title: "Add Banner" };

export default function NewBannerPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Add Banner</h1>
      <BannerForm />
    </div>
  );
}
