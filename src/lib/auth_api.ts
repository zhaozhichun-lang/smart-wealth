import request from "./request";

export const authApi = {
  // 注册用户
  register: (data: { email: string; password: string; name?: string }) => {
    return request.post("/api/register", data);
  },

  // 登录
  login: async (data: { email: string; password: string }) => {
    return request.post("/api/login", data);
  },
};
