export function isAdmin(user: any): boolean {
  if (!user || !user.email) return false;
  
  const adminEmailsStr = process.env.NEXT_PUBLIC_ADMIN_EMAILS || "keshvicrafts@gmail.com";
  const adminEmails = adminEmailsStr.split(',').map(e => e.trim().toLowerCase());
  
  return adminEmails.includes(user.email.toLowerCase());
}
