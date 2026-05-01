export interface CreateGameRequest {
  hostNickname: string;
  preferredLanguage: string;
  totalRounds: number;
  timerDuration: number;
  categoryIds: number[];
}

export interface CreateGameResponse {
  gameCode: string;
  hostUserId: number;
}

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
  totalRounds: number;
  timerDuration: number;
  language: string;
  state: string;
  players: PlayerDto[];
  selectedCategoryIds: number[];
  hostUserId: number;
}


export interface CategoryDto {
  categoryId: number;
  name: string;
}
