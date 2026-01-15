/**
 * Home Assistant connection settings
 */
export interface HomeAssistantSettings {
  /**
   * Full URL to Home Assistant instance (e.g., "https://homeassistant.local:8123")
   */
  url: string;
  
  /**
   * Long-lived access token for authentication
   */
  access_token?: string;
  
  /**
   * Whether to use SSL/TLS
   */
  ssl: boolean;
}

/**
 * Application settings
 */
export interface Settings {
  /**
   * Whether to start the application on system startup
   */
  autostart?: boolean;
  
  /**
   * Home Assistant connection preferences
   */
  home_assistant: HomeAssistantSettings;
}
