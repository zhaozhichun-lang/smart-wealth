import request from "./request";

export interface GoalCreateData {
  title: string;
  target_amount: number;
  current_amount?: number;
  deadline?: string;
}

export interface GoalUpdateData {
  title?: string;
  target_amount?: number;
  current_amount?: number;
  deadline?: string;
}

export const goalApi = {
  // 目标列表（分页）
  list: async (page = 1, limit = 12) => {
    return request.get(`/api/goals?page=${page}&limit=${limit}`);
  },

  // 新增目标
  create: async (data: GoalCreateData) => {
    return request.post("/api/goals", data);
  },

  // 更新目标
  update: async (id: number, data: GoalUpdateData) => {
    return request.put(`/api/goals/${id}`, data);
  },

  // 删除目标
  delete: async (id: number) => {
    return request.delete(`/api/goals/${id}`);
  },
};
