export interface HomeAssistantSettings {
  access_token?: string;
  host: string;
  port: number;
  ssl: boolean;
}

export interface TraySettings {
  double_click_action: string;
}

export interface Settings {
  autostart?: boolean;
  home_assistant: HomeAssistantSettings;
  tray: TraySettings;
}
