import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";

function getSecret(): Uint8Array {
  return new TextEncoder().encode(env.JWT_SECRET);
}

export async function createToken(payload: { sub: string }) {
  const secret = getSecret();
  const jwt = new SignJWT(payload);
  const token = await jwt
    .setProtectedHeader({ alg: env.JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(env.TOKEN_EXPIRES_IN)
    .sign(secret);

  return token;
}

export async function verifyToken(token: string) {
  const secret = getSecret();
  const { payload } = await jwtVerify(token, secret);
  return payload;
}
