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
  accessToken: string;
  
  /**
   * Selected pipeline ID for voice assistant
   */
  selectedPipelineId?: string;
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
