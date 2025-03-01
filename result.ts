import { Option } from "./option.ts";
import { ResultClass } from "./result-impl.ts";

/**
 * A {@link Result} containing a success value.
 */
export type Ok<A> = { result: true; value: A };
/**
 * A {@link Result} containing an error value.
 */
export type Err<E> = { result: false; value: E };

/**
 * A value which can be of either type `A` or type `E`.
 *
 * This is normally used as a return value for operations which can fail: `E` is short for `Error`.
 * `A` can be thought of as the success value, and `E` is the
 * error value. This is reflected in their constructors: to construct a success
 * value, you call {@link Ok}, and to construct an error value, you call {@link Err}.
 *
 * @template A The type of the success value.
 * @template E The type of the error value.
 *
 * @see {@link IResult} for methods on {@link Result} objects
 * @see {@link IResultStatic} for static methods in the {@link Result} namespace
 *
 * @example
 * function processResult(result: Result<string, Error>): void {
 *     if (result.isOk()) {
 *         console.info(result.value);
 *     } else {
 *         console.error(result.value.message);
 *     }
 * }
 *
 * processResult(Ok("Hello Joe!"));
 * processResult(Err(new Error("Get Robert to fix the bug!")));
 */
export type Result<A, E> = (Ok<A> | Err<E>) & IResult<A, E>;

/**
 * Methods available on {@link Result} objects.
 *
 * @template A The type of the success value.
 * @template E The type of the error value.
 */
export interface IResult<A, E> {
    /**
     * Test if the {@link Result} is {@link Ok}.
     */
    isOk(): this is Ok<A>;

    /**
     * Test if the {@link Result} is {@link Err}.
     */
    isErr(): this is Err<E>;

    /**
     * Assert that the {@link Result} is {@link Ok}.
     */
    assertOk(): asserts this is Ok<A>;

    /**
     * Assert that the {@link Result} is {@link Err}.
     */
    assertErr(): asserts this is Err<E>;

    /**
     * The `match` function takes two callbacks, one for each possible state of
     * the {@link Result}, and calls the one that matches the actual state.
     */
    match<B>(onOk: (value: A) => B, onErr: (value: E) => B): B;

    /**
     * Call the provided function with the contained value if the {@link Result} is {@link Ok}.
     */
    ifOk(onOk: (value: A) => void): void;

    /**
     * Call the provided function with the contained value if the {@link Result} is {@link Err}.
     */
    ifErr(onErr: (value: E) => void): void;

    /**
     * If the {@link Result} is {@link Ok}, call the provided function with the
     * contained value and return a new {@link Result} containing the result of the
     * function, which must be another {@link Result}. If the {@link Result} is {@link Err},
     * the {@link Err} is returned unchanged and the function is never called.
     *
     * This is the monadic bind function, for those who celebrate.
     */
    chain<B>(f: (value: A) => Result<B, E>): Result<B, E>;

    /**
     * If the {@link Result} is {@link Err}, call the provided function and return its
     * result, which must be another {@link Result}. If the {@link Result} is {@link Ok},
     * the {@link Ok} is returned unchanged and the function is never called.
     */
    chainErr<F>(f: (value: E) => Result<A, F>): Result<A, F>;

    /**
     * If the {@link Result} is {@link Ok}, transform its contained value using the provided function.
     */
    map<B>(f: (value: A) => B): Result<B, E>;

    /**
     * If the {@link Result} is {@link Err}, transform its contained value using the provided function.
     */
    mapErr<F>(f: (value: E) => F): Result<A, F>;

    /**
     * Transform the contained value using one of the provided functions `ok`
     * and `err`, according to whether the {@link Result} is {@link Ok} or
     * {@link Err}.
     */
    bimap<B, F>(ok: (okValue: A) => B, err: (errValue: E) => F): Result<B, F>;

    /**
     * Given another {@link Result} containing a function from `A` to `B`:
     *
     * If both {@link Result}s are {@link Ok}, call the function with the
     * success value of this {@link Result} and return a `Result<B, E>`
     * containing what the function returns.
     *
     * If the result in `f` is {@link Err}, return that instead.
     *
     * If the result in `f` is {@link Ok} but the original result is
     * {@link Err}, return the original error {@link Result} unchanged.
     */
    apply<B>(f: Result<(a: A) => B, E>): Result<B, E>;

    /**
     * If the {@link Result} is {@link Ok}, return the provided {@link Result} of `B`,
     * otherwise return the original result (which would be an {@link Err}).
     */
    and<B>(result: Result<B, E>): Result<B, E>;

    /**
     * If the {@link Result} is {@link Err}, return the provided {@link Result}, otherwise
     * return the original {@link Result} (which would be an {@link Ok}).
     */
    or<F>(result: Result<A, F>): Result<A, F>;

    /**
     * Return the value contained in the {@link Result} if it's {@link Ok}, or return `defaultValue` otherwise.
     */
    getOr(defaultValue: A): A;

    /**
     * Return the value contained in the {@link Result} if it's {@link Ok}, or call the provided function and return its result otherwise.
     */
    getOrElse(f: () => A): A;

    /**
     * Converts a {@link Result} into an optional value of `A`, discarding any error value and returning `undefined` in place of the error.
     */
    unwrap(): A | undefined;

    /**
     * Converts a {@link Result} into an optional value of `E`, discarding any success value and returning `undefined` in place of the `A` value.
     */
    unwrapErr(): E | undefined;

    /**
     * Converts a {@link Result} into an {@link Option} of the success value, discarding any error value.
     */
    ok(): Option<A>;

    /**
     * Converts a {@link Result} into an {@link Option} of the error value, discarding any success value.
     */
    err(): Option<E>;

    /**
     * Test if the {@link Result} is an {@link Err} containing a
     * {@link DOMException} caused by an
     * {@link AbortController} aborting.
     */
    isAborted(): this is Err<DOMException>;

    /**
     * Convert a {@link Result} into a JSON structure for serialisation.
     */
    toJSON(): { result: boolean; value: A | E };
}

/**
 * Static methods on the {@link Result} object.
 */
export interface IResultStatic {
    /**
     * Convert a {@link Promise} returning `A` into a {@link Promise} returning a {@link Result} of either `A` or the `Error` type.
     * The new {@link Promise} always succeeds, reflecting an error condition in the `Result` instead of the failure callback.
     *
     * @example
     * const fetchResult = await Result.await(fetch("https://example.com/example.txt"));
     * if (fetchResult.isErr()) {
     *     console.error(fetchResult.value.message);
     * }
     */
    await<A, E extends Error>(m: Promise<A>): Promise<Result<A, E>>;

    /**
     * Run a function and return its result as an {@link Ok} if it didn't throw any
     * exceptions, or an {@link Err} containing the thrown exception.
     *
     * @example
     * const tryFn: Result<number, Error> = Result.try(() => {
     *     throw new Error("fix the bug!");
     * });
     *
     * if (tryFn.isErr()) {
     *     console.error(tryFn.value.message);
     * }
     */
    try<A, E = unknown>(f: () => A): Result<A, E>;

    /**
     * Create a {@link Result} from the output of {@link IResult.toJSON}.
     */
    fromJSON<A, E>(doc: { result: boolean; value: A | E }): Result<A, E>;

    /**
     * Test whether an unknown value is a {@link Result}.
     *
     * @example
     * function assertResult(value: unknown): void {
     *     if (Result.is(value)) {
     *         value.assertOk();
     *     }
     * }
     */
    is(value: unknown): value is Result<unknown, unknown>;

    /**
     * The class constructor of {@link Result}s. You should never use this to
     * construct {@link Result}s directly, preferring instead {@link Ok} and
     * {@link Err}. It's exposed for use in `instanceof` checks, though
     * calling {@link Result.is} to decide resultiness is preferred.
     *
     * @example
     * import { expect } from "chai";
     * expect(Ok("stop dots")).to.be.an.instanceof(Result.Class);
     */
    Class: new () => ResultClass<unknown, unknown>;
}

/**
 * Static methods on the {@link Result} object.
 *
 * @see IResultStatic
 */
export const Result: IResultStatic = {
    await<A, E extends Error>(m: Promise<A>): Promise<Result<A, E>> {
        return m.then(Ok, Err);
    },

    try<A, E = unknown>(f: () => A): Result<A, E> {
        try {
            return Ok(f());
        } catch (e) {
            return Err(e as E);
        }
    },

    // @ts-ignore: tsc gets confused about this type signature vs the interface.
    fromJSON<A, E>(doc: { result: boolean; value: A | E }): Result<A, E> {
        return (doc.result
            ? Ok(doc.value as A)
            : Err(doc.value as E)) as Result<A, E>;
    },

    is(value: unknown): value is Result<unknown, unknown> {
        return value instanceof ResultClass;
    },

    Class: ResultClass,
};

/**
 * Construct a {@link Result} with a success value of `A`.
 *
 * @example
 * const systemWorking: Result<string, string> = Ok("Seems to be!");
 */
// deno-lint-ignore no-explicit-any
export function Ok<A, E = any>(a: A): Result<A, E> {
    const o = Object.create(ResultClass.prototype);
    o.result = true;
    o.value = a;
    return o;
}

/**
 * Construct a {@link Result} with an error value of `E`.
 *
 * @example
 * const systemWorking: Result<string, string> = Err("System down!");
 */
// deno-lint-ignore no-explicit-any
export function Err<E, A = any>(e: E): Result<A, E> {
    const o = Object.create(ResultClass.prototype);
    o.result = false;
    o.value = e;
    return o;
}
