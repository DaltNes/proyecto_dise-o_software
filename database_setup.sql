-- Script SQL para crear las tablas necesarias en Supabase
-- Ejecutar estos comandos en el SQL Editor de Supabase

-- 1. Tabla para historial de conversiones
CREATE TABLE IF NOT EXISTS conversion_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  original_filename TEXT NOT NULL,
  original_format TEXT NOT NULL,
  converted_format TEXT NOT NULL,
  converted_filename TEXT,
  file_size BIGINT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  conversion_time TIMESTAMP WITH TIME ZONE,
  download_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla para preferencias de usuario
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  language TEXT DEFAULT 'es' CHECK (language IN ('es', 'en')),
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  auto_download BOOLEAN DEFAULT false,
  email_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_conversion_history_user_id ON conversion_history(user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_history_created_at ON conversion_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversion_history_status ON conversion_history(status);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- 4. Row Level Security (RLS) para seguridad
ALTER TABLE conversion_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de seguridad
-- Los usuarios solo pueden ver y modificar sus propios registros

-- Políticas para conversion_history
CREATE POLICY "Users can view own conversion history" ON conversion_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversion history" ON conversion_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversion history" ON conversion_history
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversion history" ON conversion_history
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para user_preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- 6. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Triggers para actualizar updated_at
CREATE TRIGGER update_conversion_history_updated_at
  BEFORE UPDATE ON conversion_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Verificar que las tablas se crearon correctamente
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';