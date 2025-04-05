// Simplified user model that doesn't rely on a database
// Uses hardcoded admin user instead

const adminUser = {
  username: 'admin',
  password: 'admin',  // In a real app, this would be hashed
  role: 'admin'
};

module.exports = {
  findByUsername: (username) => {
    if (username === adminUser.username) {
      return { ...adminUser };
    }
    return null;
  },
  
  validatePassword: (user, password) => {
    if (!user) return false;
    return user.password === password;
  }
};
