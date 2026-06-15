# Блок 3. Анализ данных SQL

Диалект: PostgreSQL.

## Задача 1. Вторая зарплата

Таблица: `Employee(id int PK, salary int)`.

Требование: найти вторую по величине уникальную зарплату. Если ее нет, вернуть `null`.

```sql
SELECT MAX(salary) AS second_highest_salary
FROM Employee
WHERE salary < (
    SELECT MAX(salary)
    FROM Employee
);
```

### Почему так

- Внутренний `MAX(salary)` находит максимальную зарплату.
- Внешний `MAX(salary)` ищет максимум среди зарплат ниже максимальной.
- Если уникальная зарплата только одна или таблица пустая, результат будет `NULL`.

### Альтернатива через `DISTINCT`

```sql
SELECT (
    SELECT salary
    FROM (
        SELECT DISTINCT salary
        FROM Employee
        ORDER BY salary DESC
        OFFSET 1
        LIMIT 1
    ) AS distinct_salaries
) AS second_highest_salary;
```

Эта версия явно показывает работу с уникальными значениями, но первая короче и проще.

## Задача 2. Поиск дубликатов email

Таблица: `Person(id int PK, email varchar)`.

Требование: найти все дублирующиеся email-адреса.

```sql
SELECT email
FROM Person
GROUP BY email
HAVING COUNT(*) > 1;
```

### Если бизнес требует case-insensitive сравнение

```sql
SELECT LOWER(TRIM(email)) AS normalized_email
FROM Person
WHERE email IS NOT NULL
GROUP BY LOWER(TRIM(email))
HAVING COUNT(*) > 1;
```

Эту версию я бы использовал только после уточнения требований, потому что `Test@Email.com` и `test@email.com` могут считаться разными или одинаковыми в зависимости от бизнес-правил.

## Задача 3. Клиенты без заказов

Таблицы:

- `Customers(id int PK, name varchar)`
- `Orders(id int PK, customerId int FK)`

Требование: вернуть всех клиентов, которые ни разу не делали заказов.

```sql
SELECT c.id, c.name
FROM Customers AS c
WHERE NOT EXISTS (
    SELECT 1
    FROM Orders AS o
    WHERE o.customerId = c.id
);
```

### Альтернатива через `LEFT JOIN`

```sql
SELECT c.id, c.name
FROM Customers AS c
LEFT JOIN Orders AS o
    ON o.customerId = c.id
WHERE o.id IS NULL;
```

### Почему предпочитаю `NOT EXISTS`

`NOT EXISTS` хорошо читается как бизнес-условие "не существует заказа для клиента" и не зависит от того, какие поля `Orders` nullable, кроме самого join-условия.
