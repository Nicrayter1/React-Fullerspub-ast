import { supabaseClient } from './supabase'

/**
 * Загрузка всех дистрибьюторов
 * @returns {Array} [{ id, name, whatsapp }]
 */
export async function fetchDistributors() {
  const { data, error } = await supabaseClient
    .from('distributors')
    .select('*')
    .order('name')
  if (error) throw error
  return data
}

/**
 * Создание или обновление дистрибьютора
 * - Без id → CREATE (INSERT)
 * - С id   → UPDATE
 * @param {{ id?, name, whatsapp }} distributor
 */
export async function saveDistributor({ id, name, whatsapp }) {
  // Нормализуем номер: убираем +, пробелы, дефисы
  const cleanPhone = whatsapp
    ? whatsapp.replace(/[\s+\-()]/g, '')
    : null

  if (id) {
    // UPDATE
    const { data, error } = await supabaseClient
      .from('distributors')
      .update({ name: name.trim(), whatsapp: cleanPhone })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  } else {
    // INSERT
    const { data, error } = await supabaseClient
      .from('distributors')
      .insert({ name: name.trim(), whatsapp: cleanPhone })
      .select()
      .single()
    if (error) throw error
    return data
  }
}

/**
 * Удаление дистрибьютора
 * Продукты у которых был этот дистрибьютор — получат distributor_id = NULL
 * (FK ON DELETE SET NULL, см. миграцию)
 */
export async function deleteDistributor(id) {
  const { error } = await supabaseClient
    .from('distributors')
    .delete()
    .eq('id', id)
  if (error) throw error
}

/**
 * Привязка продукта к дистрибьютору
 * Вызывается из ParLevelManager когда меняют дистрибьютора у продукта
 */
export async function linkProductToDistributor(productId, distributorId) {
  const { error } = await supabaseClient
    .from('products')
    .update({ distributor_id: distributorId })
    .eq('id', productId)
  if (error) throw error
}
