export interface UserData {
  username: string;
  loginTime: number;
  role: 'admin' | 'limited';
}

export const AUTH_CONFIG = {
  SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  STORAGE_KEYS: {
    USER_DATA: 'user_data',
    LOGIN_TIME: 'login_time'
  }
};

export const authUtils = {
  // Check if user is authenticated and session is valid
  isAuthenticated(): boolean {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return false;
    }
    
    const userData = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.USER_DATA);
    const loginTime = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.LOGIN_TIME);
    
    if (!userData || !loginTime) {
      return false;
    }

    const currentTime = new Date().getTime();
    const loginTimestamp = parseInt(loginTime);
    
    // Check if session has expired
    if (currentTime - loginTimestamp > AUTH_CONFIG.SESSION_DURATION) {
      this.logout();
      return false;
    }

    return true;
  },

  // Get current user data
  getCurrentUser(): UserData | null {
    if (!this.isAuthenticated()) {
      return null;
    }

    const userData = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.USER_DATA);
    if (!userData) {
      return null;
    }

    try {
      return JSON.parse(userData);
    } catch {
      this.logout();
      return null;
    }
  },

  // Login user and store session data
  login(username: string, role: 'admin' | 'limited' = 'admin'): void {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    
    const userData: UserData = {
      username,
      loginTime: new Date().getTime(),
      role
    };

    localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.LOGIN_TIME, userData.loginTime.toString());
  },

  // Logout user and clear session data
  logout(): void {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    
    localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.USER_DATA);
    localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.LOGIN_TIME);
  },

  // Get remaining session time in milliseconds
  getRemainingSessionTime(): number {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return 0;
    }
    
    const loginTime = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.LOGIN_TIME);
    if (!loginTime) {
      return 0;
    }

    const currentTime = new Date().getTime();
    const loginTimestamp = parseInt(loginTime);
    const elapsed = currentTime - loginTimestamp;
    const remaining = AUTH_CONFIG.SESSION_DURATION - elapsed;

    return Math.max(0, remaining);
  },

  // Check if session will expire soon (within 5 minutes)
  isSessionExpiringSoon(): boolean {
    const remaining = this.getRemainingSessionTime();
    const fiveMinutes = 5 * 60 * 1000;
    return remaining > 0 && remaining <= fiveMinutes;
  },

  // Check if current user has admin role
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  },

  // Check if current user has limited role
  isLimited(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'limited';
  },

  // Check if user has permission for specific action
  hasPermission(action: 'add' | 'edit' | 'delete' | 'edit_attendance'): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    if (user.role === 'admin') return true;
    
    // Limited user can only edit attendance status
    if (user.role === 'limited' && action === 'edit_attendance') return true;
    
    return false;
  }
};