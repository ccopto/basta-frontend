export interface JoinGameRequest {
  nickname: string;
  preferredLanguage: string;
}

export interface JoinGameResponse {
  gameCode: string;
  userId: number;
}

export interface PlayerDto {
  userId: number;
  nickname: string;
  isHost: boolean;
  isOnline: boolean;
  totalScore: number;
}

export interface LobbySnapshot {
  gameCode: string;
  targetScore: number;
  timerDuration: number;
  language: string;
  state: string;
  players: PlayerDto[];
}

export interface CategoryDto {
  categoryId: number;
  name: string;
}
