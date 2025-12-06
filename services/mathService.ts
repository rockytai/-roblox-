import { Question } from '../types';

export const generateOptions = (correct: number): number[] => {
  const opts = new Set([correct]);
  while(opts.size < 4) { 
    let offset = Math.floor(Math.random() * 10) - 5; 
    if (offset === 0) offset = 1;
    let val = correct + offset;
    if (val < 0) val = 0;
    opts.add(val);
  }
  return Array.from(opts).sort(() => Math.random() - 0.5);
};

export const generateQuestion = (typeId: string, withOptions = false): Question => {
  let n1 = 0, n2 = 0, operator = '', ans = 0;
  
  // Safety loop to ensure we generate a valid question
  while (true) {
    if (typeId === 'add10') {
      n1 = Math.floor(Math.random() * 10) + 1; n2 = Math.floor(Math.random() * 10) + 1;
      if (n1 + n2 <= 10) { operator = '+'; ans = n1 + n2; break; }
    } else if (typeId === 'sub10') {
      n1 = Math.floor(Math.random() * 10) + 1; n2 = Math.floor(Math.random() * 10) + 1;
      if (n1 > n2) { operator = '-'; ans = n1 - n2; break; }
    } else if (typeId === 'add20') {
      n1 = Math.floor(Math.random() * 18) + 2; n2 = Math.floor(Math.random() * 18) + 2;
      if (n1 + n2 > 10 && n1 + n2 <= 20) { operator = '+'; ans = n1 + n2; break; }
    } else if (typeId === 'sub20') {
      n1 = Math.floor(Math.random() * 9) + 11; n2 = Math.floor(Math.random() * 9) + 2;
      if (n1 - n2 > 0) { operator = '-'; ans = n1 - n2; break; }
    } else if (typeId === 'add100nc') {
      n1 = Math.floor(Math.random() * 89) + 10; n2 = Math.floor(Math.random() * (99 - n1)) + 1; 
      if ((n1 % 10) + (n2 % 10) < 10) { operator = '+'; ans = n1 + n2; break; }
    } else if (typeId === 'add100wc') {
      n1 = Math.floor(Math.random() * 89) + 2; n2 = Math.floor(Math.random() * 89) + 2; 
      if (n1 + n2 <= 100 && (n1 % 10) + (n2 % 10) >= 10) { operator = '+'; ans = n1 + n2; break; }
    } else if (typeId === 'sub100nb') {
      n1 = Math.floor(Math.random() * 89) + 11; n2 = Math.floor(Math.random() * (n1 - 1)) + 1; 
      if ((n1 % 10) >= (n2 % 10)) { operator = '-'; ans = n1 - n2; break; }
    } else if (typeId === 'sub100wb') {
      n1 = Math.floor(Math.random() * 79) + 20; n2 = Math.floor(Math.random() * (n1 - 1)) + 1; 
      if ((n1 % 10) < (n2 % 10)) { operator = '-'; ans = n1 - n2; break; }
    } else if (typeId === 'mul1') {
      n1 = Math.floor(Math.random() * 9) + 1; n2 = Math.floor(Math.random() * 9) + 1;
      operator = '×'; ans = n1 * n2; break;
    } else if (typeId === 'div2') {
      n2 = Math.floor(Math.random() * 8) + 2; ans = Math.floor(Math.random() * 9) + 2; 
      // Ensure dividend < 100 and clean division
      while (n2 * ans < 10) ans++; 
      if (n2 * ans >= 100) ans = Math.floor(99/n2); 
      n1 = n2 * ans; operator = '÷'; break;
    } else {
      // Fallback
      n1 = 1; n2 = 1; operator = '+'; ans = 2; break;
    }
  }

  const q: Question = { n1, n2, operator, ans, uId: Math.random() };
  if (withOptions) {
    q.options = generateOptions(ans);
  }
  return q;
};