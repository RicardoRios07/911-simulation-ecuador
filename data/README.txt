================================================================================
                    CARPETA DE DATOS - ECU 911 SIMULACIÓN
================================================================================

Coloque aquí su archivo CSV con los datos de emergencias del ECU 911.

FORMATO REQUERIDO DEL CSV:
--------------------------
El archivo debe contener las siguientes columnas:

- fecha          : Fecha del evento (formato: DD/MM/YYYY o YYYY-MM-DD)
- provincia      : Nombre de la provincia (ej: "Pichincha", "Guayas")
- canton         : Nombre del cantón
- cod_parroquia  : Código de la parroquia
- parroquia      : Nombre de la parroquia
- tipo_servicio  : Tipo de servicio de emergencia:
                   * Seguridad Ciudadana
                   * Tránsito y Movilidad
                   * Gestión Sanitaria
                   * Servicios Municipales
                   * Gestión de Siniestros
                   * Servicio Militar
                   * Gestión de Riesgos
- subtipo        : Subtipo específico del servicio
- dia_semana     : Día de la semana (Lunes, Martes, etc.)
- dia_mes        : Día del mes (1-31)
- mes            : Mes (1-12 o nombre del mes)
- año            : Año (ej: 2025)


EJEMPLO DE CSV:
---------------
fecha,provincia,canton,cod_parroquia,parroquia,tipo_servicio,subtipo,dia_semana,dia_mes,mes,año
01/11/2025,Pichincha,Quito,170101,Centro Histórico,Seguridad Ciudadana,Robo,Sábado,1,11,2025
01/11/2025,Guayas,Guayaquil,090101,Tarqui,Gestión Sanitaria,Emergencia Médica,Sábado,1,11,2025


INSTRUCCIONES:
--------------
1. Guarde su archivo CSV en esta carpeta
2. Al descargar el proyecto como ZIP, el archivo estará incluido
3. En la aplicación, use el botón "Cargar CSV" para importar sus datos
4. La simulación se ajustará automáticamente a la distribución real de emergencias


NOTAS:
------
- El archivo puede tener cualquier nombre pero debe tener extensión .csv
- Los nombres de provincias deben coincidir con los nombres oficiales de Ecuador
- Se recomienda usar codificación UTF-8 para caracteres especiales

================================================================================
