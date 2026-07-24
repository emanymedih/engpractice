# WordMemo — cloud sync setup

## Почему это отдельный этап
GitHub Pages — статический хостинг. Он не может безопасно хранить пользовательский прогресс между iPhone и компьютером. Токены GitHub или service-role ключи нельзя встраивать в клиентский JavaScript.

## Рекомендуемая архитектура
Для WordMemo достаточно небольшого backend-as-a-service:

- authentication: email magic link или Sign in with Apple;
- таблица `user_state` с одной актуальной записью состояния на пользователя;
- Row Level Security: пользователь может читать/писать только свою запись;
- локальное состояние (`localStorage` + IndexedDB) остаётся offline-first;
- синхронизация выполняется после входа, после изменения прогресса и при возврате приложения в foreground;
- конфликт разрешается по `updatedAt`, но перед первой синхронизацией локальный прогресс нельзя молча затирать облачным.

## Минимальная схема данных

```sql
create table user_state (
  user_id uuid primary key,
  state jsonb not null,
  updated_at timestamptz not null default now()
);
```

## Правила первой синхронизации
1. Нет cloud state → загрузить локальное состояние в облако.
2. Нет local state → скачать cloud state.
3. Есть оба → выбрать более новое по `updatedAt`; при подозрительно большой разнице прогресса предложить пользователю выбор вместо автоматической потери данных.
4. После успешного merge записать одинаковое состояние в localStorage, IndexedDB и cloud.

## Что требуется перед подключением
Нужны URL проекта и публичный browser-safe anon/publishable key выбранного backend. Секретный service-role/admin key в репозиторий не добавляется.
