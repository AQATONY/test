# Блок 4. Тестирование API `/api/v2/orders`

## Исходный контракт из `api.md`

| Method | URL | Успешные/основные статусы из задания |
|---|---|---|
| `GET` | `/api/v2/orders` | `200 OK` |
| `GET` | `/api/v2/orders/{id:uuid}` | `200 OK`, `404 Not Found`, `410 Gone` |
| `POST` | `/api/v2/orders/` или `/api/v2/orders/{id:uuid}` | `200 OK` или `201 Created`, `409 Conflict` |
| `PUT` | `/api/v2/orders/{id:uuid}` | `200 OK` или `204 No Content` |
| `PUT` | `/api/v2/orders/{id:uuid}` как create/update | `201 Created`/`200 OK` при создании, `204 No Content`/`200 OK` при обновлении |
| `DELETE` | `/api/v2/orders/{id:uuid}` | `204 No Content`, `404 Not Found`, `410 Gone` |
| `HEAD` | `/api/v2/orders/{id:uuid}` | `204 No Content` |

## Общие ожидания по ошибкам

| Сценарий | Ожидаемый статус | Проверки |
|---|---|---|
| Невалидный UUID в path | `400 Bad Request` | Ошибка указывает на `id`, нет stack trace |
| Ошибка схемы JSON | `400 Bad Request` | Неверный JSON/тип поля отклоняется |
| Ошибка бизнес-валидации | `400 Bad Request` или `422 Unprocessable Entity` по стандарту проекта | В error body есть поле/код причины |
| Нет авторизации | `401 Unauthorized` | Нет утечки данных заказа |
| Авторизован, но нет прав | `403 Forbidden` | Разница с `401` соблюдена |
| Ресурс не найден | `404 Not Found` | Для неизвестного ID |
| Ресурс логически удалем | `410 Gone` | Если soft delete включен |
| Конфликт версии/состояния | `409 Conflict` или `412 Precondition Failed` при `If-Match` | Не теряются чужие изменения |
| Rate limit | `429 Too Many Requests` | Есть `Retry-After`, если используется |
| БД недоступна | `503 Service Unavailable` | Пользовательская ошибка без SQL/stack trace |
| Неожиданное падение | `500 Internal Server Error` | Есть request/correlation id, нет секретов |

## `GET /api/v2/orders`

| ID | Priority | Проверка | Ожидаемый результат |
|---|---|---|---|
| API-LIST-01 | Critical | Получить список при наличии заказов | `200 OK`, массив заказов, только доступные пользователю записи |
| API-LIST-02 | High | Получить список при отсутствии заказов | `200 OK`, пустой массив `[]`, не `404` |
| API-LIST-03 | High | Проверить, что логически удаленные заказы не возвращаются | В ответе только активные записи |
| API-LIST-04 | High | Проверить пагинацию | Корректные limit/page или cursor, стабильный порядок |
| API-LIST-05 | Medium | Проверить сортировку и фильтры, если поддерживаются | Невалидный фильтр возвращает `400` |
| API-LIST-06 | Critical | Запрос без токена | `401 Unauthorized` |
| API-LIST-07 | Critical | Пользователь без права просмотра заказов | `403 Forbidden` |
| API-LIST-08 | High | БД недоступна | `503 Service Unavailable`, нет пустого массива как ложного успеха |

## `GET /api/v2/orders/{id:uuid}`

| ID | Priority | Проверка | Ожидаемый результат |
|---|---|---|---|
| API-GET-01 | Critical | Получить существующий заказ по UUID | `200 OK`, тело заказа соответствует схеме |
| API-GET-02 | Critical | Получить заказ по неизвестному UUID | `404 Not Found` |
| API-GET-03 | High | Получить логически удаленный заказ | `410 Gone`, если soft delete включен |
| API-GET-04 | High | Передать не UUID | `400 Bad Request` |
| API-GET-05 | Critical | Получить чужой заказ | `403 Forbidden` или `404 Not Found` по security policy проекта |
| API-GET-06 | High | Проверить response headers | `Content-Type: application/json`, cache policy не раскрывает приватные данные |

## `POST /api/v2/orders`

| ID | Priority | Проверка | Ожидаемый результат |
|---|---|---|---|
| API-POST-01 | Critical | Создать заказ с валидным payload | `201 Created`, есть `Location` и `id`; либо `200 OK`, если так зафиксировано контрактом |
| API-POST-02 | Critical | Создать заказ с пустым body | `400 Bad Request` |
| API-POST-03 | Critical | Создать заказ без обязательного поля | `400`/`422`, ошибка указывает поле |
| API-POST-04 | High | Передать поле неверного типа | `400 Bad Request` |
| API-POST-05 | High | Передать неизвестное поле | Поведение определено: игнор или `400`, но одинаково документировано |
| API-POST-06 | High | `POST /api/v2/orders/{id}` с уже существующим ID | `409 Conflict` |
| API-POST-07 | High | Повторить тот же `POST` после network retry | Нет дубля заказа, если используется idempotency key; иначе риск зафиксирован |
| API-POST-08 | Critical | Пользователь без права создания | `403 Forbidden` |
| API-POST-09 | High | БД недоступна при создании | `503 Service Unavailable`, заказ не считается созданным |

## `PUT /api/v2/orders/{id:uuid}`

| ID | Priority | Проверка | Ожидаемый результат |
|---|---|---|---|
| API-PUT-01 | Critical | Обновить существующий заказ валидным payload | `200 OK` с read-model или `204 No Content` |
| API-PUT-02 | High | Повторить тот же `PUT` | Идемпотентный результат, данные не дублируются |
| API-PUT-03 | Critical | Обновить неизвестный ID в режиме update-only | `404 Not Found` |
| API-PUT-04 | High | Upsert создает новый заказ | `201 Created` или `200 OK`, если upsert включен контрактом |
| API-PUT-05 | High | Upsert обновляет существующий заказ | `204 No Content` или `200 OK` |
| API-PUT-06 | Critical | Невалидный payload | `400`/`422` |
| API-PUT-07 | High | Конфликт состояния, например заказ уже удален/закрыт | `409 Conflict` или `410 Gone` |
| API-PUT-08 | High | Lost update при старой версии ресурса | `412 Precondition Failed`, если используется ETag/If-Match |

## `DELETE /api/v2/orders/{id:uuid}`

| ID | Priority | Проверка | Ожидаемый результат |
|---|---|---|---|
| API-DEL-01 | Critical | Удалить существующий заказ | `204 No Content`, тело пустое |
| API-DEL-02 | Critical | Удалить неизвестный ID | `404 Not Found` |
| API-DEL-03 | High | Повторно удалить уже удаленный заказ | `410 Gone` по контракту из задания |
| API-DEL-04 | Critical | Пользователь без права удаления | `403 Forbidden` |
| API-DEL-05 | High | Проверить список после удаления | Удаленный заказ не возвращается в `GET /api/v2/orders` |
| API-DEL-06 | High | БД недоступна во время удаления | `503 Service Unavailable`, состояние не считаетсизмененным |

## `HEAD /api/v2/orders/{id:uuid}`

| ID | Priority | Проверка | Ожидаемый результат |
|---|---|---|---|
| API-HEAD-01 | Medium | Существующий заказ | `204 No Content`, тело отсутствует |
| API-HEAD-02 | Medium | Неизвестный заказ | `404 Not Found` |
| API-HEAD-03 | Medium | Удаленный заказ | `410 Gone`, если soft delete включен |
| API-HEAD-04 | Medium | Проверить отсутствие body | Тело ответа пустое |

## Проверки error body

Минимальный ожидаемый контракт ошибки:

```json
{
  "error": {
    "code": "badRequest",
    "message": "Cannot process the request because a required field is missing.",
    "target": "order.customerId",
    "innererror": {
      "code": "requiredFieldMissing"
    }
  }
}
```

Проверки:

- `code` соответствует HTTP status.
- `message` понятен разработчику, но не раскрывает SQL, stack trace, внутренние hostnames.
- `target` указывает поле или ресурс.
- `requestId`/`correlationId` доступен для расследования.
- Для одинаковой ошибки код стабилен между релизами.

## Автоматизация

Я бы автоматизировал как pytest/API smoke:

- parametrized tests по методам и статусам;
- JSON schema validation для success/error body;
- auth matrix: no token, wrong role, owner, admin;
- idempotency checks для `PUT`, `DELETE` и retry-safe `POST`;
- negative tests для invalid UUID, unknown ID, soft-deleted ID;
- fault injection/mock на DB unavailable, если есть тестовый стенд или contract test layer.
