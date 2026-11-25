# AGENTS.md

## 1. Purpose and mandatory architecture

This file defines the development contract for this repository. Follow it when implementing, modifying, reviewing, testing or refactoring code. Inspect existing implementations and package versions before making changes. Do not introduce alternative architectural patterns simply because they are supported by NestJS.

- Framework: NestJS; language: TypeScript in strict mode.
- Database: PostgreSQL; ORM: Prisma exclusively.
- Architecture: modular monolith with domain-owned repositories and explicit module boundaries. Design modules so they can be extracted independently when justified; do not introduce microservices prematurely.
- Configuration: `@nestjs/config`, one root `.env`, centralized `src/config/configuration.ts`.
- Validation: `class-validator` and `class-transformer` with NestJS validation pipes.
- Authentication when required: Passport/JWT; authorization via guards and domain-level ownership checks.
- Logging: structured Winston logging through the shared logger abstraction.
- Testing: use the installed runner (Vitest in the supplied fresh scaffold); do not mix Jest and Vitest or migrate runners without approval.
- Preserve the installed HTTP adapter, module format, package manager and compatible dependency versions. Do not assume CommonJS, ESM or a particular Prisma major version.

The source of truth for business requirements is the approved specification and existing API contract. This file governs implementation. If a requested change conflicts with these rules, explain the conflict rather than silently bypassing them.

## 2. Repository structure

```text
project-root/
├── AGENTS.md
├── .env                       # local secrets; never committed
├── .env.example               # placeholders only
├── .gitignore
├── package.json
├── tsconfig.json
├── nest-cli.json
├── prisma.config.ts           # when required by installed Prisma version
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   ├── seed.ts
│   └── seeders/
└── src/
    ├── main.ts
    ├── app.module.ts
    ├── config/
    │   └── configuration.ts
    ├── prisma/
    │   ├── prisma.module.ts
    │   ├── prisma.service.ts
    │   └── prisma.extensions.ts # only when needed
    ├── tests/
    │   ├── e2e/
    │   ├── integration/
    │   ├── fixtures/
    │   └── helpers/
    ├── libs/
    │   ├── constants/
    │   ├── decorators/
    │   ├── dtos/
    │   ├── enums/
    │   ├── filters/
    │   ├── guards/
    │   ├── interceptors/
    │   ├── interfaces/
    │   ├── logger/
    │   ├── middlewares/
    │   ├── pipes/
    │   └── utils/
    └── modules/
        ├── auth/
        └── user/
            ├── controllers/
            │   └── user.controller.ts
            ├── services/
            │   └── user.service.ts
            ├── repositories/
            │   └── user.repository.ts
            ├── dto/
            │   ├── create-user.dto.ts
            │   ├── update-user.dto.ts
            │   └── get-users.dto.ts
            ├── interfaces/
            ├── tests/
            │   ├── user.controller.spec.ts
            │   ├── user.service.spec.ts
            │   └── user.repository.spec.ts
            └── user.module.ts
```

- Use singular domain module names (`user`, `role`, `notification`) and kebab-case for multiword names.
- Every HTTP-backed persistent domain follows the controller/service/repository/DTO/tests structure. Non-persistent or non-HTTP modules need only the applicable layers; do not create empty folders or placeholder classes.
- Module-specific `guards/`, `strategies/`, `constants/`, `enums/`, `events/` and `listeners/` may be added as needed.
- `src/libs/` contains reusable technical infrastructure, not domain logic. Module-specific business rules and constants stay in their owning module. Pure helpers are ordinary typed functions, not injectable services unless DI is needed.
- `src/prisma/` owns NestJS database infrastructure. Root `prisma/` owns schema, migration history and seed data. No ORM `entities/` directories; no duplicate schemas in feature modules.
- Generated Prisma code belongs in the configured generated output directory and must never be edited manually.
- `main.ts` owns application bootstrap; `app.module.ts` owns root module composition. Do not implement business logic in either.

## 3. Layer boundaries and module communication

```text
HTTP request -> Controller -> Service -> Repository -> PrismaService -> PostgreSQL
                     DTO        |
                                +-> Exported service of another module
```

**Controller:** routing, DTO validation, typed authenticated principal, invoking service, and HTTP response mapping. No Prisma, business decisions, transaction management or direct repository injection.

**Service:** business rules, authorization/ownership, orchestration, mapping validated DTOs into persistence inputs, transactions and cross-module service calls. Return typed business results; throw typed errors. Never call Prisma model delegates directly.

**Repository:** typed query construction and execution, filtering, selection, pagination, persistence and transaction participation. No HTTP responses, permission decisions or business orchestration. Accept optional typed transaction client for reads and writes that may participate in a transaction.

**Module:** register own controllers/providers; export only the service or explicit public contract required by consumers. Do not export repositories across domains. Import the owning module rather than registering its providers again.

Allowed: service -> own repository; service -> exported service of another module via DI; typed domain events for decoupled side effects. Forbidden: cross-module repository imports, direct Prisma queries in services/controllers, circular dependency workarounds without design review, and bypassing domain authorization using relational queries. A repository may traverse schema relations for an authorized, domain-owned projection; coordinate cross-domain mutations through owning services.

Use synchronous service calls when results or consistency are required. Use events for independent reactions after successful commit. In-process events are not durable; use an approved queue/outbox when delivery guarantees are required. Never introduce queues or event infrastructure without a concrete requirement.

## 4. Environment and configuration

- Exactly one runtime dotenv file: `.env` at repository root. No `.env.development`, `.env.production`, `src/config/env/` or secondary environment files. Each deployment receives its own values via the same root file or injected environment variables.
- Keep `.env` out of version control, Docker images, logs and agent output. Commit `.env.example` with placeholders and descriptions only.
- All application environment access is centralized in `src/config/configuration.ts`; use injected `ConfigService` elsewhere. CLI configuration and bootstrap tooling may read the environment when required by their runtime, without duplicating application configuration logic.
- Environment names: UPPER_SNAKE_CASE; configuration keys: nested camelCase; access paths: `database.url`, `jwt.accessSecret`, etc.
- Validate required variables at startup, including actual types, ranges, allowed values and URL formats. Parse numbers/booleans explicitly; reject invalid values. No default passwords, database credentials, JWT secrets or other sensitive fallbacks.
- Keep non-sensitive defaults intentional. Do not hardcode deployment-specific origins, credentials or hosts in services.
- Add new variables to configuration, startup validation and `.env.example` together. Never overwrite a developer's existing `.env` without explicit authorization.

Example configuration shape (extend only when features require it):

```ts
// src/config/configuration.ts
export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? '3000'),
  database: { url: process.env.DATABASE_URL },
  cors: {
    origins: (process.env.CORS_ORIGINS ?? '')
      .split(',').map((origin) => origin.trim()).filter(Boolean),
  },
});
```

```ts
// app.module.ts imports (illustrative; implement validateEnvironment)
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: '.env',
  load: [configuration],
  validate: validateEnvironment,
});
```

Use Joi or a typed validation function consistent with installed dependencies. Use `configService.getOrThrow<string>('database.url')` for mandatory settings. Keep the process environment and Prisma CLI configuration compatible with the same `DATABASE_URL`; for Prisma versions requiring explicit dotenv loading or a driver adapter, configure those using the installed version's supported APIs.

## 5. Naming, imports and TypeScript

- Files: kebab-case with role suffix (`user.service.ts`, `create-user.dto.ts`, `jwt-auth.guard.ts`, `user.service.spec.ts`). Classes/types: PascalCase. Methods/properties: camelCase. Constants and enum members: UPPER_SNAKE_CASE.
- REST paths: plural kebab-case resources. Domain identifier slugs such as `super_admin` use lowercase underscores unless a public contract specifies otherwise.
- Inject dependencies via constructor with `private readonly`. Use precise return types at public boundaries and generated Prisma types internally where appropriate.
- No `any`, unsafe casts, `@ts-ignore`, non-null assertions or broad lint suppressions to hide errors. Narrow `unknown` and model optional/null values explicitly. Do not invent framework interfaces.
- Prefer async/await; do not add redundant try/catch that only logs and rethrows. Avoid floating promises; use parallel operations only where independent.
- Use established aliases for shared imports. For a new alias scheme, prefer `@/libs/*`, `@/prisma/*`, `@/modules/*` only after configuring TypeScript, actual runtime/build resolution and test resolution. TypeScript paths alone do not guarantee runtime resolution. Do not copy another project's `@worklog-ai/*` alias.
- Relative imports within a module are acceptable. Match repository ESM/CommonJS rules (including `.js` suffixes for relative ESM imports where required). Use type-only imports where appropriate, but preserve runtime DTO and DI metadata.
- Import order: external dependencies; generated database types; shared infrastructure; other module public contracts; same-module imports. Follow ESLint/Prettier configuration.
- Reuse existing abstractions. Do not create generic base repositories, unnecessary interfaces or wrappers without demonstrated reuse.

## 6. Prisma schema and lifecycle

- One canonical schema: `prisma/schema.prisma`; PostgreSQL provider only. Do not introduce TypeORM, Sequelize or another persistence layer.
- Check installed Prisma version and generated client configuration before choosing import paths, generator, datasource config or driver adapter. Prisma CLI and client versions must be compatible.
- Use one managed Prisma client per application process through `PrismaService`. Centralize connection lifecycle and pool configuration; connect/disconnect through appropriate NestJS lifecycle hooks and enable graceful shutdown. A global `PrismaModule` may export only `PrismaService` and approved transaction infrastructure. Do not instantiate clients per request or repository.
- Models: PascalCase; fields: camelCase. Database tables: plural snake_case (`@@map`); columns: snake_case (`@map` where names differ). Preserve existing table mappings and IDs.
- Default for new ordinary internal entities: integer auto-increment ID, unless requirements justify UUID or another identifier. Do not change established ID strategy casually.
- Include `createdAt DateTime @default(now())` and `updatedAt DateTime @default(now()) @updatedAt` on mutable auditable entities. Add `deletedAt DateTime?` only where soft deletion is required.
- Auditable user-managed entities have nullable `createdByUserId` and `updatedByUserId` where system actions are possible. Define explicit named relations and matching User back-relations when User is the actor model. Derive actor identity from trusted context, never a client-supplied audit field.
- Choose foreign key actions deliberately. Prefer restrict/no action or set-null where appropriate; cascade only for truly dependent data with approved deletion semantics. Never cascade all relations by default.
- Use database constraints for uniqueness, referential integrity and invariants. Add indexes for actual filter/order/join patterns; avoid redundant indexes. Use PostgreSQL numeric/Prisma Decimal for exact monetary values, never binary floating point.
- Persist timestamps consistently in UTC. Explicitly serialize Decimal/BigInt and timestamps at API boundaries according to contract; avoid precision loss.

## 7. Repository patterns

- All runtime model queries live in domain repositories (except Prisma infrastructure, approved seed/migration tooling and test fixtures).
- Inject the shared PrismaService. Use a single consistent client accessor; if a tested extended `.client` exists, use it consistently. Do not assume a custom accessor is already implemented.
- Provide focused typed methods such as `findById`, `findByEmail`, `findPaginated`, `create`, `update`, `softDelete`, as required. Do not expose arbitrary unchecked queries to controllers.
- Use generated `WhereInput`, `CreateInput`, `UpdateInput`, selection and result types internally. Map external DTOs explicitly. Do not pass arbitrary request objects or untrusted Prisma query structures directly to a delegate.
- Support `tx?: Prisma.TransactionClient` (or a compatible inferred extended transaction type) for operations participating in transactions. Use `const client = tx ?? defaultClient`; never fall back to the base client while a transaction is active.
- Prefer `select` for explicit field projection; use `include` for required relations. Avoid incompatible select/include at the same query level. Never return password hashes, secrets or internal tokens.
- Use parameterized Prisma queries. Raw SQL is exceptional, reviewed and parameterized; never concatenate untrusted SQL fragments.
- Batch related reads/writes, avoid N+1 queries, and use native upsert/unique constraints for concurrent creation. Check query plans for expensive queries.

Illustrative repository pattern for a standard (non-extended) generated client:

```ts
@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });
  }

  async create(data: Prisma.UserCreateInput, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.user.create({ data, select: { id: true, email: true } });
  }
}
```

Adapt imports, fields and soft-delete filters to the actual schema; examples are not permission to add unrequested models.

## 8. Transactions and concurrency

- Service layer defines transaction boundaries through a dedicated transaction helper or the managed PrismaService transaction API. This is the only service-level Prisma infrastructure exception; no direct model queries.
- Use a transaction for logically atomic multi-step writes. Pass the same typed transaction client to every participating repository read/write, including cross-module calls. Do not use `tx as any` or independently start nested transactions.
- Prefer interactive transactions when conditional logic is needed; use supported sequential transactions for simple atomic operations where appropriate.
- Keep transactions short; no HTTP calls, email, file upload, slow compute or event emission inside them. Emit side effects after commit, or write an outbox row within the transaction if durability is required.
- Enforce uniqueness and ownership in database write conditions where possible. Use appropriate isolation, atomic updates or concurrency controls to prevent lost updates and check-then-write races. Retry only recognized transient conflicts with bounded attempts.
- Throw errors to trigger rollback. Do not swallow a failed operation or return a success-shaped error from a transaction callback.
- Read final related data inside the transaction when a consistent snapshot is required; otherwise a post-commit read is acceptable. Never blindly defer all reads until after commit.

## 9. Soft deletes and audit trail

- Soft deletion is explicit per model and driven by retention/business requirements. Prefer repository `softDelete`/`softDeleteMany` methods implemented as typed updates to `deletedAt`, rather than overriding Prisma's native delete signature.
- Existing custom Prisma extensions may be retained if compatible and tested. If introduced, centralize in `src/prisma/prisma.extensions.ts`; maintain a typed list of supported models and document the client accessor. Do not assume extensions automatically handle nested reads/writes or transaction clients.
- All ordinary reads, counts, aggregates, groupBy, relation projections and updates on soft-deletable data must respect active-record semantics. Include `deletedAt: null` explicitly wherever extension coverage is absent. Verify both normal and transactional behavior.
- Update actor and deletion timestamp atomically. Handle dependent records according to explicit domain rules within the same transaction; do not blindly delete every related entity.
- Restore/include-deleted/permanent-delete methods must be explicit, authorized and audited. Ordinary endpoints must not expose deleted records or update them.
- Plan unique constraint behavior for deleted rows: reserve identifiers or use an approved PostgreSQL partial unique index where reuse is required. Do not assume soft deletion releases unique values.
- Hard deletion requires an approved use case and retention policy; do not equate soft deletion with compliance or permanent erasure.

## 10. DTOs, validation and API contract

- Use custom DTO classes for bodies and structured GET queries; validate path parameters using DTOs or appropriate pipes. No Prisma-generated input types in controller signatures.
- Use readonly properties, explicit optionality, nested validation and controlled transformations. Never mutate inbound DTOs to attach audit fields; pass authenticated actor separately.
- Configure global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, and `transform: true` unless a documented legacy contract requires otherwise. Prefer explicit numeric/boolean conversion; validate lengths, formats, enums, ranges and nested arrays. Validate optional/null distinctions on updates.
- Expose versioned routes using one global prefix/versioning strategy (`/api/v1`); do not duplicate prefixes in every controller. Use the existing API versioning mechanism if configured.
- GET `/api/v1/users`: list; GET `/api/v1/users/:id`: detail; POST `/api/v1/users`: create; PUT or PATCH for full or partial updates respectively. Preserve the supplied coding rules' POST `/api/v1/users/delete` soft-delete convention where adopted; use a validated delete DTO. Do not change existing routes silently.
- Use shared `ResponseHandler.sendResponse(message, result)` or the established centralized response interceptor, not both. Define one consistent response envelope for new JSON endpoints (e.g. `error`, `statusCode`, `message`, `data`) and preserve existing public contracts. Ensure actual HTTP status matches the response status. Do not wrap streams, downloads or 204 responses in JSON envelopes.
- Use shared stable messages/error codes when useful; keep domain-specific strings local. Document request/response models, authentication, pagination and expected errors via the installed OpenAPI/Swagger integration when applicable.

### Lists and pagination

- Retain `pageNo` (1-based), `pageSize`, `keyword` and optional `isPagination` if required by the API contract. Default to bounded pagination (e.g. 10 records, maximum 100); never allow unrestricted listing on public endpoints merely by toggling a flag.
- Validate pagination and allowlist sorting/filter fields; use deterministic ordering with a unique tie-breaker. Use cursor pagination for high-volume flows when justified.
- Service interprets validated parameters; repository constructs the actual Prisma filter, order, skip and take. Count uses the same authorization and filters as the list query. `Promise.all` is acceptable for independent count/list reads unless snapshot consistency is required.
- Return documented list metadata and total; do not return all columns by default. Use case-insensitive search where appropriate, and suitable indexes/search techniques for large datasets.

## 11. Error handling and logging

- Throw NestJS typed HTTP exceptions or established typed domain exceptions mapped centrally. Do not use HTTP 302 for duplicate records; use 409 Conflict for new contracts. Use 400/422 according to validation contract, 401 for authentication, 403 for authorization, 404 for missing resources, 429 for limits, 500 for unexpected failures.
- A global exception filter owns error serialization and safe logging. If ResponseHandler exposes error helpers, they must throw appropriate typed exceptions, not return normal success values. Preserve meaningful known errors; map relevant Prisma constraint/not-found errors without leaking raw SQL or database details.
- Do not add blanket try/catch in controllers/services. Catch only to recover, translate or add actionable context; rethrow failures correctly. Never log the same exception in every layer.
- Use the shared Winston-backed logger, structured event fields and request/correlation IDs. No ad hoc `console.log` or `console.error` in application code. Redact passwords, authorization headers, tokens, API keys, PII and sensitive request bodies. No production stack traces in HTTP responses.
- Monitoring/telemetry is opt-in and deployment-approved. Do not link NestJS Observe, send production data to third parties, add keys, or introduce external telemetry automatically. If already approved and configured, use available observability evidence for production investigations without exposing secrets.

## 12. Authentication, authorization and security

- Secure protected routes by default once auth is implemented. Public endpoints must be explicitly identified. Use verified Passport/JWT guards and typed `@CurrentUser()` context; validate token signature, expiry and configured issuer/audience/algorithm. No auth bypass flags in production.
- Use role/permission guards for coarse authorization and service/repository-scoped ownership checks for object-level access. Never trust request-supplied user/tenant/role identifiers as authority. Test horizontal and vertical privilege boundaries.
- Apply API-key middleware only where required by the approved client/service contract; API keys are not a replacement for user authentication. Never embed privileged secrets in public clients.
- Hash passwords with the approved adaptive algorithm (bcrypt/bcryptjs, configurable work factor at least 10 when bcrypt is used); never store or return plaintext passwords. Avoid weak default seed passwords. Store session/refresh credentials securely and support revocation/rotation as required by the auth design.
- Restrict CORS to configured trusted origins. Configure security headers, request-size limits, rate limits on authentication/OTP and other abuse-prone endpoints. Use TLS in production. Do not disable certificate validation or add custom encryption schemes without explicit design approval.
- Use least-privilege database and deployment credentials. Apply authorization to every affected read/write path, including list, export, bulk actions and nested relations. Never return sensitive fields or unrestricted internal objects.
- Set bounded timeouts for external calls and safe retry policies. Avoid SSRF by validating untrusted outbound destinations; avoid unsafe file paths and uploads. Do not rely solely on DTO validation for authorization.
- Do not invent compliance guarantees; flag privacy/retention/security requirements that need product decisions.

## 13. Migrations and seeding

- Every persistent schema change requires a reviewed migration. Use the installed Prisma CLI and configured schema path; run `prisma format`, `prisma validate`, `prisma generate` after schema changes as appropriate.
- Generate development migrations with `prisma migrate dev --name <descriptive_name>` against an authorized disposable/development database. Prefer `--create-only` when reviewing SQL before application. Inspect SQL for destructive changes, locking, data loss, defaults and backfill requirements.
- Commit schema and migration together. Never rewrite already-applied migration history. Intentional SQL customization of a new unapplied migration is allowed for reviewed data migrations, constraints or PostgreSQL-specific features not expressed by Prisma.
- Production migrations use `prisma migrate deploy` via approved deployment workflow; do not execute against staging/production without explicit authorization. No automatic schema synchronization or `db push` in production.
- Never reset, drop, truncate, force-push schema or delete data as a debugging shortcut. Verify target database before commands; if access is unclear, generate/review artifacts and report what needs to be run.
- Root `prisma/seed.ts` orchestrates domain seeders in `prisma/seeders/` in dependency order. Seeders are idempotent using stable unique keys, upsert or createMany with skipDuplicates where appropriate. Disconnect clients on completion. Never seed real user data or default privileged passwords; separate demo data from required reference data by approved script/flag, not extra dotenv files.
- Configure seed command according to installed Prisma version (including `prisma.config.ts` when applicable); do not blindly copy obsolete package.json configuration.

## 14. Testing conventions

- Module-local unit tests: `src/modules/<domain>/tests/*.spec.ts`, including controller, service and repository tests when applicable. Do not place new unit tests beside implementation files.
- Cross-module integration tests: `src/tests/integration/`; API end-to-end tests: `src/tests/e2e/*.e2e-spec.ts`; shared fixtures/helpers: `src/tests/fixtures/` and `src/tests/helpers/`. Update runner discovery/scripts to match these paths when establishing the structure.
- Use the installed test runner and its native mocks. Mock services for controller units, repositories for service units, and Prisma delegates for repository query units. Test real PostgreSQL behavior with isolated integration tests where mocks cannot prove constraints, transactions or query semantics.
- Test happy path, invalid inputs, authorization/ownership, not-found, duplicates, boundaries, soft deletion and rollback when relevant. Regression tests must reproduce the reported issue and verify the fix.
- Tests must be deterministic and isolated. Use dependency overrides or injected test configuration with a dedicated disposable test database; do not create additional dotenv files or connect tests to live databases. Do not depend on external services without explicit integration setup.
- Never weaken assertions, skip failing tests or modify unrelated expectations to make the suite pass. Use focused tests during development, then applicable lint/typecheck/build and test suite before completion.

## 15. Dependency and documentation rules

- Inspect `package.json`, lockfile, tsconfig and installed versions before choosing APIs. Use existing package manager. Prefer supported NestJS first-party integrations when relevant, but do not add packages automatically or replace the selected Prisma/validation stack.
- Use official NestJS documentation (`https://docs.nestjs.com/` and its `llms.txt` index when available) and Prisma documentation (`https://www.prisma.io/docs`) matching installed versions. Consult applicable installed NestJS agent skills if available; do not assume they are installed or install/update them without a task requirement.
- Do not switch HTTP adapter, module format, ORM, test runner, major dependency versions, or architecture without explicit approval. Preserve lockfile consistency and avoid unrelated dependency changes.
- Update API docs, `.env.example`, migrations, and relevant tests with behavior changes. Comments explain non-obvious decisions, not trivial syntax. Do not add speculative features or empty infrastructure.

## 16. Agent execution workflow

Before implementation:
1. Read this file and applicable scoped instructions. Inspect relevant modules, existing utilities, tests, configuration, schema and dependency versions.
2. Establish requirements, impacted API contracts, data ownership and security boundaries. Identify reusable patterns; do not blindly copy unsafe legacy examples.
3. Plan the smallest complete change. Flag meaningful ambiguity, breaking changes, destructive database operations or architectural conflicts before executing them. For audit/review-only requests, do not modify source code.

During implementation:
1. Respect layer boundaries and module ownership. Add only necessary files, dependencies and configuration.
2. Preserve existing user changes; never revert unrelated edits or run destructive Git commands. Do not commit/push/deploy unless requested.
3. Add/update focused tests and approved migration artifacts. Do not expose secrets in commands, logs, examples or reports.
4. Keep changes scoped; no opportunistic mass reformatting, unrelated refactors or unrequested telemetry setup.

Before completion:
1. Review the diff for correctness, security, type safety and accidental changes.
2. Run relevant non-destructive checks using actual package scripts. Typical commands (confirm availability first):
   - `npm run lint` (inspect whether it auto-fixes; prefer a check-only variant for verification)
   - `npm run build`
   - `npm test`
   - `npm run test:e2e`
   - `npx prisma validate` and `npx prisma generate` for schema changes (use installed CLI; do not fetch a new version implicitly).
3. Verify tests use an isolated database before execution. Report any checks not run and their reason. Never claim a test/build passed without evidence.
4. Summarize changes, files affected, API/config/schema impact, migrations required, verification results and remaining risks. Distinguish implemented behavior from recommendations.

## 17. Definition of done

- Correct domain folder and layer responsibilities; no cross-module repository access or direct model queries in services/controllers.
- Typed DTOs, validated inputs, explicit authorization and safe response projection.
- Centralized configuration; one runtime root `.env`; no committed secrets.
- Correct Prisma query types, database constraints, transaction scope and soft-delete semantics.
- Compatible API contract, structured errors, safe logging and relevant documentation.
- Focused tests for changed behavior; lint/build/test results accurately reported.
- No unrelated changes, unapproved dependencies, destructive operations or unrequested deployment actions.
