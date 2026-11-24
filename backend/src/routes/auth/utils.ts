export const getCleanUser = (user: any) => ({
  id: user.id,
  email: user.email,
  displayName: user.displayName,
  avatarUrl: user.avatarUrl,
  emailVerified: user.emailVerified,
  role: user.role,
  subscriptionTier: user.subscriptionTier,
  createdAt: user.createdAt,
});

export const handleValidation = (result: any, c: any) => {
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const field = firstIssue?.path?.join('.') || 'input';
    const message = firstIssue?.message || 'Invalid input';
    const errorMessage = `${field}: ${message}`;
    return c.json({ error: errorMessage }, 400);
  }
};
