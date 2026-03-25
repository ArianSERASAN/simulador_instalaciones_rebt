# Instrucciones globales de Claude

Este archivo define el comportamiento de Claude Code en todos los proyectos de este workspace.

---

## Comunicación y tono

- Responder siempre en **español**
- Respuestas **concisas y directas** — sin introducciones, sin palabrería
- Sin emojis salvo que se pidan explícitamente
- No repetir lo que el usuario acaba de decir
- Si algo no está claro, preguntar en lugar de asumir

---

## Comandos del proyecto

Actualizar esta sección para cada proyecto:

```
# Python
pip install -r requirements.txt
python main.py
python -m pytest

# Node / JavaScript / TypeScript
npm install
npm run dev
npm run build
npm test
npm run lint
```

---

## Estilo de código

- Seguir las convenciones estándar del lenguaje/framework del proyecto
- Preferir **claridad** sobre brevedad
- Añadir comentarios solo donde la lógica no sea evidente por sí sola
- No añadir docstrings, tipos o comentarios al código que no se ha modificado

---

## Git

- **NO hacer commits** salvo que el usuario lo pida explícitamente
- Sí **sugerir** hacer commit cuando sea el momento obvio (ej: tarea completada)
- **Nunca hacer push** sin confirmación explícita del usuario
- Mensajes de commit en inglés, en imperativo, descriptivos del cambio
- No usar `--no-verify` ni saltarse hooks salvo instrucción explícita

---

## Seguridad y acciones destructivas

Pedir **confirmación siempre** antes de:
- Borrar archivos o directorios
- `git reset --hard`, `git push --force`, `git clean`
- Drop de tablas o bases de datos
- Cualquier operación irreversible

**Excepción**: si el usuario lo ha pedido explícitamente en el mismo mensaje, proceder directamente.

---

## Tests

- No proponer tests por defecto en todos los proyectos
- Sugerir tests **solo si el proyecto ya tiene una suite de tests** activa
- Usar el framework de tests que ya exista en el proyecto

---

## Arquitectura

<!-- Completar por proyecto: decisiones de diseño, patrones utilizados, estructura de carpetas -->

---

## Variables de entorno

<!-- Completar por proyecto: variables requeridas y opcionales -->
<!-- Ejemplo:
- DATABASE_URL — requerida
- DEBUG=true — opcional, activa logs adicionales
-->

---

## Gotchas

<!-- Completar por proyecto: comportamientos no obvios, trampas comunes, quirks -->
