
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Role
 * 
 */
export type Role = $Result.DefaultSelection<Prisma.$RolePayload>
/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Location
 * 
 */
export type Location = $Result.DefaultSelection<Prisma.$LocationPayload>
/**
 * Model EventType
 * 
 */
export type EventType = $Result.DefaultSelection<Prisma.$EventTypePayload>
/**
 * Model EventClass
 * 
 */
export type EventClass = $Result.DefaultSelection<Prisma.$EventClassPayload>
/**
 * Model Camera
 * 
 */
export type Camera = $Result.DefaultSelection<Prisma.$CameraPayload>
/**
 * Model EventLog
 * 
 */
export type EventLog = $Result.DefaultSelection<Prisma.$EventLogPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Roles
 * const roles = await prisma.role.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Roles
   * const roles = await prisma.role.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.role`: Exposes CRUD operations for the **Role** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Roles
    * const roles = await prisma.role.findMany()
    * ```
    */
  get role(): Prisma.RoleDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.location`: Exposes CRUD operations for the **Location** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Locations
    * const locations = await prisma.location.findMany()
    * ```
    */
  get location(): Prisma.LocationDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.eventType`: Exposes CRUD operations for the **EventType** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more EventTypes
    * const eventTypes = await prisma.eventType.findMany()
    * ```
    */
  get eventType(): Prisma.EventTypeDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.eventClass`: Exposes CRUD operations for the **EventClass** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more EventClasses
    * const eventClasses = await prisma.eventClass.findMany()
    * ```
    */
  get eventClass(): Prisma.EventClassDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.camera`: Exposes CRUD operations for the **Camera** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Cameras
    * const cameras = await prisma.camera.findMany()
    * ```
    */
  get camera(): Prisma.CameraDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.eventLog`: Exposes CRUD operations for the **EventLog** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more EventLogs
    * const eventLogs = await prisma.eventLog.findMany()
    * ```
    */
  get eventLog(): Prisma.EventLogDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.3.0
   * Query Engine version: 9d6ad21cbbceab97458517b147a6a09ff43aa735
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Role: 'Role',
    User: 'User',
    Location: 'Location',
    EventType: 'EventType',
    EventClass: 'EventClass',
    Camera: 'Camera',
    EventLog: 'EventLog'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "role" | "user" | "location" | "eventType" | "eventClass" | "camera" | "eventLog"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Role: {
        payload: Prisma.$RolePayload<ExtArgs>
        fields: Prisma.RoleFieldRefs
        operations: {
          findUnique: {
            args: Prisma.RoleFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RolePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.RoleFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RolePayload>
          }
          findFirst: {
            args: Prisma.RoleFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RolePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.RoleFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RolePayload>
          }
          findMany: {
            args: Prisma.RoleFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RolePayload>[]
          }
          create: {
            args: Prisma.RoleCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RolePayload>
          }
          createMany: {
            args: Prisma.RoleCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.RoleCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RolePayload>[]
          }
          delete: {
            args: Prisma.RoleDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RolePayload>
          }
          update: {
            args: Prisma.RoleUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RolePayload>
          }
          deleteMany: {
            args: Prisma.RoleDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.RoleUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.RoleUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RolePayload>[]
          }
          upsert: {
            args: Prisma.RoleUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RolePayload>
          }
          aggregate: {
            args: Prisma.RoleAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateRole>
          }
          groupBy: {
            args: Prisma.RoleGroupByArgs<ExtArgs>
            result: $Utils.Optional<RoleGroupByOutputType>[]
          }
          count: {
            args: Prisma.RoleCountArgs<ExtArgs>
            result: $Utils.Optional<RoleCountAggregateOutputType> | number
          }
        }
      }
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Location: {
        payload: Prisma.$LocationPayload<ExtArgs>
        fields: Prisma.LocationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LocationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LocationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          findFirst: {
            args: Prisma.LocationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LocationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          findMany: {
            args: Prisma.LocationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>[]
          }
          create: {
            args: Prisma.LocationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          createMany: {
            args: Prisma.LocationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LocationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>[]
          }
          delete: {
            args: Prisma.LocationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          update: {
            args: Prisma.LocationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          deleteMany: {
            args: Prisma.LocationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LocationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.LocationUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>[]
          }
          upsert: {
            args: Prisma.LocationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          aggregate: {
            args: Prisma.LocationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLocation>
          }
          groupBy: {
            args: Prisma.LocationGroupByArgs<ExtArgs>
            result: $Utils.Optional<LocationGroupByOutputType>[]
          }
          count: {
            args: Prisma.LocationCountArgs<ExtArgs>
            result: $Utils.Optional<LocationCountAggregateOutputType> | number
          }
        }
      }
      EventType: {
        payload: Prisma.$EventTypePayload<ExtArgs>
        fields: Prisma.EventTypeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.EventTypeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventTypePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.EventTypeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventTypePayload>
          }
          findFirst: {
            args: Prisma.EventTypeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventTypePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.EventTypeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventTypePayload>
          }
          findMany: {
            args: Prisma.EventTypeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventTypePayload>[]
          }
          create: {
            args: Prisma.EventTypeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventTypePayload>
          }
          createMany: {
            args: Prisma.EventTypeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.EventTypeCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventTypePayload>[]
          }
          delete: {
            args: Prisma.EventTypeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventTypePayload>
          }
          update: {
            args: Prisma.EventTypeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventTypePayload>
          }
          deleteMany: {
            args: Prisma.EventTypeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.EventTypeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.EventTypeUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventTypePayload>[]
          }
          upsert: {
            args: Prisma.EventTypeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventTypePayload>
          }
          aggregate: {
            args: Prisma.EventTypeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEventType>
          }
          groupBy: {
            args: Prisma.EventTypeGroupByArgs<ExtArgs>
            result: $Utils.Optional<EventTypeGroupByOutputType>[]
          }
          count: {
            args: Prisma.EventTypeCountArgs<ExtArgs>
            result: $Utils.Optional<EventTypeCountAggregateOutputType> | number
          }
        }
      }
      EventClass: {
        payload: Prisma.$EventClassPayload<ExtArgs>
        fields: Prisma.EventClassFieldRefs
        operations: {
          findUnique: {
            args: Prisma.EventClassFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventClassPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.EventClassFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventClassPayload>
          }
          findFirst: {
            args: Prisma.EventClassFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventClassPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.EventClassFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventClassPayload>
          }
          findMany: {
            args: Prisma.EventClassFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventClassPayload>[]
          }
          create: {
            args: Prisma.EventClassCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventClassPayload>
          }
          createMany: {
            args: Prisma.EventClassCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.EventClassCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventClassPayload>[]
          }
          delete: {
            args: Prisma.EventClassDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventClassPayload>
          }
          update: {
            args: Prisma.EventClassUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventClassPayload>
          }
          deleteMany: {
            args: Prisma.EventClassDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.EventClassUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.EventClassUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventClassPayload>[]
          }
          upsert: {
            args: Prisma.EventClassUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventClassPayload>
          }
          aggregate: {
            args: Prisma.EventClassAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEventClass>
          }
          groupBy: {
            args: Prisma.EventClassGroupByArgs<ExtArgs>
            result: $Utils.Optional<EventClassGroupByOutputType>[]
          }
          count: {
            args: Prisma.EventClassCountArgs<ExtArgs>
            result: $Utils.Optional<EventClassCountAggregateOutputType> | number
          }
        }
      }
      Camera: {
        payload: Prisma.$CameraPayload<ExtArgs>
        fields: Prisma.CameraFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CameraFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CameraPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CameraFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CameraPayload>
          }
          findFirst: {
            args: Prisma.CameraFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CameraPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CameraFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CameraPayload>
          }
          findMany: {
            args: Prisma.CameraFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CameraPayload>[]
          }
          create: {
            args: Prisma.CameraCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CameraPayload>
          }
          createMany: {
            args: Prisma.CameraCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CameraCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CameraPayload>[]
          }
          delete: {
            args: Prisma.CameraDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CameraPayload>
          }
          update: {
            args: Prisma.CameraUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CameraPayload>
          }
          deleteMany: {
            args: Prisma.CameraDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CameraUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CameraUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CameraPayload>[]
          }
          upsert: {
            args: Prisma.CameraUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CameraPayload>
          }
          aggregate: {
            args: Prisma.CameraAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCamera>
          }
          groupBy: {
            args: Prisma.CameraGroupByArgs<ExtArgs>
            result: $Utils.Optional<CameraGroupByOutputType>[]
          }
          count: {
            args: Prisma.CameraCountArgs<ExtArgs>
            result: $Utils.Optional<CameraCountAggregateOutputType> | number
          }
        }
      }
      EventLog: {
        payload: Prisma.$EventLogPayload<ExtArgs>
        fields: Prisma.EventLogFieldRefs
        operations: {
          findUnique: {
            args: Prisma.EventLogFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventLogPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.EventLogFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventLogPayload>
          }
          findFirst: {
            args: Prisma.EventLogFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventLogPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.EventLogFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventLogPayload>
          }
          findMany: {
            args: Prisma.EventLogFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventLogPayload>[]
          }
          create: {
            args: Prisma.EventLogCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventLogPayload>
          }
          createMany: {
            args: Prisma.EventLogCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.EventLogCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventLogPayload>[]
          }
          delete: {
            args: Prisma.EventLogDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventLogPayload>
          }
          update: {
            args: Prisma.EventLogUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventLogPayload>
          }
          deleteMany: {
            args: Prisma.EventLogDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.EventLogUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.EventLogUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventLogPayload>[]
          }
          upsert: {
            args: Prisma.EventLogUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventLogPayload>
          }
          aggregate: {
            args: Prisma.EventLogAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEventLog>
          }
          groupBy: {
            args: Prisma.EventLogGroupByArgs<ExtArgs>
            result: $Utils.Optional<EventLogGroupByOutputType>[]
          }
          count: {
            args: Prisma.EventLogCountArgs<ExtArgs>
            result: $Utils.Optional<EventLogCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    role?: RoleOmit
    user?: UserOmit
    location?: LocationOmit
    eventType?: EventTypeOmit
    eventClass?: EventClassOmit
    camera?: CameraOmit
    eventLog?: EventLogOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type RoleCountOutputType
   */

  export type RoleCountOutputType = {
    users: number
  }

  export type RoleCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    users?: boolean | RoleCountOutputTypeCountUsersArgs
  }

  // Custom InputTypes
  /**
   * RoleCountOutputType without action
   */
  export type RoleCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RoleCountOutputType
     */
    select?: RoleCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * RoleCountOutputType without action
   */
  export type RoleCountOutputTypeCountUsersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
  }


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    acknowledged_logs: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    acknowledged_logs?: boolean | UserCountOutputTypeCountAcknowledged_logsArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountAcknowledged_logsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EventLogWhereInput
  }


  /**
   * Count Type LocationCountOutputType
   */

  export type LocationCountOutputType = {
    cameras: number
  }

  export type LocationCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    cameras?: boolean | LocationCountOutputTypeCountCamerasArgs
  }

  // Custom InputTypes
  /**
   * LocationCountOutputType without action
   */
  export type LocationCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LocationCountOutputType
     */
    select?: LocationCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * LocationCountOutputType without action
   */
  export type LocationCountOutputTypeCountCamerasArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CameraWhereInput
  }


  /**
   * Count Type EventTypeCountOutputType
   */

  export type EventTypeCountOutputType = {
    classes: number
  }

  export type EventTypeCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    classes?: boolean | EventTypeCountOutputTypeCountClassesArgs
  }

  // Custom InputTypes
  /**
   * EventTypeCountOutputType without action
   */
  export type EventTypeCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventTypeCountOutputType
     */
    select?: EventTypeCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * EventTypeCountOutputType without action
   */
  export type EventTypeCountOutputTypeCountClassesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EventClassWhereInput
  }


  /**
   * Count Type EventClassCountOutputType
   */

  export type EventClassCountOutputType = {
    logs: number
  }

  export type EventClassCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    logs?: boolean | EventClassCountOutputTypeCountLogsArgs
  }

  // Custom InputTypes
  /**
   * EventClassCountOutputType without action
   */
  export type EventClassCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventClassCountOutputType
     */
    select?: EventClassCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * EventClassCountOutputType without action
   */
  export type EventClassCountOutputTypeCountLogsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EventLogWhereInput
  }


  /**
   * Count Type CameraCountOutputType
   */

  export type CameraCountOutputType = {
    logs: number
  }

  export type CameraCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    logs?: boolean | CameraCountOutputTypeCountLogsArgs
  }

  // Custom InputTypes
  /**
   * CameraCountOutputType without action
   */
  export type CameraCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CameraCountOutputType
     */
    select?: CameraCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * CameraCountOutputType without action
   */
  export type CameraCountOutputTypeCountLogsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EventLogWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Role
   */

  export type AggregateRole = {
    _count: RoleCountAggregateOutputType | null
    _avg: RoleAvgAggregateOutputType | null
    _sum: RoleSumAggregateOutputType | null
    _min: RoleMinAggregateOutputType | null
    _max: RoleMaxAggregateOutputType | null
  }

  export type RoleAvgAggregateOutputType = {
    id: number | null
  }

  export type RoleSumAggregateOutputType = {
    id: bigint | null
  }

  export type RoleMinAggregateOutputType = {
    id: bigint | null
    role_name: string | null
  }

  export type RoleMaxAggregateOutputType = {
    id: bigint | null
    role_name: string | null
  }

  export type RoleCountAggregateOutputType = {
    id: number
    role_name: number
    _all: number
  }


  export type RoleAvgAggregateInputType = {
    id?: true
  }

  export type RoleSumAggregateInputType = {
    id?: true
  }

  export type RoleMinAggregateInputType = {
    id?: true
    role_name?: true
  }

  export type RoleMaxAggregateInputType = {
    id?: true
    role_name?: true
  }

  export type RoleCountAggregateInputType = {
    id?: true
    role_name?: true
    _all?: true
  }

  export type RoleAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Role to aggregate.
     */
    where?: RoleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Roles to fetch.
     */
    orderBy?: RoleOrderByWithRelationInput | RoleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: RoleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Roles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Roles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Roles
    **/
    _count?: true | RoleCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: RoleAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: RoleSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: RoleMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: RoleMaxAggregateInputType
  }

  export type GetRoleAggregateType<T extends RoleAggregateArgs> = {
        [P in keyof T & keyof AggregateRole]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateRole[P]>
      : GetScalarType<T[P], AggregateRole[P]>
  }




  export type RoleGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RoleWhereInput
    orderBy?: RoleOrderByWithAggregationInput | RoleOrderByWithAggregationInput[]
    by: RoleScalarFieldEnum[] | RoleScalarFieldEnum
    having?: RoleScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: RoleCountAggregateInputType | true
    _avg?: RoleAvgAggregateInputType
    _sum?: RoleSumAggregateInputType
    _min?: RoleMinAggregateInputType
    _max?: RoleMaxAggregateInputType
  }

  export type RoleGroupByOutputType = {
    id: bigint
    role_name: string
    _count: RoleCountAggregateOutputType | null
    _avg: RoleAvgAggregateOutputType | null
    _sum: RoleSumAggregateOutputType | null
    _min: RoleMinAggregateOutputType | null
    _max: RoleMaxAggregateOutputType | null
  }

  type GetRoleGroupByPayload<T extends RoleGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<RoleGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof RoleGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], RoleGroupByOutputType[P]>
            : GetScalarType<T[P], RoleGroupByOutputType[P]>
        }
      >
    >


  export type RoleSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    role_name?: boolean
    users?: boolean | Role$usersArgs<ExtArgs>
    _count?: boolean | RoleCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["role"]>

  export type RoleSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    role_name?: boolean
  }, ExtArgs["result"]["role"]>

  export type RoleSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    role_name?: boolean
  }, ExtArgs["result"]["role"]>

  export type RoleSelectScalar = {
    id?: boolean
    role_name?: boolean
  }

  export type RoleOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "role_name", ExtArgs["result"]["role"]>
  export type RoleInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    users?: boolean | Role$usersArgs<ExtArgs>
    _count?: boolean | RoleCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type RoleIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type RoleIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $RolePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Role"
    objects: {
      users: Prisma.$UserPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: bigint
      role_name: string
    }, ExtArgs["result"]["role"]>
    composites: {}
  }

  type RoleGetPayload<S extends boolean | null | undefined | RoleDefaultArgs> = $Result.GetResult<Prisma.$RolePayload, S>

  type RoleCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<RoleFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: RoleCountAggregateInputType | true
    }

  export interface RoleDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Role'], meta: { name: 'Role' } }
    /**
     * Find zero or one Role that matches the filter.
     * @param {RoleFindUniqueArgs} args - Arguments to find a Role
     * @example
     * // Get one Role
     * const role = await prisma.role.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends RoleFindUniqueArgs>(args: SelectSubset<T, RoleFindUniqueArgs<ExtArgs>>): Prisma__RoleClient<$Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Role that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {RoleFindUniqueOrThrowArgs} args - Arguments to find a Role
     * @example
     * // Get one Role
     * const role = await prisma.role.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends RoleFindUniqueOrThrowArgs>(args: SelectSubset<T, RoleFindUniqueOrThrowArgs<ExtArgs>>): Prisma__RoleClient<$Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Role that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoleFindFirstArgs} args - Arguments to find a Role
     * @example
     * // Get one Role
     * const role = await prisma.role.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends RoleFindFirstArgs>(args?: SelectSubset<T, RoleFindFirstArgs<ExtArgs>>): Prisma__RoleClient<$Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Role that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoleFindFirstOrThrowArgs} args - Arguments to find a Role
     * @example
     * // Get one Role
     * const role = await prisma.role.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends RoleFindFirstOrThrowArgs>(args?: SelectSubset<T, RoleFindFirstOrThrowArgs<ExtArgs>>): Prisma__RoleClient<$Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Roles that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoleFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Roles
     * const roles = await prisma.role.findMany()
     * 
     * // Get first 10 Roles
     * const roles = await prisma.role.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const roleWithIdOnly = await prisma.role.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends RoleFindManyArgs>(args?: SelectSubset<T, RoleFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Role.
     * @param {RoleCreateArgs} args - Arguments to create a Role.
     * @example
     * // Create one Role
     * const Role = await prisma.role.create({
     *   data: {
     *     // ... data to create a Role
     *   }
     * })
     * 
     */
    create<T extends RoleCreateArgs>(args: SelectSubset<T, RoleCreateArgs<ExtArgs>>): Prisma__RoleClient<$Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Roles.
     * @param {RoleCreateManyArgs} args - Arguments to create many Roles.
     * @example
     * // Create many Roles
     * const role = await prisma.role.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends RoleCreateManyArgs>(args?: SelectSubset<T, RoleCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Roles and returns the data saved in the database.
     * @param {RoleCreateManyAndReturnArgs} args - Arguments to create many Roles.
     * @example
     * // Create many Roles
     * const role = await prisma.role.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Roles and only return the `id`
     * const roleWithIdOnly = await prisma.role.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends RoleCreateManyAndReturnArgs>(args?: SelectSubset<T, RoleCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Role.
     * @param {RoleDeleteArgs} args - Arguments to delete one Role.
     * @example
     * // Delete one Role
     * const Role = await prisma.role.delete({
     *   where: {
     *     // ... filter to delete one Role
     *   }
     * })
     * 
     */
    delete<T extends RoleDeleteArgs>(args: SelectSubset<T, RoleDeleteArgs<ExtArgs>>): Prisma__RoleClient<$Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Role.
     * @param {RoleUpdateArgs} args - Arguments to update one Role.
     * @example
     * // Update one Role
     * const role = await prisma.role.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends RoleUpdateArgs>(args: SelectSubset<T, RoleUpdateArgs<ExtArgs>>): Prisma__RoleClient<$Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Roles.
     * @param {RoleDeleteManyArgs} args - Arguments to filter Roles to delete.
     * @example
     * // Delete a few Roles
     * const { count } = await prisma.role.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends RoleDeleteManyArgs>(args?: SelectSubset<T, RoleDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Roles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoleUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Roles
     * const role = await prisma.role.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends RoleUpdateManyArgs>(args: SelectSubset<T, RoleUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Roles and returns the data updated in the database.
     * @param {RoleUpdateManyAndReturnArgs} args - Arguments to update many Roles.
     * @example
     * // Update many Roles
     * const role = await prisma.role.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Roles and only return the `id`
     * const roleWithIdOnly = await prisma.role.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends RoleUpdateManyAndReturnArgs>(args: SelectSubset<T, RoleUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Role.
     * @param {RoleUpsertArgs} args - Arguments to update or create a Role.
     * @example
     * // Update or create a Role
     * const role = await prisma.role.upsert({
     *   create: {
     *     // ... data to create a Role
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Role we want to update
     *   }
     * })
     */
    upsert<T extends RoleUpsertArgs>(args: SelectSubset<T, RoleUpsertArgs<ExtArgs>>): Prisma__RoleClient<$Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Roles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoleCountArgs} args - Arguments to filter Roles to count.
     * @example
     * // Count the number of Roles
     * const count = await prisma.role.count({
     *   where: {
     *     // ... the filter for the Roles we want to count
     *   }
     * })
    **/
    count<T extends RoleCountArgs>(
      args?: Subset<T, RoleCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], RoleCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Role.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoleAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends RoleAggregateArgs>(args: Subset<T, RoleAggregateArgs>): Prisma.PrismaPromise<GetRoleAggregateType<T>>

    /**
     * Group by Role.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoleGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends RoleGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: RoleGroupByArgs['orderBy'] }
        : { orderBy?: RoleGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, RoleGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRoleGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Role model
   */
  readonly fields: RoleFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Role.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__RoleClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    users<T extends Role$usersArgs<ExtArgs> = {}>(args?: Subset<T, Role$usersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Role model
   */
  interface RoleFieldRefs {
    readonly id: FieldRef<"Role", 'BigInt'>
    readonly role_name: FieldRef<"Role", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Role findUnique
   */
  export type RoleFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Role
     */
    select?: RoleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Role
     */
    omit?: RoleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleInclude<ExtArgs> | null
    /**
     * Filter, which Role to fetch.
     */
    where: RoleWhereUniqueInput
  }

  /**
   * Role findUniqueOrThrow
   */
  export type RoleFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Role
     */
    select?: RoleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Role
     */
    omit?: RoleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleInclude<ExtArgs> | null
    /**
     * Filter, which Role to fetch.
     */
    where: RoleWhereUniqueInput
  }

  /**
   * Role findFirst
   */
  export type RoleFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Role
     */
    select?: RoleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Role
     */
    omit?: RoleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleInclude<ExtArgs> | null
    /**
     * Filter, which Role to fetch.
     */
    where?: RoleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Roles to fetch.
     */
    orderBy?: RoleOrderByWithRelationInput | RoleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Roles.
     */
    cursor?: RoleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Roles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Roles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Roles.
     */
    distinct?: RoleScalarFieldEnum | RoleScalarFieldEnum[]
  }

  /**
   * Role findFirstOrThrow
   */
  export type RoleFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Role
     */
    select?: RoleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Role
     */
    omit?: RoleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleInclude<ExtArgs> | null
    /**
     * Filter, which Role to fetch.
     */
    where?: RoleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Roles to fetch.
     */
    orderBy?: RoleOrderByWithRelationInput | RoleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Roles.
     */
    cursor?: RoleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Roles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Roles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Roles.
     */
    distinct?: RoleScalarFieldEnum | RoleScalarFieldEnum[]
  }

  /**
   * Role findMany
   */
  export type RoleFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Role
     */
    select?: RoleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Role
     */
    omit?: RoleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleInclude<ExtArgs> | null
    /**
     * Filter, which Roles to fetch.
     */
    where?: RoleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Roles to fetch.
     */
    orderBy?: RoleOrderByWithRelationInput | RoleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Roles.
     */
    cursor?: RoleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Roles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Roles.
     */
    skip?: number
    distinct?: RoleScalarFieldEnum | RoleScalarFieldEnum[]
  }

  /**
   * Role create
   */
  export type RoleCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Role
     */
    select?: RoleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Role
     */
    omit?: RoleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleInclude<ExtArgs> | null
    /**
     * The data needed to create a Role.
     */
    data: XOR<RoleCreateInput, RoleUncheckedCreateInput>
  }

  /**
   * Role createMany
   */
  export type RoleCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Roles.
     */
    data: RoleCreateManyInput | RoleCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Role createManyAndReturn
   */
  export type RoleCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Role
     */
    select?: RoleSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Role
     */
    omit?: RoleOmit<ExtArgs> | null
    /**
     * The data used to create many Roles.
     */
    data: RoleCreateManyInput | RoleCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Role update
   */
  export type RoleUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Role
     */
    select?: RoleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Role
     */
    omit?: RoleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleInclude<ExtArgs> | null
    /**
     * The data needed to update a Role.
     */
    data: XOR<RoleUpdateInput, RoleUncheckedUpdateInput>
    /**
     * Choose, which Role to update.
     */
    where: RoleWhereUniqueInput
  }

  /**
   * Role updateMany
   */
  export type RoleUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Roles.
     */
    data: XOR<RoleUpdateManyMutationInput, RoleUncheckedUpdateManyInput>
    /**
     * Filter which Roles to update
     */
    where?: RoleWhereInput
    /**
     * Limit how many Roles to update.
     */
    limit?: number
  }

  /**
   * Role updateManyAndReturn
   */
  export type RoleUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Role
     */
    select?: RoleSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Role
     */
    omit?: RoleOmit<ExtArgs> | null
    /**
     * The data used to update Roles.
     */
    data: XOR<RoleUpdateManyMutationInput, RoleUncheckedUpdateManyInput>
    /**
     * Filter which Roles to update
     */
    where?: RoleWhereInput
    /**
     * Limit how many Roles to update.
     */
    limit?: number
  }

  /**
   * Role upsert
   */
  export type RoleUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Role
     */
    select?: RoleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Role
     */
    omit?: RoleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleInclude<ExtArgs> | null
    /**
     * The filter to search for the Role to update in case it exists.
     */
    where: RoleWhereUniqueInput
    /**
     * In case the Role found by the `where` argument doesn't exist, create a new Role with this data.
     */
    create: XOR<RoleCreateInput, RoleUncheckedCreateInput>
    /**
     * In case the Role was found with the provided `where` argument, update it with this data.
     */
    update: XOR<RoleUpdateInput, RoleUncheckedUpdateInput>
  }

  /**
   * Role delete
   */
  export type RoleDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Role
     */
    select?: RoleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Role
     */
    omit?: RoleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleInclude<ExtArgs> | null
    /**
     * Filter which Role to delete.
     */
    where: RoleWhereUniqueInput
  }

  /**
   * Role deleteMany
   */
  export type RoleDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Roles to delete
     */
    where?: RoleWhereInput
    /**
     * Limit how many Roles to delete.
     */
    limit?: number
  }

  /**
   * Role.users
   */
  export type Role$usersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    where?: UserWhereInput
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    cursor?: UserWhereUniqueInput
    take?: number
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * Role without action
   */
  export type RoleDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Role
     */
    select?: RoleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Role
     */
    omit?: RoleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleInclude<ExtArgs> | null
  }


  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserAvgAggregateOutputType = {
    id: number | null
    role_id: number | null
  }

  export type UserSumAggregateOutputType = {
    id: bigint | null
    role_id: bigint | null
  }

  export type UserMinAggregateOutputType = {
    id: bigint | null
    firstname: string | null
    lastname: string | null
    username: string | null
    password: string | null
    role_id: bigint | null
  }

  export type UserMaxAggregateOutputType = {
    id: bigint | null
    firstname: string | null
    lastname: string | null
    username: string | null
    password: string | null
    role_id: bigint | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    firstname: number
    lastname: number
    username: number
    password: number
    role_id: number
    _all: number
  }


  export type UserAvgAggregateInputType = {
    id?: true
    role_id?: true
  }

  export type UserSumAggregateInputType = {
    id?: true
    role_id?: true
  }

  export type UserMinAggregateInputType = {
    id?: true
    firstname?: true
    lastname?: true
    username?: true
    password?: true
    role_id?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    firstname?: true
    lastname?: true
    username?: true
    password?: true
    role_id?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    firstname?: true
    lastname?: true
    username?: true
    password?: true
    role_id?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: UserAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UserSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _avg?: UserAvgAggregateInputType
    _sum?: UserSumAggregateInputType
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: bigint
    firstname: string
    lastname: string
    username: string
    password: string
    role_id: bigint | null
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    firstname?: boolean
    lastname?: boolean
    username?: boolean
    password?: boolean
    role_id?: boolean
    role?: boolean | User$roleArgs<ExtArgs>
    acknowledged_logs?: boolean | User$acknowledged_logsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    firstname?: boolean
    lastname?: boolean
    username?: boolean
    password?: boolean
    role_id?: boolean
    role?: boolean | User$roleArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    firstname?: boolean
    lastname?: boolean
    username?: boolean
    password?: boolean
    role_id?: boolean
    role?: boolean | User$roleArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    firstname?: boolean
    lastname?: boolean
    username?: boolean
    password?: boolean
    role_id?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "firstname" | "lastname" | "username" | "password" | "role_id", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    role?: boolean | User$roleArgs<ExtArgs>
    acknowledged_logs?: boolean | User$acknowledged_logsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    role?: boolean | User$roleArgs<ExtArgs>
  }
  export type UserIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    role?: boolean | User$roleArgs<ExtArgs>
  }

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      role: Prisma.$RolePayload<ExtArgs> | null
      acknowledged_logs: Prisma.$EventLogPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: bigint
      firstname: string
      lastname: string
      username: string
      password: string
      role_id: bigint | null
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    role<T extends User$roleArgs<ExtArgs> = {}>(args?: Subset<T, User$roleArgs<ExtArgs>>): Prisma__RoleClient<$Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    acknowledged_logs<T extends User$acknowledged_logsArgs<ExtArgs> = {}>(args?: Subset<T, User$acknowledged_logsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'BigInt'>
    readonly firstname: FieldRef<"User", 'String'>
    readonly lastname: FieldRef<"User", 'String'>
    readonly username: FieldRef<"User", 'String'>
    readonly password: FieldRef<"User", 'String'>
    readonly role_id: FieldRef<"User", 'BigInt'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.role
   */
  export type User$roleArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Role
     */
    select?: RoleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Role
     */
    omit?: RoleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleInclude<ExtArgs> | null
    where?: RoleWhereInput
  }

  /**
   * User.acknowledged_logs
   */
  export type User$acknowledged_logsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventLog
     */
    omit?: EventLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventLogInclude<ExtArgs> | null
    where?: EventLogWhereInput
    orderBy?: EventLogOrderByWithRelationInput | EventLogOrderByWithRelationInput[]
    cursor?: EventLogWhereUniqueInput
    take?: number
    skip?: number
    distinct?: EventLogScalarFieldEnum | EventLogScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Location
   */

  export type AggregateLocation = {
    _count: LocationCountAggregateOutputType | null
    _avg: LocationAvgAggregateOutputType | null
    _sum: LocationSumAggregateOutputType | null
    _min: LocationMinAggregateOutputType | null
    _max: LocationMaxAggregateOutputType | null
  }

  export type LocationAvgAggregateOutputType = {
    id: number | null
  }

  export type LocationSumAggregateOutputType = {
    id: bigint | null
  }

  export type LocationMinAggregateOutputType = {
    id: bigint | null
    loc_name: string | null
  }

  export type LocationMaxAggregateOutputType = {
    id: bigint | null
    loc_name: string | null
  }

  export type LocationCountAggregateOutputType = {
    id: number
    loc_name: number
    _all: number
  }


  export type LocationAvgAggregateInputType = {
    id?: true
  }

  export type LocationSumAggregateInputType = {
    id?: true
  }

  export type LocationMinAggregateInputType = {
    id?: true
    loc_name?: true
  }

  export type LocationMaxAggregateInputType = {
    id?: true
    loc_name?: true
  }

  export type LocationCountAggregateInputType = {
    id?: true
    loc_name?: true
    _all?: true
  }

  export type LocationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Location to aggregate.
     */
    where?: LocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Locations to fetch.
     */
    orderBy?: LocationOrderByWithRelationInput | LocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Locations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Locations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Locations
    **/
    _count?: true | LocationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: LocationAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: LocationSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LocationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LocationMaxAggregateInputType
  }

  export type GetLocationAggregateType<T extends LocationAggregateArgs> = {
        [P in keyof T & keyof AggregateLocation]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLocation[P]>
      : GetScalarType<T[P], AggregateLocation[P]>
  }




  export type LocationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LocationWhereInput
    orderBy?: LocationOrderByWithAggregationInput | LocationOrderByWithAggregationInput[]
    by: LocationScalarFieldEnum[] | LocationScalarFieldEnum
    having?: LocationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LocationCountAggregateInputType | true
    _avg?: LocationAvgAggregateInputType
    _sum?: LocationSumAggregateInputType
    _min?: LocationMinAggregateInputType
    _max?: LocationMaxAggregateInputType
  }

  export type LocationGroupByOutputType = {
    id: bigint
    loc_name: string
    _count: LocationCountAggregateOutputType | null
    _avg: LocationAvgAggregateOutputType | null
    _sum: LocationSumAggregateOutputType | null
    _min: LocationMinAggregateOutputType | null
    _max: LocationMaxAggregateOutputType | null
  }

  type GetLocationGroupByPayload<T extends LocationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LocationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LocationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LocationGroupByOutputType[P]>
            : GetScalarType<T[P], LocationGroupByOutputType[P]>
        }
      >
    >


  export type LocationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    loc_name?: boolean
    cameras?: boolean | Location$camerasArgs<ExtArgs>
    _count?: boolean | LocationCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["location"]>

  export type LocationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    loc_name?: boolean
  }, ExtArgs["result"]["location"]>

  export type LocationSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    loc_name?: boolean
  }, ExtArgs["result"]["location"]>

  export type LocationSelectScalar = {
    id?: boolean
    loc_name?: boolean
  }

  export type LocationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "loc_name", ExtArgs["result"]["location"]>
  export type LocationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    cameras?: boolean | Location$camerasArgs<ExtArgs>
    _count?: boolean | LocationCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type LocationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type LocationIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $LocationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Location"
    objects: {
      cameras: Prisma.$CameraPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: bigint
      loc_name: string
    }, ExtArgs["result"]["location"]>
    composites: {}
  }

  type LocationGetPayload<S extends boolean | null | undefined | LocationDefaultArgs> = $Result.GetResult<Prisma.$LocationPayload, S>

  type LocationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<LocationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: LocationCountAggregateInputType | true
    }

  export interface LocationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Location'], meta: { name: 'Location' } }
    /**
     * Find zero or one Location that matches the filter.
     * @param {LocationFindUniqueArgs} args - Arguments to find a Location
     * @example
     * // Get one Location
     * const location = await prisma.location.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LocationFindUniqueArgs>(args: SelectSubset<T, LocationFindUniqueArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Location that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {LocationFindUniqueOrThrowArgs} args - Arguments to find a Location
     * @example
     * // Get one Location
     * const location = await prisma.location.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LocationFindUniqueOrThrowArgs>(args: SelectSubset<T, LocationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Location that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationFindFirstArgs} args - Arguments to find a Location
     * @example
     * // Get one Location
     * const location = await prisma.location.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LocationFindFirstArgs>(args?: SelectSubset<T, LocationFindFirstArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Location that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationFindFirstOrThrowArgs} args - Arguments to find a Location
     * @example
     * // Get one Location
     * const location = await prisma.location.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LocationFindFirstOrThrowArgs>(args?: SelectSubset<T, LocationFindFirstOrThrowArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Locations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Locations
     * const locations = await prisma.location.findMany()
     * 
     * // Get first 10 Locations
     * const locations = await prisma.location.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const locationWithIdOnly = await prisma.location.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LocationFindManyArgs>(args?: SelectSubset<T, LocationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Location.
     * @param {LocationCreateArgs} args - Arguments to create a Location.
     * @example
     * // Create one Location
     * const Location = await prisma.location.create({
     *   data: {
     *     // ... data to create a Location
     *   }
     * })
     * 
     */
    create<T extends LocationCreateArgs>(args: SelectSubset<T, LocationCreateArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Locations.
     * @param {LocationCreateManyArgs} args - Arguments to create many Locations.
     * @example
     * // Create many Locations
     * const location = await prisma.location.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LocationCreateManyArgs>(args?: SelectSubset<T, LocationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Locations and returns the data saved in the database.
     * @param {LocationCreateManyAndReturnArgs} args - Arguments to create many Locations.
     * @example
     * // Create many Locations
     * const location = await prisma.location.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Locations and only return the `id`
     * const locationWithIdOnly = await prisma.location.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LocationCreateManyAndReturnArgs>(args?: SelectSubset<T, LocationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Location.
     * @param {LocationDeleteArgs} args - Arguments to delete one Location.
     * @example
     * // Delete one Location
     * const Location = await prisma.location.delete({
     *   where: {
     *     // ... filter to delete one Location
     *   }
     * })
     * 
     */
    delete<T extends LocationDeleteArgs>(args: SelectSubset<T, LocationDeleteArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Location.
     * @param {LocationUpdateArgs} args - Arguments to update one Location.
     * @example
     * // Update one Location
     * const location = await prisma.location.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LocationUpdateArgs>(args: SelectSubset<T, LocationUpdateArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Locations.
     * @param {LocationDeleteManyArgs} args - Arguments to filter Locations to delete.
     * @example
     * // Delete a few Locations
     * const { count } = await prisma.location.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LocationDeleteManyArgs>(args?: SelectSubset<T, LocationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Locations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Locations
     * const location = await prisma.location.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LocationUpdateManyArgs>(args: SelectSubset<T, LocationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Locations and returns the data updated in the database.
     * @param {LocationUpdateManyAndReturnArgs} args - Arguments to update many Locations.
     * @example
     * // Update many Locations
     * const location = await prisma.location.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Locations and only return the `id`
     * const locationWithIdOnly = await prisma.location.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends LocationUpdateManyAndReturnArgs>(args: SelectSubset<T, LocationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Location.
     * @param {LocationUpsertArgs} args - Arguments to update or create a Location.
     * @example
     * // Update or create a Location
     * const location = await prisma.location.upsert({
     *   create: {
     *     // ... data to create a Location
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Location we want to update
     *   }
     * })
     */
    upsert<T extends LocationUpsertArgs>(args: SelectSubset<T, LocationUpsertArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Locations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationCountArgs} args - Arguments to filter Locations to count.
     * @example
     * // Count the number of Locations
     * const count = await prisma.location.count({
     *   where: {
     *     // ... the filter for the Locations we want to count
     *   }
     * })
    **/
    count<T extends LocationCountArgs>(
      args?: Subset<T, LocationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LocationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Location.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends LocationAggregateArgs>(args: Subset<T, LocationAggregateArgs>): Prisma.PrismaPromise<GetLocationAggregateType<T>>

    /**
     * Group by Location.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends LocationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LocationGroupByArgs['orderBy'] }
        : { orderBy?: LocationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, LocationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLocationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Location model
   */
  readonly fields: LocationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Location.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LocationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    cameras<T extends Location$camerasArgs<ExtArgs> = {}>(args?: Subset<T, Location$camerasArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CameraPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Location model
   */
  interface LocationFieldRefs {
    readonly id: FieldRef<"Location", 'BigInt'>
    readonly loc_name: FieldRef<"Location", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Location findUnique
   */
  export type LocationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * Filter, which Location to fetch.
     */
    where: LocationWhereUniqueInput
  }

  /**
   * Location findUniqueOrThrow
   */
  export type LocationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * Filter, which Location to fetch.
     */
    where: LocationWhereUniqueInput
  }

  /**
   * Location findFirst
   */
  export type LocationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * Filter, which Location to fetch.
     */
    where?: LocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Locations to fetch.
     */
    orderBy?: LocationOrderByWithRelationInput | LocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Locations.
     */
    cursor?: LocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Locations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Locations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Locations.
     */
    distinct?: LocationScalarFieldEnum | LocationScalarFieldEnum[]
  }

  /**
   * Location findFirstOrThrow
   */
  export type LocationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * Filter, which Location to fetch.
     */
    where?: LocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Locations to fetch.
     */
    orderBy?: LocationOrderByWithRelationInput | LocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Locations.
     */
    cursor?: LocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Locations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Locations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Locations.
     */
    distinct?: LocationScalarFieldEnum | LocationScalarFieldEnum[]
  }

  /**
   * Location findMany
   */
  export type LocationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * Filter, which Locations to fetch.
     */
    where?: LocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Locations to fetch.
     */
    orderBy?: LocationOrderByWithRelationInput | LocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Locations.
     */
    cursor?: LocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Locations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Locations.
     */
    skip?: number
    distinct?: LocationScalarFieldEnum | LocationScalarFieldEnum[]
  }

  /**
   * Location create
   */
  export type LocationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * The data needed to create a Location.
     */
    data: XOR<LocationCreateInput, LocationUncheckedCreateInput>
  }

  /**
   * Location createMany
   */
  export type LocationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Locations.
     */
    data: LocationCreateManyInput | LocationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Location createManyAndReturn
   */
  export type LocationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * The data used to create many Locations.
     */
    data: LocationCreateManyInput | LocationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Location update
   */
  export type LocationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * The data needed to update a Location.
     */
    data: XOR<LocationUpdateInput, LocationUncheckedUpdateInput>
    /**
     * Choose, which Location to update.
     */
    where: LocationWhereUniqueInput
  }

  /**
   * Location updateMany
   */
  export type LocationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Locations.
     */
    data: XOR<LocationUpdateManyMutationInput, LocationUncheckedUpdateManyInput>
    /**
     * Filter which Locations to update
     */
    where?: LocationWhereInput
    /**
     * Limit how many Locations to update.
     */
    limit?: number
  }

  /**
   * Location updateManyAndReturn
   */
  export type LocationUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * The data used to update Locations.
     */
    data: XOR<LocationUpdateManyMutationInput, LocationUncheckedUpdateManyInput>
    /**
     * Filter which Locations to update
     */
    where?: LocationWhereInput
    /**
     * Limit how many Locations to update.
     */
    limit?: number
  }

  /**
   * Location upsert
   */
  export type LocationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * The filter to search for the Location to update in case it exists.
     */
    where: LocationWhereUniqueInput
    /**
     * In case the Location found by the `where` argument doesn't exist, create a new Location with this data.
     */
    create: XOR<LocationCreateInput, LocationUncheckedCreateInput>
    /**
     * In case the Location was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LocationUpdateInput, LocationUncheckedUpdateInput>
  }

  /**
   * Location delete
   */
  export type LocationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * Filter which Location to delete.
     */
    where: LocationWhereUniqueInput
  }

  /**
   * Location deleteMany
   */
  export type LocationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Locations to delete
     */
    where?: LocationWhereInput
    /**
     * Limit how many Locations to delete.
     */
    limit?: number
  }

  /**
   * Location.cameras
   */
  export type Location$camerasArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Camera
     */
    select?: CameraSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Camera
     */
    omit?: CameraOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CameraInclude<ExtArgs> | null
    where?: CameraWhereInput
    orderBy?: CameraOrderByWithRelationInput | CameraOrderByWithRelationInput[]
    cursor?: CameraWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CameraScalarFieldEnum | CameraScalarFieldEnum[]
  }

  /**
   * Location without action
   */
  export type LocationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
  }


  /**
   * Model EventType
   */

  export type AggregateEventType = {
    _count: EventTypeCountAggregateOutputType | null
    _avg: EventTypeAvgAggregateOutputType | null
    _sum: EventTypeSumAggregateOutputType | null
    _min: EventTypeMinAggregateOutputType | null
    _max: EventTypeMaxAggregateOutputType | null
  }

  export type EventTypeAvgAggregateOutputType = {
    id: number | null
  }

  export type EventTypeSumAggregateOutputType = {
    id: bigint | null
  }

  export type EventTypeMinAggregateOutputType = {
    id: bigint | null
    event_type_name: string | null
  }

  export type EventTypeMaxAggregateOutputType = {
    id: bigint | null
    event_type_name: string | null
  }

  export type EventTypeCountAggregateOutputType = {
    id: number
    event_type_name: number
    _all: number
  }


  export type EventTypeAvgAggregateInputType = {
    id?: true
  }

  export type EventTypeSumAggregateInputType = {
    id?: true
  }

  export type EventTypeMinAggregateInputType = {
    id?: true
    event_type_name?: true
  }

  export type EventTypeMaxAggregateInputType = {
    id?: true
    event_type_name?: true
  }

  export type EventTypeCountAggregateInputType = {
    id?: true
    event_type_name?: true
    _all?: true
  }

  export type EventTypeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EventType to aggregate.
     */
    where?: EventTypeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventTypes to fetch.
     */
    orderBy?: EventTypeOrderByWithRelationInput | EventTypeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: EventTypeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventTypes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventTypes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned EventTypes
    **/
    _count?: true | EventTypeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: EventTypeAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: EventTypeSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: EventTypeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: EventTypeMaxAggregateInputType
  }

  export type GetEventTypeAggregateType<T extends EventTypeAggregateArgs> = {
        [P in keyof T & keyof AggregateEventType]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEventType[P]>
      : GetScalarType<T[P], AggregateEventType[P]>
  }




  export type EventTypeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EventTypeWhereInput
    orderBy?: EventTypeOrderByWithAggregationInput | EventTypeOrderByWithAggregationInput[]
    by: EventTypeScalarFieldEnum[] | EventTypeScalarFieldEnum
    having?: EventTypeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: EventTypeCountAggregateInputType | true
    _avg?: EventTypeAvgAggregateInputType
    _sum?: EventTypeSumAggregateInputType
    _min?: EventTypeMinAggregateInputType
    _max?: EventTypeMaxAggregateInputType
  }

  export type EventTypeGroupByOutputType = {
    id: bigint
    event_type_name: string
    _count: EventTypeCountAggregateOutputType | null
    _avg: EventTypeAvgAggregateOutputType | null
    _sum: EventTypeSumAggregateOutputType | null
    _min: EventTypeMinAggregateOutputType | null
    _max: EventTypeMaxAggregateOutputType | null
  }

  type GetEventTypeGroupByPayload<T extends EventTypeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EventTypeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof EventTypeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EventTypeGroupByOutputType[P]>
            : GetScalarType<T[P], EventTypeGroupByOutputType[P]>
        }
      >
    >


  export type EventTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    event_type_name?: boolean
    classes?: boolean | EventType$classesArgs<ExtArgs>
    _count?: boolean | EventTypeCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["eventType"]>

  export type EventTypeSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    event_type_name?: boolean
  }, ExtArgs["result"]["eventType"]>

  export type EventTypeSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    event_type_name?: boolean
  }, ExtArgs["result"]["eventType"]>

  export type EventTypeSelectScalar = {
    id?: boolean
    event_type_name?: boolean
  }

  export type EventTypeOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "event_type_name", ExtArgs["result"]["eventType"]>
  export type EventTypeInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    classes?: boolean | EventType$classesArgs<ExtArgs>
    _count?: boolean | EventTypeCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type EventTypeIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type EventTypeIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $EventTypePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "EventType"
    objects: {
      classes: Prisma.$EventClassPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: bigint
      event_type_name: string
    }, ExtArgs["result"]["eventType"]>
    composites: {}
  }

  type EventTypeGetPayload<S extends boolean | null | undefined | EventTypeDefaultArgs> = $Result.GetResult<Prisma.$EventTypePayload, S>

  type EventTypeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<EventTypeFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: EventTypeCountAggregateInputType | true
    }

  export interface EventTypeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['EventType'], meta: { name: 'EventType' } }
    /**
     * Find zero or one EventType that matches the filter.
     * @param {EventTypeFindUniqueArgs} args - Arguments to find a EventType
     * @example
     * // Get one EventType
     * const eventType = await prisma.eventType.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EventTypeFindUniqueArgs>(args: SelectSubset<T, EventTypeFindUniqueArgs<ExtArgs>>): Prisma__EventTypeClient<$Result.GetResult<Prisma.$EventTypePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one EventType that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {EventTypeFindUniqueOrThrowArgs} args - Arguments to find a EventType
     * @example
     * // Get one EventType
     * const eventType = await prisma.eventType.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EventTypeFindUniqueOrThrowArgs>(args: SelectSubset<T, EventTypeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__EventTypeClient<$Result.GetResult<Prisma.$EventTypePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first EventType that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventTypeFindFirstArgs} args - Arguments to find a EventType
     * @example
     * // Get one EventType
     * const eventType = await prisma.eventType.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EventTypeFindFirstArgs>(args?: SelectSubset<T, EventTypeFindFirstArgs<ExtArgs>>): Prisma__EventTypeClient<$Result.GetResult<Prisma.$EventTypePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first EventType that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventTypeFindFirstOrThrowArgs} args - Arguments to find a EventType
     * @example
     * // Get one EventType
     * const eventType = await prisma.eventType.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EventTypeFindFirstOrThrowArgs>(args?: SelectSubset<T, EventTypeFindFirstOrThrowArgs<ExtArgs>>): Prisma__EventTypeClient<$Result.GetResult<Prisma.$EventTypePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more EventTypes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventTypeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all EventTypes
     * const eventTypes = await prisma.eventType.findMany()
     * 
     * // Get first 10 EventTypes
     * const eventTypes = await prisma.eventType.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const eventTypeWithIdOnly = await prisma.eventType.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends EventTypeFindManyArgs>(args?: SelectSubset<T, EventTypeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventTypePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a EventType.
     * @param {EventTypeCreateArgs} args - Arguments to create a EventType.
     * @example
     * // Create one EventType
     * const EventType = await prisma.eventType.create({
     *   data: {
     *     // ... data to create a EventType
     *   }
     * })
     * 
     */
    create<T extends EventTypeCreateArgs>(args: SelectSubset<T, EventTypeCreateArgs<ExtArgs>>): Prisma__EventTypeClient<$Result.GetResult<Prisma.$EventTypePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many EventTypes.
     * @param {EventTypeCreateManyArgs} args - Arguments to create many EventTypes.
     * @example
     * // Create many EventTypes
     * const eventType = await prisma.eventType.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends EventTypeCreateManyArgs>(args?: SelectSubset<T, EventTypeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many EventTypes and returns the data saved in the database.
     * @param {EventTypeCreateManyAndReturnArgs} args - Arguments to create many EventTypes.
     * @example
     * // Create many EventTypes
     * const eventType = await prisma.eventType.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many EventTypes and only return the `id`
     * const eventTypeWithIdOnly = await prisma.eventType.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends EventTypeCreateManyAndReturnArgs>(args?: SelectSubset<T, EventTypeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventTypePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a EventType.
     * @param {EventTypeDeleteArgs} args - Arguments to delete one EventType.
     * @example
     * // Delete one EventType
     * const EventType = await prisma.eventType.delete({
     *   where: {
     *     // ... filter to delete one EventType
     *   }
     * })
     * 
     */
    delete<T extends EventTypeDeleteArgs>(args: SelectSubset<T, EventTypeDeleteArgs<ExtArgs>>): Prisma__EventTypeClient<$Result.GetResult<Prisma.$EventTypePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one EventType.
     * @param {EventTypeUpdateArgs} args - Arguments to update one EventType.
     * @example
     * // Update one EventType
     * const eventType = await prisma.eventType.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends EventTypeUpdateArgs>(args: SelectSubset<T, EventTypeUpdateArgs<ExtArgs>>): Prisma__EventTypeClient<$Result.GetResult<Prisma.$EventTypePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more EventTypes.
     * @param {EventTypeDeleteManyArgs} args - Arguments to filter EventTypes to delete.
     * @example
     * // Delete a few EventTypes
     * const { count } = await prisma.eventType.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends EventTypeDeleteManyArgs>(args?: SelectSubset<T, EventTypeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more EventTypes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventTypeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many EventTypes
     * const eventType = await prisma.eventType.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends EventTypeUpdateManyArgs>(args: SelectSubset<T, EventTypeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more EventTypes and returns the data updated in the database.
     * @param {EventTypeUpdateManyAndReturnArgs} args - Arguments to update many EventTypes.
     * @example
     * // Update many EventTypes
     * const eventType = await prisma.eventType.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more EventTypes and only return the `id`
     * const eventTypeWithIdOnly = await prisma.eventType.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends EventTypeUpdateManyAndReturnArgs>(args: SelectSubset<T, EventTypeUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventTypePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one EventType.
     * @param {EventTypeUpsertArgs} args - Arguments to update or create a EventType.
     * @example
     * // Update or create a EventType
     * const eventType = await prisma.eventType.upsert({
     *   create: {
     *     // ... data to create a EventType
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the EventType we want to update
     *   }
     * })
     */
    upsert<T extends EventTypeUpsertArgs>(args: SelectSubset<T, EventTypeUpsertArgs<ExtArgs>>): Prisma__EventTypeClient<$Result.GetResult<Prisma.$EventTypePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of EventTypes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventTypeCountArgs} args - Arguments to filter EventTypes to count.
     * @example
     * // Count the number of EventTypes
     * const count = await prisma.eventType.count({
     *   where: {
     *     // ... the filter for the EventTypes we want to count
     *   }
     * })
    **/
    count<T extends EventTypeCountArgs>(
      args?: Subset<T, EventTypeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], EventTypeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a EventType.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventTypeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends EventTypeAggregateArgs>(args: Subset<T, EventTypeAggregateArgs>): Prisma.PrismaPromise<GetEventTypeAggregateType<T>>

    /**
     * Group by EventType.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventTypeGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends EventTypeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EventTypeGroupByArgs['orderBy'] }
        : { orderBy?: EventTypeGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, EventTypeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEventTypeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the EventType model
   */
  readonly fields: EventTypeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for EventType.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EventTypeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    classes<T extends EventType$classesArgs<ExtArgs> = {}>(args?: Subset<T, EventType$classesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventClassPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the EventType model
   */
  interface EventTypeFieldRefs {
    readonly id: FieldRef<"EventType", 'BigInt'>
    readonly event_type_name: FieldRef<"EventType", 'String'>
  }
    

  // Custom InputTypes
  /**
   * EventType findUnique
   */
  export type EventTypeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventType
     */
    select?: EventTypeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventType
     */
    omit?: EventTypeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventTypeInclude<ExtArgs> | null
    /**
     * Filter, which EventType to fetch.
     */
    where: EventTypeWhereUniqueInput
  }

  /**
   * EventType findUniqueOrThrow
   */
  export type EventTypeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventType
     */
    select?: EventTypeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventType
     */
    omit?: EventTypeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventTypeInclude<ExtArgs> | null
    /**
     * Filter, which EventType to fetch.
     */
    where: EventTypeWhereUniqueInput
  }

  /**
   * EventType findFirst
   */
  export type EventTypeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventType
     */
    select?: EventTypeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventType
     */
    omit?: EventTypeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventTypeInclude<ExtArgs> | null
    /**
     * Filter, which EventType to fetch.
     */
    where?: EventTypeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventTypes to fetch.
     */
    orderBy?: EventTypeOrderByWithRelationInput | EventTypeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EventTypes.
     */
    cursor?: EventTypeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventTypes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventTypes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EventTypes.
     */
    distinct?: EventTypeScalarFieldEnum | EventTypeScalarFieldEnum[]
  }

  /**
   * EventType findFirstOrThrow
   */
  export type EventTypeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventType
     */
    select?: EventTypeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventType
     */
    omit?: EventTypeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventTypeInclude<ExtArgs> | null
    /**
     * Filter, which EventType to fetch.
     */
    where?: EventTypeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventTypes to fetch.
     */
    orderBy?: EventTypeOrderByWithRelationInput | EventTypeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EventTypes.
     */
    cursor?: EventTypeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventTypes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventTypes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EventTypes.
     */
    distinct?: EventTypeScalarFieldEnum | EventTypeScalarFieldEnum[]
  }

  /**
   * EventType findMany
   */
  export type EventTypeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventType
     */
    select?: EventTypeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventType
     */
    omit?: EventTypeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventTypeInclude<ExtArgs> | null
    /**
     * Filter, which EventTypes to fetch.
     */
    where?: EventTypeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventTypes to fetch.
     */
    orderBy?: EventTypeOrderByWithRelationInput | EventTypeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing EventTypes.
     */
    cursor?: EventTypeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventTypes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventTypes.
     */
    skip?: number
    distinct?: EventTypeScalarFieldEnum | EventTypeScalarFieldEnum[]
  }

  /**
   * EventType create
   */
  export type EventTypeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventType
     */
    select?: EventTypeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventType
     */
    omit?: EventTypeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventTypeInclude<ExtArgs> | null
    /**
     * The data needed to create a EventType.
     */
    data: XOR<EventTypeCreateInput, EventTypeUncheckedCreateInput>
  }

  /**
   * EventType createMany
   */
  export type EventTypeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many EventTypes.
     */
    data: EventTypeCreateManyInput | EventTypeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * EventType createManyAndReturn
   */
  export type EventTypeCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventType
     */
    select?: EventTypeSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the EventType
     */
    omit?: EventTypeOmit<ExtArgs> | null
    /**
     * The data used to create many EventTypes.
     */
    data: EventTypeCreateManyInput | EventTypeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * EventType update
   */
  export type EventTypeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventType
     */
    select?: EventTypeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventType
     */
    omit?: EventTypeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventTypeInclude<ExtArgs> | null
    /**
     * The data needed to update a EventType.
     */
    data: XOR<EventTypeUpdateInput, EventTypeUncheckedUpdateInput>
    /**
     * Choose, which EventType to update.
     */
    where: EventTypeWhereUniqueInput
  }

  /**
   * EventType updateMany
   */
  export type EventTypeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update EventTypes.
     */
    data: XOR<EventTypeUpdateManyMutationInput, EventTypeUncheckedUpdateManyInput>
    /**
     * Filter which EventTypes to update
     */
    where?: EventTypeWhereInput
    /**
     * Limit how many EventTypes to update.
     */
    limit?: number
  }

  /**
   * EventType updateManyAndReturn
   */
  export type EventTypeUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventType
     */
    select?: EventTypeSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the EventType
     */
    omit?: EventTypeOmit<ExtArgs> | null
    /**
     * The data used to update EventTypes.
     */
    data: XOR<EventTypeUpdateManyMutationInput, EventTypeUncheckedUpdateManyInput>
    /**
     * Filter which EventTypes to update
     */
    where?: EventTypeWhereInput
    /**
     * Limit how many EventTypes to update.
     */
    limit?: number
  }

  /**
   * EventType upsert
   */
  export type EventTypeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventType
     */
    select?: EventTypeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventType
     */
    omit?: EventTypeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventTypeInclude<ExtArgs> | null
    /**
     * The filter to search for the EventType to update in case it exists.
     */
    where: EventTypeWhereUniqueInput
    /**
     * In case the EventType found by the `where` argument doesn't exist, create a new EventType with this data.
     */
    create: XOR<EventTypeCreateInput, EventTypeUncheckedCreateInput>
    /**
     * In case the EventType was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EventTypeUpdateInput, EventTypeUncheckedUpdateInput>
  }

  /**
   * EventType delete
   */
  export type EventTypeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventType
     */
    select?: EventTypeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventType
     */
    omit?: EventTypeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventTypeInclude<ExtArgs> | null
    /**
     * Filter which EventType to delete.
     */
    where: EventTypeWhereUniqueInput
  }

  /**
   * EventType deleteMany
   */
  export type EventTypeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EventTypes to delete
     */
    where?: EventTypeWhereInput
    /**
     * Limit how many EventTypes to delete.
     */
    limit?: number
  }

  /**
   * EventType.classes
   */
  export type EventType$classesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventClass
     */
    select?: EventClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventClass
     */
    omit?: EventClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventClassInclude<ExtArgs> | null
    where?: EventClassWhereInput
    orderBy?: EventClassOrderByWithRelationInput | EventClassOrderByWithRelationInput[]
    cursor?: EventClassWhereUniqueInput
    take?: number
    skip?: number
    distinct?: EventClassScalarFieldEnum | EventClassScalarFieldEnum[]
  }

  /**
   * EventType without action
   */
  export type EventTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventType
     */
    select?: EventTypeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventType
     */
    omit?: EventTypeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventTypeInclude<ExtArgs> | null
  }


  /**
   * Model EventClass
   */

  export type AggregateEventClass = {
    _count: EventClassCountAggregateOutputType | null
    _avg: EventClassAvgAggregateOutputType | null
    _sum: EventClassSumAggregateOutputType | null
    _min: EventClassMinAggregateOutputType | null
    _max: EventClassMaxAggregateOutputType | null
  }

  export type EventClassAvgAggregateOutputType = {
    id: number | null
    event_type_id: number | null
  }

  export type EventClassSumAggregateOutputType = {
    id: bigint | null
    event_type_id: bigint | null
  }

  export type EventClassMinAggregateOutputType = {
    id: bigint | null
    class_name: string | null
    event_type_id: bigint | null
  }

  export type EventClassMaxAggregateOutputType = {
    id: bigint | null
    class_name: string | null
    event_type_id: bigint | null
  }

  export type EventClassCountAggregateOutputType = {
    id: number
    class_name: number
    event_type_id: number
    _all: number
  }


  export type EventClassAvgAggregateInputType = {
    id?: true
    event_type_id?: true
  }

  export type EventClassSumAggregateInputType = {
    id?: true
    event_type_id?: true
  }

  export type EventClassMinAggregateInputType = {
    id?: true
    class_name?: true
    event_type_id?: true
  }

  export type EventClassMaxAggregateInputType = {
    id?: true
    class_name?: true
    event_type_id?: true
  }

  export type EventClassCountAggregateInputType = {
    id?: true
    class_name?: true
    event_type_id?: true
    _all?: true
  }

  export type EventClassAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EventClass to aggregate.
     */
    where?: EventClassWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventClasses to fetch.
     */
    orderBy?: EventClassOrderByWithRelationInput | EventClassOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: EventClassWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventClasses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventClasses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned EventClasses
    **/
    _count?: true | EventClassCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: EventClassAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: EventClassSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: EventClassMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: EventClassMaxAggregateInputType
  }

  export type GetEventClassAggregateType<T extends EventClassAggregateArgs> = {
        [P in keyof T & keyof AggregateEventClass]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEventClass[P]>
      : GetScalarType<T[P], AggregateEventClass[P]>
  }




  export type EventClassGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EventClassWhereInput
    orderBy?: EventClassOrderByWithAggregationInput | EventClassOrderByWithAggregationInput[]
    by: EventClassScalarFieldEnum[] | EventClassScalarFieldEnum
    having?: EventClassScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: EventClassCountAggregateInputType | true
    _avg?: EventClassAvgAggregateInputType
    _sum?: EventClassSumAggregateInputType
    _min?: EventClassMinAggregateInputType
    _max?: EventClassMaxAggregateInputType
  }

  export type EventClassGroupByOutputType = {
    id: bigint
    class_name: string
    event_type_id: bigint
    _count: EventClassCountAggregateOutputType | null
    _avg: EventClassAvgAggregateOutputType | null
    _sum: EventClassSumAggregateOutputType | null
    _min: EventClassMinAggregateOutputType | null
    _max: EventClassMaxAggregateOutputType | null
  }

  type GetEventClassGroupByPayload<T extends EventClassGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EventClassGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof EventClassGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EventClassGroupByOutputType[P]>
            : GetScalarType<T[P], EventClassGroupByOutputType[P]>
        }
      >
    >


  export type EventClassSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    class_name?: boolean
    event_type_id?: boolean
    event_type?: boolean | EventTypeDefaultArgs<ExtArgs>
    logs?: boolean | EventClass$logsArgs<ExtArgs>
    _count?: boolean | EventClassCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["eventClass"]>

  export type EventClassSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    class_name?: boolean
    event_type_id?: boolean
    event_type?: boolean | EventTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["eventClass"]>

  export type EventClassSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    class_name?: boolean
    event_type_id?: boolean
    event_type?: boolean | EventTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["eventClass"]>

  export type EventClassSelectScalar = {
    id?: boolean
    class_name?: boolean
    event_type_id?: boolean
  }

  export type EventClassOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "class_name" | "event_type_id", ExtArgs["result"]["eventClass"]>
  export type EventClassInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    event_type?: boolean | EventTypeDefaultArgs<ExtArgs>
    logs?: boolean | EventClass$logsArgs<ExtArgs>
    _count?: boolean | EventClassCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type EventClassIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    event_type?: boolean | EventTypeDefaultArgs<ExtArgs>
  }
  export type EventClassIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    event_type?: boolean | EventTypeDefaultArgs<ExtArgs>
  }

  export type $EventClassPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "EventClass"
    objects: {
      event_type: Prisma.$EventTypePayload<ExtArgs>
      logs: Prisma.$EventLogPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: bigint
      class_name: string
      event_type_id: bigint
    }, ExtArgs["result"]["eventClass"]>
    composites: {}
  }

  type EventClassGetPayload<S extends boolean | null | undefined | EventClassDefaultArgs> = $Result.GetResult<Prisma.$EventClassPayload, S>

  type EventClassCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<EventClassFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: EventClassCountAggregateInputType | true
    }

  export interface EventClassDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['EventClass'], meta: { name: 'EventClass' } }
    /**
     * Find zero or one EventClass that matches the filter.
     * @param {EventClassFindUniqueArgs} args - Arguments to find a EventClass
     * @example
     * // Get one EventClass
     * const eventClass = await prisma.eventClass.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EventClassFindUniqueArgs>(args: SelectSubset<T, EventClassFindUniqueArgs<ExtArgs>>): Prisma__EventClassClient<$Result.GetResult<Prisma.$EventClassPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one EventClass that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {EventClassFindUniqueOrThrowArgs} args - Arguments to find a EventClass
     * @example
     * // Get one EventClass
     * const eventClass = await prisma.eventClass.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EventClassFindUniqueOrThrowArgs>(args: SelectSubset<T, EventClassFindUniqueOrThrowArgs<ExtArgs>>): Prisma__EventClassClient<$Result.GetResult<Prisma.$EventClassPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first EventClass that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventClassFindFirstArgs} args - Arguments to find a EventClass
     * @example
     * // Get one EventClass
     * const eventClass = await prisma.eventClass.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EventClassFindFirstArgs>(args?: SelectSubset<T, EventClassFindFirstArgs<ExtArgs>>): Prisma__EventClassClient<$Result.GetResult<Prisma.$EventClassPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first EventClass that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventClassFindFirstOrThrowArgs} args - Arguments to find a EventClass
     * @example
     * // Get one EventClass
     * const eventClass = await prisma.eventClass.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EventClassFindFirstOrThrowArgs>(args?: SelectSubset<T, EventClassFindFirstOrThrowArgs<ExtArgs>>): Prisma__EventClassClient<$Result.GetResult<Prisma.$EventClassPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more EventClasses that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventClassFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all EventClasses
     * const eventClasses = await prisma.eventClass.findMany()
     * 
     * // Get first 10 EventClasses
     * const eventClasses = await prisma.eventClass.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const eventClassWithIdOnly = await prisma.eventClass.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends EventClassFindManyArgs>(args?: SelectSubset<T, EventClassFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventClassPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a EventClass.
     * @param {EventClassCreateArgs} args - Arguments to create a EventClass.
     * @example
     * // Create one EventClass
     * const EventClass = await prisma.eventClass.create({
     *   data: {
     *     // ... data to create a EventClass
     *   }
     * })
     * 
     */
    create<T extends EventClassCreateArgs>(args: SelectSubset<T, EventClassCreateArgs<ExtArgs>>): Prisma__EventClassClient<$Result.GetResult<Prisma.$EventClassPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many EventClasses.
     * @param {EventClassCreateManyArgs} args - Arguments to create many EventClasses.
     * @example
     * // Create many EventClasses
     * const eventClass = await prisma.eventClass.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends EventClassCreateManyArgs>(args?: SelectSubset<T, EventClassCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many EventClasses and returns the data saved in the database.
     * @param {EventClassCreateManyAndReturnArgs} args - Arguments to create many EventClasses.
     * @example
     * // Create many EventClasses
     * const eventClass = await prisma.eventClass.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many EventClasses and only return the `id`
     * const eventClassWithIdOnly = await prisma.eventClass.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends EventClassCreateManyAndReturnArgs>(args?: SelectSubset<T, EventClassCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventClassPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a EventClass.
     * @param {EventClassDeleteArgs} args - Arguments to delete one EventClass.
     * @example
     * // Delete one EventClass
     * const EventClass = await prisma.eventClass.delete({
     *   where: {
     *     // ... filter to delete one EventClass
     *   }
     * })
     * 
     */
    delete<T extends EventClassDeleteArgs>(args: SelectSubset<T, EventClassDeleteArgs<ExtArgs>>): Prisma__EventClassClient<$Result.GetResult<Prisma.$EventClassPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one EventClass.
     * @param {EventClassUpdateArgs} args - Arguments to update one EventClass.
     * @example
     * // Update one EventClass
     * const eventClass = await prisma.eventClass.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends EventClassUpdateArgs>(args: SelectSubset<T, EventClassUpdateArgs<ExtArgs>>): Prisma__EventClassClient<$Result.GetResult<Prisma.$EventClassPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more EventClasses.
     * @param {EventClassDeleteManyArgs} args - Arguments to filter EventClasses to delete.
     * @example
     * // Delete a few EventClasses
     * const { count } = await prisma.eventClass.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends EventClassDeleteManyArgs>(args?: SelectSubset<T, EventClassDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more EventClasses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventClassUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many EventClasses
     * const eventClass = await prisma.eventClass.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends EventClassUpdateManyArgs>(args: SelectSubset<T, EventClassUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more EventClasses and returns the data updated in the database.
     * @param {EventClassUpdateManyAndReturnArgs} args - Arguments to update many EventClasses.
     * @example
     * // Update many EventClasses
     * const eventClass = await prisma.eventClass.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more EventClasses and only return the `id`
     * const eventClassWithIdOnly = await prisma.eventClass.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends EventClassUpdateManyAndReturnArgs>(args: SelectSubset<T, EventClassUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventClassPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one EventClass.
     * @param {EventClassUpsertArgs} args - Arguments to update or create a EventClass.
     * @example
     * // Update or create a EventClass
     * const eventClass = await prisma.eventClass.upsert({
     *   create: {
     *     // ... data to create a EventClass
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the EventClass we want to update
     *   }
     * })
     */
    upsert<T extends EventClassUpsertArgs>(args: SelectSubset<T, EventClassUpsertArgs<ExtArgs>>): Prisma__EventClassClient<$Result.GetResult<Prisma.$EventClassPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of EventClasses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventClassCountArgs} args - Arguments to filter EventClasses to count.
     * @example
     * // Count the number of EventClasses
     * const count = await prisma.eventClass.count({
     *   where: {
     *     // ... the filter for the EventClasses we want to count
     *   }
     * })
    **/
    count<T extends EventClassCountArgs>(
      args?: Subset<T, EventClassCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], EventClassCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a EventClass.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventClassAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends EventClassAggregateArgs>(args: Subset<T, EventClassAggregateArgs>): Prisma.PrismaPromise<GetEventClassAggregateType<T>>

    /**
     * Group by EventClass.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventClassGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends EventClassGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EventClassGroupByArgs['orderBy'] }
        : { orderBy?: EventClassGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, EventClassGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEventClassGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the EventClass model
   */
  readonly fields: EventClassFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for EventClass.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EventClassClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    event_type<T extends EventTypeDefaultArgs<ExtArgs> = {}>(args?: Subset<T, EventTypeDefaultArgs<ExtArgs>>): Prisma__EventTypeClient<$Result.GetResult<Prisma.$EventTypePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    logs<T extends EventClass$logsArgs<ExtArgs> = {}>(args?: Subset<T, EventClass$logsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the EventClass model
   */
  interface EventClassFieldRefs {
    readonly id: FieldRef<"EventClass", 'BigInt'>
    readonly class_name: FieldRef<"EventClass", 'String'>
    readonly event_type_id: FieldRef<"EventClass", 'BigInt'>
  }
    

  // Custom InputTypes
  /**
   * EventClass findUnique
   */
  export type EventClassFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventClass
     */
    select?: EventClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventClass
     */
    omit?: EventClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventClassInclude<ExtArgs> | null
    /**
     * Filter, which EventClass to fetch.
     */
    where: EventClassWhereUniqueInput
  }

  /**
   * EventClass findUniqueOrThrow
   */
  export type EventClassFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventClass
     */
    select?: EventClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventClass
     */
    omit?: EventClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventClassInclude<ExtArgs> | null
    /**
     * Filter, which EventClass to fetch.
     */
    where: EventClassWhereUniqueInput
  }

  /**
   * EventClass findFirst
   */
  export type EventClassFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventClass
     */
    select?: EventClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventClass
     */
    omit?: EventClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventClassInclude<ExtArgs> | null
    /**
     * Filter, which EventClass to fetch.
     */
    where?: EventClassWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventClasses to fetch.
     */
    orderBy?: EventClassOrderByWithRelationInput | EventClassOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EventClasses.
     */
    cursor?: EventClassWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventClasses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventClasses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EventClasses.
     */
    distinct?: EventClassScalarFieldEnum | EventClassScalarFieldEnum[]
  }

  /**
   * EventClass findFirstOrThrow
   */
  export type EventClassFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventClass
     */
    select?: EventClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventClass
     */
    omit?: EventClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventClassInclude<ExtArgs> | null
    /**
     * Filter, which EventClass to fetch.
     */
    where?: EventClassWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventClasses to fetch.
     */
    orderBy?: EventClassOrderByWithRelationInput | EventClassOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EventClasses.
     */
    cursor?: EventClassWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventClasses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventClasses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EventClasses.
     */
    distinct?: EventClassScalarFieldEnum | EventClassScalarFieldEnum[]
  }

  /**
   * EventClass findMany
   */
  export type EventClassFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventClass
     */
    select?: EventClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventClass
     */
    omit?: EventClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventClassInclude<ExtArgs> | null
    /**
     * Filter, which EventClasses to fetch.
     */
    where?: EventClassWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventClasses to fetch.
     */
    orderBy?: EventClassOrderByWithRelationInput | EventClassOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing EventClasses.
     */
    cursor?: EventClassWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventClasses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventClasses.
     */
    skip?: number
    distinct?: EventClassScalarFieldEnum | EventClassScalarFieldEnum[]
  }

  /**
   * EventClass create
   */
  export type EventClassCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventClass
     */
    select?: EventClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventClass
     */
    omit?: EventClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventClassInclude<ExtArgs> | null
    /**
     * The data needed to create a EventClass.
     */
    data: XOR<EventClassCreateInput, EventClassUncheckedCreateInput>
  }

  /**
   * EventClass createMany
   */
  export type EventClassCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many EventClasses.
     */
    data: EventClassCreateManyInput | EventClassCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * EventClass createManyAndReturn
   */
  export type EventClassCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventClass
     */
    select?: EventClassSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the EventClass
     */
    omit?: EventClassOmit<ExtArgs> | null
    /**
     * The data used to create many EventClasses.
     */
    data: EventClassCreateManyInput | EventClassCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventClassIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * EventClass update
   */
  export type EventClassUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventClass
     */
    select?: EventClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventClass
     */
    omit?: EventClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventClassInclude<ExtArgs> | null
    /**
     * The data needed to update a EventClass.
     */
    data: XOR<EventClassUpdateInput, EventClassUncheckedUpdateInput>
    /**
     * Choose, which EventClass to update.
     */
    where: EventClassWhereUniqueInput
  }

  /**
   * EventClass updateMany
   */
  export type EventClassUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update EventClasses.
     */
    data: XOR<EventClassUpdateManyMutationInput, EventClassUncheckedUpdateManyInput>
    /**
     * Filter which EventClasses to update
     */
    where?: EventClassWhereInput
    /**
     * Limit how many EventClasses to update.
     */
    limit?: number
  }

  /**
   * EventClass updateManyAndReturn
   */
  export type EventClassUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventClass
     */
    select?: EventClassSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the EventClass
     */
    omit?: EventClassOmit<ExtArgs> | null
    /**
     * The data used to update EventClasses.
     */
    data: XOR<EventClassUpdateManyMutationInput, EventClassUncheckedUpdateManyInput>
    /**
     * Filter which EventClasses to update
     */
    where?: EventClassWhereInput
    /**
     * Limit how many EventClasses to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventClassIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * EventClass upsert
   */
  export type EventClassUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventClass
     */
    select?: EventClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventClass
     */
    omit?: EventClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventClassInclude<ExtArgs> | null
    /**
     * The filter to search for the EventClass to update in case it exists.
     */
    where: EventClassWhereUniqueInput
    /**
     * In case the EventClass found by the `where` argument doesn't exist, create a new EventClass with this data.
     */
    create: XOR<EventClassCreateInput, EventClassUncheckedCreateInput>
    /**
     * In case the EventClass was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EventClassUpdateInput, EventClassUncheckedUpdateInput>
  }

  /**
   * EventClass delete
   */
  export type EventClassDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventClass
     */
    select?: EventClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventClass
     */
    omit?: EventClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventClassInclude<ExtArgs> | null
    /**
     * Filter which EventClass to delete.
     */
    where: EventClassWhereUniqueInput
  }

  /**
   * EventClass deleteMany
   */
  export type EventClassDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EventClasses to delete
     */
    where?: EventClassWhereInput
    /**
     * Limit how many EventClasses to delete.
     */
    limit?: number
  }

  /**
   * EventClass.logs
   */
  export type EventClass$logsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventLog
     */
    omit?: EventLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventLogInclude<ExtArgs> | null
    where?: EventLogWhereInput
    orderBy?: EventLogOrderByWithRelationInput | EventLogOrderByWithRelationInput[]
    cursor?: EventLogWhereUniqueInput
    take?: number
    skip?: number
    distinct?: EventLogScalarFieldEnum | EventLogScalarFieldEnum[]
  }

  /**
   * EventClass without action
   */
  export type EventClassDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventClass
     */
    select?: EventClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventClass
     */
    omit?: EventClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventClassInclude<ExtArgs> | null
  }


  /**
   * Model Camera
   */

  export type AggregateCamera = {
    _count: CameraCountAggregateOutputType | null
    _avg: CameraAvgAggregateOutputType | null
    _sum: CameraSumAggregateOutputType | null
    _min: CameraMinAggregateOutputType | null
    _max: CameraMaxAggregateOutputType | null
  }

  export type CameraAvgAggregateOutputType = {
    id: number | null
    loc_id: number | null
  }

  export type CameraSumAggregateOutputType = {
    id: bigint | null
    loc_id: bigint | null
  }

  export type CameraMinAggregateOutputType = {
    id: bigint | null
    cam_name: string | null
    cam_status: boolean | null
    stream_url: string | null
    loc_id: bigint | null
  }

  export type CameraMaxAggregateOutputType = {
    id: bigint | null
    cam_name: string | null
    cam_status: boolean | null
    stream_url: string | null
    loc_id: bigint | null
  }

  export type CameraCountAggregateOutputType = {
    id: number
    cam_name: number
    cam_status: number
    stream_url: number
    loc_id: number
    _all: number
  }


  export type CameraAvgAggregateInputType = {
    id?: true
    loc_id?: true
  }

  export type CameraSumAggregateInputType = {
    id?: true
    loc_id?: true
  }

  export type CameraMinAggregateInputType = {
    id?: true
    cam_name?: true
    cam_status?: true
    stream_url?: true
    loc_id?: true
  }

  export type CameraMaxAggregateInputType = {
    id?: true
    cam_name?: true
    cam_status?: true
    stream_url?: true
    loc_id?: true
  }

  export type CameraCountAggregateInputType = {
    id?: true
    cam_name?: true
    cam_status?: true
    stream_url?: true
    loc_id?: true
    _all?: true
  }

  export type CameraAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Camera to aggregate.
     */
    where?: CameraWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Cameras to fetch.
     */
    orderBy?: CameraOrderByWithRelationInput | CameraOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CameraWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Cameras from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Cameras.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Cameras
    **/
    _count?: true | CameraCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: CameraAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: CameraSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CameraMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CameraMaxAggregateInputType
  }

  export type GetCameraAggregateType<T extends CameraAggregateArgs> = {
        [P in keyof T & keyof AggregateCamera]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCamera[P]>
      : GetScalarType<T[P], AggregateCamera[P]>
  }




  export type CameraGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CameraWhereInput
    orderBy?: CameraOrderByWithAggregationInput | CameraOrderByWithAggregationInput[]
    by: CameraScalarFieldEnum[] | CameraScalarFieldEnum
    having?: CameraScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CameraCountAggregateInputType | true
    _avg?: CameraAvgAggregateInputType
    _sum?: CameraSumAggregateInputType
    _min?: CameraMinAggregateInputType
    _max?: CameraMaxAggregateInputType
  }

  export type CameraGroupByOutputType = {
    id: bigint
    cam_name: string
    cam_status: boolean
    stream_url: string
    loc_id: bigint | null
    _count: CameraCountAggregateOutputType | null
    _avg: CameraAvgAggregateOutputType | null
    _sum: CameraSumAggregateOutputType | null
    _min: CameraMinAggregateOutputType | null
    _max: CameraMaxAggregateOutputType | null
  }

  type GetCameraGroupByPayload<T extends CameraGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CameraGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CameraGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CameraGroupByOutputType[P]>
            : GetScalarType<T[P], CameraGroupByOutputType[P]>
        }
      >
    >


  export type CameraSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    cam_name?: boolean
    cam_status?: boolean
    stream_url?: boolean
    loc_id?: boolean
    location?: boolean | Camera$locationArgs<ExtArgs>
    logs?: boolean | Camera$logsArgs<ExtArgs>
    _count?: boolean | CameraCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["camera"]>

  export type CameraSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    cam_name?: boolean
    cam_status?: boolean
    stream_url?: boolean
    loc_id?: boolean
    location?: boolean | Camera$locationArgs<ExtArgs>
  }, ExtArgs["result"]["camera"]>

  export type CameraSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    cam_name?: boolean
    cam_status?: boolean
    stream_url?: boolean
    loc_id?: boolean
    location?: boolean | Camera$locationArgs<ExtArgs>
  }, ExtArgs["result"]["camera"]>

  export type CameraSelectScalar = {
    id?: boolean
    cam_name?: boolean
    cam_status?: boolean
    stream_url?: boolean
    loc_id?: boolean
  }

  export type CameraOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "cam_name" | "cam_status" | "stream_url" | "loc_id", ExtArgs["result"]["camera"]>
  export type CameraInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    location?: boolean | Camera$locationArgs<ExtArgs>
    logs?: boolean | Camera$logsArgs<ExtArgs>
    _count?: boolean | CameraCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type CameraIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    location?: boolean | Camera$locationArgs<ExtArgs>
  }
  export type CameraIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    location?: boolean | Camera$locationArgs<ExtArgs>
  }

  export type $CameraPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Camera"
    objects: {
      location: Prisma.$LocationPayload<ExtArgs> | null
      logs: Prisma.$EventLogPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: bigint
      cam_name: string
      cam_status: boolean
      stream_url: string
      loc_id: bigint | null
    }, ExtArgs["result"]["camera"]>
    composites: {}
  }

  type CameraGetPayload<S extends boolean | null | undefined | CameraDefaultArgs> = $Result.GetResult<Prisma.$CameraPayload, S>

  type CameraCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CameraFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CameraCountAggregateInputType | true
    }

  export interface CameraDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Camera'], meta: { name: 'Camera' } }
    /**
     * Find zero or one Camera that matches the filter.
     * @param {CameraFindUniqueArgs} args - Arguments to find a Camera
     * @example
     * // Get one Camera
     * const camera = await prisma.camera.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CameraFindUniqueArgs>(args: SelectSubset<T, CameraFindUniqueArgs<ExtArgs>>): Prisma__CameraClient<$Result.GetResult<Prisma.$CameraPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Camera that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CameraFindUniqueOrThrowArgs} args - Arguments to find a Camera
     * @example
     * // Get one Camera
     * const camera = await prisma.camera.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CameraFindUniqueOrThrowArgs>(args: SelectSubset<T, CameraFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CameraClient<$Result.GetResult<Prisma.$CameraPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Camera that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CameraFindFirstArgs} args - Arguments to find a Camera
     * @example
     * // Get one Camera
     * const camera = await prisma.camera.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CameraFindFirstArgs>(args?: SelectSubset<T, CameraFindFirstArgs<ExtArgs>>): Prisma__CameraClient<$Result.GetResult<Prisma.$CameraPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Camera that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CameraFindFirstOrThrowArgs} args - Arguments to find a Camera
     * @example
     * // Get one Camera
     * const camera = await prisma.camera.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CameraFindFirstOrThrowArgs>(args?: SelectSubset<T, CameraFindFirstOrThrowArgs<ExtArgs>>): Prisma__CameraClient<$Result.GetResult<Prisma.$CameraPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Cameras that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CameraFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Cameras
     * const cameras = await prisma.camera.findMany()
     * 
     * // Get first 10 Cameras
     * const cameras = await prisma.camera.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const cameraWithIdOnly = await prisma.camera.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CameraFindManyArgs>(args?: SelectSubset<T, CameraFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CameraPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Camera.
     * @param {CameraCreateArgs} args - Arguments to create a Camera.
     * @example
     * // Create one Camera
     * const Camera = await prisma.camera.create({
     *   data: {
     *     // ... data to create a Camera
     *   }
     * })
     * 
     */
    create<T extends CameraCreateArgs>(args: SelectSubset<T, CameraCreateArgs<ExtArgs>>): Prisma__CameraClient<$Result.GetResult<Prisma.$CameraPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Cameras.
     * @param {CameraCreateManyArgs} args - Arguments to create many Cameras.
     * @example
     * // Create many Cameras
     * const camera = await prisma.camera.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CameraCreateManyArgs>(args?: SelectSubset<T, CameraCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Cameras and returns the data saved in the database.
     * @param {CameraCreateManyAndReturnArgs} args - Arguments to create many Cameras.
     * @example
     * // Create many Cameras
     * const camera = await prisma.camera.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Cameras and only return the `id`
     * const cameraWithIdOnly = await prisma.camera.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CameraCreateManyAndReturnArgs>(args?: SelectSubset<T, CameraCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CameraPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Camera.
     * @param {CameraDeleteArgs} args - Arguments to delete one Camera.
     * @example
     * // Delete one Camera
     * const Camera = await prisma.camera.delete({
     *   where: {
     *     // ... filter to delete one Camera
     *   }
     * })
     * 
     */
    delete<T extends CameraDeleteArgs>(args: SelectSubset<T, CameraDeleteArgs<ExtArgs>>): Prisma__CameraClient<$Result.GetResult<Prisma.$CameraPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Camera.
     * @param {CameraUpdateArgs} args - Arguments to update one Camera.
     * @example
     * // Update one Camera
     * const camera = await prisma.camera.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CameraUpdateArgs>(args: SelectSubset<T, CameraUpdateArgs<ExtArgs>>): Prisma__CameraClient<$Result.GetResult<Prisma.$CameraPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Cameras.
     * @param {CameraDeleteManyArgs} args - Arguments to filter Cameras to delete.
     * @example
     * // Delete a few Cameras
     * const { count } = await prisma.camera.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CameraDeleteManyArgs>(args?: SelectSubset<T, CameraDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Cameras.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CameraUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Cameras
     * const camera = await prisma.camera.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CameraUpdateManyArgs>(args: SelectSubset<T, CameraUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Cameras and returns the data updated in the database.
     * @param {CameraUpdateManyAndReturnArgs} args - Arguments to update many Cameras.
     * @example
     * // Update many Cameras
     * const camera = await prisma.camera.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Cameras and only return the `id`
     * const cameraWithIdOnly = await prisma.camera.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CameraUpdateManyAndReturnArgs>(args: SelectSubset<T, CameraUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CameraPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Camera.
     * @param {CameraUpsertArgs} args - Arguments to update or create a Camera.
     * @example
     * // Update or create a Camera
     * const camera = await prisma.camera.upsert({
     *   create: {
     *     // ... data to create a Camera
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Camera we want to update
     *   }
     * })
     */
    upsert<T extends CameraUpsertArgs>(args: SelectSubset<T, CameraUpsertArgs<ExtArgs>>): Prisma__CameraClient<$Result.GetResult<Prisma.$CameraPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Cameras.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CameraCountArgs} args - Arguments to filter Cameras to count.
     * @example
     * // Count the number of Cameras
     * const count = await prisma.camera.count({
     *   where: {
     *     // ... the filter for the Cameras we want to count
     *   }
     * })
    **/
    count<T extends CameraCountArgs>(
      args?: Subset<T, CameraCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CameraCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Camera.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CameraAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CameraAggregateArgs>(args: Subset<T, CameraAggregateArgs>): Prisma.PrismaPromise<GetCameraAggregateType<T>>

    /**
     * Group by Camera.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CameraGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CameraGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CameraGroupByArgs['orderBy'] }
        : { orderBy?: CameraGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CameraGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCameraGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Camera model
   */
  readonly fields: CameraFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Camera.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CameraClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    location<T extends Camera$locationArgs<ExtArgs> = {}>(args?: Subset<T, Camera$locationArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    logs<T extends Camera$logsArgs<ExtArgs> = {}>(args?: Subset<T, Camera$logsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Camera model
   */
  interface CameraFieldRefs {
    readonly id: FieldRef<"Camera", 'BigInt'>
    readonly cam_name: FieldRef<"Camera", 'String'>
    readonly cam_status: FieldRef<"Camera", 'Boolean'>
    readonly stream_url: FieldRef<"Camera", 'String'>
    readonly loc_id: FieldRef<"Camera", 'BigInt'>
  }
    

  // Custom InputTypes
  /**
   * Camera findUnique
   */
  export type CameraFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Camera
     */
    select?: CameraSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Camera
     */
    omit?: CameraOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CameraInclude<ExtArgs> | null
    /**
     * Filter, which Camera to fetch.
     */
    where: CameraWhereUniqueInput
  }

  /**
   * Camera findUniqueOrThrow
   */
  export type CameraFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Camera
     */
    select?: CameraSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Camera
     */
    omit?: CameraOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CameraInclude<ExtArgs> | null
    /**
     * Filter, which Camera to fetch.
     */
    where: CameraWhereUniqueInput
  }

  /**
   * Camera findFirst
   */
  export type CameraFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Camera
     */
    select?: CameraSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Camera
     */
    omit?: CameraOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CameraInclude<ExtArgs> | null
    /**
     * Filter, which Camera to fetch.
     */
    where?: CameraWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Cameras to fetch.
     */
    orderBy?: CameraOrderByWithRelationInput | CameraOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Cameras.
     */
    cursor?: CameraWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Cameras from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Cameras.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Cameras.
     */
    distinct?: CameraScalarFieldEnum | CameraScalarFieldEnum[]
  }

  /**
   * Camera findFirstOrThrow
   */
  export type CameraFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Camera
     */
    select?: CameraSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Camera
     */
    omit?: CameraOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CameraInclude<ExtArgs> | null
    /**
     * Filter, which Camera to fetch.
     */
    where?: CameraWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Cameras to fetch.
     */
    orderBy?: CameraOrderByWithRelationInput | CameraOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Cameras.
     */
    cursor?: CameraWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Cameras from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Cameras.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Cameras.
     */
    distinct?: CameraScalarFieldEnum | CameraScalarFieldEnum[]
  }

  /**
   * Camera findMany
   */
  export type CameraFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Camera
     */
    select?: CameraSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Camera
     */
    omit?: CameraOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CameraInclude<ExtArgs> | null
    /**
     * Filter, which Cameras to fetch.
     */
    where?: CameraWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Cameras to fetch.
     */
    orderBy?: CameraOrderByWithRelationInput | CameraOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Cameras.
     */
    cursor?: CameraWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Cameras from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Cameras.
     */
    skip?: number
    distinct?: CameraScalarFieldEnum | CameraScalarFieldEnum[]
  }

  /**
   * Camera create
   */
  export type CameraCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Camera
     */
    select?: CameraSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Camera
     */
    omit?: CameraOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CameraInclude<ExtArgs> | null
    /**
     * The data needed to create a Camera.
     */
    data: XOR<CameraCreateInput, CameraUncheckedCreateInput>
  }

  /**
   * Camera createMany
   */
  export type CameraCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Cameras.
     */
    data: CameraCreateManyInput | CameraCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Camera createManyAndReturn
   */
  export type CameraCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Camera
     */
    select?: CameraSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Camera
     */
    omit?: CameraOmit<ExtArgs> | null
    /**
     * The data used to create many Cameras.
     */
    data: CameraCreateManyInput | CameraCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CameraIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Camera update
   */
  export type CameraUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Camera
     */
    select?: CameraSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Camera
     */
    omit?: CameraOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CameraInclude<ExtArgs> | null
    /**
     * The data needed to update a Camera.
     */
    data: XOR<CameraUpdateInput, CameraUncheckedUpdateInput>
    /**
     * Choose, which Camera to update.
     */
    where: CameraWhereUniqueInput
  }

  /**
   * Camera updateMany
   */
  export type CameraUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Cameras.
     */
    data: XOR<CameraUpdateManyMutationInput, CameraUncheckedUpdateManyInput>
    /**
     * Filter which Cameras to update
     */
    where?: CameraWhereInput
    /**
     * Limit how many Cameras to update.
     */
    limit?: number
  }

  /**
   * Camera updateManyAndReturn
   */
  export type CameraUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Camera
     */
    select?: CameraSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Camera
     */
    omit?: CameraOmit<ExtArgs> | null
    /**
     * The data used to update Cameras.
     */
    data: XOR<CameraUpdateManyMutationInput, CameraUncheckedUpdateManyInput>
    /**
     * Filter which Cameras to update
     */
    where?: CameraWhereInput
    /**
     * Limit how many Cameras to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CameraIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Camera upsert
   */
  export type CameraUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Camera
     */
    select?: CameraSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Camera
     */
    omit?: CameraOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CameraInclude<ExtArgs> | null
    /**
     * The filter to search for the Camera to update in case it exists.
     */
    where: CameraWhereUniqueInput
    /**
     * In case the Camera found by the `where` argument doesn't exist, create a new Camera with this data.
     */
    create: XOR<CameraCreateInput, CameraUncheckedCreateInput>
    /**
     * In case the Camera was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CameraUpdateInput, CameraUncheckedUpdateInput>
  }

  /**
   * Camera delete
   */
  export type CameraDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Camera
     */
    select?: CameraSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Camera
     */
    omit?: CameraOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CameraInclude<ExtArgs> | null
    /**
     * Filter which Camera to delete.
     */
    where: CameraWhereUniqueInput
  }

  /**
   * Camera deleteMany
   */
  export type CameraDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Cameras to delete
     */
    where?: CameraWhereInput
    /**
     * Limit how many Cameras to delete.
     */
    limit?: number
  }

  /**
   * Camera.location
   */
  export type Camera$locationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    where?: LocationWhereInput
  }

  /**
   * Camera.logs
   */
  export type Camera$logsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventLog
     */
    omit?: EventLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventLogInclude<ExtArgs> | null
    where?: EventLogWhereInput
    orderBy?: EventLogOrderByWithRelationInput | EventLogOrderByWithRelationInput[]
    cursor?: EventLogWhereUniqueInput
    take?: number
    skip?: number
    distinct?: EventLogScalarFieldEnum | EventLogScalarFieldEnum[]
  }

  /**
   * Camera without action
   */
  export type CameraDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Camera
     */
    select?: CameraSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Camera
     */
    omit?: CameraOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CameraInclude<ExtArgs> | null
  }


  /**
   * Model EventLog
   */

  export type AggregateEventLog = {
    _count: EventLogCountAggregateOutputType | null
    _avg: EventLogAvgAggregateOutputType | null
    _sum: EventLogSumAggregateOutputType | null
    _min: EventLogMinAggregateOutputType | null
    _max: EventLogMaxAggregateOutputType | null
  }

  export type EventLogAvgAggregateOutputType = {
    id: number | null
    cam_id: number | null
    event_class_id: number | null
    ack_by_user_id: number | null
  }

  export type EventLogSumAggregateOutputType = {
    id: bigint | null
    cam_id: bigint | null
    event_class_id: bigint | null
    ack_by_user_id: bigint | null
  }

  export type EventLogMinAggregateOutputType = {
    id: bigint | null
    timestamp: Date | null
    event_status: string | null
    file_path: string | null
    cam_id: bigint | null
    event_class_id: bigint | null
    ack_by_user_id: bigint | null
  }

  export type EventLogMaxAggregateOutputType = {
    id: bigint | null
    timestamp: Date | null
    event_status: string | null
    file_path: string | null
    cam_id: bigint | null
    event_class_id: bigint | null
    ack_by_user_id: bigint | null
  }

  export type EventLogCountAggregateOutputType = {
    id: number
    timestamp: number
    event_status: number
    file_path: number
    cam_id: number
    event_class_id: number
    ack_by_user_id: number
    _all: number
  }


  export type EventLogAvgAggregateInputType = {
    id?: true
    cam_id?: true
    event_class_id?: true
    ack_by_user_id?: true
  }

  export type EventLogSumAggregateInputType = {
    id?: true
    cam_id?: true
    event_class_id?: true
    ack_by_user_id?: true
  }

  export type EventLogMinAggregateInputType = {
    id?: true
    timestamp?: true
    event_status?: true
    file_path?: true
    cam_id?: true
    event_class_id?: true
    ack_by_user_id?: true
  }

  export type EventLogMaxAggregateInputType = {
    id?: true
    timestamp?: true
    event_status?: true
    file_path?: true
    cam_id?: true
    event_class_id?: true
    ack_by_user_id?: true
  }

  export type EventLogCountAggregateInputType = {
    id?: true
    timestamp?: true
    event_status?: true
    file_path?: true
    cam_id?: true
    event_class_id?: true
    ack_by_user_id?: true
    _all?: true
  }

  export type EventLogAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EventLog to aggregate.
     */
    where?: EventLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventLogs to fetch.
     */
    orderBy?: EventLogOrderByWithRelationInput | EventLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: EventLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned EventLogs
    **/
    _count?: true | EventLogCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: EventLogAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: EventLogSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: EventLogMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: EventLogMaxAggregateInputType
  }

  export type GetEventLogAggregateType<T extends EventLogAggregateArgs> = {
        [P in keyof T & keyof AggregateEventLog]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEventLog[P]>
      : GetScalarType<T[P], AggregateEventLog[P]>
  }




  export type EventLogGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EventLogWhereInput
    orderBy?: EventLogOrderByWithAggregationInput | EventLogOrderByWithAggregationInput[]
    by: EventLogScalarFieldEnum[] | EventLogScalarFieldEnum
    having?: EventLogScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: EventLogCountAggregateInputType | true
    _avg?: EventLogAvgAggregateInputType
    _sum?: EventLogSumAggregateInputType
    _min?: EventLogMinAggregateInputType
    _max?: EventLogMaxAggregateInputType
  }

  export type EventLogGroupByOutputType = {
    id: bigint
    timestamp: Date
    event_status: string
    file_path: string | null
    cam_id: bigint | null
    event_class_id: bigint | null
    ack_by_user_id: bigint | null
    _count: EventLogCountAggregateOutputType | null
    _avg: EventLogAvgAggregateOutputType | null
    _sum: EventLogSumAggregateOutputType | null
    _min: EventLogMinAggregateOutputType | null
    _max: EventLogMaxAggregateOutputType | null
  }

  type GetEventLogGroupByPayload<T extends EventLogGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EventLogGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof EventLogGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EventLogGroupByOutputType[P]>
            : GetScalarType<T[P], EventLogGroupByOutputType[P]>
        }
      >
    >


  export type EventLogSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    timestamp?: boolean
    event_status?: boolean
    file_path?: boolean
    cam_id?: boolean
    event_class_id?: boolean
    ack_by_user_id?: boolean
    camera?: boolean | EventLog$cameraArgs<ExtArgs>
    event_class?: boolean | EventLog$event_classArgs<ExtArgs>
    acknowledged_by?: boolean | EventLog$acknowledged_byArgs<ExtArgs>
  }, ExtArgs["result"]["eventLog"]>

  export type EventLogSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    timestamp?: boolean
    event_status?: boolean
    file_path?: boolean
    cam_id?: boolean
    event_class_id?: boolean
    ack_by_user_id?: boolean
    camera?: boolean | EventLog$cameraArgs<ExtArgs>
    event_class?: boolean | EventLog$event_classArgs<ExtArgs>
    acknowledged_by?: boolean | EventLog$acknowledged_byArgs<ExtArgs>
  }, ExtArgs["result"]["eventLog"]>

  export type EventLogSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    timestamp?: boolean
    event_status?: boolean
    file_path?: boolean
    cam_id?: boolean
    event_class_id?: boolean
    ack_by_user_id?: boolean
    camera?: boolean | EventLog$cameraArgs<ExtArgs>
    event_class?: boolean | EventLog$event_classArgs<ExtArgs>
    acknowledged_by?: boolean | EventLog$acknowledged_byArgs<ExtArgs>
  }, ExtArgs["result"]["eventLog"]>

  export type EventLogSelectScalar = {
    id?: boolean
    timestamp?: boolean
    event_status?: boolean
    file_path?: boolean
    cam_id?: boolean
    event_class_id?: boolean
    ack_by_user_id?: boolean
  }

  export type EventLogOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "timestamp" | "event_status" | "file_path" | "cam_id" | "event_class_id" | "ack_by_user_id", ExtArgs["result"]["eventLog"]>
  export type EventLogInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    camera?: boolean | EventLog$cameraArgs<ExtArgs>
    event_class?: boolean | EventLog$event_classArgs<ExtArgs>
    acknowledged_by?: boolean | EventLog$acknowledged_byArgs<ExtArgs>
  }
  export type EventLogIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    camera?: boolean | EventLog$cameraArgs<ExtArgs>
    event_class?: boolean | EventLog$event_classArgs<ExtArgs>
    acknowledged_by?: boolean | EventLog$acknowledged_byArgs<ExtArgs>
  }
  export type EventLogIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    camera?: boolean | EventLog$cameraArgs<ExtArgs>
    event_class?: boolean | EventLog$event_classArgs<ExtArgs>
    acknowledged_by?: boolean | EventLog$acknowledged_byArgs<ExtArgs>
  }

  export type $EventLogPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "EventLog"
    objects: {
      camera: Prisma.$CameraPayload<ExtArgs> | null
      event_class: Prisma.$EventClassPayload<ExtArgs> | null
      acknowledged_by: Prisma.$UserPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: bigint
      timestamp: Date
      event_status: string
      file_path: string | null
      cam_id: bigint | null
      event_class_id: bigint | null
      ack_by_user_id: bigint | null
    }, ExtArgs["result"]["eventLog"]>
    composites: {}
  }

  type EventLogGetPayload<S extends boolean | null | undefined | EventLogDefaultArgs> = $Result.GetResult<Prisma.$EventLogPayload, S>

  type EventLogCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<EventLogFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: EventLogCountAggregateInputType | true
    }

  export interface EventLogDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['EventLog'], meta: { name: 'EventLog' } }
    /**
     * Find zero or one EventLog that matches the filter.
     * @param {EventLogFindUniqueArgs} args - Arguments to find a EventLog
     * @example
     * // Get one EventLog
     * const eventLog = await prisma.eventLog.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EventLogFindUniqueArgs>(args: SelectSubset<T, EventLogFindUniqueArgs<ExtArgs>>): Prisma__EventLogClient<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one EventLog that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {EventLogFindUniqueOrThrowArgs} args - Arguments to find a EventLog
     * @example
     * // Get one EventLog
     * const eventLog = await prisma.eventLog.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EventLogFindUniqueOrThrowArgs>(args: SelectSubset<T, EventLogFindUniqueOrThrowArgs<ExtArgs>>): Prisma__EventLogClient<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first EventLog that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventLogFindFirstArgs} args - Arguments to find a EventLog
     * @example
     * // Get one EventLog
     * const eventLog = await prisma.eventLog.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EventLogFindFirstArgs>(args?: SelectSubset<T, EventLogFindFirstArgs<ExtArgs>>): Prisma__EventLogClient<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first EventLog that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventLogFindFirstOrThrowArgs} args - Arguments to find a EventLog
     * @example
     * // Get one EventLog
     * const eventLog = await prisma.eventLog.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EventLogFindFirstOrThrowArgs>(args?: SelectSubset<T, EventLogFindFirstOrThrowArgs<ExtArgs>>): Prisma__EventLogClient<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more EventLogs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventLogFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all EventLogs
     * const eventLogs = await prisma.eventLog.findMany()
     * 
     * // Get first 10 EventLogs
     * const eventLogs = await prisma.eventLog.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const eventLogWithIdOnly = await prisma.eventLog.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends EventLogFindManyArgs>(args?: SelectSubset<T, EventLogFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a EventLog.
     * @param {EventLogCreateArgs} args - Arguments to create a EventLog.
     * @example
     * // Create one EventLog
     * const EventLog = await prisma.eventLog.create({
     *   data: {
     *     // ... data to create a EventLog
     *   }
     * })
     * 
     */
    create<T extends EventLogCreateArgs>(args: SelectSubset<T, EventLogCreateArgs<ExtArgs>>): Prisma__EventLogClient<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many EventLogs.
     * @param {EventLogCreateManyArgs} args - Arguments to create many EventLogs.
     * @example
     * // Create many EventLogs
     * const eventLog = await prisma.eventLog.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends EventLogCreateManyArgs>(args?: SelectSubset<T, EventLogCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many EventLogs and returns the data saved in the database.
     * @param {EventLogCreateManyAndReturnArgs} args - Arguments to create many EventLogs.
     * @example
     * // Create many EventLogs
     * const eventLog = await prisma.eventLog.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many EventLogs and only return the `id`
     * const eventLogWithIdOnly = await prisma.eventLog.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends EventLogCreateManyAndReturnArgs>(args?: SelectSubset<T, EventLogCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a EventLog.
     * @param {EventLogDeleteArgs} args - Arguments to delete one EventLog.
     * @example
     * // Delete one EventLog
     * const EventLog = await prisma.eventLog.delete({
     *   where: {
     *     // ... filter to delete one EventLog
     *   }
     * })
     * 
     */
    delete<T extends EventLogDeleteArgs>(args: SelectSubset<T, EventLogDeleteArgs<ExtArgs>>): Prisma__EventLogClient<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one EventLog.
     * @param {EventLogUpdateArgs} args - Arguments to update one EventLog.
     * @example
     * // Update one EventLog
     * const eventLog = await prisma.eventLog.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends EventLogUpdateArgs>(args: SelectSubset<T, EventLogUpdateArgs<ExtArgs>>): Prisma__EventLogClient<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more EventLogs.
     * @param {EventLogDeleteManyArgs} args - Arguments to filter EventLogs to delete.
     * @example
     * // Delete a few EventLogs
     * const { count } = await prisma.eventLog.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends EventLogDeleteManyArgs>(args?: SelectSubset<T, EventLogDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more EventLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventLogUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many EventLogs
     * const eventLog = await prisma.eventLog.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends EventLogUpdateManyArgs>(args: SelectSubset<T, EventLogUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more EventLogs and returns the data updated in the database.
     * @param {EventLogUpdateManyAndReturnArgs} args - Arguments to update many EventLogs.
     * @example
     * // Update many EventLogs
     * const eventLog = await prisma.eventLog.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more EventLogs and only return the `id`
     * const eventLogWithIdOnly = await prisma.eventLog.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends EventLogUpdateManyAndReturnArgs>(args: SelectSubset<T, EventLogUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one EventLog.
     * @param {EventLogUpsertArgs} args - Arguments to update or create a EventLog.
     * @example
     * // Update or create a EventLog
     * const eventLog = await prisma.eventLog.upsert({
     *   create: {
     *     // ... data to create a EventLog
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the EventLog we want to update
     *   }
     * })
     */
    upsert<T extends EventLogUpsertArgs>(args: SelectSubset<T, EventLogUpsertArgs<ExtArgs>>): Prisma__EventLogClient<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of EventLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventLogCountArgs} args - Arguments to filter EventLogs to count.
     * @example
     * // Count the number of EventLogs
     * const count = await prisma.eventLog.count({
     *   where: {
     *     // ... the filter for the EventLogs we want to count
     *   }
     * })
    **/
    count<T extends EventLogCountArgs>(
      args?: Subset<T, EventLogCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], EventLogCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a EventLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventLogAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends EventLogAggregateArgs>(args: Subset<T, EventLogAggregateArgs>): Prisma.PrismaPromise<GetEventLogAggregateType<T>>

    /**
     * Group by EventLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventLogGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends EventLogGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EventLogGroupByArgs['orderBy'] }
        : { orderBy?: EventLogGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, EventLogGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEventLogGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the EventLog model
   */
  readonly fields: EventLogFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for EventLog.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EventLogClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    camera<T extends EventLog$cameraArgs<ExtArgs> = {}>(args?: Subset<T, EventLog$cameraArgs<ExtArgs>>): Prisma__CameraClient<$Result.GetResult<Prisma.$CameraPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    event_class<T extends EventLog$event_classArgs<ExtArgs> = {}>(args?: Subset<T, EventLog$event_classArgs<ExtArgs>>): Prisma__EventClassClient<$Result.GetResult<Prisma.$EventClassPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    acknowledged_by<T extends EventLog$acknowledged_byArgs<ExtArgs> = {}>(args?: Subset<T, EventLog$acknowledged_byArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the EventLog model
   */
  interface EventLogFieldRefs {
    readonly id: FieldRef<"EventLog", 'BigInt'>
    readonly timestamp: FieldRef<"EventLog", 'DateTime'>
    readonly event_status: FieldRef<"EventLog", 'String'>
    readonly file_path: FieldRef<"EventLog", 'String'>
    readonly cam_id: FieldRef<"EventLog", 'BigInt'>
    readonly event_class_id: FieldRef<"EventLog", 'BigInt'>
    readonly ack_by_user_id: FieldRef<"EventLog", 'BigInt'>
  }
    

  // Custom InputTypes
  /**
   * EventLog findUnique
   */
  export type EventLogFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventLog
     */
    omit?: EventLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventLogInclude<ExtArgs> | null
    /**
     * Filter, which EventLog to fetch.
     */
    where: EventLogWhereUniqueInput
  }

  /**
   * EventLog findUniqueOrThrow
   */
  export type EventLogFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventLog
     */
    omit?: EventLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventLogInclude<ExtArgs> | null
    /**
     * Filter, which EventLog to fetch.
     */
    where: EventLogWhereUniqueInput
  }

  /**
   * EventLog findFirst
   */
  export type EventLogFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventLog
     */
    omit?: EventLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventLogInclude<ExtArgs> | null
    /**
     * Filter, which EventLog to fetch.
     */
    where?: EventLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventLogs to fetch.
     */
    orderBy?: EventLogOrderByWithRelationInput | EventLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EventLogs.
     */
    cursor?: EventLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EventLogs.
     */
    distinct?: EventLogScalarFieldEnum | EventLogScalarFieldEnum[]
  }

  /**
   * EventLog findFirstOrThrow
   */
  export type EventLogFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventLog
     */
    omit?: EventLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventLogInclude<ExtArgs> | null
    /**
     * Filter, which EventLog to fetch.
     */
    where?: EventLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventLogs to fetch.
     */
    orderBy?: EventLogOrderByWithRelationInput | EventLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EventLogs.
     */
    cursor?: EventLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EventLogs.
     */
    distinct?: EventLogScalarFieldEnum | EventLogScalarFieldEnum[]
  }

  /**
   * EventLog findMany
   */
  export type EventLogFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventLog
     */
    omit?: EventLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventLogInclude<ExtArgs> | null
    /**
     * Filter, which EventLogs to fetch.
     */
    where?: EventLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventLogs to fetch.
     */
    orderBy?: EventLogOrderByWithRelationInput | EventLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing EventLogs.
     */
    cursor?: EventLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventLogs.
     */
    skip?: number
    distinct?: EventLogScalarFieldEnum | EventLogScalarFieldEnum[]
  }

  /**
   * EventLog create
   */
  export type EventLogCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventLog
     */
    omit?: EventLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventLogInclude<ExtArgs> | null
    /**
     * The data needed to create a EventLog.
     */
    data?: XOR<EventLogCreateInput, EventLogUncheckedCreateInput>
  }

  /**
   * EventLog createMany
   */
  export type EventLogCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many EventLogs.
     */
    data: EventLogCreateManyInput | EventLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * EventLog createManyAndReturn
   */
  export type EventLogCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the EventLog
     */
    omit?: EventLogOmit<ExtArgs> | null
    /**
     * The data used to create many EventLogs.
     */
    data: EventLogCreateManyInput | EventLogCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventLogIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * EventLog update
   */
  export type EventLogUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventLog
     */
    omit?: EventLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventLogInclude<ExtArgs> | null
    /**
     * The data needed to update a EventLog.
     */
    data: XOR<EventLogUpdateInput, EventLogUncheckedUpdateInput>
    /**
     * Choose, which EventLog to update.
     */
    where: EventLogWhereUniqueInput
  }

  /**
   * EventLog updateMany
   */
  export type EventLogUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update EventLogs.
     */
    data: XOR<EventLogUpdateManyMutationInput, EventLogUncheckedUpdateManyInput>
    /**
     * Filter which EventLogs to update
     */
    where?: EventLogWhereInput
    /**
     * Limit how many EventLogs to update.
     */
    limit?: number
  }

  /**
   * EventLog updateManyAndReturn
   */
  export type EventLogUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the EventLog
     */
    omit?: EventLogOmit<ExtArgs> | null
    /**
     * The data used to update EventLogs.
     */
    data: XOR<EventLogUpdateManyMutationInput, EventLogUncheckedUpdateManyInput>
    /**
     * Filter which EventLogs to update
     */
    where?: EventLogWhereInput
    /**
     * Limit how many EventLogs to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventLogIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * EventLog upsert
   */
  export type EventLogUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventLog
     */
    omit?: EventLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventLogInclude<ExtArgs> | null
    /**
     * The filter to search for the EventLog to update in case it exists.
     */
    where: EventLogWhereUniqueInput
    /**
     * In case the EventLog found by the `where` argument doesn't exist, create a new EventLog with this data.
     */
    create: XOR<EventLogCreateInput, EventLogUncheckedCreateInput>
    /**
     * In case the EventLog was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EventLogUpdateInput, EventLogUncheckedUpdateInput>
  }

  /**
   * EventLog delete
   */
  export type EventLogDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventLog
     */
    omit?: EventLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventLogInclude<ExtArgs> | null
    /**
     * Filter which EventLog to delete.
     */
    where: EventLogWhereUniqueInput
  }

  /**
   * EventLog deleteMany
   */
  export type EventLogDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EventLogs to delete
     */
    where?: EventLogWhereInput
    /**
     * Limit how many EventLogs to delete.
     */
    limit?: number
  }

  /**
   * EventLog.camera
   */
  export type EventLog$cameraArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Camera
     */
    select?: CameraSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Camera
     */
    omit?: CameraOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CameraInclude<ExtArgs> | null
    where?: CameraWhereInput
  }

  /**
   * EventLog.event_class
   */
  export type EventLog$event_classArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventClass
     */
    select?: EventClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventClass
     */
    omit?: EventClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventClassInclude<ExtArgs> | null
    where?: EventClassWhereInput
  }

  /**
   * EventLog.acknowledged_by
   */
  export type EventLog$acknowledged_byArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    where?: UserWhereInput
  }

  /**
   * EventLog without action
   */
  export type EventLogDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventLog
     */
    omit?: EventLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventLogInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const RoleScalarFieldEnum: {
    id: 'id',
    role_name: 'role_name'
  };

  export type RoleScalarFieldEnum = (typeof RoleScalarFieldEnum)[keyof typeof RoleScalarFieldEnum]


  export const UserScalarFieldEnum: {
    id: 'id',
    firstname: 'firstname',
    lastname: 'lastname',
    username: 'username',
    password: 'password',
    role_id: 'role_id'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const LocationScalarFieldEnum: {
    id: 'id',
    loc_name: 'loc_name'
  };

  export type LocationScalarFieldEnum = (typeof LocationScalarFieldEnum)[keyof typeof LocationScalarFieldEnum]


  export const EventTypeScalarFieldEnum: {
    id: 'id',
    event_type_name: 'event_type_name'
  };

  export type EventTypeScalarFieldEnum = (typeof EventTypeScalarFieldEnum)[keyof typeof EventTypeScalarFieldEnum]


  export const EventClassScalarFieldEnum: {
    id: 'id',
    class_name: 'class_name',
    event_type_id: 'event_type_id'
  };

  export type EventClassScalarFieldEnum = (typeof EventClassScalarFieldEnum)[keyof typeof EventClassScalarFieldEnum]


  export const CameraScalarFieldEnum: {
    id: 'id',
    cam_name: 'cam_name',
    cam_status: 'cam_status',
    stream_url: 'stream_url',
    loc_id: 'loc_id'
  };

  export type CameraScalarFieldEnum = (typeof CameraScalarFieldEnum)[keyof typeof CameraScalarFieldEnum]


  export const EventLogScalarFieldEnum: {
    id: 'id',
    timestamp: 'timestamp',
    event_status: 'event_status',
    file_path: 'file_path',
    cam_id: 'cam_id',
    event_class_id: 'event_class_id',
    ack_by_user_id: 'ack_by_user_id'
  };

  export type EventLogScalarFieldEnum = (typeof EventLogScalarFieldEnum)[keyof typeof EventLogScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'BigInt'
   */
  export type BigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt'>
    


  /**
   * Reference to a field of type 'BigInt[]'
   */
  export type ListBigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt[]'>
    


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type RoleWhereInput = {
    AND?: RoleWhereInput | RoleWhereInput[]
    OR?: RoleWhereInput[]
    NOT?: RoleWhereInput | RoleWhereInput[]
    id?: BigIntFilter<"Role"> | bigint | number
    role_name?: StringFilter<"Role"> | string
    users?: UserListRelationFilter
  }

  export type RoleOrderByWithRelationInput = {
    id?: SortOrder
    role_name?: SortOrder
    users?: UserOrderByRelationAggregateInput
  }

  export type RoleWhereUniqueInput = Prisma.AtLeast<{
    id?: bigint | number
    role_name?: string
    AND?: RoleWhereInput | RoleWhereInput[]
    OR?: RoleWhereInput[]
    NOT?: RoleWhereInput | RoleWhereInput[]
    users?: UserListRelationFilter
  }, "id" | "role_name">

  export type RoleOrderByWithAggregationInput = {
    id?: SortOrder
    role_name?: SortOrder
    _count?: RoleCountOrderByAggregateInput
    _avg?: RoleAvgOrderByAggregateInput
    _max?: RoleMaxOrderByAggregateInput
    _min?: RoleMinOrderByAggregateInput
    _sum?: RoleSumOrderByAggregateInput
  }

  export type RoleScalarWhereWithAggregatesInput = {
    AND?: RoleScalarWhereWithAggregatesInput | RoleScalarWhereWithAggregatesInput[]
    OR?: RoleScalarWhereWithAggregatesInput[]
    NOT?: RoleScalarWhereWithAggregatesInput | RoleScalarWhereWithAggregatesInput[]
    id?: BigIntWithAggregatesFilter<"Role"> | bigint | number
    role_name?: StringWithAggregatesFilter<"Role"> | string
  }

  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: BigIntFilter<"User"> | bigint | number
    firstname?: StringFilter<"User"> | string
    lastname?: StringFilter<"User"> | string
    username?: StringFilter<"User"> | string
    password?: StringFilter<"User"> | string
    role_id?: BigIntNullableFilter<"User"> | bigint | number | null
    role?: XOR<RoleNullableScalarRelationFilter, RoleWhereInput> | null
    acknowledged_logs?: EventLogListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    firstname?: SortOrder
    lastname?: SortOrder
    username?: SortOrder
    password?: SortOrder
    role_id?: SortOrderInput | SortOrder
    role?: RoleOrderByWithRelationInput
    acknowledged_logs?: EventLogOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: bigint | number
    username?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    firstname?: StringFilter<"User"> | string
    lastname?: StringFilter<"User"> | string
    password?: StringFilter<"User"> | string
    role_id?: BigIntNullableFilter<"User"> | bigint | number | null
    role?: XOR<RoleNullableScalarRelationFilter, RoleWhereInput> | null
    acknowledged_logs?: EventLogListRelationFilter
  }, "id" | "username">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    firstname?: SortOrder
    lastname?: SortOrder
    username?: SortOrder
    password?: SortOrder
    role_id?: SortOrderInput | SortOrder
    _count?: UserCountOrderByAggregateInput
    _avg?: UserAvgOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
    _sum?: UserSumOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: BigIntWithAggregatesFilter<"User"> | bigint | number
    firstname?: StringWithAggregatesFilter<"User"> | string
    lastname?: StringWithAggregatesFilter<"User"> | string
    username?: StringWithAggregatesFilter<"User"> | string
    password?: StringWithAggregatesFilter<"User"> | string
    role_id?: BigIntNullableWithAggregatesFilter<"User"> | bigint | number | null
  }

  export type LocationWhereInput = {
    AND?: LocationWhereInput | LocationWhereInput[]
    OR?: LocationWhereInput[]
    NOT?: LocationWhereInput | LocationWhereInput[]
    id?: BigIntFilter<"Location"> | bigint | number
    loc_name?: StringFilter<"Location"> | string
    cameras?: CameraListRelationFilter
  }

  export type LocationOrderByWithRelationInput = {
    id?: SortOrder
    loc_name?: SortOrder
    cameras?: CameraOrderByRelationAggregateInput
  }

  export type LocationWhereUniqueInput = Prisma.AtLeast<{
    id?: bigint | number
    loc_name?: string
    AND?: LocationWhereInput | LocationWhereInput[]
    OR?: LocationWhereInput[]
    NOT?: LocationWhereInput | LocationWhereInput[]
    cameras?: CameraListRelationFilter
  }, "id" | "loc_name">

  export type LocationOrderByWithAggregationInput = {
    id?: SortOrder
    loc_name?: SortOrder
    _count?: LocationCountOrderByAggregateInput
    _avg?: LocationAvgOrderByAggregateInput
    _max?: LocationMaxOrderByAggregateInput
    _min?: LocationMinOrderByAggregateInput
    _sum?: LocationSumOrderByAggregateInput
  }

  export type LocationScalarWhereWithAggregatesInput = {
    AND?: LocationScalarWhereWithAggregatesInput | LocationScalarWhereWithAggregatesInput[]
    OR?: LocationScalarWhereWithAggregatesInput[]
    NOT?: LocationScalarWhereWithAggregatesInput | LocationScalarWhereWithAggregatesInput[]
    id?: BigIntWithAggregatesFilter<"Location"> | bigint | number
    loc_name?: StringWithAggregatesFilter<"Location"> | string
  }

  export type EventTypeWhereInput = {
    AND?: EventTypeWhereInput | EventTypeWhereInput[]
    OR?: EventTypeWhereInput[]
    NOT?: EventTypeWhereInput | EventTypeWhereInput[]
    id?: BigIntFilter<"EventType"> | bigint | number
    event_type_name?: StringFilter<"EventType"> | string
    classes?: EventClassListRelationFilter
  }

  export type EventTypeOrderByWithRelationInput = {
    id?: SortOrder
    event_type_name?: SortOrder
    classes?: EventClassOrderByRelationAggregateInput
  }

  export type EventTypeWhereUniqueInput = Prisma.AtLeast<{
    id?: bigint | number
    event_type_name?: string
    AND?: EventTypeWhereInput | EventTypeWhereInput[]
    OR?: EventTypeWhereInput[]
    NOT?: EventTypeWhereInput | EventTypeWhereInput[]
    classes?: EventClassListRelationFilter
  }, "id" | "event_type_name">

  export type EventTypeOrderByWithAggregationInput = {
    id?: SortOrder
    event_type_name?: SortOrder
    _count?: EventTypeCountOrderByAggregateInput
    _avg?: EventTypeAvgOrderByAggregateInput
    _max?: EventTypeMaxOrderByAggregateInput
    _min?: EventTypeMinOrderByAggregateInput
    _sum?: EventTypeSumOrderByAggregateInput
  }

  export type EventTypeScalarWhereWithAggregatesInput = {
    AND?: EventTypeScalarWhereWithAggregatesInput | EventTypeScalarWhereWithAggregatesInput[]
    OR?: EventTypeScalarWhereWithAggregatesInput[]
    NOT?: EventTypeScalarWhereWithAggregatesInput | EventTypeScalarWhereWithAggregatesInput[]
    id?: BigIntWithAggregatesFilter<"EventType"> | bigint | number
    event_type_name?: StringWithAggregatesFilter<"EventType"> | string
  }

  export type EventClassWhereInput = {
    AND?: EventClassWhereInput | EventClassWhereInput[]
    OR?: EventClassWhereInput[]
    NOT?: EventClassWhereInput | EventClassWhereInput[]
    id?: BigIntFilter<"EventClass"> | bigint | number
    class_name?: StringFilter<"EventClass"> | string
    event_type_id?: BigIntFilter<"EventClass"> | bigint | number
    event_type?: XOR<EventTypeScalarRelationFilter, EventTypeWhereInput>
    logs?: EventLogListRelationFilter
  }

  export type EventClassOrderByWithRelationInput = {
    id?: SortOrder
    class_name?: SortOrder
    event_type_id?: SortOrder
    event_type?: EventTypeOrderByWithRelationInput
    logs?: EventLogOrderByRelationAggregateInput
  }

  export type EventClassWhereUniqueInput = Prisma.AtLeast<{
    id?: bigint | number
    AND?: EventClassWhereInput | EventClassWhereInput[]
    OR?: EventClassWhereInput[]
    NOT?: EventClassWhereInput | EventClassWhereInput[]
    class_name?: StringFilter<"EventClass"> | string
    event_type_id?: BigIntFilter<"EventClass"> | bigint | number
    event_type?: XOR<EventTypeScalarRelationFilter, EventTypeWhereInput>
    logs?: EventLogListRelationFilter
  }, "id">

  export type EventClassOrderByWithAggregationInput = {
    id?: SortOrder
    class_name?: SortOrder
    event_type_id?: SortOrder
    _count?: EventClassCountOrderByAggregateInput
    _avg?: EventClassAvgOrderByAggregateInput
    _max?: EventClassMaxOrderByAggregateInput
    _min?: EventClassMinOrderByAggregateInput
    _sum?: EventClassSumOrderByAggregateInput
  }

  export type EventClassScalarWhereWithAggregatesInput = {
    AND?: EventClassScalarWhereWithAggregatesInput | EventClassScalarWhereWithAggregatesInput[]
    OR?: EventClassScalarWhereWithAggregatesInput[]
    NOT?: EventClassScalarWhereWithAggregatesInput | EventClassScalarWhereWithAggregatesInput[]
    id?: BigIntWithAggregatesFilter<"EventClass"> | bigint | number
    class_name?: StringWithAggregatesFilter<"EventClass"> | string
    event_type_id?: BigIntWithAggregatesFilter<"EventClass"> | bigint | number
  }

  export type CameraWhereInput = {
    AND?: CameraWhereInput | CameraWhereInput[]
    OR?: CameraWhereInput[]
    NOT?: CameraWhereInput | CameraWhereInput[]
    id?: BigIntFilter<"Camera"> | bigint | number
    cam_name?: StringFilter<"Camera"> | string
    cam_status?: BoolFilter<"Camera"> | boolean
    stream_url?: StringFilter<"Camera"> | string
    loc_id?: BigIntNullableFilter<"Camera"> | bigint | number | null
    location?: XOR<LocationNullableScalarRelationFilter, LocationWhereInput> | null
    logs?: EventLogListRelationFilter
  }

  export type CameraOrderByWithRelationInput = {
    id?: SortOrder
    cam_name?: SortOrder
    cam_status?: SortOrder
    stream_url?: SortOrder
    loc_id?: SortOrderInput | SortOrder
    location?: LocationOrderByWithRelationInput
    logs?: EventLogOrderByRelationAggregateInput
  }

  export type CameraWhereUniqueInput = Prisma.AtLeast<{
    id?: bigint | number
    AND?: CameraWhereInput | CameraWhereInput[]
    OR?: CameraWhereInput[]
    NOT?: CameraWhereInput | CameraWhereInput[]
    cam_name?: StringFilter<"Camera"> | string
    cam_status?: BoolFilter<"Camera"> | boolean
    stream_url?: StringFilter<"Camera"> | string
    loc_id?: BigIntNullableFilter<"Camera"> | bigint | number | null
    location?: XOR<LocationNullableScalarRelationFilter, LocationWhereInput> | null
    logs?: EventLogListRelationFilter
  }, "id">

  export type CameraOrderByWithAggregationInput = {
    id?: SortOrder
    cam_name?: SortOrder
    cam_status?: SortOrder
    stream_url?: SortOrder
    loc_id?: SortOrderInput | SortOrder
    _count?: CameraCountOrderByAggregateInput
    _avg?: CameraAvgOrderByAggregateInput
    _max?: CameraMaxOrderByAggregateInput
    _min?: CameraMinOrderByAggregateInput
    _sum?: CameraSumOrderByAggregateInput
  }

  export type CameraScalarWhereWithAggregatesInput = {
    AND?: CameraScalarWhereWithAggregatesInput | CameraScalarWhereWithAggregatesInput[]
    OR?: CameraScalarWhereWithAggregatesInput[]
    NOT?: CameraScalarWhereWithAggregatesInput | CameraScalarWhereWithAggregatesInput[]
    id?: BigIntWithAggregatesFilter<"Camera"> | bigint | number
    cam_name?: StringWithAggregatesFilter<"Camera"> | string
    cam_status?: BoolWithAggregatesFilter<"Camera"> | boolean
    stream_url?: StringWithAggregatesFilter<"Camera"> | string
    loc_id?: BigIntNullableWithAggregatesFilter<"Camera"> | bigint | number | null
  }

  export type EventLogWhereInput = {
    AND?: EventLogWhereInput | EventLogWhereInput[]
    OR?: EventLogWhereInput[]
    NOT?: EventLogWhereInput | EventLogWhereInput[]
    id?: BigIntFilter<"EventLog"> | bigint | number
    timestamp?: DateTimeFilter<"EventLog"> | Date | string
    event_status?: StringFilter<"EventLog"> | string
    file_path?: StringNullableFilter<"EventLog"> | string | null
    cam_id?: BigIntNullableFilter<"EventLog"> | bigint | number | null
    event_class_id?: BigIntNullableFilter<"EventLog"> | bigint | number | null
    ack_by_user_id?: BigIntNullableFilter<"EventLog"> | bigint | number | null
    camera?: XOR<CameraNullableScalarRelationFilter, CameraWhereInput> | null
    event_class?: XOR<EventClassNullableScalarRelationFilter, EventClassWhereInput> | null
    acknowledged_by?: XOR<UserNullableScalarRelationFilter, UserWhereInput> | null
  }

  export type EventLogOrderByWithRelationInput = {
    id?: SortOrder
    timestamp?: SortOrder
    event_status?: SortOrder
    file_path?: SortOrderInput | SortOrder
    cam_id?: SortOrderInput | SortOrder
    event_class_id?: SortOrderInput | SortOrder
    ack_by_user_id?: SortOrderInput | SortOrder
    camera?: CameraOrderByWithRelationInput
    event_class?: EventClassOrderByWithRelationInput
    acknowledged_by?: UserOrderByWithRelationInput
  }

  export type EventLogWhereUniqueInput = Prisma.AtLeast<{
    id?: bigint | number
    AND?: EventLogWhereInput | EventLogWhereInput[]
    OR?: EventLogWhereInput[]
    NOT?: EventLogWhereInput | EventLogWhereInput[]
    timestamp?: DateTimeFilter<"EventLog"> | Date | string
    event_status?: StringFilter<"EventLog"> | string
    file_path?: StringNullableFilter<"EventLog"> | string | null
    cam_id?: BigIntNullableFilter<"EventLog"> | bigint | number | null
    event_class_id?: BigIntNullableFilter<"EventLog"> | bigint | number | null
    ack_by_user_id?: BigIntNullableFilter<"EventLog"> | bigint | number | null
    camera?: XOR<CameraNullableScalarRelationFilter, CameraWhereInput> | null
    event_class?: XOR<EventClassNullableScalarRelationFilter, EventClassWhereInput> | null
    acknowledged_by?: XOR<UserNullableScalarRelationFilter, UserWhereInput> | null
  }, "id">

  export type EventLogOrderByWithAggregationInput = {
    id?: SortOrder
    timestamp?: SortOrder
    event_status?: SortOrder
    file_path?: SortOrderInput | SortOrder
    cam_id?: SortOrderInput | SortOrder
    event_class_id?: SortOrderInput | SortOrder
    ack_by_user_id?: SortOrderInput | SortOrder
    _count?: EventLogCountOrderByAggregateInput
    _avg?: EventLogAvgOrderByAggregateInput
    _max?: EventLogMaxOrderByAggregateInput
    _min?: EventLogMinOrderByAggregateInput
    _sum?: EventLogSumOrderByAggregateInput
  }

  export type EventLogScalarWhereWithAggregatesInput = {
    AND?: EventLogScalarWhereWithAggregatesInput | EventLogScalarWhereWithAggregatesInput[]
    OR?: EventLogScalarWhereWithAggregatesInput[]
    NOT?: EventLogScalarWhereWithAggregatesInput | EventLogScalarWhereWithAggregatesInput[]
    id?: BigIntWithAggregatesFilter<"EventLog"> | bigint | number
    timestamp?: DateTimeWithAggregatesFilter<"EventLog"> | Date | string
    event_status?: StringWithAggregatesFilter<"EventLog"> | string
    file_path?: StringNullableWithAggregatesFilter<"EventLog"> | string | null
    cam_id?: BigIntNullableWithAggregatesFilter<"EventLog"> | bigint | number | null
    event_class_id?: BigIntNullableWithAggregatesFilter<"EventLog"> | bigint | number | null
    ack_by_user_id?: BigIntNullableWithAggregatesFilter<"EventLog"> | bigint | number | null
  }

  export type RoleCreateInput = {
    id?: bigint | number
    role_name: string
    users?: UserCreateNestedManyWithoutRoleInput
  }

  export type RoleUncheckedCreateInput = {
    id?: bigint | number
    role_name: string
    users?: UserUncheckedCreateNestedManyWithoutRoleInput
  }

  export type RoleUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    role_name?: StringFieldUpdateOperationsInput | string
    users?: UserUpdateManyWithoutRoleNestedInput
  }

  export type RoleUncheckedUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    role_name?: StringFieldUpdateOperationsInput | string
    users?: UserUncheckedUpdateManyWithoutRoleNestedInput
  }

  export type RoleCreateManyInput = {
    id?: bigint | number
    role_name: string
  }

  export type RoleUpdateManyMutationInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    role_name?: StringFieldUpdateOperationsInput | string
  }

  export type RoleUncheckedUpdateManyInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    role_name?: StringFieldUpdateOperationsInput | string
  }

  export type UserCreateInput = {
    id?: bigint | number
    firstname: string
    lastname: string
    username: string
    password: string
    role?: RoleCreateNestedOneWithoutUsersInput
    acknowledged_logs?: EventLogCreateNestedManyWithoutAcknowledged_byInput
  }

  export type UserUncheckedCreateInput = {
    id?: bigint | number
    firstname: string
    lastname: string
    username: string
    password: string
    role_id?: bigint | number | null
    acknowledged_logs?: EventLogUncheckedCreateNestedManyWithoutAcknowledged_byInput
  }

  export type UserUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    firstname?: StringFieldUpdateOperationsInput | string
    lastname?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: RoleUpdateOneWithoutUsersNestedInput
    acknowledged_logs?: EventLogUpdateManyWithoutAcknowledged_byNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    firstname?: StringFieldUpdateOperationsInput | string
    lastname?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    acknowledged_logs?: EventLogUncheckedUpdateManyWithoutAcknowledged_byNestedInput
  }

  export type UserCreateManyInput = {
    id?: bigint | number
    firstname: string
    lastname: string
    username: string
    password: string
    role_id?: bigint | number | null
  }

  export type UserUpdateManyMutationInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    firstname?: StringFieldUpdateOperationsInput | string
    lastname?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    firstname?: StringFieldUpdateOperationsInput | string
    lastname?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
  }

  export type LocationCreateInput = {
    id?: bigint | number
    loc_name: string
    cameras?: CameraCreateNestedManyWithoutLocationInput
  }

  export type LocationUncheckedCreateInput = {
    id?: bigint | number
    loc_name: string
    cameras?: CameraUncheckedCreateNestedManyWithoutLocationInput
  }

  export type LocationUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    loc_name?: StringFieldUpdateOperationsInput | string
    cameras?: CameraUpdateManyWithoutLocationNestedInput
  }

  export type LocationUncheckedUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    loc_name?: StringFieldUpdateOperationsInput | string
    cameras?: CameraUncheckedUpdateManyWithoutLocationNestedInput
  }

  export type LocationCreateManyInput = {
    id?: bigint | number
    loc_name: string
  }

  export type LocationUpdateManyMutationInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    loc_name?: StringFieldUpdateOperationsInput | string
  }

  export type LocationUncheckedUpdateManyInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    loc_name?: StringFieldUpdateOperationsInput | string
  }

  export type EventTypeCreateInput = {
    id?: bigint | number
    event_type_name: string
    classes?: EventClassCreateNestedManyWithoutEvent_typeInput
  }

  export type EventTypeUncheckedCreateInput = {
    id?: bigint | number
    event_type_name: string
    classes?: EventClassUncheckedCreateNestedManyWithoutEvent_typeInput
  }

  export type EventTypeUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    event_type_name?: StringFieldUpdateOperationsInput | string
    classes?: EventClassUpdateManyWithoutEvent_typeNestedInput
  }

  export type EventTypeUncheckedUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    event_type_name?: StringFieldUpdateOperationsInput | string
    classes?: EventClassUncheckedUpdateManyWithoutEvent_typeNestedInput
  }

  export type EventTypeCreateManyInput = {
    id?: bigint | number
    event_type_name: string
  }

  export type EventTypeUpdateManyMutationInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    event_type_name?: StringFieldUpdateOperationsInput | string
  }

  export type EventTypeUncheckedUpdateManyInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    event_type_name?: StringFieldUpdateOperationsInput | string
  }

  export type EventClassCreateInput = {
    id?: bigint | number
    class_name: string
    event_type: EventTypeCreateNestedOneWithoutClassesInput
    logs?: EventLogCreateNestedManyWithoutEvent_classInput
  }

  export type EventClassUncheckedCreateInput = {
    id?: bigint | number
    class_name: string
    event_type_id: bigint | number
    logs?: EventLogUncheckedCreateNestedManyWithoutEvent_classInput
  }

  export type EventClassUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    class_name?: StringFieldUpdateOperationsInput | string
    event_type?: EventTypeUpdateOneRequiredWithoutClassesNestedInput
    logs?: EventLogUpdateManyWithoutEvent_classNestedInput
  }

  export type EventClassUncheckedUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    class_name?: StringFieldUpdateOperationsInput | string
    event_type_id?: BigIntFieldUpdateOperationsInput | bigint | number
    logs?: EventLogUncheckedUpdateManyWithoutEvent_classNestedInput
  }

  export type EventClassCreateManyInput = {
    id?: bigint | number
    class_name: string
    event_type_id: bigint | number
  }

  export type EventClassUpdateManyMutationInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    class_name?: StringFieldUpdateOperationsInput | string
  }

  export type EventClassUncheckedUpdateManyInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    class_name?: StringFieldUpdateOperationsInput | string
    event_type_id?: BigIntFieldUpdateOperationsInput | bigint | number
  }

  export type CameraCreateInput = {
    id?: bigint | number
    cam_name: string
    cam_status?: boolean
    stream_url: string
    location?: LocationCreateNestedOneWithoutCamerasInput
    logs?: EventLogCreateNestedManyWithoutCameraInput
  }

  export type CameraUncheckedCreateInput = {
    id?: bigint | number
    cam_name: string
    cam_status?: boolean
    stream_url: string
    loc_id?: bigint | number | null
    logs?: EventLogUncheckedCreateNestedManyWithoutCameraInput
  }

  export type CameraUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    cam_name?: StringFieldUpdateOperationsInput | string
    cam_status?: BoolFieldUpdateOperationsInput | boolean
    stream_url?: StringFieldUpdateOperationsInput | string
    location?: LocationUpdateOneWithoutCamerasNestedInput
    logs?: EventLogUpdateManyWithoutCameraNestedInput
  }

  export type CameraUncheckedUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    cam_name?: StringFieldUpdateOperationsInput | string
    cam_status?: BoolFieldUpdateOperationsInput | boolean
    stream_url?: StringFieldUpdateOperationsInput | string
    loc_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    logs?: EventLogUncheckedUpdateManyWithoutCameraNestedInput
  }

  export type CameraCreateManyInput = {
    id?: bigint | number
    cam_name: string
    cam_status?: boolean
    stream_url: string
    loc_id?: bigint | number | null
  }

  export type CameraUpdateManyMutationInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    cam_name?: StringFieldUpdateOperationsInput | string
    cam_status?: BoolFieldUpdateOperationsInput | boolean
    stream_url?: StringFieldUpdateOperationsInput | string
  }

  export type CameraUncheckedUpdateManyInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    cam_name?: StringFieldUpdateOperationsInput | string
    cam_status?: BoolFieldUpdateOperationsInput | boolean
    stream_url?: StringFieldUpdateOperationsInput | string
    loc_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
  }

  export type EventLogCreateInput = {
    id?: bigint | number
    timestamp?: Date | string
    event_status?: string
    file_path?: string | null
    camera?: CameraCreateNestedOneWithoutLogsInput
    event_class?: EventClassCreateNestedOneWithoutLogsInput
    acknowledged_by?: UserCreateNestedOneWithoutAcknowledged_logsInput
  }

  export type EventLogUncheckedCreateInput = {
    id?: bigint | number
    timestamp?: Date | string
    event_status?: string
    file_path?: string | null
    cam_id?: bigint | number | null
    event_class_id?: bigint | number | null
    ack_by_user_id?: bigint | number | null
  }

  export type EventLogUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    event_status?: StringFieldUpdateOperationsInput | string
    file_path?: NullableStringFieldUpdateOperationsInput | string | null
    camera?: CameraUpdateOneWithoutLogsNestedInput
    event_class?: EventClassUpdateOneWithoutLogsNestedInput
    acknowledged_by?: UserUpdateOneWithoutAcknowledged_logsNestedInput
  }

  export type EventLogUncheckedUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    event_status?: StringFieldUpdateOperationsInput | string
    file_path?: NullableStringFieldUpdateOperationsInput | string | null
    cam_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    event_class_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    ack_by_user_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
  }

  export type EventLogCreateManyInput = {
    id?: bigint | number
    timestamp?: Date | string
    event_status?: string
    file_path?: string | null
    cam_id?: bigint | number | null
    event_class_id?: bigint | number | null
    ack_by_user_id?: bigint | number | null
  }

  export type EventLogUpdateManyMutationInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    event_status?: StringFieldUpdateOperationsInput | string
    file_path?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type EventLogUncheckedUpdateManyInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    event_status?: StringFieldUpdateOperationsInput | string
    file_path?: NullableStringFieldUpdateOperationsInput | string | null
    cam_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    event_class_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    ack_by_user_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
  }

  export type BigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type UserListRelationFilter = {
    every?: UserWhereInput
    some?: UserWhereInput
    none?: UserWhereInput
  }

  export type UserOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type RoleCountOrderByAggregateInput = {
    id?: SortOrder
    role_name?: SortOrder
  }

  export type RoleAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type RoleMaxOrderByAggregateInput = {
    id?: SortOrder
    role_name?: SortOrder
  }

  export type RoleMinOrderByAggregateInput = {
    id?: SortOrder
    role_name?: SortOrder
  }

  export type RoleSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type BigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type BigIntNullableFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel> | null
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntNullableFilter<$PrismaModel> | bigint | number | null
  }

  export type RoleNullableScalarRelationFilter = {
    is?: RoleWhereInput | null
    isNot?: RoleWhereInput | null
  }

  export type EventLogListRelationFilter = {
    every?: EventLogWhereInput
    some?: EventLogWhereInput
    none?: EventLogWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type EventLogOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    firstname?: SortOrder
    lastname?: SortOrder
    username?: SortOrder
    password?: SortOrder
    role_id?: SortOrder
  }

  export type UserAvgOrderByAggregateInput = {
    id?: SortOrder
    role_id?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    firstname?: SortOrder
    lastname?: SortOrder
    username?: SortOrder
    password?: SortOrder
    role_id?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    firstname?: SortOrder
    lastname?: SortOrder
    username?: SortOrder
    password?: SortOrder
    role_id?: SortOrder
  }

  export type UserSumOrderByAggregateInput = {
    id?: SortOrder
    role_id?: SortOrder
  }

  export type BigIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel> | null
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntNullableWithAggregatesFilter<$PrismaModel> | bigint | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedBigIntNullableFilter<$PrismaModel>
    _min?: NestedBigIntNullableFilter<$PrismaModel>
    _max?: NestedBigIntNullableFilter<$PrismaModel>
  }

  export type CameraListRelationFilter = {
    every?: CameraWhereInput
    some?: CameraWhereInput
    none?: CameraWhereInput
  }

  export type CameraOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type LocationCountOrderByAggregateInput = {
    id?: SortOrder
    loc_name?: SortOrder
  }

  export type LocationAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type LocationMaxOrderByAggregateInput = {
    id?: SortOrder
    loc_name?: SortOrder
  }

  export type LocationMinOrderByAggregateInput = {
    id?: SortOrder
    loc_name?: SortOrder
  }

  export type LocationSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type EventClassListRelationFilter = {
    every?: EventClassWhereInput
    some?: EventClassWhereInput
    none?: EventClassWhereInput
  }

  export type EventClassOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type EventTypeCountOrderByAggregateInput = {
    id?: SortOrder
    event_type_name?: SortOrder
  }

  export type EventTypeAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type EventTypeMaxOrderByAggregateInput = {
    id?: SortOrder
    event_type_name?: SortOrder
  }

  export type EventTypeMinOrderByAggregateInput = {
    id?: SortOrder
    event_type_name?: SortOrder
  }

  export type EventTypeSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type EventTypeScalarRelationFilter = {
    is?: EventTypeWhereInput
    isNot?: EventTypeWhereInput
  }

  export type EventClassCountOrderByAggregateInput = {
    id?: SortOrder
    class_name?: SortOrder
    event_type_id?: SortOrder
  }

  export type EventClassAvgOrderByAggregateInput = {
    id?: SortOrder
    event_type_id?: SortOrder
  }

  export type EventClassMaxOrderByAggregateInput = {
    id?: SortOrder
    class_name?: SortOrder
    event_type_id?: SortOrder
  }

  export type EventClassMinOrderByAggregateInput = {
    id?: SortOrder
    class_name?: SortOrder
    event_type_id?: SortOrder
  }

  export type EventClassSumOrderByAggregateInput = {
    id?: SortOrder
    event_type_id?: SortOrder
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type LocationNullableScalarRelationFilter = {
    is?: LocationWhereInput | null
    isNot?: LocationWhereInput | null
  }

  export type CameraCountOrderByAggregateInput = {
    id?: SortOrder
    cam_name?: SortOrder
    cam_status?: SortOrder
    stream_url?: SortOrder
    loc_id?: SortOrder
  }

  export type CameraAvgOrderByAggregateInput = {
    id?: SortOrder
    loc_id?: SortOrder
  }

  export type CameraMaxOrderByAggregateInput = {
    id?: SortOrder
    cam_name?: SortOrder
    cam_status?: SortOrder
    stream_url?: SortOrder
    loc_id?: SortOrder
  }

  export type CameraMinOrderByAggregateInput = {
    id?: SortOrder
    cam_name?: SortOrder
    cam_status?: SortOrder
    stream_url?: SortOrder
    loc_id?: SortOrder
  }

  export type CameraSumOrderByAggregateInput = {
    id?: SortOrder
    loc_id?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type CameraNullableScalarRelationFilter = {
    is?: CameraWhereInput | null
    isNot?: CameraWhereInput | null
  }

  export type EventClassNullableScalarRelationFilter = {
    is?: EventClassWhereInput | null
    isNot?: EventClassWhereInput | null
  }

  export type UserNullableScalarRelationFilter = {
    is?: UserWhereInput | null
    isNot?: UserWhereInput | null
  }

  export type EventLogCountOrderByAggregateInput = {
    id?: SortOrder
    timestamp?: SortOrder
    event_status?: SortOrder
    file_path?: SortOrder
    cam_id?: SortOrder
    event_class_id?: SortOrder
    ack_by_user_id?: SortOrder
  }

  export type EventLogAvgOrderByAggregateInput = {
    id?: SortOrder
    cam_id?: SortOrder
    event_class_id?: SortOrder
    ack_by_user_id?: SortOrder
  }

  export type EventLogMaxOrderByAggregateInput = {
    id?: SortOrder
    timestamp?: SortOrder
    event_status?: SortOrder
    file_path?: SortOrder
    cam_id?: SortOrder
    event_class_id?: SortOrder
    ack_by_user_id?: SortOrder
  }

  export type EventLogMinOrderByAggregateInput = {
    id?: SortOrder
    timestamp?: SortOrder
    event_status?: SortOrder
    file_path?: SortOrder
    cam_id?: SortOrder
    event_class_id?: SortOrder
    ack_by_user_id?: SortOrder
  }

  export type EventLogSumOrderByAggregateInput = {
    id?: SortOrder
    cam_id?: SortOrder
    event_class_id?: SortOrder
    ack_by_user_id?: SortOrder
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type UserCreateNestedManyWithoutRoleInput = {
    create?: XOR<UserCreateWithoutRoleInput, UserUncheckedCreateWithoutRoleInput> | UserCreateWithoutRoleInput[] | UserUncheckedCreateWithoutRoleInput[]
    connectOrCreate?: UserCreateOrConnectWithoutRoleInput | UserCreateOrConnectWithoutRoleInput[]
    createMany?: UserCreateManyRoleInputEnvelope
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
  }

  export type UserUncheckedCreateNestedManyWithoutRoleInput = {
    create?: XOR<UserCreateWithoutRoleInput, UserUncheckedCreateWithoutRoleInput> | UserCreateWithoutRoleInput[] | UserUncheckedCreateWithoutRoleInput[]
    connectOrCreate?: UserCreateOrConnectWithoutRoleInput | UserCreateOrConnectWithoutRoleInput[]
    createMany?: UserCreateManyRoleInputEnvelope
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
  }

  export type BigIntFieldUpdateOperationsInput = {
    set?: bigint | number
    increment?: bigint | number
    decrement?: bigint | number
    multiply?: bigint | number
    divide?: bigint | number
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type UserUpdateManyWithoutRoleNestedInput = {
    create?: XOR<UserCreateWithoutRoleInput, UserUncheckedCreateWithoutRoleInput> | UserCreateWithoutRoleInput[] | UserUncheckedCreateWithoutRoleInput[]
    connectOrCreate?: UserCreateOrConnectWithoutRoleInput | UserCreateOrConnectWithoutRoleInput[]
    upsert?: UserUpsertWithWhereUniqueWithoutRoleInput | UserUpsertWithWhereUniqueWithoutRoleInput[]
    createMany?: UserCreateManyRoleInputEnvelope
    set?: UserWhereUniqueInput | UserWhereUniqueInput[]
    disconnect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    delete?: UserWhereUniqueInput | UserWhereUniqueInput[]
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    update?: UserUpdateWithWhereUniqueWithoutRoleInput | UserUpdateWithWhereUniqueWithoutRoleInput[]
    updateMany?: UserUpdateManyWithWhereWithoutRoleInput | UserUpdateManyWithWhereWithoutRoleInput[]
    deleteMany?: UserScalarWhereInput | UserScalarWhereInput[]
  }

  export type UserUncheckedUpdateManyWithoutRoleNestedInput = {
    create?: XOR<UserCreateWithoutRoleInput, UserUncheckedCreateWithoutRoleInput> | UserCreateWithoutRoleInput[] | UserUncheckedCreateWithoutRoleInput[]
    connectOrCreate?: UserCreateOrConnectWithoutRoleInput | UserCreateOrConnectWithoutRoleInput[]
    upsert?: UserUpsertWithWhereUniqueWithoutRoleInput | UserUpsertWithWhereUniqueWithoutRoleInput[]
    createMany?: UserCreateManyRoleInputEnvelope
    set?: UserWhereUniqueInput | UserWhereUniqueInput[]
    disconnect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    delete?: UserWhereUniqueInput | UserWhereUniqueInput[]
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    update?: UserUpdateWithWhereUniqueWithoutRoleInput | UserUpdateWithWhereUniqueWithoutRoleInput[]
    updateMany?: UserUpdateManyWithWhereWithoutRoleInput | UserUpdateManyWithWhereWithoutRoleInput[]
    deleteMany?: UserScalarWhereInput | UserScalarWhereInput[]
  }

  export type RoleCreateNestedOneWithoutUsersInput = {
    create?: XOR<RoleCreateWithoutUsersInput, RoleUncheckedCreateWithoutUsersInput>
    connectOrCreate?: RoleCreateOrConnectWithoutUsersInput
    connect?: RoleWhereUniqueInput
  }

  export type EventLogCreateNestedManyWithoutAcknowledged_byInput = {
    create?: XOR<EventLogCreateWithoutAcknowledged_byInput, EventLogUncheckedCreateWithoutAcknowledged_byInput> | EventLogCreateWithoutAcknowledged_byInput[] | EventLogUncheckedCreateWithoutAcknowledged_byInput[]
    connectOrCreate?: EventLogCreateOrConnectWithoutAcknowledged_byInput | EventLogCreateOrConnectWithoutAcknowledged_byInput[]
    createMany?: EventLogCreateManyAcknowledged_byInputEnvelope
    connect?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
  }

  export type EventLogUncheckedCreateNestedManyWithoutAcknowledged_byInput = {
    create?: XOR<EventLogCreateWithoutAcknowledged_byInput, EventLogUncheckedCreateWithoutAcknowledged_byInput> | EventLogCreateWithoutAcknowledged_byInput[] | EventLogUncheckedCreateWithoutAcknowledged_byInput[]
    connectOrCreate?: EventLogCreateOrConnectWithoutAcknowledged_byInput | EventLogCreateOrConnectWithoutAcknowledged_byInput[]
    createMany?: EventLogCreateManyAcknowledged_byInputEnvelope
    connect?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
  }

  export type RoleUpdateOneWithoutUsersNestedInput = {
    create?: XOR<RoleCreateWithoutUsersInput, RoleUncheckedCreateWithoutUsersInput>
    connectOrCreate?: RoleCreateOrConnectWithoutUsersInput
    upsert?: RoleUpsertWithoutUsersInput
    disconnect?: RoleWhereInput | boolean
    delete?: RoleWhereInput | boolean
    connect?: RoleWhereUniqueInput
    update?: XOR<XOR<RoleUpdateToOneWithWhereWithoutUsersInput, RoleUpdateWithoutUsersInput>, RoleUncheckedUpdateWithoutUsersInput>
  }

  export type EventLogUpdateManyWithoutAcknowledged_byNestedInput = {
    create?: XOR<EventLogCreateWithoutAcknowledged_byInput, EventLogUncheckedCreateWithoutAcknowledged_byInput> | EventLogCreateWithoutAcknowledged_byInput[] | EventLogUncheckedCreateWithoutAcknowledged_byInput[]
    connectOrCreate?: EventLogCreateOrConnectWithoutAcknowledged_byInput | EventLogCreateOrConnectWithoutAcknowledged_byInput[]
    upsert?: EventLogUpsertWithWhereUniqueWithoutAcknowledged_byInput | EventLogUpsertWithWhereUniqueWithoutAcknowledged_byInput[]
    createMany?: EventLogCreateManyAcknowledged_byInputEnvelope
    set?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    disconnect?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    delete?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    connect?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    update?: EventLogUpdateWithWhereUniqueWithoutAcknowledged_byInput | EventLogUpdateWithWhereUniqueWithoutAcknowledged_byInput[]
    updateMany?: EventLogUpdateManyWithWhereWithoutAcknowledged_byInput | EventLogUpdateManyWithWhereWithoutAcknowledged_byInput[]
    deleteMany?: EventLogScalarWhereInput | EventLogScalarWhereInput[]
  }

  export type NullableBigIntFieldUpdateOperationsInput = {
    set?: bigint | number | null
    increment?: bigint | number
    decrement?: bigint | number
    multiply?: bigint | number
    divide?: bigint | number
  }

  export type EventLogUncheckedUpdateManyWithoutAcknowledged_byNestedInput = {
    create?: XOR<EventLogCreateWithoutAcknowledged_byInput, EventLogUncheckedCreateWithoutAcknowledged_byInput> | EventLogCreateWithoutAcknowledged_byInput[] | EventLogUncheckedCreateWithoutAcknowledged_byInput[]
    connectOrCreate?: EventLogCreateOrConnectWithoutAcknowledged_byInput | EventLogCreateOrConnectWithoutAcknowledged_byInput[]
    upsert?: EventLogUpsertWithWhereUniqueWithoutAcknowledged_byInput | EventLogUpsertWithWhereUniqueWithoutAcknowledged_byInput[]
    createMany?: EventLogCreateManyAcknowledged_byInputEnvelope
    set?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    disconnect?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    delete?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    connect?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    update?: EventLogUpdateWithWhereUniqueWithoutAcknowledged_byInput | EventLogUpdateWithWhereUniqueWithoutAcknowledged_byInput[]
    updateMany?: EventLogUpdateManyWithWhereWithoutAcknowledged_byInput | EventLogUpdateManyWithWhereWithoutAcknowledged_byInput[]
    deleteMany?: EventLogScalarWhereInput | EventLogScalarWhereInput[]
  }

  export type CameraCreateNestedManyWithoutLocationInput = {
    create?: XOR<CameraCreateWithoutLocationInput, CameraUncheckedCreateWithoutLocationInput> | CameraCreateWithoutLocationInput[] | CameraUncheckedCreateWithoutLocationInput[]
    connectOrCreate?: CameraCreateOrConnectWithoutLocationInput | CameraCreateOrConnectWithoutLocationInput[]
    createMany?: CameraCreateManyLocationInputEnvelope
    connect?: CameraWhereUniqueInput | CameraWhereUniqueInput[]
  }

  export type CameraUncheckedCreateNestedManyWithoutLocationInput = {
    create?: XOR<CameraCreateWithoutLocationInput, CameraUncheckedCreateWithoutLocationInput> | CameraCreateWithoutLocationInput[] | CameraUncheckedCreateWithoutLocationInput[]
    connectOrCreate?: CameraCreateOrConnectWithoutLocationInput | CameraCreateOrConnectWithoutLocationInput[]
    createMany?: CameraCreateManyLocationInputEnvelope
    connect?: CameraWhereUniqueInput | CameraWhereUniqueInput[]
  }

  export type CameraUpdateManyWithoutLocationNestedInput = {
    create?: XOR<CameraCreateWithoutLocationInput, CameraUncheckedCreateWithoutLocationInput> | CameraCreateWithoutLocationInput[] | CameraUncheckedCreateWithoutLocationInput[]
    connectOrCreate?: CameraCreateOrConnectWithoutLocationInput | CameraCreateOrConnectWithoutLocationInput[]
    upsert?: CameraUpsertWithWhereUniqueWithoutLocationInput | CameraUpsertWithWhereUniqueWithoutLocationInput[]
    createMany?: CameraCreateManyLocationInputEnvelope
    set?: CameraWhereUniqueInput | CameraWhereUniqueInput[]
    disconnect?: CameraWhereUniqueInput | CameraWhereUniqueInput[]
    delete?: CameraWhereUniqueInput | CameraWhereUniqueInput[]
    connect?: CameraWhereUniqueInput | CameraWhereUniqueInput[]
    update?: CameraUpdateWithWhereUniqueWithoutLocationInput | CameraUpdateWithWhereUniqueWithoutLocationInput[]
    updateMany?: CameraUpdateManyWithWhereWithoutLocationInput | CameraUpdateManyWithWhereWithoutLocationInput[]
    deleteMany?: CameraScalarWhereInput | CameraScalarWhereInput[]
  }

  export type CameraUncheckedUpdateManyWithoutLocationNestedInput = {
    create?: XOR<CameraCreateWithoutLocationInput, CameraUncheckedCreateWithoutLocationInput> | CameraCreateWithoutLocationInput[] | CameraUncheckedCreateWithoutLocationInput[]
    connectOrCreate?: CameraCreateOrConnectWithoutLocationInput | CameraCreateOrConnectWithoutLocationInput[]
    upsert?: CameraUpsertWithWhereUniqueWithoutLocationInput | CameraUpsertWithWhereUniqueWithoutLocationInput[]
    createMany?: CameraCreateManyLocationInputEnvelope
    set?: CameraWhereUniqueInput | CameraWhereUniqueInput[]
    disconnect?: CameraWhereUniqueInput | CameraWhereUniqueInput[]
    delete?: CameraWhereUniqueInput | CameraWhereUniqueInput[]
    connect?: CameraWhereUniqueInput | CameraWhereUniqueInput[]
    update?: CameraUpdateWithWhereUniqueWithoutLocationInput | CameraUpdateWithWhereUniqueWithoutLocationInput[]
    updateMany?: CameraUpdateManyWithWhereWithoutLocationInput | CameraUpdateManyWithWhereWithoutLocationInput[]
    deleteMany?: CameraScalarWhereInput | CameraScalarWhereInput[]
  }

  export type EventClassCreateNestedManyWithoutEvent_typeInput = {
    create?: XOR<EventClassCreateWithoutEvent_typeInput, EventClassUncheckedCreateWithoutEvent_typeInput> | EventClassCreateWithoutEvent_typeInput[] | EventClassUncheckedCreateWithoutEvent_typeInput[]
    connectOrCreate?: EventClassCreateOrConnectWithoutEvent_typeInput | EventClassCreateOrConnectWithoutEvent_typeInput[]
    createMany?: EventClassCreateManyEvent_typeInputEnvelope
    connect?: EventClassWhereUniqueInput | EventClassWhereUniqueInput[]
  }

  export type EventClassUncheckedCreateNestedManyWithoutEvent_typeInput = {
    create?: XOR<EventClassCreateWithoutEvent_typeInput, EventClassUncheckedCreateWithoutEvent_typeInput> | EventClassCreateWithoutEvent_typeInput[] | EventClassUncheckedCreateWithoutEvent_typeInput[]
    connectOrCreate?: EventClassCreateOrConnectWithoutEvent_typeInput | EventClassCreateOrConnectWithoutEvent_typeInput[]
    createMany?: EventClassCreateManyEvent_typeInputEnvelope
    connect?: EventClassWhereUniqueInput | EventClassWhereUniqueInput[]
  }

  export type EventClassUpdateManyWithoutEvent_typeNestedInput = {
    create?: XOR<EventClassCreateWithoutEvent_typeInput, EventClassUncheckedCreateWithoutEvent_typeInput> | EventClassCreateWithoutEvent_typeInput[] | EventClassUncheckedCreateWithoutEvent_typeInput[]
    connectOrCreate?: EventClassCreateOrConnectWithoutEvent_typeInput | EventClassCreateOrConnectWithoutEvent_typeInput[]
    upsert?: EventClassUpsertWithWhereUniqueWithoutEvent_typeInput | EventClassUpsertWithWhereUniqueWithoutEvent_typeInput[]
    createMany?: EventClassCreateManyEvent_typeInputEnvelope
    set?: EventClassWhereUniqueInput | EventClassWhereUniqueInput[]
    disconnect?: EventClassWhereUniqueInput | EventClassWhereUniqueInput[]
    delete?: EventClassWhereUniqueInput | EventClassWhereUniqueInput[]
    connect?: EventClassWhereUniqueInput | EventClassWhereUniqueInput[]
    update?: EventClassUpdateWithWhereUniqueWithoutEvent_typeInput | EventClassUpdateWithWhereUniqueWithoutEvent_typeInput[]
    updateMany?: EventClassUpdateManyWithWhereWithoutEvent_typeInput | EventClassUpdateManyWithWhereWithoutEvent_typeInput[]
    deleteMany?: EventClassScalarWhereInput | EventClassScalarWhereInput[]
  }

  export type EventClassUncheckedUpdateManyWithoutEvent_typeNestedInput = {
    create?: XOR<EventClassCreateWithoutEvent_typeInput, EventClassUncheckedCreateWithoutEvent_typeInput> | EventClassCreateWithoutEvent_typeInput[] | EventClassUncheckedCreateWithoutEvent_typeInput[]
    connectOrCreate?: EventClassCreateOrConnectWithoutEvent_typeInput | EventClassCreateOrConnectWithoutEvent_typeInput[]
    upsert?: EventClassUpsertWithWhereUniqueWithoutEvent_typeInput | EventClassUpsertWithWhereUniqueWithoutEvent_typeInput[]
    createMany?: EventClassCreateManyEvent_typeInputEnvelope
    set?: EventClassWhereUniqueInput | EventClassWhereUniqueInput[]
    disconnect?: EventClassWhereUniqueInput | EventClassWhereUniqueInput[]
    delete?: EventClassWhereUniqueInput | EventClassWhereUniqueInput[]
    connect?: EventClassWhereUniqueInput | EventClassWhereUniqueInput[]
    update?: EventClassUpdateWithWhereUniqueWithoutEvent_typeInput | EventClassUpdateWithWhereUniqueWithoutEvent_typeInput[]
    updateMany?: EventClassUpdateManyWithWhereWithoutEvent_typeInput | EventClassUpdateManyWithWhereWithoutEvent_typeInput[]
    deleteMany?: EventClassScalarWhereInput | EventClassScalarWhereInput[]
  }

  export type EventTypeCreateNestedOneWithoutClassesInput = {
    create?: XOR<EventTypeCreateWithoutClassesInput, EventTypeUncheckedCreateWithoutClassesInput>
    connectOrCreate?: EventTypeCreateOrConnectWithoutClassesInput
    connect?: EventTypeWhereUniqueInput
  }

  export type EventLogCreateNestedManyWithoutEvent_classInput = {
    create?: XOR<EventLogCreateWithoutEvent_classInput, EventLogUncheckedCreateWithoutEvent_classInput> | EventLogCreateWithoutEvent_classInput[] | EventLogUncheckedCreateWithoutEvent_classInput[]
    connectOrCreate?: EventLogCreateOrConnectWithoutEvent_classInput | EventLogCreateOrConnectWithoutEvent_classInput[]
    createMany?: EventLogCreateManyEvent_classInputEnvelope
    connect?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
  }

  export type EventLogUncheckedCreateNestedManyWithoutEvent_classInput = {
    create?: XOR<EventLogCreateWithoutEvent_classInput, EventLogUncheckedCreateWithoutEvent_classInput> | EventLogCreateWithoutEvent_classInput[] | EventLogUncheckedCreateWithoutEvent_classInput[]
    connectOrCreate?: EventLogCreateOrConnectWithoutEvent_classInput | EventLogCreateOrConnectWithoutEvent_classInput[]
    createMany?: EventLogCreateManyEvent_classInputEnvelope
    connect?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
  }

  export type EventTypeUpdateOneRequiredWithoutClassesNestedInput = {
    create?: XOR<EventTypeCreateWithoutClassesInput, EventTypeUncheckedCreateWithoutClassesInput>
    connectOrCreate?: EventTypeCreateOrConnectWithoutClassesInput
    upsert?: EventTypeUpsertWithoutClassesInput
    connect?: EventTypeWhereUniqueInput
    update?: XOR<XOR<EventTypeUpdateToOneWithWhereWithoutClassesInput, EventTypeUpdateWithoutClassesInput>, EventTypeUncheckedUpdateWithoutClassesInput>
  }

  export type EventLogUpdateManyWithoutEvent_classNestedInput = {
    create?: XOR<EventLogCreateWithoutEvent_classInput, EventLogUncheckedCreateWithoutEvent_classInput> | EventLogCreateWithoutEvent_classInput[] | EventLogUncheckedCreateWithoutEvent_classInput[]
    connectOrCreate?: EventLogCreateOrConnectWithoutEvent_classInput | EventLogCreateOrConnectWithoutEvent_classInput[]
    upsert?: EventLogUpsertWithWhereUniqueWithoutEvent_classInput | EventLogUpsertWithWhereUniqueWithoutEvent_classInput[]
    createMany?: EventLogCreateManyEvent_classInputEnvelope
    set?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    disconnect?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    delete?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    connect?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    update?: EventLogUpdateWithWhereUniqueWithoutEvent_classInput | EventLogUpdateWithWhereUniqueWithoutEvent_classInput[]
    updateMany?: EventLogUpdateManyWithWhereWithoutEvent_classInput | EventLogUpdateManyWithWhereWithoutEvent_classInput[]
    deleteMany?: EventLogScalarWhereInput | EventLogScalarWhereInput[]
  }

  export type EventLogUncheckedUpdateManyWithoutEvent_classNestedInput = {
    create?: XOR<EventLogCreateWithoutEvent_classInput, EventLogUncheckedCreateWithoutEvent_classInput> | EventLogCreateWithoutEvent_classInput[] | EventLogUncheckedCreateWithoutEvent_classInput[]
    connectOrCreate?: EventLogCreateOrConnectWithoutEvent_classInput | EventLogCreateOrConnectWithoutEvent_classInput[]
    upsert?: EventLogUpsertWithWhereUniqueWithoutEvent_classInput | EventLogUpsertWithWhereUniqueWithoutEvent_classInput[]
    createMany?: EventLogCreateManyEvent_classInputEnvelope
    set?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    disconnect?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    delete?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    connect?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    update?: EventLogUpdateWithWhereUniqueWithoutEvent_classInput | EventLogUpdateWithWhereUniqueWithoutEvent_classInput[]
    updateMany?: EventLogUpdateManyWithWhereWithoutEvent_classInput | EventLogUpdateManyWithWhereWithoutEvent_classInput[]
    deleteMany?: EventLogScalarWhereInput | EventLogScalarWhereInput[]
  }

  export type LocationCreateNestedOneWithoutCamerasInput = {
    create?: XOR<LocationCreateWithoutCamerasInput, LocationUncheckedCreateWithoutCamerasInput>
    connectOrCreate?: LocationCreateOrConnectWithoutCamerasInput
    connect?: LocationWhereUniqueInput
  }

  export type EventLogCreateNestedManyWithoutCameraInput = {
    create?: XOR<EventLogCreateWithoutCameraInput, EventLogUncheckedCreateWithoutCameraInput> | EventLogCreateWithoutCameraInput[] | EventLogUncheckedCreateWithoutCameraInput[]
    connectOrCreate?: EventLogCreateOrConnectWithoutCameraInput | EventLogCreateOrConnectWithoutCameraInput[]
    createMany?: EventLogCreateManyCameraInputEnvelope
    connect?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
  }

  export type EventLogUncheckedCreateNestedManyWithoutCameraInput = {
    create?: XOR<EventLogCreateWithoutCameraInput, EventLogUncheckedCreateWithoutCameraInput> | EventLogCreateWithoutCameraInput[] | EventLogUncheckedCreateWithoutCameraInput[]
    connectOrCreate?: EventLogCreateOrConnectWithoutCameraInput | EventLogCreateOrConnectWithoutCameraInput[]
    createMany?: EventLogCreateManyCameraInputEnvelope
    connect?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type LocationUpdateOneWithoutCamerasNestedInput = {
    create?: XOR<LocationCreateWithoutCamerasInput, LocationUncheckedCreateWithoutCamerasInput>
    connectOrCreate?: LocationCreateOrConnectWithoutCamerasInput
    upsert?: LocationUpsertWithoutCamerasInput
    disconnect?: LocationWhereInput | boolean
    delete?: LocationWhereInput | boolean
    connect?: LocationWhereUniqueInput
    update?: XOR<XOR<LocationUpdateToOneWithWhereWithoutCamerasInput, LocationUpdateWithoutCamerasInput>, LocationUncheckedUpdateWithoutCamerasInput>
  }

  export type EventLogUpdateManyWithoutCameraNestedInput = {
    create?: XOR<EventLogCreateWithoutCameraInput, EventLogUncheckedCreateWithoutCameraInput> | EventLogCreateWithoutCameraInput[] | EventLogUncheckedCreateWithoutCameraInput[]
    connectOrCreate?: EventLogCreateOrConnectWithoutCameraInput | EventLogCreateOrConnectWithoutCameraInput[]
    upsert?: EventLogUpsertWithWhereUniqueWithoutCameraInput | EventLogUpsertWithWhereUniqueWithoutCameraInput[]
    createMany?: EventLogCreateManyCameraInputEnvelope
    set?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    disconnect?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    delete?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    connect?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    update?: EventLogUpdateWithWhereUniqueWithoutCameraInput | EventLogUpdateWithWhereUniqueWithoutCameraInput[]
    updateMany?: EventLogUpdateManyWithWhereWithoutCameraInput | EventLogUpdateManyWithWhereWithoutCameraInput[]
    deleteMany?: EventLogScalarWhereInput | EventLogScalarWhereInput[]
  }

  export type EventLogUncheckedUpdateManyWithoutCameraNestedInput = {
    create?: XOR<EventLogCreateWithoutCameraInput, EventLogUncheckedCreateWithoutCameraInput> | EventLogCreateWithoutCameraInput[] | EventLogUncheckedCreateWithoutCameraInput[]
    connectOrCreate?: EventLogCreateOrConnectWithoutCameraInput | EventLogCreateOrConnectWithoutCameraInput[]
    upsert?: EventLogUpsertWithWhereUniqueWithoutCameraInput | EventLogUpsertWithWhereUniqueWithoutCameraInput[]
    createMany?: EventLogCreateManyCameraInputEnvelope
    set?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    disconnect?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    delete?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    connect?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    update?: EventLogUpdateWithWhereUniqueWithoutCameraInput | EventLogUpdateWithWhereUniqueWithoutCameraInput[]
    updateMany?: EventLogUpdateManyWithWhereWithoutCameraInput | EventLogUpdateManyWithWhereWithoutCameraInput[]
    deleteMany?: EventLogScalarWhereInput | EventLogScalarWhereInput[]
  }

  export type CameraCreateNestedOneWithoutLogsInput = {
    create?: XOR<CameraCreateWithoutLogsInput, CameraUncheckedCreateWithoutLogsInput>
    connectOrCreate?: CameraCreateOrConnectWithoutLogsInput
    connect?: CameraWhereUniqueInput
  }

  export type EventClassCreateNestedOneWithoutLogsInput = {
    create?: XOR<EventClassCreateWithoutLogsInput, EventClassUncheckedCreateWithoutLogsInput>
    connectOrCreate?: EventClassCreateOrConnectWithoutLogsInput
    connect?: EventClassWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutAcknowledged_logsInput = {
    create?: XOR<UserCreateWithoutAcknowledged_logsInput, UserUncheckedCreateWithoutAcknowledged_logsInput>
    connectOrCreate?: UserCreateOrConnectWithoutAcknowledged_logsInput
    connect?: UserWhereUniqueInput
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type CameraUpdateOneWithoutLogsNestedInput = {
    create?: XOR<CameraCreateWithoutLogsInput, CameraUncheckedCreateWithoutLogsInput>
    connectOrCreate?: CameraCreateOrConnectWithoutLogsInput
    upsert?: CameraUpsertWithoutLogsInput
    disconnect?: CameraWhereInput | boolean
    delete?: CameraWhereInput | boolean
    connect?: CameraWhereUniqueInput
    update?: XOR<XOR<CameraUpdateToOneWithWhereWithoutLogsInput, CameraUpdateWithoutLogsInput>, CameraUncheckedUpdateWithoutLogsInput>
  }

  export type EventClassUpdateOneWithoutLogsNestedInput = {
    create?: XOR<EventClassCreateWithoutLogsInput, EventClassUncheckedCreateWithoutLogsInput>
    connectOrCreate?: EventClassCreateOrConnectWithoutLogsInput
    upsert?: EventClassUpsertWithoutLogsInput
    disconnect?: EventClassWhereInput | boolean
    delete?: EventClassWhereInput | boolean
    connect?: EventClassWhereUniqueInput
    update?: XOR<XOR<EventClassUpdateToOneWithWhereWithoutLogsInput, EventClassUpdateWithoutLogsInput>, EventClassUncheckedUpdateWithoutLogsInput>
  }

  export type UserUpdateOneWithoutAcknowledged_logsNestedInput = {
    create?: XOR<UserCreateWithoutAcknowledged_logsInput, UserUncheckedCreateWithoutAcknowledged_logsInput>
    connectOrCreate?: UserCreateOrConnectWithoutAcknowledged_logsInput
    upsert?: UserUpsertWithoutAcknowledged_logsInput
    disconnect?: UserWhereInput | boolean
    delete?: UserWhereInput | boolean
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutAcknowledged_logsInput, UserUpdateWithoutAcknowledged_logsInput>, UserUncheckedUpdateWithoutAcknowledged_logsInput>
  }

  export type NestedBigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedBigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedBigIntNullableFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel> | null
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntNullableFilter<$PrismaModel> | bigint | number | null
  }

  export type NestedBigIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel> | null
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntNullableWithAggregatesFilter<$PrismaModel> | bigint | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedBigIntNullableFilter<$PrismaModel>
    _min?: NestedBigIntNullableFilter<$PrismaModel>
    _max?: NestedBigIntNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type UserCreateWithoutRoleInput = {
    id?: bigint | number
    firstname: string
    lastname: string
    username: string
    password: string
    acknowledged_logs?: EventLogCreateNestedManyWithoutAcknowledged_byInput
  }

  export type UserUncheckedCreateWithoutRoleInput = {
    id?: bigint | number
    firstname: string
    lastname: string
    username: string
    password: string
    acknowledged_logs?: EventLogUncheckedCreateNestedManyWithoutAcknowledged_byInput
  }

  export type UserCreateOrConnectWithoutRoleInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutRoleInput, UserUncheckedCreateWithoutRoleInput>
  }

  export type UserCreateManyRoleInputEnvelope = {
    data: UserCreateManyRoleInput | UserCreateManyRoleInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithWhereUniqueWithoutRoleInput = {
    where: UserWhereUniqueInput
    update: XOR<UserUpdateWithoutRoleInput, UserUncheckedUpdateWithoutRoleInput>
    create: XOR<UserCreateWithoutRoleInput, UserUncheckedCreateWithoutRoleInput>
  }

  export type UserUpdateWithWhereUniqueWithoutRoleInput = {
    where: UserWhereUniqueInput
    data: XOR<UserUpdateWithoutRoleInput, UserUncheckedUpdateWithoutRoleInput>
  }

  export type UserUpdateManyWithWhereWithoutRoleInput = {
    where: UserScalarWhereInput
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyWithoutRoleInput>
  }

  export type UserScalarWhereInput = {
    AND?: UserScalarWhereInput | UserScalarWhereInput[]
    OR?: UserScalarWhereInput[]
    NOT?: UserScalarWhereInput | UserScalarWhereInput[]
    id?: BigIntFilter<"User"> | bigint | number
    firstname?: StringFilter<"User"> | string
    lastname?: StringFilter<"User"> | string
    username?: StringFilter<"User"> | string
    password?: StringFilter<"User"> | string
    role_id?: BigIntNullableFilter<"User"> | bigint | number | null
  }

  export type RoleCreateWithoutUsersInput = {
    id?: bigint | number
    role_name: string
  }

  export type RoleUncheckedCreateWithoutUsersInput = {
    id?: bigint | number
    role_name: string
  }

  export type RoleCreateOrConnectWithoutUsersInput = {
    where: RoleWhereUniqueInput
    create: XOR<RoleCreateWithoutUsersInput, RoleUncheckedCreateWithoutUsersInput>
  }

  export type EventLogCreateWithoutAcknowledged_byInput = {
    id?: bigint | number
    timestamp?: Date | string
    event_status?: string
    file_path?: string | null
    camera?: CameraCreateNestedOneWithoutLogsInput
    event_class?: EventClassCreateNestedOneWithoutLogsInput
  }

  export type EventLogUncheckedCreateWithoutAcknowledged_byInput = {
    id?: bigint | number
    timestamp?: Date | string
    event_status?: string
    file_path?: string | null
    cam_id?: bigint | number | null
    event_class_id?: bigint | number | null
  }

  export type EventLogCreateOrConnectWithoutAcknowledged_byInput = {
    where: EventLogWhereUniqueInput
    create: XOR<EventLogCreateWithoutAcknowledged_byInput, EventLogUncheckedCreateWithoutAcknowledged_byInput>
  }

  export type EventLogCreateManyAcknowledged_byInputEnvelope = {
    data: EventLogCreateManyAcknowledged_byInput | EventLogCreateManyAcknowledged_byInput[]
    skipDuplicates?: boolean
  }

  export type RoleUpsertWithoutUsersInput = {
    update: XOR<RoleUpdateWithoutUsersInput, RoleUncheckedUpdateWithoutUsersInput>
    create: XOR<RoleCreateWithoutUsersInput, RoleUncheckedCreateWithoutUsersInput>
    where?: RoleWhereInput
  }

  export type RoleUpdateToOneWithWhereWithoutUsersInput = {
    where?: RoleWhereInput
    data: XOR<RoleUpdateWithoutUsersInput, RoleUncheckedUpdateWithoutUsersInput>
  }

  export type RoleUpdateWithoutUsersInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    role_name?: StringFieldUpdateOperationsInput | string
  }

  export type RoleUncheckedUpdateWithoutUsersInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    role_name?: StringFieldUpdateOperationsInput | string
  }

  export type EventLogUpsertWithWhereUniqueWithoutAcknowledged_byInput = {
    where: EventLogWhereUniqueInput
    update: XOR<EventLogUpdateWithoutAcknowledged_byInput, EventLogUncheckedUpdateWithoutAcknowledged_byInput>
    create: XOR<EventLogCreateWithoutAcknowledged_byInput, EventLogUncheckedCreateWithoutAcknowledged_byInput>
  }

  export type EventLogUpdateWithWhereUniqueWithoutAcknowledged_byInput = {
    where: EventLogWhereUniqueInput
    data: XOR<EventLogUpdateWithoutAcknowledged_byInput, EventLogUncheckedUpdateWithoutAcknowledged_byInput>
  }

  export type EventLogUpdateManyWithWhereWithoutAcknowledged_byInput = {
    where: EventLogScalarWhereInput
    data: XOR<EventLogUpdateManyMutationInput, EventLogUncheckedUpdateManyWithoutAcknowledged_byInput>
  }

  export type EventLogScalarWhereInput = {
    AND?: EventLogScalarWhereInput | EventLogScalarWhereInput[]
    OR?: EventLogScalarWhereInput[]
    NOT?: EventLogScalarWhereInput | EventLogScalarWhereInput[]
    id?: BigIntFilter<"EventLog"> | bigint | number
    timestamp?: DateTimeFilter<"EventLog"> | Date | string
    event_status?: StringFilter<"EventLog"> | string
    file_path?: StringNullableFilter<"EventLog"> | string | null
    cam_id?: BigIntNullableFilter<"EventLog"> | bigint | number | null
    event_class_id?: BigIntNullableFilter<"EventLog"> | bigint | number | null
    ack_by_user_id?: BigIntNullableFilter<"EventLog"> | bigint | number | null
  }

  export type CameraCreateWithoutLocationInput = {
    id?: bigint | number
    cam_name: string
    cam_status?: boolean
    stream_url: string
    logs?: EventLogCreateNestedManyWithoutCameraInput
  }

  export type CameraUncheckedCreateWithoutLocationInput = {
    id?: bigint | number
    cam_name: string
    cam_status?: boolean
    stream_url: string
    logs?: EventLogUncheckedCreateNestedManyWithoutCameraInput
  }

  export type CameraCreateOrConnectWithoutLocationInput = {
    where: CameraWhereUniqueInput
    create: XOR<CameraCreateWithoutLocationInput, CameraUncheckedCreateWithoutLocationInput>
  }

  export type CameraCreateManyLocationInputEnvelope = {
    data: CameraCreateManyLocationInput | CameraCreateManyLocationInput[]
    skipDuplicates?: boolean
  }

  export type CameraUpsertWithWhereUniqueWithoutLocationInput = {
    where: CameraWhereUniqueInput
    update: XOR<CameraUpdateWithoutLocationInput, CameraUncheckedUpdateWithoutLocationInput>
    create: XOR<CameraCreateWithoutLocationInput, CameraUncheckedCreateWithoutLocationInput>
  }

  export type CameraUpdateWithWhereUniqueWithoutLocationInput = {
    where: CameraWhereUniqueInput
    data: XOR<CameraUpdateWithoutLocationInput, CameraUncheckedUpdateWithoutLocationInput>
  }

  export type CameraUpdateManyWithWhereWithoutLocationInput = {
    where: CameraScalarWhereInput
    data: XOR<CameraUpdateManyMutationInput, CameraUncheckedUpdateManyWithoutLocationInput>
  }

  export type CameraScalarWhereInput = {
    AND?: CameraScalarWhereInput | CameraScalarWhereInput[]
    OR?: CameraScalarWhereInput[]
    NOT?: CameraScalarWhereInput | CameraScalarWhereInput[]
    id?: BigIntFilter<"Camera"> | bigint | number
    cam_name?: StringFilter<"Camera"> | string
    cam_status?: BoolFilter<"Camera"> | boolean
    stream_url?: StringFilter<"Camera"> | string
    loc_id?: BigIntNullableFilter<"Camera"> | bigint | number | null
  }

  export type EventClassCreateWithoutEvent_typeInput = {
    id?: bigint | number
    class_name: string
    logs?: EventLogCreateNestedManyWithoutEvent_classInput
  }

  export type EventClassUncheckedCreateWithoutEvent_typeInput = {
    id?: bigint | number
    class_name: string
    logs?: EventLogUncheckedCreateNestedManyWithoutEvent_classInput
  }

  export type EventClassCreateOrConnectWithoutEvent_typeInput = {
    where: EventClassWhereUniqueInput
    create: XOR<EventClassCreateWithoutEvent_typeInput, EventClassUncheckedCreateWithoutEvent_typeInput>
  }

  export type EventClassCreateManyEvent_typeInputEnvelope = {
    data: EventClassCreateManyEvent_typeInput | EventClassCreateManyEvent_typeInput[]
    skipDuplicates?: boolean
  }

  export type EventClassUpsertWithWhereUniqueWithoutEvent_typeInput = {
    where: EventClassWhereUniqueInput
    update: XOR<EventClassUpdateWithoutEvent_typeInput, EventClassUncheckedUpdateWithoutEvent_typeInput>
    create: XOR<EventClassCreateWithoutEvent_typeInput, EventClassUncheckedCreateWithoutEvent_typeInput>
  }

  export type EventClassUpdateWithWhereUniqueWithoutEvent_typeInput = {
    where: EventClassWhereUniqueInput
    data: XOR<EventClassUpdateWithoutEvent_typeInput, EventClassUncheckedUpdateWithoutEvent_typeInput>
  }

  export type EventClassUpdateManyWithWhereWithoutEvent_typeInput = {
    where: EventClassScalarWhereInput
    data: XOR<EventClassUpdateManyMutationInput, EventClassUncheckedUpdateManyWithoutEvent_typeInput>
  }

  export type EventClassScalarWhereInput = {
    AND?: EventClassScalarWhereInput | EventClassScalarWhereInput[]
    OR?: EventClassScalarWhereInput[]
    NOT?: EventClassScalarWhereInput | EventClassScalarWhereInput[]
    id?: BigIntFilter<"EventClass"> | bigint | number
    class_name?: StringFilter<"EventClass"> | string
    event_type_id?: BigIntFilter<"EventClass"> | bigint | number
  }

  export type EventTypeCreateWithoutClassesInput = {
    id?: bigint | number
    event_type_name: string
  }

  export type EventTypeUncheckedCreateWithoutClassesInput = {
    id?: bigint | number
    event_type_name: string
  }

  export type EventTypeCreateOrConnectWithoutClassesInput = {
    where: EventTypeWhereUniqueInput
    create: XOR<EventTypeCreateWithoutClassesInput, EventTypeUncheckedCreateWithoutClassesInput>
  }

  export type EventLogCreateWithoutEvent_classInput = {
    id?: bigint | number
    timestamp?: Date | string
    event_status?: string
    file_path?: string | null
    camera?: CameraCreateNestedOneWithoutLogsInput
    acknowledged_by?: UserCreateNestedOneWithoutAcknowledged_logsInput
  }

  export type EventLogUncheckedCreateWithoutEvent_classInput = {
    id?: bigint | number
    timestamp?: Date | string
    event_status?: string
    file_path?: string | null
    cam_id?: bigint | number | null
    ack_by_user_id?: bigint | number | null
  }

  export type EventLogCreateOrConnectWithoutEvent_classInput = {
    where: EventLogWhereUniqueInput
    create: XOR<EventLogCreateWithoutEvent_classInput, EventLogUncheckedCreateWithoutEvent_classInput>
  }

  export type EventLogCreateManyEvent_classInputEnvelope = {
    data: EventLogCreateManyEvent_classInput | EventLogCreateManyEvent_classInput[]
    skipDuplicates?: boolean
  }

  export type EventTypeUpsertWithoutClassesInput = {
    update: XOR<EventTypeUpdateWithoutClassesInput, EventTypeUncheckedUpdateWithoutClassesInput>
    create: XOR<EventTypeCreateWithoutClassesInput, EventTypeUncheckedCreateWithoutClassesInput>
    where?: EventTypeWhereInput
  }

  export type EventTypeUpdateToOneWithWhereWithoutClassesInput = {
    where?: EventTypeWhereInput
    data: XOR<EventTypeUpdateWithoutClassesInput, EventTypeUncheckedUpdateWithoutClassesInput>
  }

  export type EventTypeUpdateWithoutClassesInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    event_type_name?: StringFieldUpdateOperationsInput | string
  }

  export type EventTypeUncheckedUpdateWithoutClassesInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    event_type_name?: StringFieldUpdateOperationsInput | string
  }

  export type EventLogUpsertWithWhereUniqueWithoutEvent_classInput = {
    where: EventLogWhereUniqueInput
    update: XOR<EventLogUpdateWithoutEvent_classInput, EventLogUncheckedUpdateWithoutEvent_classInput>
    create: XOR<EventLogCreateWithoutEvent_classInput, EventLogUncheckedCreateWithoutEvent_classInput>
  }

  export type EventLogUpdateWithWhereUniqueWithoutEvent_classInput = {
    where: EventLogWhereUniqueInput
    data: XOR<EventLogUpdateWithoutEvent_classInput, EventLogUncheckedUpdateWithoutEvent_classInput>
  }

  export type EventLogUpdateManyWithWhereWithoutEvent_classInput = {
    where: EventLogScalarWhereInput
    data: XOR<EventLogUpdateManyMutationInput, EventLogUncheckedUpdateManyWithoutEvent_classInput>
  }

  export type LocationCreateWithoutCamerasInput = {
    id?: bigint | number
    loc_name: string
  }

  export type LocationUncheckedCreateWithoutCamerasInput = {
    id?: bigint | number
    loc_name: string
  }

  export type LocationCreateOrConnectWithoutCamerasInput = {
    where: LocationWhereUniqueInput
    create: XOR<LocationCreateWithoutCamerasInput, LocationUncheckedCreateWithoutCamerasInput>
  }

  export type EventLogCreateWithoutCameraInput = {
    id?: bigint | number
    timestamp?: Date | string
    event_status?: string
    file_path?: string | null
    event_class?: EventClassCreateNestedOneWithoutLogsInput
    acknowledged_by?: UserCreateNestedOneWithoutAcknowledged_logsInput
  }

  export type EventLogUncheckedCreateWithoutCameraInput = {
    id?: bigint | number
    timestamp?: Date | string
    event_status?: string
    file_path?: string | null
    event_class_id?: bigint | number | null
    ack_by_user_id?: bigint | number | null
  }

  export type EventLogCreateOrConnectWithoutCameraInput = {
    where: EventLogWhereUniqueInput
    create: XOR<EventLogCreateWithoutCameraInput, EventLogUncheckedCreateWithoutCameraInput>
  }

  export type EventLogCreateManyCameraInputEnvelope = {
    data: EventLogCreateManyCameraInput | EventLogCreateManyCameraInput[]
    skipDuplicates?: boolean
  }

  export type LocationUpsertWithoutCamerasInput = {
    update: XOR<LocationUpdateWithoutCamerasInput, LocationUncheckedUpdateWithoutCamerasInput>
    create: XOR<LocationCreateWithoutCamerasInput, LocationUncheckedCreateWithoutCamerasInput>
    where?: LocationWhereInput
  }

  export type LocationUpdateToOneWithWhereWithoutCamerasInput = {
    where?: LocationWhereInput
    data: XOR<LocationUpdateWithoutCamerasInput, LocationUncheckedUpdateWithoutCamerasInput>
  }

  export type LocationUpdateWithoutCamerasInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    loc_name?: StringFieldUpdateOperationsInput | string
  }

  export type LocationUncheckedUpdateWithoutCamerasInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    loc_name?: StringFieldUpdateOperationsInput | string
  }

  export type EventLogUpsertWithWhereUniqueWithoutCameraInput = {
    where: EventLogWhereUniqueInput
    update: XOR<EventLogUpdateWithoutCameraInput, EventLogUncheckedUpdateWithoutCameraInput>
    create: XOR<EventLogCreateWithoutCameraInput, EventLogUncheckedCreateWithoutCameraInput>
  }

  export type EventLogUpdateWithWhereUniqueWithoutCameraInput = {
    where: EventLogWhereUniqueInput
    data: XOR<EventLogUpdateWithoutCameraInput, EventLogUncheckedUpdateWithoutCameraInput>
  }

  export type EventLogUpdateManyWithWhereWithoutCameraInput = {
    where: EventLogScalarWhereInput
    data: XOR<EventLogUpdateManyMutationInput, EventLogUncheckedUpdateManyWithoutCameraInput>
  }

  export type CameraCreateWithoutLogsInput = {
    id?: bigint | number
    cam_name: string
    cam_status?: boolean
    stream_url: string
    location?: LocationCreateNestedOneWithoutCamerasInput
  }

  export type CameraUncheckedCreateWithoutLogsInput = {
    id?: bigint | number
    cam_name: string
    cam_status?: boolean
    stream_url: string
    loc_id?: bigint | number | null
  }

  export type CameraCreateOrConnectWithoutLogsInput = {
    where: CameraWhereUniqueInput
    create: XOR<CameraCreateWithoutLogsInput, CameraUncheckedCreateWithoutLogsInput>
  }

  export type EventClassCreateWithoutLogsInput = {
    id?: bigint | number
    class_name: string
    event_type: EventTypeCreateNestedOneWithoutClassesInput
  }

  export type EventClassUncheckedCreateWithoutLogsInput = {
    id?: bigint | number
    class_name: string
    event_type_id: bigint | number
  }

  export type EventClassCreateOrConnectWithoutLogsInput = {
    where: EventClassWhereUniqueInput
    create: XOR<EventClassCreateWithoutLogsInput, EventClassUncheckedCreateWithoutLogsInput>
  }

  export type UserCreateWithoutAcknowledged_logsInput = {
    id?: bigint | number
    firstname: string
    lastname: string
    username: string
    password: string
    role?: RoleCreateNestedOneWithoutUsersInput
  }

  export type UserUncheckedCreateWithoutAcknowledged_logsInput = {
    id?: bigint | number
    firstname: string
    lastname: string
    username: string
    password: string
    role_id?: bigint | number | null
  }

  export type UserCreateOrConnectWithoutAcknowledged_logsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutAcknowledged_logsInput, UserUncheckedCreateWithoutAcknowledged_logsInput>
  }

  export type CameraUpsertWithoutLogsInput = {
    update: XOR<CameraUpdateWithoutLogsInput, CameraUncheckedUpdateWithoutLogsInput>
    create: XOR<CameraCreateWithoutLogsInput, CameraUncheckedCreateWithoutLogsInput>
    where?: CameraWhereInput
  }

  export type CameraUpdateToOneWithWhereWithoutLogsInput = {
    where?: CameraWhereInput
    data: XOR<CameraUpdateWithoutLogsInput, CameraUncheckedUpdateWithoutLogsInput>
  }

  export type CameraUpdateWithoutLogsInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    cam_name?: StringFieldUpdateOperationsInput | string
    cam_status?: BoolFieldUpdateOperationsInput | boolean
    stream_url?: StringFieldUpdateOperationsInput | string
    location?: LocationUpdateOneWithoutCamerasNestedInput
  }

  export type CameraUncheckedUpdateWithoutLogsInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    cam_name?: StringFieldUpdateOperationsInput | string
    cam_status?: BoolFieldUpdateOperationsInput | boolean
    stream_url?: StringFieldUpdateOperationsInput | string
    loc_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
  }

  export type EventClassUpsertWithoutLogsInput = {
    update: XOR<EventClassUpdateWithoutLogsInput, EventClassUncheckedUpdateWithoutLogsInput>
    create: XOR<EventClassCreateWithoutLogsInput, EventClassUncheckedCreateWithoutLogsInput>
    where?: EventClassWhereInput
  }

  export type EventClassUpdateToOneWithWhereWithoutLogsInput = {
    where?: EventClassWhereInput
    data: XOR<EventClassUpdateWithoutLogsInput, EventClassUncheckedUpdateWithoutLogsInput>
  }

  export type EventClassUpdateWithoutLogsInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    class_name?: StringFieldUpdateOperationsInput | string
    event_type?: EventTypeUpdateOneRequiredWithoutClassesNestedInput
  }

  export type EventClassUncheckedUpdateWithoutLogsInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    class_name?: StringFieldUpdateOperationsInput | string
    event_type_id?: BigIntFieldUpdateOperationsInput | bigint | number
  }

  export type UserUpsertWithoutAcknowledged_logsInput = {
    update: XOR<UserUpdateWithoutAcknowledged_logsInput, UserUncheckedUpdateWithoutAcknowledged_logsInput>
    create: XOR<UserCreateWithoutAcknowledged_logsInput, UserUncheckedCreateWithoutAcknowledged_logsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutAcknowledged_logsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutAcknowledged_logsInput, UserUncheckedUpdateWithoutAcknowledged_logsInput>
  }

  export type UserUpdateWithoutAcknowledged_logsInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    firstname?: StringFieldUpdateOperationsInput | string
    lastname?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: RoleUpdateOneWithoutUsersNestedInput
  }

  export type UserUncheckedUpdateWithoutAcknowledged_logsInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    firstname?: StringFieldUpdateOperationsInput | string
    lastname?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
  }

  export type UserCreateManyRoleInput = {
    id?: bigint | number
    firstname: string
    lastname: string
    username: string
    password: string
  }

  export type UserUpdateWithoutRoleInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    firstname?: StringFieldUpdateOperationsInput | string
    lastname?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    acknowledged_logs?: EventLogUpdateManyWithoutAcknowledged_byNestedInput
  }

  export type UserUncheckedUpdateWithoutRoleInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    firstname?: StringFieldUpdateOperationsInput | string
    lastname?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    acknowledged_logs?: EventLogUncheckedUpdateManyWithoutAcknowledged_byNestedInput
  }

  export type UserUncheckedUpdateManyWithoutRoleInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    firstname?: StringFieldUpdateOperationsInput | string
    lastname?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
  }

  export type EventLogCreateManyAcknowledged_byInput = {
    id?: bigint | number
    timestamp?: Date | string
    event_status?: string
    file_path?: string | null
    cam_id?: bigint | number | null
    event_class_id?: bigint | number | null
  }

  export type EventLogUpdateWithoutAcknowledged_byInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    event_status?: StringFieldUpdateOperationsInput | string
    file_path?: NullableStringFieldUpdateOperationsInput | string | null
    camera?: CameraUpdateOneWithoutLogsNestedInput
    event_class?: EventClassUpdateOneWithoutLogsNestedInput
  }

  export type EventLogUncheckedUpdateWithoutAcknowledged_byInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    event_status?: StringFieldUpdateOperationsInput | string
    file_path?: NullableStringFieldUpdateOperationsInput | string | null
    cam_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    event_class_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
  }

  export type EventLogUncheckedUpdateManyWithoutAcknowledged_byInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    event_status?: StringFieldUpdateOperationsInput | string
    file_path?: NullableStringFieldUpdateOperationsInput | string | null
    cam_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    event_class_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
  }

  export type CameraCreateManyLocationInput = {
    id?: bigint | number
    cam_name: string
    cam_status?: boolean
    stream_url: string
  }

  export type CameraUpdateWithoutLocationInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    cam_name?: StringFieldUpdateOperationsInput | string
    cam_status?: BoolFieldUpdateOperationsInput | boolean
    stream_url?: StringFieldUpdateOperationsInput | string
    logs?: EventLogUpdateManyWithoutCameraNestedInput
  }

  export type CameraUncheckedUpdateWithoutLocationInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    cam_name?: StringFieldUpdateOperationsInput | string
    cam_status?: BoolFieldUpdateOperationsInput | boolean
    stream_url?: StringFieldUpdateOperationsInput | string
    logs?: EventLogUncheckedUpdateManyWithoutCameraNestedInput
  }

  export type CameraUncheckedUpdateManyWithoutLocationInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    cam_name?: StringFieldUpdateOperationsInput | string
    cam_status?: BoolFieldUpdateOperationsInput | boolean
    stream_url?: StringFieldUpdateOperationsInput | string
  }

  export type EventClassCreateManyEvent_typeInput = {
    id?: bigint | number
    class_name: string
  }

  export type EventClassUpdateWithoutEvent_typeInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    class_name?: StringFieldUpdateOperationsInput | string
    logs?: EventLogUpdateManyWithoutEvent_classNestedInput
  }

  export type EventClassUncheckedUpdateWithoutEvent_typeInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    class_name?: StringFieldUpdateOperationsInput | string
    logs?: EventLogUncheckedUpdateManyWithoutEvent_classNestedInput
  }

  export type EventClassUncheckedUpdateManyWithoutEvent_typeInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    class_name?: StringFieldUpdateOperationsInput | string
  }

  export type EventLogCreateManyEvent_classInput = {
    id?: bigint | number
    timestamp?: Date | string
    event_status?: string
    file_path?: string | null
    cam_id?: bigint | number | null
    ack_by_user_id?: bigint | number | null
  }

  export type EventLogUpdateWithoutEvent_classInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    event_status?: StringFieldUpdateOperationsInput | string
    file_path?: NullableStringFieldUpdateOperationsInput | string | null
    camera?: CameraUpdateOneWithoutLogsNestedInput
    acknowledged_by?: UserUpdateOneWithoutAcknowledged_logsNestedInput
  }

  export type EventLogUncheckedUpdateWithoutEvent_classInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    event_status?: StringFieldUpdateOperationsInput | string
    file_path?: NullableStringFieldUpdateOperationsInput | string | null
    cam_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    ack_by_user_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
  }

  export type EventLogUncheckedUpdateManyWithoutEvent_classInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    event_status?: StringFieldUpdateOperationsInput | string
    file_path?: NullableStringFieldUpdateOperationsInput | string | null
    cam_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    ack_by_user_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
  }

  export type EventLogCreateManyCameraInput = {
    id?: bigint | number
    timestamp?: Date | string
    event_status?: string
    file_path?: string | null
    event_class_id?: bigint | number | null
    ack_by_user_id?: bigint | number | null
  }

  export type EventLogUpdateWithoutCameraInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    event_status?: StringFieldUpdateOperationsInput | string
    file_path?: NullableStringFieldUpdateOperationsInput | string | null
    event_class?: EventClassUpdateOneWithoutLogsNestedInput
    acknowledged_by?: UserUpdateOneWithoutAcknowledged_logsNestedInput
  }

  export type EventLogUncheckedUpdateWithoutCameraInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    event_status?: StringFieldUpdateOperationsInput | string
    file_path?: NullableStringFieldUpdateOperationsInput | string | null
    event_class_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    ack_by_user_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
  }

  export type EventLogUncheckedUpdateManyWithoutCameraInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    event_status?: StringFieldUpdateOperationsInput | string
    file_path?: NullableStringFieldUpdateOperationsInput | string | null
    event_class_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    ack_by_user_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}