export type Lang = 'es' | 'en' | 'ca';

export const DEFAULT_LANG: Lang = 'es';
export const SUPPORTED_LANGS: readonly Lang[] = ['es', 'en', 'ca'];

export const LANG_LOCALES: Record<Lang, string> = {
  es: 'es-ES',
  en: 'en-GB',
  ca: 'ca-ES',
};

/**
 * Diccionarios de textos de interfaz (ES/EN/CA) almacenados como tuplas [es, en, ca]
 * para no duplicar claves en el bundle.
 *
 * Nota sobre datos del dominio: los nombres de playas, municipios, descripciones,
 * servicios (`Socorrista`, `Aseos`, `Duchas`, `Aparcamiento`, `Acceso adaptado`,
 * `Chiringuito`) y fuentes/licencias pertenecen al dataset y no se traducen.
 */
const ENTRIES = {
  'lang.es': ['Español', 'Español', 'Español'],
  'lang.en': ['English', 'English', 'English'],
  'lang.ca': ['Català', 'Català', 'Català'],

  'header.subtitle': ['Playas de Baleares', 'Balearic Beaches', 'Platges de les Balears'],
  'header.demoData': ['Datos de demostración', 'Demo data', 'Dades de demostració'],
  'header.officialData': ['Datos oficiales', 'Official data', 'Dades oficials'],
  'header.languageSelector': ['Idioma', 'Language', 'Idioma'],
  'header.datasetSelector': ['Conjunto de datos', 'Dataset', 'Conjunt de dades'],
  'header.datasetSeed': ['Demo', 'Demo', 'Demo'],
  'header.datasetOsm': ['Muestreo OSM', 'OSM sample', 'Mostreig OSM'],
  'header.uiScale': ['Tamaño de la interfaz', 'Interface size', 'Mida de la interfície'],
  'header.uiScaleDown': ['Reducir interfaz', 'Decrease interface size', 'Reduir interfície'],
  'header.uiScaleReset': ['Tamaño automático', 'Automatic size', 'Mida automàtica'],
  'header.uiScaleUp': ['Aumentar interfaz', 'Increase interface size', 'Augmentar interfície'],
  'header.osmSampleBadge': [
    'Muestreo OSM · calidad pendiente',
    'OSM sample · quality pending',
    'Mostreig OSM · qualitat pendent',
  ],

  'seo.homeTitle': [
    'Costa Clara · Playas de Baleares',
    'Costa Clara · Balearic Beaches',
    'Costa Clara · Platges de les Balears',
  ],
  'seo.homeDescription': [
    'Mapa interactivo de las playas de Baleares: calidad del agua, servicios, bandera azul y cómo llegar.',
    'Interactive map of Balearic beaches: water quality, amenities, blue flag and directions.',
    'Mapa interactiu de les platges de les Balears: qualitat de l’aigua, serveis, bandera blava i com arribar-hi.',
  ],
  'seo.beachTitle': ['{name} · Costa Clara', '{name} · Costa Clara', '{name} · Costa Clara'],
  'seo.beachDescription': [
    '{name} ({island}, {municipality}): calidad del agua {quality}, servicios y cómo llegar.',
    '{name} ({island}, {municipality}): {quality} water quality, amenities and directions.',
    '{name} ({island}, {municipality}): qualitat de l’aigua {quality}, serveis i com arribar-hi.',
  ],

  'island.todas': ['Todas', 'All', 'Totes'],
  'island.mallorca': ['Mallorca', 'Mallorca', 'Mallorca'],
  'island.menorca': ['Menorca', 'Menorca', 'Menorca'],
  'island.ibiza': ['Ibiza', 'Ibiza', 'Eivissa'],
  'island.formentera': ['Formentera', 'Formentera', 'Formentera'],

  'quality.todas': ['Todas', 'All', 'Totes'],
  'quality.excelente': ['Excelente', 'Excellent', 'Excel·lent'],
  'quality.buena': ['Buena', 'Good', 'Bona'],
  'quality.suficiente': ['Suficiente', 'Sufficient', 'Suficient'],
  'quality.insuficiente': ['Insuficiente', 'Poor', 'Insuficient'],
  'quality.sin-datos': ['Sin datos', 'No data', 'Sense dades'],

  'accessibility.todas': ['Todas', 'All', 'Totes'],
  'accessibility.adaptada': ['Adaptada', 'Accessible', 'Adaptada'],
  'accessibility.parcial': ['Parcial', 'Partial', 'Parcial'],
  'accessibility.sin-datos': ['Sin datos', 'No data', 'Sense dades'],

  'trend.mejora': ['↑ Mejora', '↑ Improving', '↑ Millora'],
  'trend.empeora': ['↓ Empeora', '↓ Declining', '↓ Empitjora'],
  'trend.estable': ['→ Estable', '→ Stable', '→ Estable'],
  'trend.sin-datos': ['Sin tendencia', 'No trend', 'Sense tendència'],

  'filters.heading': ['Encuentra tu playa', 'Find your beach', 'Troba la teva platja'],
  'filters.subtitle': [
    'Calidad del agua, servicios y ubicación en un solo mapa.',
    'Water quality, amenities and location on one map.',
    'Qualitat de l’aigua, serveis i ubicació en un sol mapa.',
  ],
  'filters.searchPlaceholder': [
    'Buscar playa, cala, municipio o servicio',
    'Search beach, cove, municipality or amenity',
    'Cerca platja, cala, municipi o servei',
  ],
  'filters.searchAria': ['Buscar playa', 'Search beach', 'Cerca platja'],
  'filters.clearSearch': ['Limpiar búsqueda', 'Clear search', 'Neteja la cerca'],
  'filters.islandGroupAria': ['Filtrar por isla', 'Filter by island', 'Filtra per illa'],
  'filters.qualityLabel': ['Calidad del agua', 'Water quality', 'Qualitat de l’aigua'],
  'filters.blueFlag': ['Bandera azul', 'Blue flag', 'Bandera blava'],
  'filters.moreFilters': ['Más filtros', 'More filters', 'Més filtres'],
  'filters.countSingular': ['playa', 'beach', 'platja'],
  'filters.countPlural': ['playas', 'beaches', 'platges'],
  'filters.nearMe': ['Cerca de mí', 'Near me', 'A prop meu'],
  'filters.locating': ['Buscando…', 'Locating…', 'Cercant…'],
  'filters.clearFilters': ['Limpiar filtros', 'Clear filters', 'Neteja filtres'],
  'filters.services': ['Servicios', 'Amenities', 'Serveis'],
  'filters.matchAll': ['Coinciden todos', 'Match all', 'Coincideixen tots'],
  'filters.servicesGroupAria': [
    'Filtrar por servicios',
    'Filter by amenities',
    'Filtra per serveis',
  ],
  'filters.accessibility': ['Accesibilidad', 'Accessibility', 'Accessibilitat'],
  'filters.accessibilityGroupAria': [
    'Filtrar por accesibilidad',
    'Filter by accessibility',
    'Filtra per accessibilitat',
  ],
  'filters.locationError': [
    'No hemos podido obtener tu ubicación.',
    'Could not get your location.',
    'No hem pogut obtenir la teva ubicació.',
  ],
  'filters.locationSorted': [
    'Ordenado por distancia a tu ubicación.',
    'Sorted by distance from your location.',
    'Ordenat per distància a la teva ubicació.',
  ],
  'filters.locationReady': [
    'Ubicación activa. Puedes elegir «Más cercanas» en el orden.',
    'Location active. You can choose "Nearest" in the sort menu.',
    'Ubicació activa. Pots triar «Més properes» a l’ordre.',
  ],

  'results.heading': ['Resultados', 'Results', 'Resultats'],
  'results.sortLabel': ['Ordenar resultados', 'Sort results', 'Ordena els resultats'],
  'results.sortName': ['Orden: Nombre (A–Z)', 'Sort: Name (A–Z)', 'Ordre: Nom (A–Z)'],
  'results.sortQuality': ['Orden: Mejor calidad', 'Sort: Best quality', 'Ordre: Millor qualitat'],
  'results.sortSample': [
    'Orden: Muestra más reciente',
    'Sort: Latest sample',
    'Ordre: Mostra més recent',
  ],
  'results.sortIsland': ['Orden: Isla (A–Z)', 'Sort: Island (A–Z)', 'Ordre: Illa (A–Z)'],
  'results.sortDistance': ['Orden: Más cercanas', 'Sort: Nearest', 'Ordre: Més properes'],
  'results.favorites': ['Favoritas ({count})', 'Favourites ({count})', 'Preferides ({count})'],
  'results.waterQualitySr': ['Agua {quality}', '{quality} water', 'Aigua {quality}'],
  'results.distanceAway': ['a {distance}', '{distance} away', 'a {distance}'],
  'results.blueBadge': ['Azul', 'Blue', 'Blava'],
  'results.addCompare': [
    'Añadir {name} al comparador',
    'Add {name} to comparison',
    'Afegeix {name} al comparador',
  ],
  'results.removeCompare': [
    'Quitar {name} del comparador',
    'Remove {name} from comparison',
    'Treu {name} del comparador',
  ],
  'results.addFavorite': [
    'Añadir {name} a favoritas',
    'Add {name} to favourites',
    'Afegeix {name} a preferides',
  ],
  'results.removeFavorite': [
    'Quitar {name} de favoritas',
    'Remove {name} from favourites',
    'Treu {name} de preferides',
  ],

  'empty.noFavoritesTitle': [
    'Todavía no tienes favoritas',
    'No favourites yet',
    'Encara no tens preferides',
  ],
  'empty.noFavoritesBody': [
    'Pulsa el corazón de una playa para guardarla aquí. Se queda en este navegador.',
    'Tap the heart on a beach to save it here. It stays stored in this browser.',
    'Prem el cor d’una platja per desar-la aquí. Es guarda en aquest navegador.',
  ],
  'empty.showAllBeaches': ['Ver todas las playas', 'Show all beaches', 'Mostra totes les platges'],
  'empty.noSearchTitle': [
    'No hay playas para «{query}»',
    'No beaches for "{query}"',
    'No hi ha platges per a «{query}»',
  ],
  'empty.noSearchBody': [
    'Prueba con otro nombre, municipio o quita algún filtro.',
    'Try another name, municipality or remove a filter.',
    'Prova amb un altre nom, municipi o treu algun filtre.',
  ],
  'empty.noFiltersTitle': [
    'No hay playas con esos filtros',
    'No beaches match those filters',
    'No hi ha platges amb aquests filtres',
  ],
  'empty.noFiltersAdvancedBody': [
    'Prueba a quitar algún servicio o cambiar de isla.',
    'Try removing an amenity or switching islands.',
    'Prova de treure algun servei o canviar d’illa.',
  ],
  'empty.noFiltersDefaultBody': [
    'Prueba a quitar algún filtro o buscar otra cosa.',
    'Try removing a filter or searching for something else.',
    'Prova de treure algun filtre o cercar una altra cosa.',
  ],

  'map.help': [
    'Usa la lista de resultados para recorrer las playas con el teclado. El mapa muestra la misma información.',
    'Use the results list to navigate beaches with the keyboard. The map shows the same information.',
    'Fes servir la llista de resultats per recórrer les platges amb el teclat. El mapa mostra la mateixa informació.',
  ],
  'map.ariaLabel': [
    'Mapa de playas de Baleares',
    'Map of Balearic beaches',
    'Mapa de platges de les Balears',
  ],
  'map.layerLabel': ['Capa del mapa', 'Map layer', 'Capa del mapa'],
  'map.layerOsm': ['Mapa', 'Map', 'Mapa'],
  'map.layerTopo': ['Relieve', 'Terrain', 'Relleu'],
  'map.layerSatellite': ['Satélite', 'Satellite', 'Satèl·lit'],
  'map.zoomIn': ['Acercar', 'Zoom in', 'Apropa'],
  'map.zoomOut': ['Alejar', 'Zoom out', 'Allunya'],
  'map.attributions': ['Atribuciones', 'Attributions', 'Atribucions'],
  'map.fullscreenEnter': ['Pantalla completa', 'Fullscreen', 'Pantalla completa'],
  'map.fullscreenExit': [
    'Salir de pantalla completa',
    'Exit fullscreen',
    'Surt de pantalla completa',
  ],
  'map.legend': ['Calidad', 'Quality', 'Qualitat'],
  'map.loading': ['Cargando mapa…', 'Loading map…', 'Carregant mapa…'],
  'map.loadErrorTitle': [
    'No se pudo cargar el mapa',
    'Could not load the map',
    'No s’ha pogut carregar el mapa',
  ],

  'detail.loading': ['Cargando ficha…', 'Loading details…', 'Carregant fitxa…'],
  'detail.loadErrorTitle': [
    'No se pudo cargar la ficha',
    'Could not load details',
    'No s’ha pogut carregar la fitxa',
  ],
  'detail.loadErrorBody': [
    'Comprueba tu conexión e inténtalo de nuevo.',
    'Check your connection and try again.',
    'Comprova la teva connexió i torna-ho a provar.',
  ],
  'detail.close': ['Cerrar', 'Close', 'Tanca'],
  'detail.openedAnnouncement': [
    'Ficha abierta: {name}.',
    'Details opened: {name}.',
    'Fitxa oberta: {name}.',
  ],
  'detail.blueFlag': ['Bandera azul', 'Blue flag', 'Bandera blava'],
  'detail.addFavorite': ['Añadir a favoritas', 'Add to favourites', 'Afegeix a preferides'],
  'detail.removeFavorite': ['Quitar de favoritas', 'Remove from favourites', 'Treu de preferides'],
  'detail.shareAria': ['Compartir playa', 'Share beach', 'Comparteix platja'],
  'detail.closeAria': ['Cerrar ficha', 'Close details', 'Tanca la fitxa'],
  'detail.linkCopied': ['Enlace copiado', 'Link copied', 'Enllaç copiat'],
  'detail.linkCopyError': [
    'No se pudo copiar el enlace',
    'Could not copy link',
    'No s’ha pogut copiar l’enllaç',
  ],
  'detail.shareText': [
    'Consulta {name} en Costa Clara',
    'Check out {name} on Costa Clara',
    'Consulta {name} a Costa Clara',
  ],
  'detail.noServices': [
    'Sin servicios en la ficha',
    'No amenities listed',
    'Sense serveis a la fitxa',
  ],
  'detail.marineLoading': [
    'Cargando estado del mar…',
    'Loading sea conditions…',
    'Carregant estat de la mar…',
  ],
  'detail.marineTitle': ['Estado del mar', 'Sea conditions', 'Estat de la mar'],
  'detail.marineUpdatedAt': [
    'Actualizado a las {time}',
    'Updated at {time}',
    'Actualitzat a les {time}',
  ],
  'detail.marineUpdatedEmpty': ['Actualizado: —', 'Updated: —', 'Actualitzat: —'],
  'detail.marineWaves': ['Oleaje', 'Waves', 'Onatge'],
  'detail.marinePeriod': ['Periodo', 'Period', 'Període'],
  'detail.marineWaterTemp': ['Temp. agua', 'Water temp.', 'Temp. aigua'],
  'detail.marineWind': ['Viento', 'Wind', 'Vent'],
  'detail.marineWindDirection': ['Dirección', 'Direction', 'Direcció'],
  'detail.windDir.N': ['N', 'N', 'N'],
  'detail.windDir.NE': ['NE', 'NE', 'NE'],
  'detail.windDir.E': ['E', 'E', 'E'],
  'detail.windDir.SE': ['SE', 'SE', 'SE'],
  'detail.windDir.S': ['S', 'S', 'S'],
  'detail.windDir.SW': ['SO', 'SW', 'SO'],
  'detail.windDir.W': ['O', 'W', 'O'],
  'detail.windDir.NW': ['NO', 'NW', 'NO'],
  'detail.sourceLabel': ['Fuente:', 'Source:', 'Font:'],
  'detail.sourceNamed': ['Fuente: {name}', 'Source: {name}', 'Font: {name}'],
  'detail.latestSample': ['Última muestra', 'Latest sample', 'Última mostra'],
  'detail.noSample': ['Sin muestra', 'No sample', 'Sense mostra'],
  'detail.samplingNote': [
    'Muestreo de OpenStreetMap: la calidad del agua está pendiente de la fuente oficial.',
    'OpenStreetMap sample: water quality is pending the official source.',
    'Mostreig d’OpenStreetMap: la qualitat de l’aigua està pendent de la font oficial.',
  ],
  'detail.coordinates': ['Coordenadas', 'Coordinates', 'Coordenades'],
  'detail.directions': ['Cómo llegar', 'Directions', 'Com arribar-hi'],
  'detail.updatedDate': ['Actualizado {date}', 'Updated {date}', 'Actualitzat {date}'],
  'detail.reportLink': ['Reportar un dato', 'Report a data issue', 'Informa d’una dada'],
  'detail.reportHelp': [
    'Abre un issue en GitHub para revisar y corregir el dato. No incluyas datos personales.',
    'Opens a GitHub issue to review and fix the data. Do not include personal information.',
    'Obre un issue a GitHub per revisar i corregir la dada. No hi incloguis dades personals.',
  ],
  'detail.reportIssueTitle': [
    'Reportar dato: {name} ({id})',
    'Report data: {name} ({id})',
    'Informa d’una dada: {name} ({id})',
  ],
  'detail.reportIssueBeach': [
    'Playa: {name} ({id})',
    'Beach: {name} ({id})',
    'Platja: {name} ({id})',
  ],
  'detail.reportIssueField': ['Campo a revisar: ', 'Field to review: ', 'Camp a revisar: '],
  'detail.reportIssueUrl': ['URL de la ficha: {url}', 'Beach URL: {url}', 'URL de la fitxa: {url}'],
  'detail.reportIssuePrompt': [
    'Describe el dato incorrecto o la fuente oficial:',
    'Describe the incorrect data or official source:',
    'Descriu la dada incorrecta o la font oficial:',
  ],
  'detail.reportIssueNote': [
    'Nota: no incluyas datos personales.',
    'Note: do not include personal information.',
    'Nota: no hi incloguis dades personals.',
  ],

  'history.title': ['Histórico de calidad', 'Quality history', 'Històric de qualitat'],
  'history.emptySummary': [
    'Sin histórico de calidad.',
    'No quality history.',
    'Sense històric de qualitat.',
  ],
  'history.summary': [
    'Histórico de {count} muestras, de {from} a {to}. Última: {latest}.',
    'History of {count} samples, from {from} to {to}. Latest: {latest}.',
    'Històric de {count} mostres, de {from} a {to}. Última: {latest}.',
  ],

  'compare.regionAria': ['Comparador de playas', 'Beach comparison', 'Comparador de platges'],
  'compare.trayTitle': [
    'Comparar ({count}/{max})',
    'Compare ({count}/{max})',
    'Compara ({count}/{max})',
  ],
  'compare.clear': ['Vaciar', 'Clear', 'Buida'],
  'compare.addOneMore': ['Añade 1 playa más', 'Add 1 more beach', 'Afegeix 1 platja més'],
  'compare.openButton': ['Comparar ({count})', 'Compare ({count})', 'Compara ({count})'],
  'compare.preparing': ['Preparando comparador…', 'Preparing comparison…', 'Preparant comparador…'],
  'compare.loading': ['Cargando comparador…', 'Loading comparison…', 'Carregant comparador…'],
  'compare.loadErrorTitle': [
    'No se pudo cargar el comparador',
    'Could not load comparison',
    'No s’ha pogut carregar el comparador',
  ],
  'compare.maxWarning': [
    'Máximo 3 playas a la vez. Quita una para añadir otra.',
    'Maximum 3 beaches at once. Remove one to add another.',
    'Màxim 3 platges alhora. Treu-ne una per afegir-ne una altra.',
  ],
  'compare.addedAnnouncement': [
    'Añadida {name} al comparador ({count} de {max}).',
    'Added {name} to comparison ({count} of {max}).',
    'Afegida {name} al comparador ({count} de {max}).',
  ],
  'compare.oneLeftAnnouncement': [
    'Queda 1 playa en el comparador. Añade otra para comparar.',
    '1 beach left in comparison. Add another to compare.',
    'Queda 1 platja al comparador. Afegeix-ne una altra per comparar.',
  ],
  'compare.clearedAnnouncement': [
    'Comparador vaciado.',
    'Comparison cleared.',
    'Comparador buidat.',
  ],
  'compare.removedAnnouncement': [
    'Quitada {name} del comparador.',
    'Removed {name} from comparison.',
    'Treta {name} del comparador.',
  ],
  'compare.dialogTitle': ['Comparativa de playas', 'Beach comparison', 'Comparativa de platges'],
  'compare.countOfMax': [
    '{count} de {max} playas',
    '{count} of {max} beaches',
    '{count} de {max} platges',
  ],
  'compare.copyLink': ['Copiar enlace', 'Copy link', 'Copia l’enllaç'],
  'compare.closeAria': ['Cerrar comparador', 'Close comparison', 'Tanca el comparador'],
  'compare.tableCaption': [
    'Comparativa de playas seleccionadas',
    'Comparison of selected beaches',
    'Comparativa de platges seleccionades',
  ],
  'compare.attributeHeader': ['Atributo', 'Attribute', 'Atribut'],
  'compare.remove': ['Quitar', 'Remove', 'Treu'],
  'compare.waterQuality': ['Calidad del agua', 'Water quality', 'Qualitat de l’aigua'],
  'compare.trend': ['Tendencia', 'Trend', 'Tendència'],
  'compare.blueFlag': ['Bandera azul', 'Blue flag', 'Bandera blava'],
  'compare.islandAndMunicipality': ['Isla y municipio', 'Island & municipality', 'Illa i municipi'],
  'compare.distance': ['Distancia', 'Distance', 'Distància'],
  'compare.accessibility': ['Accesibilidad', 'Accessibility', 'Accessibilitat'],
  'compare.services': ['Servicios', 'Amenities', 'Serveis'],
  'compare.latestSample': ['Última muestra', 'Latest sample', 'Última mostra'],
  'compare.actions': ['Acciones', 'Actions', 'Accions'],
  'compare.yes': ['Sí', 'Yes', 'Sí'],
  'compare.no': ['No', 'No', 'No'],
  'compare.noneHaveServices': [
    'Ninguna tiene servicios registrados',
    'None have listed amenities',
    'Cap no té serveis registrats',
  ],
  'compare.noServices': [
    'Sin servicios registrados',
    'No amenities listed',
    'Sense serveis registrats',
  ],
  'compare.viewOnMap': ['Ver en el mapa', 'Show on map', 'Mostra al mapa'],
  'compare.shareTitle': [
    'Comparativa: {names} · Costa Clara',
    'Comparison: {names} · Costa Clara',
    'Comparativa: {names} · Costa Clara',
  ],
  'compare.shareText': [
    'Compara {names} en Costa Clara',
    'Compare {names} on Costa Clara',
    'Compara {names} a Costa Clara',
  ],

  'pwa.offline': [
    'Sin conexión: estás viendo la última versión guardada',
    'Offline: you are viewing the last saved version',
    'Sense connexió: estàs veient l’última versió desada',
  ],
  'pwa.updateReady': [
    'Nueva versión disponible',
    'New version available',
    'Nova versió disponible',
  ],
  'pwa.updateAction': ['Actualizar', 'Update', 'Actualitza'],

  'notFound.pageTitle': [
    'Página no encontrada · Costa Clara',
    'Page not found · Costa Clara',
    'Pàgina no trobada · Costa Clara',
  ],
  'notFound.eyebrow': ['Error 404', 'Error 404', 'Error 404'],
  'notFound.heading': [
    'Esta playa no está en el mapa',
    "This beach isn't on the map",
    'Aquesta platja no és al mapa',
  ],
  'notFound.body': [
    'La página que buscas no existe o ha cambiado de sitio. Vuelve al mapa para seguir explorando las playas de Baleares.',
    "The page you're looking for doesn't exist or has moved. Return to the map to keep exploring the Balearic beaches.",
    'La pàgina que cerques no existeix o ha canviat de lloc. Torna al mapa per continuar explorant les platges de les Balears.',
  ],
  'notFound.backToMap': ['Volver al mapa', 'Back to map', 'Torna al mapa'],
} as const satisfies Record<string, readonly [string, string, string]>;

export type TranslationKey = keyof typeof ENTRIES;

function buildDictionary(index: 0 | 1 | 2): Record<TranslationKey, string> {
  const dict = {} as Record<TranslationKey, string>;
  for (const key of Object.keys(ENTRIES) as TranslationKey[]) {
    dict[key] = ENTRIES[key][index];
  }
  return dict;
}

export const TRANSLATIONS: Record<Lang, Record<TranslationKey, string>> = {
  es: buildDictionary(0),
  en: buildDictionary(1),
  ca: buildDictionary(2),
};
