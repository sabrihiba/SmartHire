export const formatDate = (date: Date): string => {
  return date.toLocaleDateString();
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Removes undefined fields from an object to make it compatible with Firestore
 * Firestore doesn't accept undefined values - fields should either be omitted or have a value
 */
export function removeUndefinedFields(obj: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
}
