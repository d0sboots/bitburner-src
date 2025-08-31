import { useCallback, useEffect, useState } from "react";
import { GameCycleEvents } from "../../engine";
import type { EventEmitter } from "../../utils/EventEmitter";

/** Hook that returns a function for the component. Optionally set an interval to rerender the component.
 * @param autoRerenderTime: Optional. If provided and nonzero, used as the ms interval to automatically call the rerender function.
 */
export function useRerender(autoRerenderTime?: number) {
  const [__, setRerender] = useState(0);

  const rerender = useCallback(() => setRerender((currentValue) => currentValue + 1), []);

  useEffect(() => {
    if (!autoRerenderTime) return;
    const intervalID = setInterval(rerender, autoRerenderTime);
    return () => clearInterval(intervalID);
  }, [rerender, autoRerenderTime]);

  return rerender;
}

/** Hook that rerenders the component shortly after the game engine processes a cycle.
 * @returns a function that will trigger a rerender.
 */
export function useCycleRerender(): () => void {
  const rerender = useRerender();

  useEffect(() => {
    const unsubscribe = GameCycleEvents.subscribe(rerender);
    return unsubscribe;
  }, [rerender]);
  return rerender;
}

/**
 * Hook that uses an updater function to trigger updates on a component.
 * This can be used to avoid the rerenders caused by prop-drilling; instead,
 * the leaf component determines whether it needs to update directly from an
 * external store. The EventEmitter triggers the update; GameCycleEvents (the
 * engine loop) is used by default.
 */
export function useEventUpdater<T>(updater: () => T, events?: EventEmitter<unknown[]>): T {
  events ??= GameCycleEvents;
  const [state, setState] = useState(updater);
  const doUpdate = useCallback(() => setState(updater), [setState, updater]);
  useEffect(() => {
    const unsubscribe = events.subscribe(doUpdate);
    return unsubscribe;
  }, [doUpdate, events]);
  return state;
}

export function useBoolean(initialValue = false) {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((old) => !old);
  }, []);

  const on = useCallback(() => {
    setValue(true);
  }, []);

  const off = useCallback(() => {
    setValue(false);
  }, []);

  return [value, { toggle, on, off }] as const;
}
