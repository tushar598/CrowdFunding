import { useSyncExternalStore } from "react";

/**
 * Returns `true` once the component has mounted on the client.
 * Uses `useSyncExternalStore` instead of `useEffect + setState`
 * to avoid the "synchronous setState in effect" warning in React 19.
 */
const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function useMounted(): boolean {
  return useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
}
