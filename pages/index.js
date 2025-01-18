import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <meta httpEquiv="Content-Security-Policy" content="frame-ancestors 'self' https://*.google.com https://*.googleusercontent.com" />
      </Head>
      <div 
        dangerouslySetInnerHTML={{ 
          __html: '<iframe src="/calculator.html" style="width: 100%; height: 100vh; border: none;"></iframe>' 
        }} 
      />
    </>
  );
}