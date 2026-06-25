export interface CategoryActivitySeed {
  id: string;
  label: string;
  active: boolean;
}

export interface CategoriesAppSeedItem {
  categoryId: string;
  label: string;
  color: string;
  description: string;
  selectionMin: number;
  selectionMax: number;
  manageMin: number;
  manageMax: number;
  manageWeight: number;
  sortOrder: number;
  activities: CategoryActivitySeed[];
}

export const CATEGORIES_APP_SEED: CategoriesAppSeedItem[] = [
  {
    categoryId: 'compromisos',
    label: 'Compromisos',
    color: '#a8946e',
    description: 'Bloques fijos: trabajo, citas, reuniones',
    selectionMin: 1,
    selectionMax: 2,
    manageMin: 1,
    manageMax: 3,
    manageWeight: 4,
    sortOrder: 0,
    activities: [
      { id: 'comp-1', label: 'Trabajo', active: true },
      { id: 'comp-2', label: 'Cita médica', active: true },
      { id: 'comp-3', label: 'Cena familiar', active: true },
      { id: 'comp-4', label: 'Reunión', active: true },
      { id: 'comp-5', label: 'Clase / curso', active: true },
      { id: 'comp-6', label: 'Entrevista', active: true },
      { id: 'comp-7', label: 'Cita con amigos', active: true },
      { id: 'comp-8', label: 'Dentista', active: true },
    ],
  },
  {
    categoryId: 'pendientes',
    label: 'Pendientes',
    color: '#b87070',
    description: 'Tareas puntuales: comprar, llamar, arreglar',
    selectionMin: 1,
    selectionMax: 2,
    manageMin: 1,
    manageMax: 6,
    manageWeight: 2,
    sortOrder: 1,
    activities: [
      { id: 'pend-1', label: 'Hacer la compra', active: true },
      { id: 'pend-2', label: 'Llamar al seguro', active: true },
      { id: 'pend-3', label: 'Arreglar algo en casa', active: true },
      { id: 'pend-4', label: 'Revisar suscripciones', active: true },
      { id: 'pend-5', label: 'Mirar el curso', active: true },
      { id: 'pend-6', label: 'Pagar factura', active: true },
      { id: 'pend-7', label: 'Enviar un email pendiente', active: true },
      { id: 'pend-8', label: 'Reservar cita', active: true },
    ],
  },
  {
    categoryId: 'rutinas',
    label: 'Rutinas',
    color: '#6b9e7a',
    description: 'Hábitos diarios: desayuno, platos, dormir',
    selectionMin: 1,
    selectionMax: 2,
    manageMin: 1,
    manageMax: 6,
    manageWeight: 2,
    sortOrder: 2,
    activities: [
      { id: 'rut-1', label: 'Desayunar', active: true },
      { id: 'rut-2', label: 'Cepillarse los dientes', active: true },
      { id: 'rut-3', label: 'Ducharse', active: true },
      { id: 'rut-4', label: 'Lavar los platos', active: true },
      { id: 'rut-5', label: 'Sacar al perro', active: true },
      { id: 'rut-6', label: 'Acostarse a dormir', active: true },
      { id: 'rut-7', label: 'Limpiar la habitación', active: true },
      { id: 'rut-8', label: 'Preparar la comida', active: true },
    ],
  },
  {
    categoryId: 'practica',
    label: 'Práctica',
    color: '#6a8fad',
    description: 'Acciones voluntarias: correr, gym, leer…',
    selectionMin: 1,
    selectionMax: 2,
    manageMin: 1,
    manageMax: 3,
    manageWeight: 4,
    sortOrder: 3,
    activities: [
      { id: 'prac-1', label: 'Correr', active: true },
      { id: 'prac-2', label: 'Ir al gym', active: true },
      { id: 'prac-3', label: 'Leer', active: true },
      { id: 'prac-4', label: 'Aprender inglés', active: true },
      { id: 'prac-5', label: 'Tocar instrumento musical', active: true },
      { id: 'prac-6', label: 'Pintar', active: true },
      { id: 'prac-7', label: 'Estudiar', active: true },
      { id: 'prac-8', label: 'Hacer bici', active: true },
    ],
  },
  {
    categoryId: 'metas',
    label: 'Metas',
    color: '#9a7eb0',
    description: 'Objetivos a largo plazo con sesiones cortas',
    selectionMin: 1,
    selectionMax: 2,
    manageMin: 2,
    manageMax: 4,
    manageWeight: 4,
    sortOrder: 4,
    activities: [
      { id: 'meta-1', label: 'Aprender un idioma', active: true },
      { id: 'meta-2', label: 'Bajar de peso', active: true },
      { id: 'meta-3', label: 'Mejorar la ansiedad', active: true },
      { id: 'meta-4', label: 'Sacar el carnet', active: true },
      { id: 'meta-5', label: 'Rutina skincare', active: true },
      { id: 'meta-6', label: 'Tener más espalda', active: true },
      { id: 'meta-7', label: 'Subir de peso', active: true },
      { id: 'meta-8', label: 'Ahorrar dinero', active: true },
    ],
  },
  {
    categoryId: 'bienestar',
    label: 'Bienestar',
    color: '#6aada3',
    description: 'Micro-intervenciones breves',
    selectionMin: 1,
    selectionMax: 2,
    manageMin: 1,
    manageMax: 9,
    manageWeight: 1,
    sortOrder: 5,
    activities: [
      { id: 'bien-1', label: 'Dejar el móvil 15 min', active: true },
      { id: 'bien-2', label: 'Respirar 5 min', active: true },
      { id: 'bien-3', label: 'Hacer 20 sentadillas', active: true },
      { id: 'bien-4', label: 'Caminar 5 min', active: true },
      { id: 'bien-5', label: 'Cerrar los ojos y respirar', active: true },
      { id: 'bien-6', label: 'Relajarse 10 min', active: true },
      { id: 'bien-7', label: 'Estirar 5 min', active: true },
      { id: 'bien-8', label: 'Beber un vaso de agua', active: true },
    ],
  },
  {
    categoryId: 'descanso',
    label: 'Descanso',
    color: '#b8926a',
    description: 'Ocio sin presión',
    selectionMin: 1,
    selectionMax: 2,
    manageMin: 2,
    manageMax: 4,
    manageWeight: 3,
    sortOrder: 6,
    activities: [
      { id: 'desc-1', label: 'Ver una serie', active: true },
      { id: 'desc-2', label: 'Jugar videojuegos', active: true },
      { id: 'desc-3', label: 'Escuchar música', active: true },
      { id: 'desc-4', label: 'Salir con amigos', active: true },
      { id: 'desc-5', label: 'Pasear sin plan', active: true },
      { id: 'desc-6', label: 'Comer algo rico', active: true },
      { id: 'desc-7', label: 'Ir de compras', active: true },
      { id: 'desc-8', label: 'Ver una película', active: true },
    ],
  },
];
