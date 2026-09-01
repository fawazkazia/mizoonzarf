"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Fieldset } from "@/components/admin/FormField";
import { updateCustomerDetails, updateCustomerAddress } from "../actions";

export interface EditableCustomer {
  id: string;
  name: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
}

export interface EditableAddress {
  id: string | null;
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export function EditCustomerModal({ customer, address }: { customer: EditableCustomer; address: EditableAddress }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(customer.name ?? "");
  const [phone, setPhone] = useState(customer.phone ?? "");
  const [dob, setDob] = useState(customer.dateOfBirth ?? "");
  const [gender, setGender] = useState(customer.gender ?? "");

  const [fullName, setFullName] = useState(address.fullName);
  const [addrPhone, setAddrPhone] = useState(address.phone);
  const [line1, setLine1] = useState(address.line1);
  const [line2, setLine2] = useState(address.line2);
  const [city, setCity] = useState(address.city);
  const [state, setState] = useState(address.state);
  const [postalCode, setPostalCode] = useState(address.postalCode);
  const [country, setCountry] = useState(address.country || "IN");

  async function handleSave() {
    setLoading(true);
    try {
      await updateCustomerDetails(customer.id, { name, phone, dateOfBirth: dob, gender });
      if (fullName && line1 && city && country) {
        await updateCustomerAddress(customer.id, address.id, {
          fullName,
          phone: addrPhone || phone,
          line1,
          line2,
          city,
          state,
          postalCode,
          country,
        });
      }
      toast.success("Customer updated.");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save changes.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        Edit Customer
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} ariaLabel="Edit customer" panelClassName="p-6">
        <h2 className="mb-4 font-display text-xl">Edit Customer</h2>
        <div className="flex flex-col gap-4">
          <Fieldset title="Personal Details">
            <Field label="Full Name">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Mobile Number">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field label="Date of Birth">
              <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
            </Field>
            <Field label="Gender">
              <Select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">Not specified</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </Select>
            </Field>
          </Fieldset>

          <Fieldset title="Address">
            <Field label="Full Name">
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={addrPhone} onChange={(e) => setAddrPhone(e.target.value)} />
            </Field>
            <Field label="House/Flat, Street">
              <Input value={line1} onChange={(e) => setLine1(e.target.value)} />
            </Field>
            <Field label="Area / Landmark">
              <Input value={line2} onChange={(e) => setLine2(e.target.value)} />
            </Field>
            <Field label="City">
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </Field>
            <Field label="State">
              <Input value={state} onChange={(e) => setState(e.target.value)} />
            </Field>
            <Field label="PIN / ZIP">
              <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
            </Field>
            <Field label="Country">
              <Input value={country} onChange={(e) => setCountry(e.target.value)} />
            </Field>
          </Fieldset>

          <div className="flex justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
