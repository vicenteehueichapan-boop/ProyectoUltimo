# 👑 APEX PREDATOR V10 — Master Architecture

Este repositorio contiene la culminación de la **Fase 1 y 2** del sistema de asistencia táctica para Poker 6-Max NL2-NL50. El proyecto ha sido auditado al nivel de Ingeniería de Software Principal (Staff Engineer) para garantizar una ejecución síncrona de 60FPS, persistencia de datos hermética y una lógica de decisión GTO/Explotativa de grado militar.

## 🚀 Características Principales

### 1. Motor de Decisión (Engine Core)
- **Escudo de Relatividad (Relativity Shield):** Lógica defensiva avanzada que detecta texturas de mesa letales (Boards pareados, monótonos o con huecos mínimos) y ajusta los rangos de Call/Fold para evitar fugas de EV.
- **Multiplicadores MDA (Massive Data Analysis):** Sizing dinámico que extrae valor máximo contra *Calling Stations* y reduce el riesgo de farol contra *Nits*.
- **Conexión Holística:** Sincronización total entre el **Sizing Lab**, el **Constructor de Rangos** y el motor de ejecución en tiempo real.

### 2. Constructor de Rangos GTO (Painter)
- Interfaz interactiva 13x13 con sistema de pintado por arrastre optimizado.
- **Debounced I/O:** Sistema de guardado asíncrono (350ms) que protege el rendimiento del disco durante sesiones de multitableo intensivo.
- Persistencia total en `localStorage` con fallbacks de seguridad.

### 3. V10 Dual-Table & Tactical Ergonomics
- **Arquitectura Dual:** Layout avanzado con CSS Grid optimizado para jugar en dos mesas simultáneas.
- **Lógica de Dealer Real:** Botón de rotación inteligente que salta automáticamente los asientos vacíos y re-mapea las posiciones (SB, BB, UTG, etc.) dinámicamente según los asientos activos.
- **Ergonomía de Alta Velocidad:** Inputs masivos y feedback visual de escala para una fricción mínima en la toma de decisiones.

## 🛠️ Tecnologías
- **Core:** Vanilla JavaScript (ES6+) - Arquitectura desacoplada.
- **UI:** CSS3 Avanzado (Modern Dark Mode, Glassmorphism, Micro-animaciones).
- **Persistencia:** LocalStorage API con protección `beforeunload`.

## 📂 Estructura del Proyecto
- `apex_mesa_v9.html`: Interfaz principal estable.
- `dual_table_v10_prototype.html`: Prototipo de ergonomía táctica dual.
- `modules/`:
  - `engine_core.js`: El cerebro del sistema.
  - `engine_hand.js`: Evaluador de manos y texturas.
  - `strategy_center.js`: Centro de control de MDA y Sizings.
  - `range_db.js`: Base de datos de rangos con Debounce I/O.
  - `player_db.js`: Almacén de perfiles de villanos.

---
**Nota de Seguridad:** Este software es una herramienta de asistencia de entrada **100% manual**. No utiliza OCR ni automatización, garantizando el aislamiento total del cliente de Poker y la seguridad del usuario.

*Desarrollado por APEX ARCHITECT.*
