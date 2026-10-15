# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y versionado con
[SemVer](https://semver.org/lang/es/).

## [No publicado]

### Cambiado

- El demo está en inglés.
- Demo: selector de servidor Overpass; cambiar tema, forma o color redibuja la ciudad cargada sin
  volver a consultar, y si una consulta falla lo dice sin borrar lo que se muestra.
- El lint usa `@ghegar/eslint-config` (presets `base` y `ts`) en lugar de una config propia.

### Corregido

- Demo: contraste de la rosa en el tema Noche, plural de «nombre» y favicon.
- Los títulos largos se salían del póster: título, subtítulo y coordenadas llevan `maxWidth` y, si
  la estimación desborda, `posterToSvg` los ajusta con `textLength`; `advance` afina la estimación.

## [0.1.0] - 2026-10-13

### Agregado

- `traza`: modelo de red (nodos, tramos, clase, nombre), corte de líneas en nodos compartidos, seis
  clases de vía con mapa desde `highway` de OSM, geodesia, proyección azimutal equidistante local.
- `traza/osm`: consulta Overpass por bbox o polígono con capas de calles, agua, parques y edificios;
  tope de área, `AbortSignal`, `userAgent` y parseo propio con multipolígonos.
- `traza/sources`: GeoJSON y WFS paginado en `CRS:84` a red, con unión de vértices por tolerancia;
  polígonos propios como áreas.
- `traza/orientation`: histograma de rumbos ponderado por longitud, entropía y orden φ.
- `traza/stats`: longitud por clase, intersecciones, calles sin salida, grado medio, circuidad,
  densidad y proporción con nombre.
- `traza/names`: normalización de nombres con tipos de vía y abreviaturas de México, categorías por
  reglas del consumidor, ranking de nombres y de tipos de vía con filtro por clase.
- `traza/poster`: escena del póster con marco circular o rectangular, capas ordenadas, bloque de texto
  y atribución de OSM obligatoria.
- `traza/svg`: póster y rosa de orientación a SVG con el tema del consumidor.
- `traza/ol`: features y capa de OpenLayers con clase, rumbo y categoría.
- Demo en Vite con seis ciudades, tres temas, coloreado por nombre y descarga SVG/PNG.
