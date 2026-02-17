import Navigation from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps): JSX.Element {
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#ecf0f1',
  };

  const contentStyle: React.CSSProperties = {
    padding: '30px',
    maxWidth: '1200px',
    margin: '0 auto',
  };

  return (
    <div style={containerStyle}>
      <Navigation />
      <div style={contentStyle}>{children}</div>
    </div>
  );
}
