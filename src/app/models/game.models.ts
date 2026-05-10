export interface RoundStartedEvent {
  roundNumber: number;
  letter: string;
  timerDuration: number;
  serverTime: string; // ISO timestamp for client timer sync
}

export interface RoundStoppedEvent {
  callerNickname: string;
}

/** Client-side map of categoryId → submitted answer string (used during the answering phase). */
export type AnswerMap = { [categoryId: number]: string };

/** Per-answer validation metadata from the server's Phase 1 dictionary check. */
export interface AnswerValidation {
  answerId: number;
  categoryId: number;
  answer: string;
  /** null = not yet checked, true = auto-accepted, false = failed dict check */
  dictionaryValid: boolean | null;
  /** true = this answer should appear in the peer validation grid */
  requiresPeerReview: boolean;
}

export interface PlayerAnswers {
  userId: number;
  nickname: string;
  /** Updated: now carries full validation metadata per answer. */
  answers: AnswerValidation[];
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
  /** null if not yet checked; true = auto-accepted by dictionary. */
  dictionaryValid: boolean | null;
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
