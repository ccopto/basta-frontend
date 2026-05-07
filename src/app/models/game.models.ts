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

export interface PlayerAnswers {
  userId: number;
  nickname: string;
  answers: AnswerMap;
}

export interface ScoringData {
  players: PlayerAnswers[];
}


export interface AnswerScore {
  categoryId: number;
  answer: string;
  isValid: boolean;
  points: number;
  isUnique: boolean;
}

export interface PlayerScore {
  userId: number;
  nickname: string;
  roundScore: number;
  cumulativeScore: number;
  answers: AnswerScore[];
}

export interface LeaderboardPlayer {
  userId: number;
  nickname: string;
  cumulativeScore: number;
  rank: number;
}

export interface LeaderboardDto {
  reason: string;
  players: LeaderboardPlayer[];
}

