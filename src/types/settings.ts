export interface Settings {
  homeAssistant: HomeAssistantConfig;
}

export interface HomeAssistantConfig {
  accessToken?: string;
  url?: string;
}
