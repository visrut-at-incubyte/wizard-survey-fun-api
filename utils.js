import crypto from "crypto";

export function createHash(data) {
  const sha256 = crypto.createHmac("sha256", process.env.SALT);
  const ipHash = sha256.update(data);
  const ipHashDigest = ipHash.digest("hex");
  return ipHashDigest;
}
