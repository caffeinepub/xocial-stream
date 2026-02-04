/**
 * Utility for managing persistent admin session in local storage
 * Enhanced with force reactivation capabilities
 */

const ADMIN_PRINCIPAL_KEY = 'xocial_stream_admin_principal';
const ADMIN_SESSION_VERSION_KEY = 'xocial_stream_admin_session_version';
const CURRENT_SESSION_VERSION = '2'; // Increment to force revalidation

export const adminSession = {
  /**
   * Store the verified admin principal in local storage
   */
  setAdminPrincipal(principal: string): void {
    try {
      localStorage.setItem(ADMIN_PRINCIPAL_KEY, principal);
      localStorage.setItem(ADMIN_SESSION_VERSION_KEY, CURRENT_SESSION_VERSION);
    } catch (error) {
      console.error('Failed to store admin principal:', error);
    }
  },

  /**
   * Get the stored admin principal from local storage
   */
  getAdminPrincipal(): string | null {
    try {
      return localStorage.getItem(ADMIN_PRINCIPAL_KEY);
    } catch (error) {
      console.error('Failed to retrieve admin principal:', error);
      return null;
    }
  },

  /**
   * Check if the current principal matches the stored admin principal
   * Also validates session version to ensure compatibility
   */
  isStoredAdmin(currentPrincipal: string): boolean {
    const storedPrincipal = this.getAdminPrincipal();
    const sessionVersion = this.getSessionVersion();
    
    // If session version doesn't match, clear stale data and return false
    if (sessionVersion !== CURRENT_SESSION_VERSION) {
      this.clearAdminPrincipal();
      return false;
    }
    
    return storedPrincipal !== null && storedPrincipal === currentPrincipal;
  },

  /**
   * Clear the stored admin principal (on logout or reactivation)
   */
  clearAdminPrincipal(): void {
    try {
      localStorage.removeItem(ADMIN_PRINCIPAL_KEY);
      localStorage.removeItem(ADMIN_SESSION_VERSION_KEY);
    } catch (error) {
      console.error('Failed to clear admin principal:', error);
    }
  },

  /**
   * Check if there is any stored admin principal
   */
  hasStoredAdmin(): boolean {
    return this.getAdminPrincipal() !== null;
  },

  /**
   * Get the current session version
   */
  getSessionVersion(): string | null {
    try {
      return localStorage.getItem(ADMIN_SESSION_VERSION_KEY);
    } catch (error) {
      console.error('Failed to retrieve session version:', error);
      return null;
    }
  },

  /**
   * Force reactivation of admin session
   * Clears stale data and prepares for fresh backend verification
   */
  forceReactivation(): void {
    this.clearAdminPrincipal();
    console.log('Admin session cleared for reactivation');
  },

  /**
   * Check if session needs revalidation
   */
  needsRevalidation(): boolean {
    const sessionVersion = this.getSessionVersion();
    return sessionVersion !== CURRENT_SESSION_VERSION;
  },
};
