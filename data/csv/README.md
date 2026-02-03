# Datos de Emergencias ECU 911

Esta carpeta contiene los datos CSV para la simulación del sistema ECU 911 de Ecuador.

## Formato del CSV

El archivo CSV debe contener las siguientes columnas:

- `fecha`: Fecha de la emergencia (formato: YYYY-MM-DD)
- `provincia`: Nombre de la provincia
- `canton`: Nombre del cantón
- `cod_parroquia`: Código de la parroquia
- `parroquia`: Nombre de la parroquia
- `tipo_servicio`: Tipo de servicio de emergencia (ej: Seguridad Ciudadana, Tránsito y Movilidad, etc.)
- `subtipo`: Subtipo específico de la emergencia
- `dia_semana`: Día de la semana (ej: Lunes, Martes, etc.)
- `dia_mes`: Día del mes (1-31)
- `mes`: Mes (1-12)
- `año`: Año (ej: 2025)

## Instrucciones

1. Coloca tu archivo CSV en esta carpeta con el nombre `emergencias.csv`
2. Asegúrate de que las columnas coincidan con el formato especificado
3. La simulación leerá automáticamente los datos de este archivo

## Tipos de Servicio (Noviembre 2025)

Según los datos proporcionados:

- **Seguridad Ciudadana**: 181,765 casos
- **Tránsito y Movilidad**: 34,780 casos
- **Gestión Sanitaria**: 32,434 casos
- **Servicios Municipales**: 10,541 casos
- **Gestión de Siniestros**: 4,354 casos
- **Servicio Militar**: 4,185 casos
- **Gestión de Riesgos**: 1,007 casos

La simulación utilizará estos datos para distribuir agentes de manera realista según la demanda por provincia.
