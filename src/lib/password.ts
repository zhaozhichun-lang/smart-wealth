import bcrypt from "bcryptjs";

// 注册时把明文密码加密成不可逆的哈希值
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

// 登录时验证用户输入的明文密码，和数据库里的哈希值是否匹配
export async function comparePassword(
  password: string,
  hashedPassword: string,
) {
  return bcrypt.compare(password, hashedPassword);
}
