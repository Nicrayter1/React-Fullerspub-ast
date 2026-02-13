/**
 * ============================================================
 * ДОПОЛНИТЕЛЬНЫЕ СТИЛИ ДЛЯ КНОПКИ ФЛАГОВ
 * Добавьте эти стили в конец файла AdminProductList.css
 * ============================================================
 */

/* ============================================================
   КНОПКА ФЛАГОВ
   ============================================================ */

/* Кнопка флагов */
.btn-flag {
  background: #374151 !important;
  border: 2px solid #4b5563 !important;
  border-radius: 6px;
  padding: 6px 10px !important;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 16px;
  min-width: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-flag:hover {
  background: #4b5563 !important;
  border-color: #60a5fa !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(96, 165, 250, 0.3);
}

/* Контейнер иконок флагов */
.flag-icons {
  display: flex;
  gap: 2px;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

/* Отдельные флаги */
.flag-red,
.flag-green,
.flag-yellow,
.flag-empty {
  font-size: 14px;
  line-height: 1;
}

/* Пустой флаг (когда нет флагов) */
.flag-empty {
  opacity: 0.4;
  font-size: 16px;
}

/* Анимация при наведении на кнопку с флагами */
.btn-flag:hover .flag-red,
.btn-flag:hover .flag-green,
.btn-flag:hover .flag-yellow {
  transform: scale(1.1);
  transition: transform 0.2s;
}

/* ============================================================
   АДАПТАЦИЯ ДЛЯ МОБИЛЬНЫХ
   ============================================================ */

@media (max-width: 768px) {
  .btn-flag {
    min-width: 40px;
    padding: 5px 8px !important;
  }
  
  .flag-icons {
    gap: 1px;
  }
  
  .flag-red,
  .flag-green,
  .flag-yellow {
    font-size: 12px;
  }
  
  .flag-empty {
    font-size: 14px;
  }
}
