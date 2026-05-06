import { requestJson } from "./httpClient";

export type SupplierStatus = "active" | "inactive";

export type Supplier = {
  id: number;
  name: string;
  document: string;
  contactName: string;
  phone: string;
  email: string;
  category: string;
  address: string;
  notes: string;
  status: SupplierStatus;
  createdAt: string;
  updatedAt: string;
};

export type SupplierPayload = {
  name: string;
  document?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  category?: string;
  address?: string;
  notes?: string;
  status?: SupplierStatus;
};

export const listSuppliersApi = () =>
  requestJson<Supplier[]>("suppliers", { method: "GET" });

export const createSupplierApi = (body: SupplierPayload) =>
  requestJson<Supplier>("suppliers", { method: "POST", body });

export const updateSupplierApi = (id: number, body: SupplierPayload) =>
  requestJson<Supplier>(`suppliers/${id}`, { method: "PUT", body });

export const removeSupplierApi = (id: number) =>
  requestJson<void>(`suppliers/${id}`, { method: "DELETE" });
