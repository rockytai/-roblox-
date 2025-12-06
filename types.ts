export type GameMode = 'HOME' | 'SETUP_RPG' | 'SETUP_DUEL' | 'RPG_PLAYING' | 'DUEL_PLAYING' | 'RPG_RESULT' | 'DUEL_RESULT';

export type InputMode = 'KEYPAD' | 'CHOICE';
export type DuelType = 'TIME' | 'RACE';

export interface AvatarConfig {
  id: string;
  name: string;
  headColor: string;
  bodyColor: string;
}

export interface Player {
  name: string;
  avatar: AvatarConfig;
  score: number;
  wins: number;
  isCpu?: boolean;
  feedback?: 'correct' | 'wrong' | null;
}

export interface QuestionType {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Question {
  n1: number;
  n2: number;
  operator: string;
  ans: number;
  uId: number;
  options?: number[];
}

export interface RpgLevelConfig {
  time: number;
  pass: number;
}