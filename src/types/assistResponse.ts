export enum AssistResponseType {
  Assist = "assist",
  User = "user",
}

export interface AssistResponse {
  type: AssistResponseType;
  text: string;
}
