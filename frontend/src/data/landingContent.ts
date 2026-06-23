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
    date: '30 jun',
    acts: [
      { time: '09:00', name: 'Apertura' },
      { time: '10:30', name: 'Taller intro' },
      { time: '14:00', name: 'Charla invitada' },
    ],
  },
  {
    idx: '2',
    label: 'Día 2',
    date: '01 jul',
    acts: [
      { time: '09:00', name: 'Taller eléctrica' },
      { time: '11:00', name: 'Taller electrónica' },
      { time: '15:00', name: 'Rompehielo' },
    ],
  },
  {
    idx: '3',
    label: 'Día 3',
    date: '02 jul',
    acts: [
      { time: '09:00', name: 'Hackatón inicia' },
      { time: '13:00', name: 'Almuerzo' },
      { time: '16:00', name: 'Checkpoint' },
    ],
  },
  {
    idx: '4',
    label: 'Día 4',
    date: '03 jul',
    acts: [
      { time: '10:00', name: 'Demos' },
      { time: '14:00', name: 'Calificación' },
      { time: '17:00', name: 'Premiación' },
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
    desc: 'Práctica en ingeniería eléctrica, electrónica y biomédica.',
  },
  {
    icon: 'atom',
    title: 'Charlas',
    desc: 'Conferencias con profesionales e invitados del área STEM.',
  },
  {
    icon: 'bulb',
    title: 'Hackatón',
    desc: 'Reto en equipo para aplicar habilidades técnicas y blandas.',
  },
]
