"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Field, Input } from "@/components/admin/FormField";
import { SingleImageUploader } from "@/components/admin/ImageUploader";
import { Button } from "@/components/ui/Button";
import { updateStaffProfile } from "../actions";

type Initial = { name: string; phone: string; department: string; jobTitle: string; image: string | null };

export function EditStaffProfileForm({ userId, initial }: { userId: string; initial: Initial }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [department, setDepartment] = useState(initial.department);
  const [jobTitle, setJobTitle] = useState(initial.jobTitle);
  const [image, setImage] = useState<string | null>(initial.image);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await updateStaffProfile(userId, { name, phone, department, jobTitle, image });
      toast.success("Profile updated.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update profile.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <SingleImageUploader value={image} onChange={setImage} />
      <Field label="Name">
        <Input required value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Mobile Number">
        <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </Field>
      <Field label="Department">
        <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
      </Field>
      <Field label="Job Title">
        <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
      </Field>
      <Button type="submit" size="sm" variant="secondary" disabled={loading} className="self-start">
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
