# Style Guide - Bar Stock App

## Дизайн-система (Tailwind CSS)

Это приложение использует Tailwind CSS для стилизации. Мы перешли от кастомных CSS-файлов к компонентному подходу и утилитарным классам.

### Цветовая палитра

| Цвет | Tailwind класс | HEX | Применение |
|------|----------------|-----|------------|
| Primary | `bg-primary` | `#3b82f6` | Основные действия, кнопки |
| Success | `bg-success` | `#10b981` | Положительные статусы, добавление |
| Error | `bg-error` | `#ef4444` | Ошибки, удаление |
| Warning | `bg-warning` | `#f59e0b` | Предупреждения, заморозка |
| Secondary| `bg-secondary` | `#6b7280` | Второстепенные действия |
| Surface | `bg-surface-light` | `#ffffff` | Карточки, контейнеры |
| Background | `bg-background-light` | `#f3f4f6` | Фон приложения |

### Тёмная тема

Приложение поддерживает автоматическую тёмную тему (`darkMode: 'media'`). Используйте префикс `dark:` для настройки стилей.

- Фон: `dark:bg-background-dark` (`#111827`)
- Поверхности: `dark:bg-surface-dark` (`#1f2937`)
- Текст: `dark:text-gray-100`

---

## Библиотека компонентов (`src/components/ui`)

Мы используем переиспользуемые UI-компоненты для обеспечения единообразия интерфейса.

### Button

```jsx
import Button from './components/ui/Button'

<Button variant="primary" size="md" onClick={handleSave}>
  Сохранить
</Button>
```

**Props:**
- `variant`: `primary` (default), `secondary`, `outline`, `danger`, `ghost`
- `size`: `sm`, `md`, `lg`
- `loading`: boolean (показывает спиннер)
- `icon`: Lucide icon component
- `disabled`: boolean

### Input

```jsx
import Input from './components/ui/Input'

<Input
  label="Email"
  error={errors.email}
  placeholder="example@email.com"
  value={email}
  onChange={e => setEmail(e.target.value)}
/>
```

### Table

```jsx
import Table from './components/ui/Table'

const columns = [
  { header: 'Имя', key: 'name' },
  { header: 'Действие', render: (row) => <Button>Edit</Button> }
]

<Table columns={columns} data={items} />
```

### Modal

```jsx
import Modal from './components/ui/Modal'

<Modal
  isOpen={isOpen}
  title="Редактирование"
  onClose={() => setIsOpen(false)}
  actions={<Button onClick={save}>OK</Button>}
>
  Содержимое модального окна
</Modal>
```

### Card

```jsx
import Card from './components/ui/Card'

<Card title="Статистика" actions={<Button size="sm">Обновить</Button>}>
  Контент карточки
</Card>
```

### Badge

```jsx
import Badge from './components/ui/Badge'

<Badge variant="success">Активен</Badge>
```

---

## Правила разработки

1. **Никаких новых CSS файлов.** Используйте Tailwind классы прямо в JSX.
2. **Используйте UI компоненты.** Если нужно создать кнопку или поле ввода, проверьте `src/components/ui`.
3. **Адаптивность.** Используйте префиксы `sm:`, `md:`, `lg:` для мобильных версий.
4. **Тёмная тема.** Всегда проверяйте, как ваш компонент выглядит в тёмной теме.
