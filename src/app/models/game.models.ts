export interface RoundStartedEvent {
  roundNumber: number;
  letter: string;
  timerDuration: number;
  serverTime: string; // ISO timestamp for client timer sync
}

export interface RoundStoppedEvent {
  callerNickname: string;
}

export interface AnswerMap {
  [categoryId: number]: string;
}
