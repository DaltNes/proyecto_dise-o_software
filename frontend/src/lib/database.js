import { supabase } from '../supabaseClient'

// Funciones CRUD para el historial de conversiones
export const conversionHistory = {
  // Crear un nuevo registro de conversión
  create: async (conversionData) => {
    try {
      const { data, error } = await supabase
        .from('conversion_history')
        .insert([{
          user_id: conversionData.userId,
          original_filename: conversionData.originalFilename,
          original_format: conversionData.originalFormat,
          converted_format: conversionData.convertedFormat,
          converted_filename: conversionData.convertedFilename,
          file_size: conversionData.fileSize,
          status: conversionData.status || 'completed',
          conversion_time: conversionData.conversionTime || new Date().toISOString(),
          download_url: conversionData.downloadUrl
        }])
        .select()

      if (error) throw error
      return { data: data[0], error: null }
    } catch (error) {
      console.error('Error creating conversion record:', error)
      return { data: null, error }
    }
  },

  // Obtener historial de conversiones del usuario
  getByUser: async (userId, limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('conversion_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching conversion history:', error)
      return { data: null, error }
    }
  },

  // Obtener una conversión específica
  getById: async (conversionId) => {
    try {
      const { data, error } = await supabase
        .from('conversion_history')
        .select('*')
        .eq('id', conversionId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching conversion:', error)
      return { data: null, error }
    }
  },

  // Actualizar estado de conversión
  updateStatus: async (conversionId, status, downloadUrl = null) => {
    try {
      const updateData = { status }
      if (downloadUrl) updateData.download_url = downloadUrl

      const { data, error } = await supabase
        .from('conversion_history')
        .update(updateData)
        .eq('id', conversionId)
        .select()

      if (error) throw error
      return { data: data[0], error: null }
    } catch (error) {
      console.error('Error updating conversion status:', error)
      return { data: null, error }
    }
  },

  // Eliminar un registro de conversión
  delete: async (conversionId, userId) => {
    try {
      const { error } = await supabase
        .from('conversion_history')
        .delete()
        .eq('id', conversionId)
        .eq('user_id', userId) // Asegurar que solo el propietario pueda eliminar

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Error deleting conversion record:', error)
      return { error }
    }
  },

  // Obtener estadísticas del usuario
  getStats: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('conversion_history')
        .select('original_format, converted_format, file_size, status')
        .eq('user_id', userId)

      if (error) throw error

      // Calcular estadísticas
      const totalConversions = data.length
      const successfulConversions = data.filter(item => item.status === 'completed').length
      const totalFileSize = data.reduce((sum, item) => sum + (item.file_size || 0), 0)
      
      const formatStats = data.reduce((acc, item) => {
        const conversion = `${item.original_format} → ${item.converted_format}`
        acc[conversion] = (acc[conversion] || 0) + 1
        return acc
      }, {})

      return {
        data: {
          totalConversions,
          successfulConversions,
          failedConversions: totalConversions - successfulConversions,
          totalFileSize,
          formatStats,
          successRate: totalConversions > 0 ? (successfulConversions / totalConversions * 100).toFixed(2) : 0
        },
        error: null
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
      return { data: null, error }
    }
  }
}

// Funciones para configuraciones del usuario
export const userPreferences = {
  // Obtener preferencias del usuario
  get: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching user preferences:', error)
      return { data: null, error }
    }
  },

  // Crear o actualizar preferencias
  upsert: async (userId, preferences) => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          language: preferences.language || 'es',
          theme: preferences.theme || 'light',
          auto_download: preferences.autoDownload || false,
          email_notifications: preferences.emailNotifications || true,
          updated_at: new Date().toISOString()
        })
        .select()

      if (error) throw error
      return { data: data[0], error: null }
    } catch (error) {
      console.error('Error updating user preferences:', error)
      return { data: null, error }
    }
  }
}