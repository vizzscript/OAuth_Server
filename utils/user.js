const getUserId = (req) => {
  return req.user?.id || req.headers['x-user-id'] || process.env.DEFAULT_USER_ID || 'default_user_id';
};

module.exports = { getUserId };
