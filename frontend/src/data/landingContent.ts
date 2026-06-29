export interface CalendarActivity {
  time: string
  name: string
}

export interface CalendarDay {
  idx: string
  label: string
  date: string
  theme: string
  acts: CalendarActivity[]
}

export const calendarDays: CalendarDay[] = [
  {
    idx: '1',
    label: 'Ing. Eléctrica',
    date: '30 jun',
    theme: 'Talleres de energía y sistemas eléctricos',
    acts: [
      { time: '8:00',  name: 'Bienvenida — Puerta 7' },
      { time: '9:00',  name: 'Conversatorio: Tres Visiones, Un Futuro' },
      { time: '10:30', name: 'Taller: ¿Cómo funciona un aerogenerador?' },
      { time: '10:30', name: 'Taller: ¿Cómo funciona un motor DC?' },
      { time: '10:30', name: 'Taller: ¿Cómo funciona un panel solar?' },
      { time: '12:00', name: 'Testimonios de talleres' },
      { time: '12:30', name: 'Almuerzo' },
      { time: '14:00', name: 'Escape room · Tour por el campus' },
    ],
  },
  {
    idx: '2',
    label: 'Ing. Electrónica',
    date: '1 jul',
    theme: 'Antenas, señales y programación con Arduino',
    acts: [
      { time: '8:00',  name: 'Bienvenida — Puerta 7' },
      { time: '9:00',  name: 'Taller: Antenas' },
      { time: '9:00',  name: 'Taller: Vélez' },
      { time: '10:30', name: 'Merienda' },
      { time: '11:00', name: 'Taller: Antenas (cont.)' },
      { time: '11:00', name: 'Taller: Vélez (cont.)' },
      { time: '12:30', name: 'Almuerzo' },
      { time: '14:30', name: 'Taller: Arduino, ultrasonido, IR y servo' },
    ],
  },
  {
    idx: '3',
    label: 'Hackatón',
    date: '2 jul',
    theme: 'Diseña, construye y presenta tu prototipo',
    acts: [
      { time: '8:00',  name: 'Bienvenida — Puerta 7' },
      { time: '9:00',  name: 'Apertura del hackathon · Entrega de materiales' },
      { time: '9:30',  name: 'Tiempo de trabajo — 5K (SDU 10)' },
      { time: '12:30', name: 'Almuerzo' },
      { time: '14:00', name: 'Presentación de prototipos — 31K' },
      { time: '16:30', name: 'Premiación y cierre — 31K' },
    ],
  },
  {
    idx: '4',
    label: 'Ing. Biomédica',
    date: '3 jul',
    theme: 'Imágenes médicas y actividad de cierre',
    acts: [
      { time: '9:30',  name: 'Charla: Imagenología Médica — 31K' },
      { time: '10:30', name: 'Merienda — Bambú' },
      { time: '11:30', name: 'Taller práctico: Imágenes médicas' },
      { time: '12:30', name: 'Almuerzo' },
      { time: '14:30', name: 'Actividad deportiva — Bloque M' },
    ],
  },
]

export const landingStats = [
  { n: '4', l: 'días' },
  { n: '3', l: 'áreas de ingeniería' },
  { n: '1', l: 'hackathon' },
  { n: '9–11', l: 'grados' },
]

export type InfoIcon = 'chip' | 'atom' | 'bulb'

export interface InfoCard {
  icon: InfoIcon
  title: string
  desc: string
}

export const infoCards: InfoCard[] = [
  {
    icon: 'chip',
    title: 'Talleres',
    desc: 'Práctica en ingeniería eléctrica, electrónica y biomédica — aerogeneradores, motores, paneles solares, antenas y Arduino.',
  },
  {
    icon: 'atom',
    title: 'Charlas',
    desc: 'Conversatorio con profesionales de tres ramas de la ingeniería y conferencia de imagenología médica.',
  },
  {
    icon: 'bulb',
    title: 'Hackatón',
    desc: 'Reto en equipo el día 3: diseña, construye y presenta un prototipo para ganar el reconocimiento del jurado.',
  },
]
