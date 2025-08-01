import { useEffect, useState } from 'react';
import { useEnvValidation } from '@/hooks/use-env-validation';

const TestPage = () => {
  const [envInfo, setEnvInfo] = useState<any>({});
  const envValidation = useEnvValidation();

  useEffect(() => {
    console.log('TestPage loaded');
    
    // Check environment variables
    const envData = {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing',
      VITE_APP_URL: import.meta.env.VITE_APP_URL,
      NODE_ENV: import.meta.env.NODE_ENV,
      MODE: import.meta.env.MODE,
    };
    
    console.log('Environment variables:', envData);
    setEnvInfo(envData);
  }, []);

  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1>🧪 Test Page</h1>
      <p>If you can see this, React is working!</p>
      
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: '#f0f0f0', 
        borderRadius: '8px' 
      }}>
        <h2>Environment Variables:</h2>
        <pre style={{ 
          backgroundColor: 'white', 
          padding: '15px', 
          borderRadius: '4px',
          overflow: 'auto'
        }}>
          {JSON.stringify(envInfo, null, 2)}
        </pre>
      </div>
      
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: envValidation.isValid ? '#e8f5e8' : '#fef2f2', 
        borderRadius: '8px' 
      }}>
        <h2>{envValidation.isValid ? '✅ Status Check:' : '❌ Environment Issues:'}</h2>
        <ul>
          <li>React: ✅ Working</li>
          <li>TypeScript: ✅ Working</li>
          <li>Vite: ✅ Working</li>
          <li>Environment Validation: {envValidation.isValid ? '✅ Valid' : '❌ Invalid'}</li>
          <li>Supabase URL: {envInfo.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</li>
          <li>Supabase Key: {envInfo.VITE_SUPABASE_ANON_KEY === 'Present' ? '✅ Set' : '❌ Missing'}</li>
        </ul>
        
        {!envValidation.isValid && (
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fef2f2', borderRadius: '4px' }}>
            <h3 style={{ color: '#dc2626', marginBottom: '10px' }}>Issues Found:</h3>
            {envValidation.missingVars.length > 0 && (
              <div>
                <strong>Missing Variables:</strong>
                <ul style={{ marginLeft: '20px', marginTop: '5px' }}>
                  {envValidation.missingVars.map((varName, index) => (
                    <li key={index} style={{ color: '#dc2626' }}>{varName}</li>
                  ))}
                </ul>
              </div>
            )}
            {envValidation.errors.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <strong>Validation Errors:</strong>
                <ul style={{ marginLeft: '20px', marginTop: '5px' }}>
                  {envValidation.errors.map((error, index) => (
                    <li key={index} style={{ color: '#dc2626' }}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '30px' }}>
        <a href="/" style={{ 
          padding: '10px 20px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          textDecoration: 'none', 
          borderRadius: '4px' 
        }}>
          ← Back to Main App
        </a>
      </div>
    </div>
  );
};

export default TestPage; 