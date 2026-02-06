// Bypass authentication for testing
export const authenticate = async (req, res, next) => {
  // Bypass authentication for testing
  req.user = {
    _id: 'test-user-id',
    email: 'm@gmail.com',
    role: 'admin'
  };
  next();
};