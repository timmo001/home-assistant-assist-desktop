export enum AssistResponseType {
  Assist = "assist",
  Error = "error",
  User = "user",
}

export interface AssistResponse {
  type: AssistResponseType;
  text: string;
}
