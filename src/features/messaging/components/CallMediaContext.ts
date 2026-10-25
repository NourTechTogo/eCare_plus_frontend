import {createContext,type ReactNode} from 'react'
export interface LiveCallControls {
 connected:boolean;busy:boolean;error:string;muted:boolean;camera:boolean;remoteCount:number;
 media:ReactNode;join:()=>Promise<void>;toggle:(kind:'micro'|'camera')=>Promise<void>;startAudio:()=>void
}
export const CallMediaContext=createContext<LiveCallControls|null>(null)
