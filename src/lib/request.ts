// 请求地址 ： 基础地址 + 接口路径
// 请求方式 ： POST  GET  PUT  DELETE
// 请求数据 ？： 表单数据
// 请求头 ：  token , json 格式
// 获取token 以及 清除token

// 获取token
const getToken = () => {
  // 浏览器检查 ：是否在浏览器环境中
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

// 存储 token
export function setToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
  }
}

// 401 清除过期 token 并跳转登录页
export function clearAuth() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("loginInfo");
    window.location.href = "/";
  }
}

// 封装一个公共请求函数
// endpoint ： 接口路径
// method ： 请求方式
// data ： 请求数据 ？： 表单数据
// 返回值 ： 响应数据
const baseRequest = async (endpoint: string, method: string, data?: any) => {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    headers,
    method,
  };

  if (data && (method === "POST" || method === "PUT")) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(endpoint, config);

  // 统一请求失败处理
  if (!response.ok) {
    if (response.status === 401) {
      clearAuth();
    }

    let detail = response.statusText || "Unknown error";
    try {
      const errBody = await response.json();
      if (errBody?.message) {
        detail = errBody.message;
      } else if (errBody?.detail) {
        detail = errBody.detail;
      }
    } catch {
      // 响应体不是 JSON，使用 statusText
    }

    throw new Error(detail);
  }

  // 统一请求成功处理
  const result = await response.json();

  // 防御性检查：后端可能在 HTTP 200 的 body 中返回业务错误状态码
  if (result && typeof result.status === "number" && result.status >= 400) {
    if (result.status === 401) {
      clearAuth();
    }
    throw new Error(result.message || result.detail || "请求失败");
  }

  return result;
};

export async function postRequest(endpoint: string, data?: any) {
  return baseRequest(endpoint, "POST", data);
}

async function putRequest(endpoint: string, data?: any) {
  return baseRequest(endpoint, "PUT", data);
}

async function deleteRequest(endpoint: string) {
  return baseRequest(endpoint, "DELETE");
}

async function getRequest(endpoint: string) {
  return baseRequest(endpoint, "GET");
}

const request = {
  post: postRequest,
  put: putRequest,
  delete: deleteRequest,
  get: getRequest,
};

export default request;
