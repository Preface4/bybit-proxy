export default function Home() {
  return (
    <div 
      dangerouslySetInnerHTML={{ 
        __html: '<iframe src="/calculator.html" style="width: 100%; height: 100vh; border: none;"></iframe>' 
      }} 
    />
  );
}