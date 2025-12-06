import { AvatarConfig, QuestionType, RpgLevelConfig } from './types';

export const AVATARS: AvatarConfig[] = [
  { id: 'classic', name: '经典菜鸟', headColor: '#FFD700', bodyColor: '#0000FF' },
  { id: 'bacon', name: '培根头', headColor: '#EAB892', bodyColor: '#607D8B' },
  { id: 'guest', name: '神秘客', headColor: '#FFFFFF', bodyColor: '#111111' },
  { id: 'girl', name: '积木女孩', headColor: '#F5CBA7', bodyColor: '#E91E63' },
  { id: 'robot', name: '机器人', headColor: '#C0C0C0', bodyColor: '#78909C' },
  { id: 'zombie', name: '僵尸', headColor: '#98FB98', bodyColor: '#5D4037' }
];

export const QUESTION_TYPES: Record<string, QuestionType> = {
  ADD_10: { id: 'add10', name: '10以内加法', color: 'bg-green-500', icon: '🗡️' },
  SUB_10: { id: 'sub10', name: '10以内减法', color: 'bg-blue-500', icon: '🪄' },
  ADD_20: { id: 'add20', name: '20以内加法', color: 'bg-orange-500', icon: '🛡️' },
  SUB_20: { id: 'sub20', name: '20以内减法', color: 'bg-purple-500', icon: '🥷' },
  ADD_100_NC: { id: 'add100nc', name: '100内不进位加', color: 'bg-teal-600', icon: '➕' },
  ADD_100_WC: { id: 'add100wc', name: '100内进位加', color: 'bg-emerald-600', icon: '🔥' },
  SUB_100_NB: { id: 'sub100nb', name: '100内不退位减', color: 'bg-cyan-600', icon: '➖' },
  SUB_100_WB: { id: 'sub100wb', name: '100内退位减', color: 'bg-indigo-600', icon: '❄️' },
  MUL_1:  { id: 'mul1',  name: '一位数乘法', color: 'bg-red-500', icon: '⚡' },
  DIV_2:  { id: 'div2',  name: '两位数除法', color: 'bg-pink-500', icon: '➗' }
};

export const RPG_LEVEL_CONFIG: RpgLevelConfig[] = [
  { time: 50, pass: 8 },
  { time: 40, pass: 8 },
  { time: 30, pass: 8 },
  { time: 25, pass: 8 },
  { time: 20, pass: 8 }
];