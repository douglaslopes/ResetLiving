
import { Task } from '../types';

const formatDateForICS = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

export const downloadICSFile = (tasks: Task[]) => {
  if (tasks.length === 0) return;

  const today = new Date();
  
  let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ResetLiving//Routine App//PT-BR
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Rotina ResetLiving
X-WR-TIMEZONE:America/Sao_Paulo
`;

  tasks.forEach(task => {
    // Parse task time HH:mm
    const [hours, minutes] = task.time.split(':').map(Number);
    
    // Create Date objects for start and end
    const startDate = new Date(today);
    startDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + 30); // Default duration 30 mins

    const dtStart = formatDateForICS(startDate);
    const dtEnd = formatDateForICS(endDate);
    const dtStamp = formatDateForICS(new Date());

    icsContent += `BEGIN:VEVENT
UID:${task.id}-${dtStamp}@resetliving.app
DTSTAMP:${dtStamp}
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:ResetLiving: ${task.title}
DESCRIPTION:${task.description}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT0M
ACTION:DISPLAY
DESCRIPTION:Lembrete ResetLiving
END:VALARM
END:VEVENT
`;
  });

  icsContent += `END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', 'minha_rotina_resetliving.ics');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};