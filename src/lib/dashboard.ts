import request from "./request";

export interface CurrentUser {
  id: number;
  email: string;
  name: string;
}

export const dashboardApi = {
  /** 获取当前登录用户信息 */
  getCurrentUser: async (): Promise<CurrentUser> => {
    return request.get("/api/current_user");
  },

  /** 更新当前用户资料 */
  updateProfile: async (data: {
    name?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<CurrentUser> => {
    return request.put("/api/current_user", data);
  },

  /** 获取 AI 智能财务建议 */
  getSuggestion: async (): Promise<string> => {
    const result = await request.get("/api/aichat/suggestions");
    return result?.suggestions || "暂无建议";
  },
};
