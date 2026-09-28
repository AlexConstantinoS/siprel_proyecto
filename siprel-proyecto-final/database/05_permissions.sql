-- Minimo privilegio: la API ejecuta SPs, no consulta tablas directamente.
REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'siprel_app'@'%';
GRANT EXECUTE ON siprel_db.* TO 'siprel_app'@'%';
FLUSH PRIVILEGES;
