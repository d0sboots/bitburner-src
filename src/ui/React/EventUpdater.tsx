/**
 * React component that renders its children dynamically based on events from
 * an EventEmitter.
 *
 * When a new event is triggered, the generator will be run to return a state.
 * If the new state differs from the old one (determined by basic equality),
 * then the child function will be called to rerender new components.
 *
 * This is the component version of useEventUpdater. The hook is designed to
 * be used from within a component; this works outside, wrapping simple
 * components that shouldn't have the hook added into them.
 */
import React, { useState, useEffect, useCallback } from "react";

import type { EventEmitter } from "../../utils/EventEmitter";

interface IProps<T> {
  events: EventEmitter<unknown[]>;
  generator: () => T;
  children: (_: T) => React.ReactElement;
}

export function EventUpdater<T>(props: IProps<T>): React.ReactElement {
  const [state, setState] = useState(props.generator);
  const doUpdate = useCallback(() => setState(props.generator), [props.generator, setState]);
  useEffect(() => props.events.subscribe(doUpdate), [props.events, doUpdate]);
  return props.children(state);
}
