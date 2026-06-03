export function isAdmin(user: any): boolean {
  if (!user || !user.email) return false;
  
  // Use server-side ADMIN_EMAILS environment variable to prevent leakage to the browser.
  // Falls back to the public business email which is safe to expose on the client.
  const adminEmailsStr = process.env.ADMIN_EMAILS || "keshvicrafts@gmail.com";
  const adminEmails = adminEmailsStr.split(',').map(e => e.trim().toLowerCase());
  
  return adminEmails.includes(user.email.toLowerCase());
}
