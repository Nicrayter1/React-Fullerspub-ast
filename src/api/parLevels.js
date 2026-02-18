import { supabaseClient } from './supabase'

/**
 * Загрузка всех нормативов
 */
export async function fetchParLevels() {
  const { data, error } = await supabaseClient
    .from('par_levels')
    .select('*')

  if (error) throw error
  return data
}

/**
 * Сохранение норматива для одного продукта
 * Если запись есть — обновляет, нет — создаёт
 */
export async function upsertParLevel(productId, totalPar) {
  const { data, error } = await supabaseClient
    .from('par_levels')
    .upsert(
      { product_id: productId, total_par: totalPar },
      { onConflict: 'product_id' }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Массовое сохранение нормативов
 * @param {Array} items — [{ product_id, total_par }, ...]
 */
export async function upsertParLevelsBulk(items) {
  const { data, error } = await supabaseClient
    .from('par_levels')
    .upsert(items, { onConflict: 'product_id' })
    .select()

  if (error) throw error
  return data
}

/**
 * Загрузка сводки заказа из View order_summary
 */
export async function fetchOrderSummary() {
  const { data, error } = await supabaseClient
    .from('order_summary')
    .select('*')
    .order('distributor', { nullsLast: true })

  if (error) throw error
  return data
}

/**
 * Обновление company/distributor/unit у продукта
 */
export async function updateProductMeta(productId, { company, distributor, unit }) {
  const { data, error } = await supabaseClient
    .from('products')
    .update({ company, distributor, unit })
    .eq('id', productId)
    .select()
    .single()

  if (error) throw error
  return data
}
