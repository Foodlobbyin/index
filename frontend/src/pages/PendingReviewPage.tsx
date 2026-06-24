import { Link } from 'react-router-dom';

export default function PendingReviewPage(): JSX.Element {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', justifyContent: 'center',
      alignItems: 'center', backgroundColor: '#fffbeb', padding: 24,
    }}>
      <div style={{
        backgroundColor: 'white', padding: '48px 40px', borderRadius: 12,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)', maxWidth: 480, textAlign: 'center',
      }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>⏳</div>
        <h2 style={{ color: '#92400e', marginBottom: 12, fontSize: 22 }}>Application Under Review</h2>
        <p style={{ color: '#6b7280', lineHeight: 1.6, marginBottom: 24 }}>
          Your account has been created and your email is verified. Our team is reviewing your application to ensure you are a good fit for the Foodlobby community.
        </p>
        <div style={{
          backgroundColor: '#fef3c7', border: '1px solid #fde68a',
          borderRadius: 8, padding: '14px 18px', marginBottom: 24, textAlign: 'left',
        }}>
          <p style={{ color: '#92400e', fontSize: 13, margin: 0, fontWeight: 600 }}>What happens next?</p>
          <ul style={{ color: '#78350f', fontSize: 13, marginTop: 8, paddingLeft: 18, lineHeight: 1.8 }}>
            <li>Our team will review your profile within 1–3 business days</li>
            <li>You will receive an email once your account is approved</li>
            <li>After approval, you can log in and access all features</li>
          </ul>
        </div>
        <p style={{ color: '#9ca3af', fontSize: 13 }}>
          Have a question?{' '}
          <a href="mailto:support@foodlobby.in" style={{ color: '#d97706' }}>Contact us</a>
        </p>
        <Link
          to="/login"
          style={{
            display: 'inline-block', marginTop: 20, padding: '10px 24px',
            border: '1px solid #d97706', color: '#d97706', borderRadius: 6,
            fontSize: 14, textDecoration: 'none', fontWeight: 500,
          }}
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
