import request from "./request";

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const transactionApi = {
  // 交易列表（分页）
  list: async (page = 1, limit = 20): Promise<PaginatedResponse<any>> => {
    return request.get(`/api/transactions?page=${page}&limit=${limit}`);
  },

  // 新增交易
  create: async (data: {
    type: "income" | "expense";
    category: string;
    amount: number;
    date?: string;
    description?: string;
    source?: string;
  }) => {
    return request.post("/api/transactions", data);
  },

  // 更新交易
  update: async (
    id: number,
    data: {
      type?: "income" | "expense";
      category?: string;
      amount?: number;
      date?: string;
      description?: string;
      source?: string;
    },
  ) => {
    return request.put(`/api/transactions/${id}`, data);
  },

  // 删除交易
  delete: async (id: number) => {
    return request.delete(`/api/transactions/${id}`);
  },
};
