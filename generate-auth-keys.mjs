import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

async function generateKeys() {
  const keys = await generateKeyPair("RS256", { extractable: true });
  const privateKey = await exportPKCS8(keys.privateKey);
  const publicKey = await exportJWK(keys.publicKey);
  const jwks = JSON.stringify({ keys: [{ use: "sig", ...publicKey }] });

  console.log(`JWT_PRIVATE_KEY="${privateKey.trimEnd().replace(/\n/g, " ")}"`);
  console.log(`JWKS=${jwks}`);
}

generateKeys().catch(console.error);