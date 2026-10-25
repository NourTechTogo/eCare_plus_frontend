import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
export type AsyncData<T> = | {status:'loading'} | {status:'error';error:string} | {status:'success';data:T;refreshError?:string}
export function useAsyncData<T>(key:string,load:()=>Promise<T>,pollMs=0):AsyncData<T> {
 const {user}=useAuth()
 const scopedKey=`${user?.id ?? 'anonymous'}:${key}`
 const [loaded,setLoaded]=useState<{key:string;state:AsyncData<T>}|null>(null)
 const loadRef=useRef(load)
 useEffect(()=>{loadRef.current=load})
 useEffect(()=>{
  let active=true
  let timer:ReturnType<typeof setTimeout>|undefined
  const run=async()=>{
   if (pollMs && document.visibilityState === 'hidden') { timer=setTimeout(()=>void run(),pollMs);return }
   try {const data=await loadRef.current(); if(active)setLoaded({key:scopedKey,state:{status:'success',data}})}
   catch(e){if(active)setLoaded(previous=>{
    const error=e instanceof Error ? e.message : 'Chargement impossible.'
    return previous?.key===scopedKey && previous.state.status==='success'
     ? {key:scopedKey,state:{...previous.state,refreshError:error}}
     : {key:scopedKey,state:{status:'error',error}}
   })}
   finally {if(active && pollMs)timer=setTimeout(()=>void run(),pollMs)}
  }
  void run()
  return ()=>{active=false;clearTimeout(timer)}
 },[scopedKey,pollMs])
 return loaded?.key===scopedKey?loaded.state:{status:'loading'}
}
