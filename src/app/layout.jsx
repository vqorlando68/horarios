import { CalendarioProvider } from '@/context/CalendarioContext';
import '@/styles/tokens.css';

export const metadata = {
  title: 'Horarios',
  description: 'Sistema de Horarios y Citas'
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0, fontFamily: 'sans-serif' }}>
        <CalendarioProvider>
          {children}
        </CalendarioProvider>
      </body>
    </html>
  );
}
