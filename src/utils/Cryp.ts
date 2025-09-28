import CryptoJS from "crypto-js";

const SECRET_KEY = process.env.CRYPTO_SECRET;

// Encriptar texto
export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
}

// Desencriptar texto
export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}