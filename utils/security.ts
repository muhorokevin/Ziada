/**
 * Simple obfuscation for local storage data. 
 * In a real-world enterprise app, we would use Web Crypto API with a PBKDF2 derived key.
 * This provides a layer of protection against casual inspection.
 */
const SALT = "Akiba_Kenya_254";

export const encryptData = (data: any): string => {
  const json = JSON.stringify(data);
  return btoa(json.split('').map((char, i) => 
    String.fromCharCode(char.charCodeAt(0) ^ SALT.charCodeAt(i % SALT.length))
  ).join(''));
};

export const decryptData = (encoded: string): any => {
  try {
    const decoded = atob(encoded);
    const decrypted = decoded.split('').map((char, i) => 
      String.fromCharCode(char.charCodeAt(0) ^ SALT.charCodeAt(i % SALT.length))
    ).join('');
    return JSON.parse(decrypted);
  } catch (e) {
    console.warn("Security Error: Data integrity compromised or missing.");
    return null;
  }
};