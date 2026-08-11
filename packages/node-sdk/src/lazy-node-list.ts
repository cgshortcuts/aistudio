/** Array that runs `load` on first read, so disabled manifest packs stay cheap. */
export function lazyReadonlyArray<T>(load: () => readonly T[]): readonly T[] {
  let cached: readonly T[] | undefined;
  const resolve = (): readonly T[] => (cached ??= load());
  return new Proxy([] as T[], {
    get(_target, prop) {
      const src = resolve();
      const value = Reflect.get(src as object, prop, src);
      if (typeof value === "function") {
        return (value as (...args: unknown[]) => unknown).bind(src);
      }
      return value;
    },
    has(_target, prop) {
      return Reflect.has(resolve() as object, prop);
    },
    ownKeys() {
      return Reflect.ownKeys(resolve() as object);
    },
    getOwnPropertyDescriptor(_target, prop) {
      return Reflect.getOwnPropertyDescriptor(resolve() as object, prop);
    },
    getPrototypeOf() {
      return Array.prototype;
    }
  });
}
