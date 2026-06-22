export interface CalendarActivity {
  time: string
  name: string
}

export interface CalendarDay {
  idx: string
  label: string
  date: string
  acts: CalendarActivity[]
}

/** Placeholder — edit this file to update the public calendar. */
export const calendarDays: CalendarDay[] = [
  {
    idx: '1',
    label: 'Día 1',
    date: '30 JUN',
    acts: [
      { time: '09:00', name: 'Apertura' },
      { time: '10:30', name: 'Taller intro' },
      { time: '14:00', name: 'Charla invitada' },
    ],
  },
  {
    idx: '2',
    label: 'Día 2',
    date: '01 JUL',
    acts: [
      { time: '09:00', name: 'Taller eléctrica' },
      { time: '11:00', name: 'Taller electrónica' },
      { time: '15:00', name: 'Rompehielo' },
    ],
  },
  {
    idx: '3',
    label: 'Día 3',
    date: '02 JUL',
    acts: [
      { time: '09:00', name: 'Hackatón inicia' },
      { time: '13:00', name: 'Almuerzo' },
      { time: '16:00', name: 'Checkpoint' },
    ],
  },
  {
    idx: '4',
    label: 'Día 4',
    date: '03 JUL',
    acts: [
      { time: '10:00', name: 'Demos' },
      { time: '14:00', name: 'Calificación' },
      { time: '17:00', name: 'Premiación' },
    ],
  },
]

export const landingSpecs = [
  { k: 'DURACIÓN', v: '4 DÍAS' },
  { k: 'ÁREAS', v: 'ELÉCTRICA · ELECTRÓNICA · BIOMÉDICA' },
  { k: 'FORMATO', v: 'TALLERES · CHARLAS · HACKATHON' },
  { k: 'SEDE', v: 'UNINORTE · BARRANQUILLA' },
]

export const landingStats = [
  { n: '04', l: 'DÍAS' },
  { n: '03', l: 'ÁREAS DE INGENIERÍA' },
  { n: '01', l: 'HACKATHON' },
  { n: '9–11', l: 'GRADOS' },
]

export const infoCards = [
  {
    num: '01',
    title: 'Talleres',
    desc: 'Práctica en ingeniería eléctrica, electrónica y biomédica.',
  },
  {
    num: '02',
    title: 'Charlas',
    desc: 'Conferencias con profesionales e invitados del área STEM.',
  },
  {
    num: '03',
    title: 'Hackatón',
    desc: 'Reto en equipo para aplicar habilidades técnicas y blandas.',
  },
]
