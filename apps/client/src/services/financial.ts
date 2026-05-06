import { requestJson } from "./httpClient";

export type FinancialTransactionType = "income" | "expense";
export type FinancialTransactionStatus = "pending" | "paid" | "canceled";

export type FinancialTransaction = {
  id: number;
  type: FinancialTransactionType;
  status: FinancialTransactionStatus;
  description: string;
  category: string;
  paymentMethod: string;
  amount: number;
  dueDate: string | null;
  paidAt: string | null;
  supplierId: number | null;
  serviceOrderId: number | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type FinancialTransactionPayload = {
  type: FinancialTransactionType;
  status?: FinancialTransactionStatus;
  description: string;
  category?: string;
  paymentMethod?: string;
  amount: number;
  dueDate?: string | null;
  paidAt?: string | null;
  supplierId?: number | null;
  serviceOrderId?: number | null;
  notes?: string;
};

export type FinancialSummary = {
  serviceOrderRevenue: number;
  manualIncome: number;
  pendingIncome: number;
  paidExpenses: number;
  pendingExpenses: number;
  balance: number;
  projectedBalance: number;
  serviceOrders: number;
  paidTransactions: number;
  pendingTransactions: number;
  categoryTotals: Array<{
    type: FinancialTransactionType;
    category: string;
    amount: number;
  }>;
};

export const listFinancialTransactionsApi = () =>
  requestJson<FinancialTransaction[]>("financial/transactions", { method: "GET" });

export const createFinancialTransactionApi = (body: FinancialTransactionPayload) =>
  requestJson<FinancialTransaction>("financial/transactions", {
    method: "POST",
    body,
  });

export const updateFinancialTransactionApi = (
  id: number,
  body: FinancialTransactionPayload,
) =>
  requestJson<FinancialTransaction>(`financial/transactions/${id}`, {
    method: "PUT",
    body,
  });

export const removeFinancialTransactionApi = (id: number) =>
  requestJson<void>(`financial/transactions/${id}`, { method: "DELETE" });

export const getFinancialSummaryApi = () =>
  requestJson<FinancialSummary>("financial/summary", { method: "GET" });
