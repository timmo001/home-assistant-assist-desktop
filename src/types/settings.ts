export interface HomeAssistantSettings {
  access_token?: string;
  host: string;
  port: number;
  ssl: boolean;
}

export interface Settings {
  home_assistant: HomeAssistantSettings;
}
