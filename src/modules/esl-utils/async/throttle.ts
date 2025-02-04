import {createDeferred} from './promise';

import type {AnyToAnyFnSignature} from '../misc/functions';
import type {Deferred} from './promise';

/** Throttled<F> is a function wrapper type for a function decorated via throttle */
export interface Throttled<F extends AnyToAnyFnSignature> {
  /** Throttled method signature */
  (...args: Parameters<F>): void;
  /** Promise of throttled function call */
  promise: Promise<ReturnType<F> | void>;
}

/**
 * Creates a throttled executed function.
 * The func is invoked with the last arguments provided to the throttled function.
 * @param fn - function to decorate
 * @param threshold - indicates how often function could be called
 * @param thisArg - optional context to call original function, use debounced method call context if not defined
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function throttle<F extends AnyToAnyFnSignature>(fn: F, threshold = 250, thisArg?: object): Throttled<F> {
  let last: number;
  let timeout: number | null = null;
  let deferred: Deferred<ReturnType<F>> | null = null;

  function throttledSubject(...args: any[]) {
    const now = Date.now();

    if (!last || now >= last + threshold) {
      last = now;
      fn.apply(this, args);
    }

    deferred = deferred || createDeferred();
    (typeof timeout === 'number') && clearTimeout(timeout);
    timeout = window.setTimeout(() => {
      last = now;
      timeout = null;
      // fn.apply to save call context
      deferred!.resolve(fn.apply(thisArg || this, args));
      deferred = null;
    }, threshold);
  }
  Object.defineProperty(throttledSubject, 'promise', {
    get: () => deferred ? deferred.promise : Promise.resolve()
  });
  return throttledSubject as Throttled<F>;
}
