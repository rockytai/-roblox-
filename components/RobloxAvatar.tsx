import React from 'react';
import { AvatarConfig } from '../types';

interface Props {
  avatar: AvatarConfig;
  size?: 'sm' | 'md' | 'lg';
}

export const RobloxAvatar: React.FC<Props> = ({ avatar, size = 'md' }) => {
  const scale = size === 'sm' ? 'scale-75' : size === 'lg' ? 'scale-150' : 'scale-100';
  
  return (
    <div className={`flex flex-col items-center ${scale} origin-center transition-all duration-200`}>
      <div 
        className="roblox-head relative rounded-md" 
        style={{ width: '40px', height: '45px', backgroundColor: avatar.headColor }}
      >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-1.5 flex justify-between">
          <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
          <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-2.5 h-1 bg-black rounded-b-sm"></div>
        </div>
      </div>
      <div 
        className="w-[45px] h-[35px] rounded-sm -mt-1 z-10 border-2 border-black/20 shadow-sm" 
        style={{ backgroundColor: avatar.bodyColor }}
      ></div>
    </div>
  );
};