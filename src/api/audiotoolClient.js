export const audiotool = {
  auth: {
    loginViaEmailPassword: async (email, password) => {
      // Dummy implementation – replace with real API call if needed
      console.log(`Logging in via email/password: ${email}`);
      return { user: { email } };
    },
    register: async ({ email, password }) => {
      console.log(`Registering user: ${email}`);
      return { user: { email } };
    },
    verifyOtp: async ({ email, otpCode }) => {
      console.log(`Verifying OTP for ${email}: ${otpCode}`);
      // Return a dummy access token
      return { access_token: "dummy-access-token" };
    },
    resetPasswordRequest: async (email) => {
      console.log(`Reset password request for ${email}`);
      return {};
    },
    resetPassword: async ({ resetToken, newPassword }) => {
      console.log(`Resetting password with token ${resetToken}`);
      return {};
    },
    loginWithProvider: (provider, redirectUrl) => {
      // Redirect to a generic OAuth endpoint – replace with real logic
      window.location.href = `/auth/${provider}?redirect=${encodeURIComponent(redirectUrl)}`;
    },
    logout: () => {
      localStorage.removeItem("audiotool_access_token");
      console.log("Logged out");
    },
    setToken: (token) => {
      localStorage.setItem("audiotool_access_token", token);
      console.log(`Token set: ${token}`);
    }
  }
};
