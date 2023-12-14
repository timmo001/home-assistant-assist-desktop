export interface HomeAssistantSettings {
  access_token?: string;
  host: string;
  port: number;
  ssl: boolean;
}

export interface Settings {
  autostart?: boolean;
  home_assistant: HomeAssistantSettings;
}
